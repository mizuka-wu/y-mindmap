import { AttributeTitle, AttributeTitleUnit, AttributeTitleStyle } from '@y-mindmap/core'

export interface RichTextEditorConfig {
  container: HTMLElement
  onChange?: (value: AttributeTitle) => void
  onSubmit?: (value: AttributeTitle) => void
  onCancel?: () => void
  placeholder?: string
  multiline?: boolean
}

export interface RichTextEditorPlugin {
  name: string
  init?: (editor: RichTextEditor) => void
  destroy?: () => void
  toolbar?: ToolbarItem[]
  shortcuts?: Shortcut[]
}

export interface ToolbarItem {
  id: string
  icon: string
  label: string
  action: (editor: RichTextEditor) => void
  isActive?: (editor: RichTextEditor) => boolean
}

export interface Shortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: (editor: RichTextEditor) => void
}

export interface FormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  fontFamily: string | undefined
  fontSize: string | undefined
  color: string | undefined
  backgroundColor: string | undefined
  href: string | undefined
}

export class RichTextEditor {
  private container: HTMLElement
  private editorElement: HTMLElement | null = null
  private config: RichTextEditorConfig
  private plugins: Map<string, RichTextEditorPlugin> = new Map()
  private value: AttributeTitle = []
  private isEditing: boolean = false

  constructor(config: RichTextEditorConfig) {
    this.container = config.container
    this.config = config
  }

  mount(): void {
    this.editorElement = document.createElement('div')
    this.editorElement.className = 'y-mindmap-richtext-editor'
    this.editorElement.contentEditable = 'true'
    this.editorElement.setAttribute('data-placeholder', this.config.placeholder || '输入标题...')

    this.editorElement.addEventListener('input', this.handleInput)
    this.editorElement.addEventListener('keydown', this.handleKeydown)
    this.editorElement.addEventListener('focus', this.handleFocus)
    this.editorElement.addEventListener('blur', this.handleBlur)
    this.editorElement.addEventListener('mouseup', this.updateFormatState)

    this.container.appendChild(this.editorElement)
    this.initPlugins()
  }

  unmount(): void {
    if (this.editorElement) {
      this.editorElement.removeEventListener('input', this.handleInput)
      this.editorElement.removeEventListener('keydown', this.handleKeydown)
      this.editorElement.removeEventListener('focus', this.handleFocus)
      this.editorElement.removeEventListener('blur', this.handleBlur)
      this.editorElement.removeEventListener('mouseup', this.updateFormatState)
      this.editorElement.remove()
      this.editorElement = null
    }
    this.destroyPlugins()
  }

  getValue(): AttributeTitle {
    return this.value
  }

  setValue(value: AttributeTitle): void {
    this.value = value
    this.render()
  }

  getFormatState(): FormatState {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return this.getDefaultFormatState()
    }

    const range = selection.getRangeAt(0)
    const node = range.startContainer.parentElement

    if (!node) {
      return this.getDefaultFormatState()
    }

    const computedStyle = window.getComputedStyle(node)

