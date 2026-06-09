import { createExtension } from '@y-mindmap/extension'

export interface RichTextEditOptions {
  showFormatToolbar?: boolean
}

export const RichTextEdit = createExtension<RichTextEditOptions>({
  name: 'rich-text-edit',
  type: 'behavior',

  defaultOptions: {
    showFormatToolbar: true,
    enabled: true,
  },

  setup(ctx, options) {
    // TODO: 绑定双击编辑事件
    // TODO: 创建富文本覆盖层
    // TODO: 显示格式工具栏

    return () => {
      // TODO: 清理编辑覆盖层和工具栏
    }
  },
})