import { AttributeTitle, isRichAttributeTitle, getPlainTextFromAttributeTitle, createAttributeTitleFromPlainText } from '@y-mindmap/core'
import { RichTextEditor } from '@y-mindmap/richtext-editor'
import { createDefaultPlugins } from '@y-mindmap/richtext-editor'

export interface RichTextInlineEditorConfig {
  container: HTMLElement
  onSubmit: (nodeId: string, title: AttributeTitle) => void
  onCancel: () => void
}

export class RichTextInlineEditor {
  private container: HTMLElement
  private editorElement: HTMLElement | null = null
  private richTextEditor: RichTextEditor | null = null
  private nodeId: string | null = null
  private originalTitle: AttributeTitle = []
  private config: RichTextInlineEditorConfig

  constructor(config: RichTextInlineEditorConfig) {
    this.container = config.container
    this.config = config
  }

  startEditing(
    nodeId: string,
    title: AttributeTitle | string,
    bounds: { x: number; y: number; width: number; height: number }
  ): void {
    this.nodeId = nodeId

    let attributeTitle: AttributeTitle
    if (typeof title === 'string') {
      attributeTitle = createAttributeTitleFromPlainText(title)
    } else {
      attributeTitle = title
    }
    this.originalTitle = [...attributeTitle]

    this.editorElement = document.createElement('div')
    this.editorElement.className = 'y-mindmap-richtext-inline-editor'
    this.editorElement.style.position = 'fixed'
    this.editorElement.style.left = `${bounds.x}px`
    this.editorElement.style.top = `${bounds.y}px`
    this.editorElement.style.width = `${bounds.width}px`
    this.editorElement.style.height = `${bounds.height}px`
    this.editorElement.style.zIndex = '10000'

    document.body.appendChild(this.editorElement)

    this.richTextEditor = new RichTextEditor({
      container: this.editorElement,
      onSubmit: (value) => {
        this.handleRichTextSubmit(value)
      },
      onCancel: () => {
        this.cancelEditing()
      },
      multiline: false,
    })

    const plugins = createDefaultPlugins()
    plugins.forEach(p => this.richTextEditor!.registerPlugin(p))

    this.richTextEditor.mount()
    this.richTextEditor.setValue(attributeTitle)
    this.richTextEditor.focus()
  }

  stopEditing(): void {
    if (!this.richTextEditor) return

    const newTitle = this.richTextEditor.getValue()

    this.richTextEditor.unmount()
    this.richTextEditor = null

    if (this.editorElement) {
      this.editorElement.remove()
      this.editorElement = null
    }

    if (this.nodeId) {
      this.config.onSubmit(this.nodeId, newTitle)
    }

    this.nodeId = null
    this.originalTitle = []
  }

  cancelEditing(): void {
    if (this.richTextEditor) {
      this.richTextEditor.unmount()
      this.richTextEditor = null
    }

    if (this.editorElement) {
      this.editorElement.remove()
      this.editorElement = null
    }

    this.nodeId = null
    this.originalTitle = []

    this.config.onCancel()
  }

  isEditing(): boolean {
    return this.richTextEditor !== null
  }

  getEditingNodeId(): string | null {
    return this.nodeId
  }

  dispose(): void {
    if (this.isEditing()) {
      this.cancelEditing()
    }
  }

  private handleRichTextSubmit(value: AttributeTitle): void {
    if (this.richTextEditor) {
      this.richTextEditor.unmount()
      this.richTextEditor = null
    }

    if (this.editorElement) {
      this.editorElement.remove()
      this.editorElement = null
    }

    if (this.nodeId) {
      this.config.onSubmit(this.nodeId, value)
    }

    this.nodeId = null
    this.originalTitle = []
  }
}
