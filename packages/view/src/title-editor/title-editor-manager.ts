import { Bounds, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import { MindMapNode } from '@y-mindmap/state'
import { TitleEditor, TitleRenderer, TitleStyle, EditResult, TitleEditorEvents } from './types'
import { PlainTextEditor } from './plain-text-editor'
import { PlainTextRenderer } from './plain-text-renderer'

export interface TitleEditorManagerConfig {
  container: HTMLElement
  editorType?: 'plain' | 'richtext' | 'markdown'
  rendererType?: 'plain' | 'richtext' | 'markdown'
  events?: TitleEditorEvents
}

export class TitleEditorManager {
  private editor: TitleEditor
  private renderer: TitleRenderer
  private container: HTMLElement
  
  constructor(config: TitleEditorManagerConfig) {
    this.container = config.container
    
    this.editor = this.createEditor(config.editorType || 'plain', config.events)
    this.renderer = this.createRenderer(config.rendererType || 'plain')
  }
  
  get isEditing(): boolean {
    return this.editor.isEditing
  }
  
  get editingNodeId(): string | null {
    return this.editor.editingNodeId
  }
  
  startEditing(node: MindMapNode, bounds: Bounds): void {
    const style = this.getNodeStyle(node)
    this.editor.startEditing(node.id, node.title, bounds, {
      placeholder: '输入标题...',
      multiline: false,
      autoSelect: true,
    })
  }
  
  stopEditing(): EditResult | null {
    return this.editor.stopEditing()
  }
  
  cancelEditing(): void {
    this.editor.cancelEditing()
  }
  
  renderTitle(node: MindMapNode, bounds: Bounds): any {
    const style = this.getNodeStyle(node)
    const result = this.renderer.render(node.title, bounds, style)
    return result.element
  }
  
  measureTitle(node: MindMapNode, maxWidth: number): { width: number; height: number } {
    const style = this.getNodeStyle(node)
    return this.renderer.measure(node.title, maxWidth, style)
  }
  
  destroy(): void {
    this.editor.destroy()
    this.renderer.destroy()
  }
  
  private createEditor(type: string, events?: TitleEditorEvents): TitleEditor {
    switch (type) {
      case 'plain':
        return new PlainTextEditor(this.container, events)
      case 'richtext':
        return new PlainTextEditor(this.container, events)
      case 'markdown':
        return new PlainTextEditor(this.container, events)
      default:
        return new PlainTextEditor(this.container, events)
    }
  }
  
  private createRenderer(type: string): TitleRenderer {
    switch (type) {
      case 'plain':
        return new PlainTextRenderer()
      case 'richtext':
        return new PlainTextRenderer()
      case 'markdown':
        return new PlainTextRenderer()
      default:
        return new PlainTextRenderer()
    }
  }
  
  private getNodeStyle(node: MindMapNode): TitleStyle {
    const nodeStyle = node.style?.properties || {}
    
    return {
      fontFamily: nodeStyle['font-family'] || DEFAULT_TOPIC_STYLE.fontFamily || 'Arial',
      fontSize: nodeStyle['font-size'] || DEFAULT_TOPIC_STYLE.fontSize || 14,
      fontWeight: nodeStyle['font-weight'] || DEFAULT_TOPIC_STYLE.fontWeight || 'normal',
      fontStyle: nodeStyle['font-style'] || DEFAULT_TOPIC_STYLE.fontStyle || 'normal',
      color: nodeStyle['text-color'] || DEFAULT_TOPIC_STYLE.textColor || '#333',
      textAlign: (nodeStyle['text-align'] as any) || 'center',
      lineHeight: (nodeStyle as any)['line-height'] || 1.2,
    }
  }
}
