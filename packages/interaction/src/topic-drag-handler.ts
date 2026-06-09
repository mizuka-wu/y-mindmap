import { EditorState, MindMapNode, Transaction, Selection } from '@y-mindmap/state'
import { Point } from '@y-mindmap/core'
import { InteractionHandler, InteractionEvent, Command } from './handlers'

export enum DropPosition {
  NONE = 'none',
  BEFORE = 'before',
  AFTER = 'after',
  INSIDE = 'inside',
}

export interface DropTarget {
  nodeId: string
  position: DropPosition
  bounds: { x: number; y: number; width: number; height: number }
}

export interface DragCallbacks {
  onDragStart?: (sourceId: string, position: Point, bounds: { x: number; y: number; width: number; height: number }) => void
  onDragMove?: (position: Point, dropTarget: DropTarget | null) => void
  onDragEnd?: (sourceId: string, dropTarget: DropTarget | null) => void
  onDragCancel?: () => void
}

interface DragStateInternal {
  sourceId: string
  startPosition: Point
  currentPosition: Point
  isDragging: boolean
}

const DRAG_THRESHOLD = 5

export function createTopicDragHandler(
  callbacks: DragCallbacks,
  hitTest?: (position: Point, sourceId: string) => DropTarget | null,
): InteractionHandler {
  let dragState: DragStateInternal | null = null

  const isValidDrop = (sourceId: string, targetId: string, state: EditorState): boolean => {
    if (sourceId === targetId) return false

    const sourceNode = state.doc.getNodeById(sourceId)
    const targetNode = state.doc.getNodeById(targetId)
    if (!sourceNode || !targetNode) return false

    let isDescendant = false
    targetNode.descendants((node) => {
      if (node.id === sourceId) {
        isDescendant = true
      }
    })

    return !isDescendant
  }

  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "pointerdown" && event.target && event.button === 0) {
        dragState = {
          sourceId: event.target,
          startPosition: event.position || { x: 0, y: 0 },
          currentPosition: event.position || { x: 0, y: 0 },
          isDragging: false,
        }
        return null
      }

      if (event.type === "pointermove" && dragState) {
        const dx = (event.position?.x || 0) - dragState.startPosition.x
        const dy = (event.position?.y || 0) - dragState.startPosition.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (!dragState.isDragging && distance >= DRAG_THRESHOLD) {
          dragState.isDragging = true
          dragState.currentPosition = event.position || { x: 0, y: 0 }

          const sourceNode = state.doc.getNodeById(dragState.sourceId)
          if (sourceNode && callbacks.onDragStart) {
            callbacks.onDragStart(dragState.sourceId, dragState.startPosition, {
              x: 0,
              y: 0,
              width: 120,
              height: 40,
            })
          }

          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true
          }
        }

        if (dragState.isDragging) {
          dragState.currentPosition = event.position || { x: 0, y: 0 }

          const dropTarget = hitTest ? hitTest(dragState.currentPosition, dragState.sourceId) : null

          if (callbacks.onDragMove) {
            callbacks.onDragMove(dragState.currentPosition, dropTarget)
          }

          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true
          }
        }

        return null
      }

      if (event.type === "pointerup" && dragState) {
        if (dragState.isDragging) {
          const sourceId = dragState.sourceId
          const dropTarget = hitTest ? hitTest(dragState.currentPosition, sourceId) : null

          if (callbacks.onDragEnd) {
            callbacks.onDragEnd(sourceId, dropTarget)
          }

          if (dropTarget && isValidDrop(sourceId, dropTarget.nodeId, state)) {
            const targetId = dropTarget.nodeId
            const dropPos = dropTarget.position

            dragState = null

            return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
              const tr = state.tr

              if (dropPos === DropPosition.INSIDE) {
                tr.moveNode(sourceId, targetId)
              } else {
                const parent = state.doc.findParent(targetId)
                if (parent) {
                  const siblings = parent.attachedChildren
                  const targetIndex = siblings.findIndex(n => n.id === targetId)
                  const insertIndex = dropPos === DropPosition.BEFORE ? targetIndex : targetIndex + 1
                  tr.moveNode(sourceId, parent.id, insertIndex)
                }
              }

              tr.setSelection(Selection.single(sourceId))
              if (dispatch) dispatch(tr)
              return true
            }
          }

          dragState = null
          return null
        }

        if (callbacks.onDragCancel) {
          callbacks.onDragCancel()
        }
        dragState = null
        return null
      }

      if (event.type === "pointercancel") {
        if (dragState) {
          if (callbacks.onDragCancel) {
            callbacks.onDragCancel()
          }
          dragState = null
        }
        return null
      }

      return null
    },
  }
}
