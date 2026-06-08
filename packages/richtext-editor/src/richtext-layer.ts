import { AttributeTitle, AttributeTitleUnit, StyleData } from '@y-mindmap/core'
import { MeasureEngine, Size, getMeasureEngine } from './measure-engine'
import { FontManager, getFontManager } from './font-manager'
import { StyleResolver, ResolvedStyle, StyleContext, getStyleResolver } from './style-resolver'
import { RichTextEditor, RichTextEditorConfig } from './editor'
import { createDefaultPlugins } from './plugins'

export interface RichTextLayerConfig {
  padding?: { top: number; right: number; bottom: number; left: number }
  editorType?: 'simple' | 'prosemirror'
  themeDefaults?: Partial<ResolvedStyle>
  onMeasure?: (title: AttributeTitle, size: Size) => void
}

export interface DisplayOptions {
  maxWidth?: number
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  styleContext?: StyleContext
}

export interface EditOptions {
  multiline?: boolean
  styleContext?: StyleContext
  onSubmit?: (value: AttributeTitle) => void
  onCancel?: () => void
}

export class RichTextLayer {
  private measureEngine: MeasureEngine
  private fontManager: FontManager
  private styleResolver: StyleResolver
  private config: RichTextLayerConfig
  private currentEditor: RichTextEditor | null = null
  private fontLoadCallback: (() => void) | null = null

  constructor(config: RichTextLayerConfig = {}) {
    this.config = config
    this.styleResolver = getStyleResolver(config.themeDefaults)
    this.measureEngine = getMeasureEngine(this.styleResolver)
    this.fontManager = getFontManager()

    this.fontLoadCallback = () => {
      this.measureEngine.clearCache()
      this.styleResolver.clearCache()
    }
    this.fontManager.onFontLoaded(this.fontLoadCallback)
  }

  measure(title: AttributeTitle, options: DisplayOptions = {}): Size {
    const size = this.measureEngine.measureAttributeTitle(title, {
      padding: this.config.padding,
      maxWidth: options.maxWidth,
      styleContext: options.styleContext,
    })

    this.config.onMeasure?.(title, size)
    return size
  }

  measureMultiline(title: AttributeTitle, maxWidth: number, options: DisplayOptions = {}): Size {
    return this.measureEngine.measureMultilineAttributeTitle(title, maxWidth, {
      padding: this.config.padding,
      styleContext: options.styleContext,
    })
  }

  display(container: HTMLElement, title: AttributeTitle, options: DisplayOptions = {}): void {
    container.innerHTML = ''

    if (!title || title.length === 0) return

    const context = options.styleContext || {}
    const size = this.measure(title, options)
    const padding = this.config.padding || { top: 0, right: 0, bottom: 0, left: 0 }

    const wrapper = document.createElement('div')
    wrapper.className = 'y-mindmap-richtext-display'
    wrapper.style.position = 'relative'
    wrapper.style.width = `${size.width}px`
    wrapper.style.height = `${size.height}px`
    wrapper.style.padding = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`
    wrapper.style.boxSizing = 'border-box'

    const content = document.createElement('div')
    content.className = 'y-mindmap-richtext-content'

    for (const unit of title) {
      const resolvedStyle = this.styleResolver.resolveUnit(unit, context)
      const span = this.createUnitElement(unit, resolvedStyle)
      content.appendChild(span)
    }

    wrapper.appendChild(content)
    container.appendChild(wrapper)
  }

  async edit(
    container: HTMLElement,
    title: AttributeTitle,
    options: EditOptions = {}
  ): Promise<AttributeTitle> {
    return new Promise((resolve, reject) => {
      const editorConfig: RichTextEditorConfig = {
        container,
        multiline: options.multiline,
        onSubmit: (value) => {
          options.onSubmit?.(value)
          resolve(value)
          this.currentEditor = null
        },
        onCancel: () => {
          options.onCancel?.()
          resolve(title)
          this.currentEditor = null
        },
        onChange: () => {},
      }

      const editor = new RichTextEditor(editorConfig)
      const plugins = createDefaultPlugins()
      plugins.forEach(p => editor.registerPlugin(p))

      editor.mount()
      editor.setValue(title)
      editor.focus()

      this.currentEditor = editor
    })
  }

  cancelEdit(): void {
    if (this.currentEditor) {
      this.currentEditor.unmount()
      this.currentEditor = null
    }
  }

  collectFonts(title: AttributeTitle): string[] {
    const fonts = new Set<string>()
    for (const unit of title) {
      if (unit['fo:font-family']) {
        fonts.add(unit['fo:font-family'])
      }
    }
    return Array.from(fonts)
  }

  async ensureFontsLoaded(title: AttributeTitle): Promise<void> {
    const fonts = this.collectFonts(title)
    if (fonts.length > 0) {
      await this.fontManager.ensureFontsLoaded(fonts)
    }
  }

  getResolvedStyle(unit: AttributeTitleUnit, context?: StyleContext): ResolvedStyle {
    return this.styleResolver.resolveUnit(unit, context)
  }

  getBaseStyle(context?: StyleContext): ResolvedStyle {
    return this.styleResolver.getBaseStyle(context)
  }

  destroy(): void {
    this.cancelEdit()
    if (this.fontLoadCallback) {
      this.fontManager.offFontLoaded(this.fontLoadCallback)
    }
  }

  private createUnitElement(unit: AttributeTitleUnit, resolvedStyle: ResolvedStyle): HTMLElement {
    const span = document.createElement('span')
    span.className = 'y-mindmap-richtext-unit'

    span.style.fontFamily = resolvedStyle['fo:font-family']
    span.style.fontWeight = String(resolvedStyle['fo:font-weight'])
    span.style.fontStyle = resolvedStyle['fo:font-style']
    span.style.fontSize = String(resolvedStyle['fo:font-size'])
    span.style.color = resolvedStyle['fo:color']
    span.style.backgroundColor = resolvedStyle['fo:background-color']
    span.style.textDecoration = resolvedStyle['fo:text-decoration']

    if (unit.href) {
      const link = document.createElement('a')
      link.href = unit.href
      link.textContent = unit.text
      span.appendChild(link)
    } else if (unit.formula) {
      const formula = document.createElement('span')
      formula.className = 'y-mindmap-formula'
      formula.setAttribute('data-formula', unit.formula)
      formula.textContent = unit.text
      span.appendChild(formula)
    } else {
      span.textContent = unit.text
    }

    return span
  }
}

let globalRichTextLayer: RichTextLayer | null = null

export function getRichTextLayer(config?: RichTextLayerConfig): RichTextLayer {
  if (!globalRichTextLayer) {
    globalRichTextLayer = new RichTextLayer(config)
  }
  return globalRichTextLayer
}
