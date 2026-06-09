import { createExtension } from '../types'

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
    // TODO: 监听右键事件
    // TODO: 显示菜单

    return () => {
      // TODO: 清理菜单 DOM 和事件监听
    }
  },
})
