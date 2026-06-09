import { ExtensionDefinition } from '@y-mindmap/extension'
import {
  ContextMenu,
  type ContextMenuOptions,
  DragDrop,
  type DragDropOptions,
  BoxSelect,
  RichTextEdit,
  type RichTextEditOptions,
  InertialScroll,
  type InertialScrollOptions,
  Gesture,
  type GestureOptions,
  Keymap,
  type KeymapOptions,
  Clipboard,
  ExportXMind,
  ExportMarkdown,
  ExportJSON,
  ExportPNG,
  type ExportPNGOptions,
  ExportSVG,
  ExportPDF,
} from '@y-mindmap/extensions'

export interface StarterKitOptions {
  contextMenu?: Partial<ContextMenuOptions> | false
  dragDrop?: Partial<DragDropOptions> | false
  boxSelect?: false
  richTextEdit?: Partial<RichTextEditOptions> | false
  inertialScroll?: Partial<InertialScrollOptions> | false
  gesture?: Partial<GestureOptions> | false
  keymap?: Partial<KeymapOptions> | false
  clipboard?: false
  exportXMind?: false
  exportMarkdown?: false
  exportJSON?: false
  exportPNG?: Partial<ExportPNGOptions> | false
  exportSVG?: false
  exportPDF?: false
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

  if (options?.inertialScroll !== false) {
    extensions.push(
      options?.inertialScroll
        ? InertialScroll.configure(options.inertialScroll)
        : InertialScroll
    )
  }

  if (options?.gesture !== false) {
    extensions.push(
      options?.gesture
        ? Gesture.configure(options.gesture)
        : Gesture
    )
  }

  if (options?.keymap !== false) {
    extensions.push(
      options?.keymap
        ? Keymap.configure(options.keymap)
        : Keymap
    )
  }

  if (options?.clipboard !== false) {
    extensions.push(Clipboard)
  }

  if (options?.exportXMind !== false) {
    extensions.push(ExportXMind)
  }

  if (options?.exportMarkdown !== false) {
    extensions.push(ExportMarkdown)
  }

  if (options?.exportJSON !== false) {
    extensions.push(ExportJSON)
  }

  if (options?.exportPNG !== false) {
    extensions.push(
      options?.exportPNG
        ? ExportPNG.configure(options.exportPNG)
        : ExportPNG
    )
  }

  if (options?.exportSVG !== false) {
    extensions.push(ExportSVG)
  }

  if (options?.exportPDF !== false) {
    extensions.push(ExportPDF)
  }

  return extensions
}
