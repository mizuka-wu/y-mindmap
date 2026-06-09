import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportPDFOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportPDF = createExtension<ExportPDFOptions>({
  name: 'export-pdf',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    if (!ctx.view) return

    // TODO: 从 MindMapEditor 的 PDFExporter 提取实现
    // 1. 从 @y-mindmap/formats/pdf 导入：
    //    import { PDFExporter } from '@y-mindmap/formats/pdf'
    //
    // 2. 创建导出器实例：
    //    const exporter = new PDFExporter()
    //
    // 3. 注册命令：
    //    - exportPDF: 调用 exporter.export(canvas, contentBounds, options)，返回 Blob
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
