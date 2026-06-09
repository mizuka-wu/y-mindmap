import { EditorState, Transaction } from '@y-mindmap/state'
import { Command, isCommandDefinition } from './command'

export interface KeymapConfig {
  bindings: Record<string, string>
}

const DEFAULT_KEYMAP: Record<string, string> = {
  'Tab': 'addSubTopic',
  'Enter': 'addSiblingTopic',
  'Delete': 'deleteNode',
  'Backspace': 'deleteNode',
  'ArrowUp': 'navigateUp',
  'ArrowDown': 'navigateDown',
  'ArrowLeft': 'navigateLeft',
  'ArrowRight': 'navigateRight',
  'Space': 'toggleFold',
  'Ctrl+z': 'undo',
  'Ctrl+Shift+z': 'redo',
  'Ctrl+a': 'selectAll',
  'Ctrl+c': 'copy',
  'Ctrl+v': 'paste',
  'Ctrl+x': 'cut',
  'Escape': 'deselectAll',
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map()
  private keymap: Record<string, string> = { ...DEFAULT_KEYMAP }

  register(name: string, command: Command): void {
    this.commands.set(name, command)
  }

  unregister(name: string): void {
    this.commands.delete(name)
  }

  get(name: string): Command | undefined {
    return this.commands.get(name)
  }

  execute(name: string, state: EditorState, dispatch?: (tr: Transaction) => void, input?: any): boolean {
    const command = this.commands.get(name)
    if (!command) return false

    if (isCommandDefinition(command)) {
      const result = command.execute(state, input, dispatch)
      return !!result
    }

    return command(state, dispatch)
  }

  getCommandForKey(key: string): string | undefined {
    return this.keymap[key]
  }

  setKeymap(keymap: Record<string, string>): void {
    this.keymap = { ...DEFAULT_KEYMAP, ...keymap }
  }

  getKeymap(): Record<string, string> {
    return { ...this.keymap }
  }

  getRegisteredCommands(): string[] {
    return Array.from(this.commands.keys())
  }

  getCommandDefinitions(): Array<{ name: string; description: string; inputSchema?: any; outputSchema?: any }> {
    const definitions: Array<{ name: string; description: string; inputSchema?: any; outputSchema?: any }> = []
    
    for (const [name, command] of this.commands) {
      if (isCommandDefinition(command)) {
        definitions.push({
          name: command.name,
          description: command.description,
          inputSchema: command.inputSchema,
          outputSchema: command.outputSchema,
        })
      } else {
        definitions.push({
          name,
          description: `Command: ${name}`,
        })
      }
    }

    return definitions
  }
}
