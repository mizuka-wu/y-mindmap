import { ExtensionDefinition } from '@y-mindmap/extension'
import { ContextMenu, type ContextMenuOptions } from './extensions/context-menu'
import { DragDrop, type DragDropOptions } from './extensions/drag-drop'
import { BoxSelect } from './extensions/box-select'
import { RichTextEdit, type RichTextEditOptions } from './extensions/rich-text-edit'

export interface StarterKitOptions {
  contextMenu?: Partial<ContextMenuOptions> | false
  dragDrop?: Partial<DragDropOptions> | false
  boxSelect?: false
  richTextEdit?: Partial<RichTextEditOptions> | false
}

export function StarterKit(options?: StarterKitOptions): ExtensionDefinition[] {
  const extensions: ExtensionDefinition[] = []

  if (options?.contextMenu !== false) {
    extensions.push(
      options?.contextMenu
        ? ContextMenu.configure(options.contextMenu)
        : ContextMenu
    )
  }

  if (options?.dragDrop !== false) {
    extensions.push(
      options?.dragDrop
        ? DragDrop.configure(options.dragDrop)
        : DragDrop
    )
  }

  if (options?.boxSelect !== false) {
    extensions.push(BoxSelect)
  }

  if (options?.richTextEdit !== false) {
    extensions.push(
      options?.richTextEdit
        ? RichTextEdit.configure(options.richTextEdit)
        : RichTextEdit
    )
  }

  return extensions
}