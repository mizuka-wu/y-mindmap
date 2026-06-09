import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClipboardOptions {
  // 当前无需配置选项，预留扩展点
}

const CLIPBOARD_KEYMAP: Record<string, string> = {
  'Ctrl+c': 'copy',
  'Ctrl+x': 'cut',
  'Ctrl+v': 'paste',
  'Ctrl+d': 'duplicate',
}

export const Clipboard = createExtension<ClipboardOptions>({
  name: 'clipboard',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    const handler = (e: KeyboardEvent) => {
      const view = ctx.view as any
      const container: HTMLElement | undefined = view?.container
      if (!container) return

      const activeEl = document.activeElement
      if (!container.contains(activeEl) && activeEl !== container) return

      let keyStr = ''
      if (e.ctrlKey || e.metaKey) keyStr += 'Ctrl+'
      if (e.shiftKey) keyStr += 'Shift+'
      keyStr += e.key.length === 1 ? e.key.toLowerCase() : e.key

      const command = CLIPBOARD_KEYMAP[keyStr]
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
