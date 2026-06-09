import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportSVGOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportSVG = createExtension<ExportSVGOptions>({
  name: 'export-svg',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 从 MindMapEditor 的 SVGExporter 提取实现
    // 1. 从 @y-mindmap/formats/svg 导入：
    //    import { SVGExporter } from '@y-mindmap/formats/svg'
    //
    // 2. 创建导出器实例：
    //    const exporter = new SVGExporter()
    //
    // 3. 注册命令：
    //    - exportSVG: 调用 exporter.export(ctx.state.doc.root, options)，返回字符串
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
