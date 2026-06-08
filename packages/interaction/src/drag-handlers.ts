import {
  EditorState,
  Selection,
  MindMapNode,
  Transaction,
} from "@y-mindmap/state";
import { InteractionHandler, InteractionEvent, Command } from "./handlers";
import { Point } from "@y-mindmap/core";

interface DragState {
  sourceId: string;
  startPosition: Point;
  currentPosition: Point;
  isDragging: boolean;
}

const DRAG_THRESHOLD = 5;

export function createDragHandler(): InteractionHandler {
  let dragState: DragState | null = null;
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "pointerdown" && event.target) {
        dragState = {
          sourceId: event.target,
          startPosition: event.position || { x: 0, y: 0 },
          currentPosition: event.position || { x: 0, y: 0 },
          isDragging: false,
        };
        return null;
      }

      if (event.type === "pointermove" && dragState) {
        const dx = (event.position?.x || 0) - dragState.startPosition.x;
        const dy = (event.position?.y || 0) - dragState.startPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!dragState.isDragging && distance >= DRAG_THRESHOLD) {
          dragState.isDragging = true;
          dragState.currentPosition = event.position || { x: 0, y: 0 };
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true;
          };
        }

        if (dragState.isDragging) {
          dragState.currentPosition = event.position || { x: 0, y: 0 };
          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            return true;
          };
        }

        return null;
      }

      if (event.type === "pointerup" && dragState) {
        if (
          dragState.isDragging &&
          event.target &&
          event.target !== dragState.sourceId
        ) {
          const sourceId = dragState.sourceId;
          const targetId = event.target;
          dragState = null;

          return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
            const sourceNode = state.doc.getNodeById(sourceId);
            const targetNode = state.doc.getNodeById(targetId);
            if (!sourceNode || !targetNode) return false;

            const tr = state.tr;
            tr.moveNode(sourceId, targetId);
            tr.setSelection(Selection.single(sourceId));
            if (dispatch) dispatch(tr);
            return true;
          };
        }

        dragState = null;
        return null;
      }

      if (event.type === "pointercancel") {
        dragState = null;
        return null;
      }

      return null;
    },
  };
}

export function createMultiSelectHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "click" && event.target && event.modifiers?.ctrl) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const tr = state.tr;
          tr.setSelection(state.selection.toggle(event.target!));
          if (dispatch) dispatch(tr);
          return true;
        };
      }

      if (event.type === "click" && event.target && event.modifiers?.shift) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const anchorId = state.selection.anchorId || event.target!;
          const focusId = event.target!;

          const allIds: string[] = [];
          state.doc.root.descendants((node) => allIds.push(node.id));

          const anchorIndex = allIds.indexOf(anchorId);
          const focusIndex = allIds.indexOf(focusId);

          if (anchorIndex === -1 || focusIndex === -1) return false;

          const start = Math.min(anchorIndex, focusIndex);
          const end = Math.max(anchorIndex, focusIndex);
          const selectedIds = allIds.slice(start, end + 1);

          const tr = state.tr;
          tr.setSelection(Selection.multiple(selectedIds));
          if (dispatch) dispatch(tr);
          return true;
        };
      }

      if (event.type === "boxselect" && event.position) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      return null;
    },
  };
}

export function createViewportDragHandler(): InteractionHandler {
  let isPanning = false;
  let lastPosition: Point | null = null;

  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "pointerdown" && !event.target && event.button === 0) {
        isPanning = true;
        lastPosition = event.position || null;
        return null;
      }

      if (event.type === "pointermove" && isPanning && lastPosition) {
        const dx = (event.position?.x || 0) - lastPosition.x;
        const dy = (event.position?.y || 0) - lastPosition.y;
        lastPosition = event.position || null;

        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      if (event.type === "pointerup" || event.type === "pointercancel") {
        isPanning = false;
        lastPosition = null;
        return null;
      }

      return null;
    },
  };
}
