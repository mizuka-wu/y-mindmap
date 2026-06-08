import {
  EditorState,
  Selection,
  MindMapNode,
  Transaction,
} from "@y-mindmap/state";
import { Point } from "@y-mindmap/core";

export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
) => boolean;

export interface InteractionHandler {
  handle(event: InteractionEvent, state: EditorState): Command | null;
}

export type InteractionEvent = {
  type: string;
  target?: string;
  position?: Point;
  key?: string;
  modifiers?: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  button?: number;
  deltaX?: number;
  deltaY?: number;
};

export function createSelectHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "click" && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const tr = state.tr;
          if (event.modifiers?.ctrl || event.modifiers?.meta) {
            tr.setSelection(state.selection.toggle(event.target!));
          } else {
            tr.setSelection(Selection.single(event.target!));
          }
          if (dispatch) dispatch(tr);
          return true;
        };
      }

      if (event.type === "click" && !event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          const tr = state.tr;
          tr.setSelection(Selection.empty());
          if (dispatch) dispatch(tr);
          return true;
        };
      }

      return null;
    },
  };
}

export function createKeyboardHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, _state: EditorState): Command | null {
      if (event.type !== "keydown") return null;
      // All keyboard commands are routed through CommandRegistry in MindMapEditor.
      // This handler is kept for backward compatibility but no longer implements commands inline.
      return null;
    },
  };
}

export function createDragHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "dragstart" && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      if (event.type === "drag" && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      if (event.type === "dragend" && event.target) {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      return null;
    },
  };
}

export function createZoomHandler(): InteractionHandler {
  return {
    handle(event: InteractionEvent, state: EditorState): Command | null {
      if (event.type === "wheel") {
        return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
          return true;
        };
      }

      return null;
    },
  };
}
