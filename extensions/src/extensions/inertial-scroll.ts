import { createExtension } from '@y-mindmap/extension'

export interface InertialScrollOptions {
  /**
   * 摩擦系数，控制减速速度 (0-1)
   * @default 0.95
   */
  friction?: number

  /**
   * 触发惯性滚动的速度阈值
   * @default 0.5
   */
  threshold?: number
}

export const InertialScroll = createExtension<InertialScrollOptions>({
  name: 'inertial-scroll',
  type: 'behavior',

  defaultOptions: {
    friction: 0.95,
    threshold: 0.5,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    // TODO: 从 MindMapEditor.initInertialScroll() 提取实现
    // 1. 从 @y-mindmap/interaction 导入 InertialScroll 类
    // 2. 创建 InertialScroll 实例，传入 options.friction 和 options.threshold
    // 3. 绑定到 view 的 panBy 方法：
    //    const inertialScroll = new InertialScroll((dx, dy) => {
    //      ctx.view.panBy(dx, dy)
    //    }, { friction: options.friction, threshold: options.threshold })
    // 4. 监听 pointerdown/pointermove/pointerup 事件：
    //    - pointerdown: inertialScroll.stop() + inertialScroll.record(x, y)
    //    - pointermove: inertialScroll.record(x, y)
    //    - pointerup: inertialScroll.start()
    // 5. 返回清理函数：停止惯性滚动并移除事件监听

    return () => {
      // TODO: 清理逻辑
      // inertialScroll.stop()
      // 移除 pointerdown/pointermove/pointerup 事件监听
    }
  },
})
