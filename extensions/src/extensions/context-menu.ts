import { createExtension } from '@y-mindmap/extension'

export interface ContextMenuOptions {
  items?: Array<{
    id: string
    label: string
    icon?: string
    shortcut?: string
    action: (nodeId?: string) => void
  }>
}

export const ContextMenu = createExtension<ContextMenuOptions>({
  name: 'context-menu',
  type: 'behavior',

  defaultOptions: {
    items: [],
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    const view = ctx.view as any
    if (typeof view.initContextMenu === 'function') {
      view.initContextMenu()
    }

    return () => {
      if (typeof view.destroyContextMenu === 'function') {
        view.destroyContextMenu()
      }
    }
  },
})