import { Bounds } from '@y-mindmap/core'
import { TitleEditor, EditOptions, EditResult, TitleEditorEvents } from './types'

export class PlainTextEditor implements TitleEditor {
  readonly type = 'plain' as const
  
  private _isEditing = false
  private _editingNodeId: string | null = null
  private _originalContent = ''
  private _currentContent = ''
  
  private element: HTMLTextAreaElement | null = null
  private container: HTMLElement
  private events: TitleEditorEvents
  
  constructor(container: HTMLElement, events?: TitleEditorEvents) {
    this.container = container
    this.events = events || {}
  }
  
  get isEditing(): boolean {
    return this._isEditing
  }
  
  get editingNodeId(): string | null {
    return this._editingNodeId
  }
  
  startEditing(
    nodeId: string,
    title: string,
    bounds: Bounds,
    options?: EditOptions
  ): void {
    if (this._isEditing) {
      this.stopEditing()
    }
    
    this._editingNodeId = nodeId
    this._originalContent = title
    this._currentContent = title
    this._isEditing = true
    
    this.element = this.createElement(bounds, options)
    this.container.appendChild(this.element)
    
    this.element.value = title
    this.element.focus()
    
    if (options?.autoSelect !== false) {
      this.element.select()
    }
    
    this.element.addEventListener('keydown', this.handleKeyDown)
    this.element.addEventListener('input', this.handleInput)
    this.element.addEventListener('blur', this.handleBlur)
    
    this.events.onEditStart?.(nodeId)
  }
  
  stopEditing(): EditResult | null {
    if (!this._isEditing || !this.element) {
      return null
    }
    
    const result: EditResult = {
      nodeId: this._editingNodeId!,
      content: this._currentContent,
      originalContent: this._originalContent,
      changed: this._currentContent !== this._originalContent,
    }
    
    this.cleanup()
    
    if (result.changed) {
      this.events.onEditConfirm?.(result.nodeId, result.content)
    }
    
    return result
  }
  
  cancelEditing(): void {
    if (!this._isEditing) {
      return
    }
    
    const nodeId = this._editingNodeId
    this.cleanup()
    
    if (nodeId) {
      this.events.onEditCancel?.(nodeId)
    }
  }
  
  getContent(): string {
    return this._currentContent
  }
  
  setContent(content: string): void {
    this._currentContent = content
    if (this.element) {
      this.element.value = content
    }
  }
  
  selectAll(): void {
    if (this.element) {
      this.element.select()
    }
  }
  
  destroy(): void {
    this.cancelEditing()
  }
  
  private createElement(bounds: Bounds, options?: EditOptions): HTMLTextAreaElement {
    const el = document.createElement('textarea')
    
    el.className = 'y-mindmap-plain-editor'
    el.style.position = 'fixed'
    el.style.left = `${bounds.x}px`
    el.style.top = `${bounds.y}px`
    el.style.width = `${bounds.width}px`
    el.style.height = `${bounds.height}px`
    
    if (options?.multiline === false) {
      el.style.resize = 'none'
      el.style.overflow = 'hidden'
    }
    
    if (options?.maxLength) {
      el.maxLength = options.maxLength
    }
    
    if (options?.placeholder) {
      el.placeholder = options.placeholder
    }
    
    return el
  }
  
  private cleanup(): void {
    if (this.element) {
      this.element.removeEventListener('keydown', this.handleKeyDown)
      this.element.removeEventListener('input', this.handleInput)
      this.element.removeEventListener('blur', this.handleBlur)
      
      this.element.remove()
      this.element = null
    }
    
    this._isEditing = false
    this._editingNodeId = null
    this._originalContent = ''
    this._currentContent = ''
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this.stopEditing()
    }
    
    if (e.key === 'Escape') {
      e.preventDefault()
      this.cancelEditing()
    }
    
    if (e.key === 'Tab') {
      e.preventDefault()
      this.stopEditing()
    }
  }
  
  private handleInput = (): void => {
    if (this.element) {
      this._currentContent = this.element.value
      this.events.onEditing?.(this._editingNodeId!, this._currentContent)
    }
  }
  
  private handleBlur = (): void => {
    this.stopEditing()
  }
}
