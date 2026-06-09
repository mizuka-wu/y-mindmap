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
    if (!ctx.view) return

    const view = ctx.view as any
    if (typeof view.initRichTextEdit === 'function') {
      view.initRichTextEdit()
    }

    return () => {
      if (typeof view.destroyRichTextEdit === 'function') {
        view.destroyRichTextEdit()
      }
    }
  },
})