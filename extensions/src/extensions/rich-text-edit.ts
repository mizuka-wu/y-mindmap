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

    ctx.view.initRichTextEdit()

    return () => {
      ctx.view?.destroyRichTextEdit()
    }
  },
})