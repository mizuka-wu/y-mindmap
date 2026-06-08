import { EditorState, Selection, MindMapNode, Transaction } from '@y-mindmap/state'
import { Point } from '@y-mindmap/core'

export type Command = (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean

export interface InteractionHandler {
  handle(event: InteractionEvent, state: EditorState): Command | null
}

export type InteractionEvent = {
  type: string
  target?: string
  position?: Point
  key?: string
  modifiers?: {
    ctrl: boolean
    shift: boolean
    alt: boolean
    meta: boolean
  }
  button?: number
  deltaX?: number
  deltaY?: number
}

export function createSelectHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'click' && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const tr = state.tr
          if (event.modifiers?.ctrl || event.modifiers?.meta) {
            tr.setSelection(state.selection.toggle(event.target!))
          } else {
            tr.setSelection(Selection.single(event.target!))
          }
          if (dispatch) dispatch(tr)
          return true
        }
      }

      if (event.type === 'click' && !event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const tr = state.tr
          tr.setSelection(Selection.empty())
          if (dispatch) dispatch(tr)
          return true
        }
      }

      return null
    },
  }
}

export function createKeyboardHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type !== 'keydown') return null

      const key = event.key
      const modifiers = event.modifiers || { ctrl: false, shift: false, alt: false, meta: false }

      if (key === 'Tab') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const node = state.doc.getNodeById(selectedId)
          if (!node) return false

          const newNode = MindMapNode.createEmpty()
          const tr = state.tr
          tr.addNode(selectedId, newNode)
          tr.setSelection(Selection.single(newNode.id))
          if (dispatch) dispatch(tr)
          return true
        }
      }

      if (key === 'Enter' && !modifiers.shift) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const node = state.doc.getNodeById(selectedId)
          if (!node) return false

          const newNode = MindMapNode.createEmpty()
          const tr = state.tr
          tr.addNode(node.id, newNode)
          tr.setSelection(Selection.single(newNode.id))
          if (dispatch) dispatch(tr)
          return true
        }
      }

      if (key === 'Delete' || key === 'Backspace') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedIds = state.selection.all
          if (selectedIds.length === 0) return false

          const tr = state.tr
          for (const id of selectedIds) {
            const node = state.doc.getNodeById(id)
            if (node && !node.isRoot) {
              tr.removeNode(id)
            }
          }
          tr.setSelection(Selection.empty())
          if (dispatch) dispatch(tr)
          return true
        }
      }

      if (key === 'z' && (modifiers.ctrl || modifiers.meta)) {
        if (modifiers.shift) {
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            if (!state.canRedo()) return false
            const newState = state.redo()
            if (dispatch) {
              const tr = newState.tr
              tr.setMeta('source', 'redo')
              dispatch(tr)
            }
            return true
          }
        } else {
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            if (!state.canUndo()) return false
            const newState = state.undo()
            if (dispatch) {
              const tr = newState.tr
              tr.setMeta('source', 'undo')
              dispatch(tr)
            }
            return true
          }
        }
      }

      if (key === 'a' && (modifiers.ctrl || modifiers.meta)) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const allIds: string[] = []
          state.doc.root.descendants(node => {
            allIds.push(node.id)
          })
          const tr = state.tr
          tr.setSelection(Selection.multiple(allIds))
          if (dispatch) dispatch(tr)
          return true
        }
      }

      if (key === 'ArrowUp') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const node = state.doc.getNodeById(selectedId)
          if (!node) return false

          const parent = findParent(state.doc.root, node.id)
          if (!parent) return false

          const siblings = parent.attachedChildren
          const index = siblings.findIndex(c => c.id === node.id)
          if (index > 0 && siblings[index - 1]) {
            const tr = state.tr
            tr.setSelection(Selection.single(siblings[index - 1]!.id))
            if (dispatch) dispatch(tr)
            return true
          }
          return false
        }
      }

      if (key === 'ArrowDown') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const node = state.doc.getNodeById(selectedId)
          if (!node) return false

          const parent = findParent(state.doc.root, node.id)
          if (!parent) return false

          const siblings = parent.attachedChildren
          const index = siblings.findIndex(c => c.id === node.id)
          if (index < siblings.length - 1 && siblings[index + 1]) {
            const tr = state.tr
            tr.setSelection(Selection.single(siblings[index + 1]!.id))
            if (dispatch) dispatch(tr)
            return true
          }
          return false
        }
      }

      if (key === 'ArrowLeft') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const parent = findParent(state.doc.root, selectedId)
          if (parent && !parent.isRoot) {
            const tr = state.tr
            tr.setSelection(Selection.single(parent.id))
            if (dispatch) dispatch(tr)
            return true
          }
          return false
        }
      }

      if (key === 'ArrowRight') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const node = state.doc.getNodeById(selectedId)
          if (!node) return false

          const children = node.attachedChildren
          if (children.length > 0 && children[0]) {
            const tr = state.tr
            tr.setSelection(Selection.single(children[0]!.id))
            if (dispatch) dispatch(tr)
            return true
          }
          return false
        }
      }

      if (key === ' ') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedId = state.selection.first
          if (!selectedId) return false

          const tr = state.tr
          tr.toggleFold(selectedId)
          if (dispatch) dispatch(tr)
          return true
        }
      }

      return null
    },
  }
}

export function createDragHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'dragstart' && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true
        }
      }

      if (event.type === 'drag' && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true
        }
      }

      if (event.type === 'dragend' && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true
        }
      }

      return null
    },
  }
}

export function createZoomHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'wheel') {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true
        }
      }

      return null
    },
  }
}

function findParent(root: MindMapNode, childId: string): MindMapNode | null {
  for (const children of Object.values(root.children)) {
    for (const child of children) {
      if (child.id === childId) return root
      const found = findParent(child, childId)
      if (found) return found
    }
  }
  return null
}
