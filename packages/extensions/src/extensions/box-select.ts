import { createExtension } from '../types'

export const BoxSelect = createExtension({
  name: 'box-select',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 绑定框选事件（pointerdown → pointermove → pointerup）
    // TODO: 创建选框矩形
    // TODO: 计算框选节点

    return () => {
      // TODO: 清理选框 DOM 和事件监听
    }
  },
})
