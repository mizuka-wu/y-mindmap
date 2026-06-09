import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportXMindOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportXMind = createExtension<ExportXMindOptions>({
  name: 'export-xmind',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 从 MindMapEditor 的 XMindImporter/XMindExporter 提取实现
    // 1. 从 @y-mindmap/formats/xmind 导入：
    //    import { XMindImporter, XMindExporter } from '@y-mindmap/formats/xmind'
    //
    // 2. 创建导入器和导出器实例：
    //    const importer = new XMindImporter()
    //    const exporter = new XMindExporter()
    //
    // 3. 注册命令（通过 extension 的 commands 属性或在 setup 中动态注册）：
    //    - importXMind: 接受 File 或 ArrayBuffer，调用 importer.import()，然后更新文档
    //    - exportXMind: 调用 exporter.export(ctx.state.doc.root)，返回 Blob
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
