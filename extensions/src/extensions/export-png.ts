import { createExtension } from '@y-mindmap/extension'

export interface ExportPNGOptions {
  /**
   * 导出图片质量 (0-1)
   * @default 1
   */
  quality?: number

  /**
   * 像素比率，用于高分辨率导出
   * @default 2
   */
  pixelRatio?: number
}

export const ExportPNG = createExtension<ExportPNGOptions>({
  name: 'export-png',
  type: 'behavior',

  defaultOptions: {
    quality: 1,
    pixelRatio: 2,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    // TODO: 从 MindMapEditor 的 PNGExporter 提取实现
    // 1. 从 @y-mindmap/formats/png 导入：
    //    import { PNGExporter } from '@y-mindmap/formats/png'
    //
    // 2. 创建导出器实例：
    //    const exporter = new PNGExporter()
    //
    // 3. 注册命令：
    //    - exportPNG: 调用 exporter.export(canvas, contentBounds, { quality: options.quality, pixelRatio: options.pixelRatio })
    //      其中 canvas = ctx.view.getCanvas()
    //      contentBounds 需要从 state.doc.root 计算所有节点的边界
    //
    // 4. 可选：添加菜单项或工具栏按钮
    //
    // 5. 返回清理函数

    return () => {
      // TODO: 清理逻辑
      // 清理导出器实例（如果有需要）
    }
  },
})
