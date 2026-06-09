import * as Y from 'yjs'
import { createExtension } from '../types'

export interface CollabOptions {
  ydoc: Y.Doc
  field?: string
  fragment?: Y.Map<any>
}

export const Collab = createExtension<CollabOptions>({
  name: 'collab',
  type: 'collaboration',

  defaultOptions: {
    ydoc: null as any,
    field: 'mindmap',
    enabled: true,
  },

  setup(ctx, options) {
    const { ydoc, field, fragment } = options
    const ymap = fragment || ydoc.getMap(field || 'mindmap')

    // TODO: 实现双向绑定逻辑
    // 1. 初始同步：state → Y.Map
    // 2. 监听 Y.Map 变更 → dispatch Transaction 更新 state
    // 3. 监听 state 变更 → 写回 Y.Map（在 ydoc.transact() 内）

    const handleYMapChange = (event: Y.YMapEvent<any>, transaction: Y.Transaction) => {
      if (transaction.local) return
      // TODO: 将 Y.Map 变更转换为 Transaction 并 dispatch
    }

    ymap.observe(handleYMapChange)

    return () => {
      ymap.unobserve(handleYMapChange)
    }
  },
})
