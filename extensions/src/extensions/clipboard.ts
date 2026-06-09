import { createExtension } from '@y-mindmap/extension'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClipboardOptions {
  // 当前无需配置选项，预留扩展点
}

export const Clipboard = createExtension<ClipboardOptions>({
  name: 'clipboard',
  type: 'behavior',

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    // TODO: 从 MindMapEditor 的 copy/cut/paste/duplicate 命令提取实现
    // 1. 从 @y-mindmap/commands 导入 clipboard 命令：
    //    import { copy, cut, paste, duplicate } from '@y-mindmap/commands'
    //
    // 2. 注册 clipboard 命令（如果尚未注册）：
    //    ctx.executeCommand 可用于执行命令，但注册需要通过 commandRegistry
    //    注意：命令注册可能需要通过 extension 的 commands 属性或在 setup 中动态注册
    //
    // 3. 绑定快捷键（如果 keymap 扩展未处理）：
    //    - Ctrl+C → copy
    //    - Ctrl+X → cut
    //    - Ctrl+V → paste
    //    - Ctrl+D → duplicate (可选)
    //
    // 4. 监听系统剪贴板事件（可选）：
    //    - paste 事件：从 navigator.clipboard.readText() 读取
    //    - copy/cut 事件：写入 navigator.clipboard.writeText()
    //
    // 5. 返回清理函数

    return () => {
      // TODO: 清理逻辑
      // 移除键盘事件监听（如果在此扩展中绑定）
      // 移除剪贴板事件监听（如果添加）
    }
  },
})
