import { EditorState, Selection, MindMapNode, Transaction } from '@y-mindmap/state'
import { InteractionHandler, InteractionEvent, Command } from './handlers'
import { Point, Bounds } from '@y-mindmap/core'

interface BoxSelectState {
  startPoint: Point | null
  endPoint: Point | null
  isActive: boolean
}

let boxSelectState: BoxSelectState = {
  startPoint: null,
  endPoint: null,
  isActive: false,
}

export function createBoxSelectHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === 'pointerdown' && !event.target && event.button === 0 && !event.modifiers?.ctrl) {
        boxSelectState = {
          startPoint: event.position || null,
          endPoint: event.position || null,
          isActive: false,
        }
        return null
      }

      if (event.type === 'pointermove' && boxSelectState.startPoint) {
        const endPoint = event.position || { x: 0, y: 0 }
        const dx = Math.abs(endPoint.x - boxSelectState.startPoint.x)
        const dy = Math.abs(endPoint.y - boxSelectState.startPoint.y)

        if (!boxSelectState.isActive && (dx > 5 || dy > 5)) {
          boxSelectState.isActive = true
          boxSelectState.endPoint = endPoint
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true
          }
        }

        if (boxSelectState.isActive) {
          boxSelectState.endPoint = endPoint
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true
          }
        }

        return null
      }

      if (event.type === 'pointerup' && boxSelectState.isActive) {
        const rect = getSelectionRect(boxSelectState.startPoint!, boxSelectState.endPoint!)
        boxSelectState = { startPoint: null, endPoint: null, isActive: false }

        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const selectedIds = findNodesInRect(state, rect)
          if (selectedIds.length > 0) {
            const tr = state.tr
            tr.setSelection(Selection.multiple(selectedIds))
            if (dispatch) dispatch(tr)
          }
          return true
        }
      }

      if (event.type === 'pointercancel') {
        boxSelectState = { startPoint: null, endPoint: null, isActive: false }
        return null
      }

      return null
    },
  }
}

function getSelectionRect(start: Point, end: Point): Bounds {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

function findNodesInRect(state: EditorState, rect: Bounds): string[] {
  const selectedIds: string[] = []

  state.doc.root.descendants(node => {
    const nodeBounds = getNodeBounds(node)
    if (nodeBounds && isRectIntersecting(rect, nodeBounds)) {
      selectedIds.push(node.id)
    }
  })

  return selectedIds
}

function getNodeBounds(node: MindMapNode): Bounds | null {
  // This would need to be implemented to get actual node bounds from the view
  // For now, return null
  return null
}

function isRectIntersecting(rect1: Bounds, rect2: Bounds): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}
