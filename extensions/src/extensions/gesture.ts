import { createExtension } from '@y-mindmap/extension'

export interface GestureOptions {
  /**
   * 启用捏合缩放手势
   * @default true
   */
  enablePinch?: boolean

  /**
   * 启用平移手势
   * @default true
   */
  enablePan?: boolean
}

export const Gesture = createExtension<GestureOptions>({
  name: 'gesture',
  type: 'behavior',

  defaultOptions: {
    enablePinch: true,
    enablePan: true,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    // TODO: 从 MindMapEditor.initGestures() 提取实现
    // 1. 从 @y-mindmap/interaction 导入 GestureRecognizer 类
    // 2. 创建 GestureRecognizer 实例，绑定手势事件回调：
    //    - pinch: 如果 options.enablePinch，调用 ctx.view.zoomTo(currentZoom * scale)
    //    - pan: 如果 options.enablePan，调用 ctx.view.panBy(deltaX, deltaY)
    //    - tap: 通过 ctx.view.getViewportController().screenToCanvas() 转换坐标，
    //           然后 ctx.view.getNodeAtPoint() 获取节点，最后 ctx.executeCommand('selectNode', { nodeId })
    //    - doubletap: 类似 tap，但调用 ctx.executeCommand('startEditing', { nodeId }) 或 view.startEditing(nodeId)
    // 3. 监听 pointerdown/pointermove/pointerup/pointercancel 事件：
    //    - pointerdown: gestureRecognizer.handlePointerDown(pointerId, x, y)
    //    - pointermove: gestureRecognizer.handlePointerMove(pointerId, x, y)
    //    - pointerup: gestureRecognizer.handlePointerUp(pointerId, x, y)
    //    - pointercancel: gestureRecognizer.handlePointerCancel(pointerId)
    // 4. 返回清理函数：重置手势识别器并移除事件监听

    return () => {
      // TODO: 清理逻辑
      // gestureRecognizer.reset()
      // 移除 pointerdown/pointermove/pointerup/pointercancel 事件监听
    }
  },
})
