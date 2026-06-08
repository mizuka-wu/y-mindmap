import { EditorState } from '@y-mindmap/state'

export type Command = (state: EditorState, dispatch?: (tr: any) => void) => boolean

export interface InteractionHandler {
  handle(event: Event, state: EditorState): Command | null
}

export class SelectHandler implements InteractionHandler {
  handle(event: Event, state: EditorState): Command | null {
    return null
  }
}

export class DragHandler implements InteractionHandler {
  handle(event: Event, state: EditorState): Command | null {
    return null
  }
}

export class KeyboardHandler implements InteractionHandler {
  handle(event: Event, state: EditorState): Command | null {
    return null
  }
}