    return {
      bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 700,
      italic: computedStyle.fontStyle === 'italic',
      underline: computedStyle.textDecoration.includes('underline'),
      strikethrough: computedStyle.textDecoration.includes('line-through'),
      fontFamily: computedStyle.fontFamily || undefined,
      fontSize: computedStyle.fontSize || undefined,
      color: computedStyle.color || undefined,
      backgroundColor: computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' 
        ? computedStyle.backgroundColor 
        : undefined,
      href: node.getAttribute('href') || undefined,
    }
  }

  toggleBold(): void {
    document.execCommand('bold', false)
    this.syncValue()
  }

  toggleItalic(): void {
    document.execCommand('italic', false)
    this.syncValue()
  }

  toggleUnderline(): void {
    document.execCommand('underline', false)
    this.syncValue()
  }

  toggleStrikethrough(): void {
    document.execCommand('strikeThrough', false)
    this.syncValue()
  }

  setFontFamily(fontFamily: string): void {
    document.execCommand('fontName', false, fontFamily)
    this.syncValue()
  }

  setFontSize(fontSize: string): void {
    document.execCommand('fontSize', false, '7')
    const fontElements = this.editorElement?.querySelectorAll('font[size="7"]')
    fontElements?.forEach(el => {
      el.removeAttribute('size')
      ;(el as HTMLElement).style.fontSize = fontSize
    })
    this.syncValue()
  }

  setColor(color: string): void {
    document.execCommand('foreColor', false, color)
    this.syncValue()
  }

  setBackgroundColor(color: string): void {
    document.execCommand('hiliteColor', false, color)
    this.syncValue()
  }

  setLink(url: string): void {
    if (url) {
      document.execCommand('createLink', false, url)
    } else {
      document.execCommand('unlink', false)
    }
    this.syncValue()
  }

  insertFormula(formula: string): void {
    const span = document.createElement('span')
    span.className = 'formula'
    span.setAttribute('data-formula', formula)
    span.textContent = formula

    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(span)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    this.syncValue()
  }

  registerPlugin(plugin: RichTextEditorPlugin): void {
    this.plugins.set(plugin.name, plugin)
    if (this.isEditing && plugin.init) {
      plugin.init(this)
    }
  }

  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name)
    if (plugin?.destroy) {
      plugin.destroy()
    }
    this.plugins.delete(name)
  }

  focus(): void {
    this.editorElement?.focus()
  }

  blur(): void {
    this.editorElement?.blur()
  }

  private handleInput = (): void => {
    this.syncValue()
    this.config.onChange?.(this.value)
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Enter' && !this.config.multiline) {
      e.preventDefault()
      this.config.onSubmit?.(this.value)
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      this.config.onCancel?.()
      return
    }

    for (const [, plugin] of this.plugins) {
      if (plugin.shortcuts) {
        for (const shortcut of plugin.shortcuts) {
          const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true
          const shiftMatch = shortcut.shift ? e.shiftKey : true
          const altMatch = shortcut.alt ? e.altKey : true

          if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
            e.preventDefault()
            shortcut.action(this)
            return
          }
        }
      }
    }
  }

  private handleFocus = (): void => {
    this.isEditing = true
  }

  private handleBlur = (): void => {
    this.isEditing = false
  }

  private initPlugins(): void {
    for (const [, plugin] of this.plugins) {
      if (plugin.init) {
        plugin.init(this)
      }
    }
  }

  private destroyPlugins(): void {
    for (const [, plugin] of this.plugins) {
      if (plugin.destroy) {
        plugin.destroy()
      }
    }
  }

  private render(): void {
    if (!this.editorElement) return

    if (this.value.length === 0) {
      this.editorElement.innerHTML = ''
      return
    }

    const html = this.value.map(unit => this.unitToHtml(unit)).join('')
    this.editorElement.innerHTML = html
  }

  private unitToHtml(unit: AttributeTitleUnit): string {
    let text = unit.text
    text = text.replace(/&/g, '&amp;')
    text = text.replace(/</g, '&lt;')
    text = text.replace(/>/g, '&gt;')
    text = text.replace(/\n/g, '<br>')

    const styles: string[] = []
    if (unit['fo:font-family']) styles.push(`font-family: ${unit['fo:font-family']}`)
    if (unit['fo:font-weight']) styles.push(`font-weight: ${unit['fo:font-weight']}`)
    if (unit['fo:font-style']) styles.push(`font-style: ${unit['fo:font-style']}`)
    if (unit['fo:font-size']) styles.push(`font-size: ${unit['fo:font-size']}`)
    if (unit['fo:color']) styles.push(`color: ${unit['fo:color']}`)
    if (unit['fo:background-color']) styles.push(`background-color: ${unit['fo:background-color']}`)
    if (unit['fo:text-decoration']) styles.push(`text-decoration: ${unit['fo:text-decoration']}`)

    let html = text
    if (styles.length > 0) {
      html = `<span style="${styles.join('; ')}">${html}</span>`
    }

    if (unit.href) {
      html = `<a href="${unit.href}">${html}</a>`
    }

    if (unit.formula) {
      html = `<span class="formula" data-formula="${unit.formula}">${html}</span>`
    }

    return html
  }

  private syncValue(): void {
    if (!this.editorElement) return

    const newValue: AttributeTitle = []
    this.parseNode(this.editorElement, newValue)
    this.value = newValue
  }

  private parseNode(node: Node, result: AttributeTitleUnit[]): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text) {
        result.push({ text })
      }
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement
      const styles: Partial<AttributeTitleStyle> = {}

      if (element.style.fontWeight) {
        styles['fo:font-weight'] = element.style.fontWeight
      }
      if (element.style.fontStyle) {
        styles['fo:font-style'] = element.style.fontStyle
      }
      if (element.style.fontFamily) {
        styles['fo:font-family'] = element.style.fontFamily
      }
      if (element.style.fontSize) {
        styles['fo:font-size'] = element.style.fontSize
      }
      if (element.style.color) {
        styles['fo:color'] = element.style.color
      }
      if (element.style.backgroundColor) {
        styles['fo:background-color'] = element.style.backgroundColor
      }
      if (element.style.textDecoration) {
        styles['fo:text-decoration'] = element.style.textDecoration
      }

      const href = element.tagName === 'A' ? element.getAttribute('href') : undefined
      const formula = element.classList.contains('formula') 
        ? element.getAttribute('data-formula') 
        : undefined

      if (element.tagName === 'BR') {
        result.push({ text: '\n' })
        return
      }

      const childNodes = Array.from(element.childNodes)
      if (childNodes.length === 0 && element.textContent) {
        const unit: AttributeTitleUnit = {
          text: element.textContent,
          ...styles,
        }
        if (href) unit.href = href
        if (formula) unit.formula = formula
        result.push(unit)
        return
      }

      for (const child of childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || ''
          if (text) {
            const unit: AttributeTitleUnit = {
              text,
              ...styles,
            }
            if (href) unit.href = href
            if (formula) unit.formula = formula
            result.push(unit)
          }
        } else {
          this.parseNode(child, result)
        }
      }
    }
  }

  private updateFormatState = (): void => {
  }

  private getDefaultFormatState(): FormatState {
    return {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      fontFamily: undefined,
      fontSize: undefined,
      color: undefined,
      backgroundColor: undefined,
      href: undefined,
    }
  }
}
