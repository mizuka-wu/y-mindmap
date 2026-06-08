import * as Y from 'yjs'

export class CollabUndoManager {
  private undoManager: Y.UndoManager
  private doc: Y.Doc
  private onStateChangeCallback: ((canUndo: boolean, canRedo: boolean) => void) | null = null

  constructor(doc: Y.Doc, trackedNamespaces?: Y.AbstractType<any>[]) {
    this.doc = doc

    const trackedTypes = trackedNamespaces || [doc.getMap('nodes'), doc.getText('rootId')]
    this.undoManager = new Y.UndoManager(trackedTypes, {
      captureTimeout: 500,
    })

    this.undoManager.on('stack-item-added', () => {
      this.emitStateChange()
    })

    this.undoManager.on('stack-item-popped', () => {
      this.emitStateChange()
    })

    this.undoManager.on('stack-cleared', () => {
      this.emitStateChange()
    })
  }

  undo(): boolean {
    if (!this.canUndo()) return false
    this.undoManager.undo()
    return true
  }

  redo(): boolean {
    if (!this.canRedo()) return false
    this.undoManager.redo()
    return true
  }

  canUndo(): boolean {
    return this.undoManager.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.undoManager.redoStack.length > 0
  }

  clear(): void {
    this.undoManager.clear()
  }

  onStateChange(callback: (canUndo: boolean, canRedo: boolean) => void): void {
    this.onStateChangeCallback = callback
  }

  private emitStateChange(): void {
    this.onStateChangeCallback?.(this.canUndo(), this.canRedo())
  }

  destroy(): void {
    this.undoManager.destroy()
  }
}
