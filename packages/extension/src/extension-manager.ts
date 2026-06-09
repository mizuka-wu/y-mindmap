import { ExtensionDefinition, ExtensionContext } from './types'
import { EditorState, Transaction } from '@y-mindmap/state'
import { EditorView } from '@y-mindmap/view'

export class ExtensionManager {
  private extensions: Map<string, ExtensionDefinition> = new Map()
  private cleanupFns: Map<string, () => void> = new Map()
  private eventHandlers: Map<string, Set<(...args: any[]) => void>> = new Map()
  private ctx: ExtensionContext | null = null

  register(extension: ExtensionDefinition): void {
    if (this.extensions.has(extension.name)) {
      throw new Error(`Extension ${extension.name} is already registered`)
    }
    this.extensions.set(extension.name, extension)
  }

  setup(state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView | null): void {
    this.ctx = {
      state,
      dispatch,
      view,
      executeCommand: (name, args) => false,
      on: (event, handler) => this.on(event, handler),
      off: (event, handler) => this.off(event, handler),
      emit: (event, ...args) => this.emit(event, ...args),
    }

    for (const [name, ext] of this.extensions) {
      if (ext.setup && this.ctx) {
        const cleanup = ext.setup(this.ctx, ext.defaultOptions)
        if (cleanup) {
          this.cleanupFns.set(name, cleanup)
        }
      }
    }
  }

  updateState(state: EditorState): void {
    if (this.ctx) {
      this.ctx.state = state
    }
  }

  updateView(view: EditorView): void {
    if (this.ctx) {
      this.ctx.view = view
    }
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventHandlers.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in extension event handler for ${event}:`, error)
        }
      }
    }
  }

  getCommands(): Record<string, (...args: any[]) => any> {
    const commands: Record<string, any> = {}
    for (const ext of this.extensions.values()) {
      if (ext.commands) {
        Object.assign(commands, ext.commands)
      }
    }
    return commands
  }

  getMenuItems(): Array<{ id: string; label: string; icon?: string; shortcut?: string; action: () => void }> {
    const items: Array<{ id: string; label: string; icon?: string; shortcut?: string; action: () => void }> = []
    for (const ext of this.extensions.values()) {
      if (ext.menuItems) {
        items.push(...ext.menuItems)
      }
    }
    return items
  }

  getExtension(name: string): ExtensionDefinition | undefined {
    return this.extensions.get(name)
  }

  has(name: string): boolean {
    return this.extensions.has(name)
  }

  destroy(): void {
    for (const [name, cleanup] of this.cleanupFns) {
      try {
        cleanup()
      } catch (error) {
        console.error(`Error cleaning up extension ${name}:`, error)
      }
    }
    this.cleanupFns.clear()

    for (const ext of this.extensions.values()) {
      if (ext.destroy) {
        ext.destroy()
      }
    }

    this.extensions.clear()
    this.eventHandlers.clear()
    this.ctx = null
  }
}