import { EditorState, Transaction, Selection, MindMapNode } from '@y-mindmap/state'
import { InteractionHandler, InteractionEvent, Command } from './handlers'
import { InlineEditor } from './inline-editor'
import { Bounds } from '@y-mindmap/core'

export interface TextEditContext {
  editor: InlineEditor
  getNodeBounds: (nodeId: string) => Bounds | null
  getNodeTitle: (nodeId: string) => string
}

export interface RichTextEditContext {
  isEditing: () => boolean
  getEditingNodeId: () => string | null
  startEditing: (nodeId: string) => void
  stopEditing: (save: boolean) => void
}

export function createTextEditHandler(context: TextEditContext): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'dblclick' && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const nodeId = event.target!
          const bounds = context.getNodeBounds(nodeId)
          const title = context.getNodeTitle(nodeId)
          
          if (bounds && title !== undefined) {
            context.editor.startEditing(nodeId, title, {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            })
          }
          
          return true
        }
      }

      if (event.type === 'keydown' && event.key === 'F2') {
        const selectedId = state.selection.first
        if (!selectedId) return null

        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const bounds = context.getNodeBounds(selectedId)
          const title = context.getNodeTitle(selectedId)
          
          if (bounds && title !== undefined) {
            context.editor.startEditing(selectedId, title, {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            })
          }
          
          return true
        }
      }

      if (event.type === 'keydown' && event.key === 'Enter' && !event.modifiers?.shift) {
        if (context.editor.isEditing()) {
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            context.editor.stopEditing()
            return true
          }
        }
      }

      if (event.type === 'keydown' && event.key === 'Escape') {
        if (context.editor.isEditing()) {
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            context.editor.cancelEditing()
            return true
          }
        }
      }

      return null
    },
  }
}

export function createRichTextEditHandler(context: RichTextEditContext): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'keydown' && event.key === 'F2') {
        const selectedId = state.selection.first
        if (!selectedId) return null

        return () => {
          context.startEditing(selectedId)
          return true
        }
      }

      if (event.type === 'keydown' && event.key === 'Enter' && !event.modifiers?.shift) {
        if (context.isEditing()) {
          return () => {
            context.stopEditing(true)
            return true
          }
        }
      }

      if (event.type === 'keydown' && event.key === 'Escape') {
        if (context.isEditing()) {
          return () => {
            context.stopEditing(false)
            return true
          }
        }
      }

      return null
    },
  }
}

export function createUpdateTitleCommand(nodeId: string, title: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const node = state.doc.getNodeById(nodeId)
    if (!node) return false

    const tr = state.tr
    tr.updateTitle(nodeId, title)
    if (dispatch) dispatch(tr)
    return true
  }
}
