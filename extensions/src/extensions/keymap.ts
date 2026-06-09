import { createExtension } from '@y-mindmap/extension'

export interface KeymapOptions {
  /**
   * 自定义快捷键映射
   * 键格式：修饰键+键名，如 "Ctrl+c", "Shift+Enter"
   * 值格式：命令名称，如 "copy", "addSiblingTopic"
   * @default undefined (使用默认快捷键)
   */
  keymap?: Record<string, string>
}

export const Keymap = createExtension<KeymapOptions>({
  name: 'keymap',
  type: 'behavior',

  defaultOptions: {
    keymap: undefined,
    enabled: true,
  },

  setup(ctx, options) {
    // TODO: 从 MindMapEditor.registerDefaultCommands() 和 bindDOMEvents() 提取实现
    // 1. 注册默认命令（如果尚未注册）：
    //    - addSubTopic, addSiblingTopic, deleteNode, toggleFold
    //    - selectNode, selectAll, deselectAll
    //    - undo, redo
    //    - navigateUp, navigateDown, navigateLeft, navigateRight
    //    - updateTitle, moveNodeUp, moveNodeDown
    //    - setStructureClass, updateStyle
    //    - copy, cut, paste, duplicate
    //    注意：这些命令可能已由其他扩展或编辑器核心注册，需要检查是否已存在
    //
    // 2. 应用自定义快捷键映射：
    //    if (options.keymap) {
    //      // 合并或覆盖默认快捷键
    //    }
    //
    // 3. 绑定键盘事件：
    //    const handleKeyDown = (e: KeyboardEvent) => {
    //      // 检查焦点是否在编辑器容器内
    //      if (!container.contains(document.activeElement) && document.activeElement !== container) return
    //
    //      // 构建快捷键字符串
    //      let keyStr = ''
    //      if (e.ctrlKey || e.metaKey) keyStr += 'Ctrl+'
    //      if (e.shiftKey) keyStr += 'Shift+'
    //      if (e.altKey) keyStr += 'Alt+'
    //      keyStr += e.key === ' ' ? 'Space' : e.key.length === 1 ? e.key.toLowerCase() : e.key
    //
    //      // 查找并执行命令
    //      const commandName = commandRegistry.getCommandForKey(keyStr)
    //      if (commandName) {
    //        e.preventDefault()
    //        ctx.executeCommand(commandName)
    //      }
    //    }
    //    document.addEventListener('keydown', handleKeyDown)
    //
    // 4. 返回清理函数：移除键盘事件监听

    return () => {
      // TODO: 清理逻辑
      // document.removeEventListener('keydown', handleKeyDown)
    }
  },
})
