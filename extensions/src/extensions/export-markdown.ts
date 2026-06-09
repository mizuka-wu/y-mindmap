import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportMarkdownOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportMarkdown = createExtension<ExportMarkdownOptions>({
  name: 'export-markdown',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 从 MindMapEditor 的 MarkdownImporter/MarkdownExporter 提取实现
    // 1. 从 @y-mindmap/formats/markdown 导入：
    //    import { MarkdownImporter, MarkdownExporter } from '@y-mindmap/formats/markdown'
    //
    // 2. 创建导入器和导出器实例：
    //    const importer = new MarkdownImporter()
    //    const exporter = new MarkdownExporter()
    //
    // 3. 注册命令：
    //    - importMarkdown: 接受字符串或 File，调用 importer.import()，然后更新文档
    //    - exportMarkdown: 调用 exporter.export(ctx.state.doc.root)，返回字符串
    //
    // 4. 可选：添加菜单项或工具栏按钮
    //
    // 5. 返回清理函数

    return () => {
      // TODO: 清理逻辑
      // 清理导入器/导出器实例（如果有需要）
    }
  },
})
