import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportJSONOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportJSON = createExtension<ExportJSONOptions>({
  name: 'export-json',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 从 MindMapEditor 的 JSONImporter/JSONExporter 提取实现
    // 1. 从 @y-mindmap/formats/json 导入：
    //    import { JSONImporter, JSONExporter } from '@y-mindmap/formats/json'
    //
    // 2. 创建导入器和导出器实例：
    //    const importer = new JSONImporter()
    //    const exporter = new JSONExporter()
    //
    // 3. 注册命令：
    //    - importJSON: 接受字符串或 File，调用 importer.import()，然后更新文档
    //    - exportJSON: 调用 exporter.export(ctx.state.doc.root, options)，返回字符串
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
