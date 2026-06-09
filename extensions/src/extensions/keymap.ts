import { createExtension } from '@y-mindmap/extension'

export interface KeymapOptions {
  keymap?: Record<string, string>
}

const DEFAULT_KEYMAP: Record<string, string> = {
  'Ctrl+z': 'undo',
  'Ctrl+Shift+z': 'redo',
  'Ctrl+y': 'redo',
  'Tab': 'addSubTopic',
  'Enter': 'addSiblingTopic',
  'Delete': 'deleteNode',
  'Backspace': 'deleteNode',
  'Ctrl+a': 'selectAll',
  'Escape': 'deselectAll',
  'ArrowUp': 'navigateUp',
  'ArrowDown': 'navigateDown',
  'ArrowLeft': 'navigateLeft',
  'ArrowRight': 'navigateRight',
  'Ctrl+Shift+ArrowUp': 'moveNodeUp',
  'Ctrl+Shift+ArrowDown': 'moveNodeDown',
}

export const Keymap = createExtension<KeymapOptions>({
  name: 'keymap',
  type: 'behavior',

  defaultOptions: {
    keymap: undefined,
    enabled: true,
  },

  setup(ctx, options) {
    const keymap: Record<string, string> = {
      ...DEFAULT_KEYMAP,
      ...options.keymap,
    }

    const handler = (e: KeyboardEvent) => {
      const view = ctx.view as any
      const container: HTMLElement | undefined = view?.container
      if (!container) return

      const activeEl = document.activeElement
      if (!container.contains(activeEl) && activeEl !== container) return

      let keyStr = ''
      if (e.ctrlKey || e.metaKey) keyStr += 'Ctrl+'
      if (e.shiftKey) keyStr += 'Shift+'
      if (e.altKey) keyStr += 'Alt+'
      keyStr += e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key

      const command = keymap[keyStr]
      if (command) {
        e.preventDefault()
        ctx.executeCommand(command)
      }
    }

    document.addEventListener('keydown', handler)

    return () => {
      document.removeEventListener('keydown', handler)
    }
  },
})
