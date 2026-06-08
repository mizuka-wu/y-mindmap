import { EditorState, Transaction } from '@y-mindmap/state'
import { InteractionHandler, InteractionEvent, Command } from './handlers'

export class InteractionManager {
  private handlers: InteractionHandler[] = []
  private editorState: EditorState
  private dispatch: (tr: Transaction) => void

  constructor(state: EditorState, dispatch: (tr: Transaction) => void) {
    this.editorState = state
    this.dispatch = dispatch
  }

  addHandler(handler: InteractionHandler): void {
    this.handlers.push(handler)
  }

  removeHandler(handler: InteractionHandler): void {
    const index = this.handlers.indexOf(handler)
    if (index >= 0) {
      this.handlers.splice(index, 1)
    }
  }

  handleEvent(event: InteractionEvent): boolean {
    for (const handler of this.handlers) {
      const command = handler.handle(event, this.editorState)
      if (command) {
        return command(this.editorState, this.dispatch)
      }
    }
    return false
  }

  updateState(state: EditorState): void {
    this.editorState = state
  }
}
