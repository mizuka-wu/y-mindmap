import { AttributeTitle, AttributeTitleUnit, AttributeTitleStyle, StyleData } from '@y-mindmap/core'

export interface ResolvedStyle {
  'fo:font-family': string
  'fo:font-weight': string | number
  'fo:font-style': string
  'fo:font-size': string | number
  'fo:color': string
  'fo:text-decoration': string
  'fo:background-color': string
}

export interface StyleContext {
  theme?: Partial<ResolvedStyle>
  nodeStyle?: StyleData
  parentStyle?: Partial<ResolvedStyle>
}

const DEFAULT_STYLE: ResolvedStyle = {
  'fo:font-family': 'Arial, sans-serif',
  'fo:font-weight': 'normal',
  'fo:font-style': 'normal',
  'fo:font-size': 14,
  'fo:color': '#333333',
  'fo:text-decoration': 'none',
  'fo:background-color': 'transparent',
}

export class StyleResolver {
  private themeDefaults: Partial<ResolvedStyle>
  private cache: Map<string, ResolvedStyle> = new Map()

  constructor(themeDefaults?: Partial<ResolvedStyle>) {
    this.themeDefaults = themeDefaults || {}
  }

  resolveUnit(unit: AttributeTitleUnit, context: StyleContext = {}): ResolvedStyle {
    const cacheKey = this.getCacheKey(unit, context)
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    const resolved: ResolvedStyle = {
      'fo:font-family': this.resolveFontFamily(unit, context),
      'fo:font-weight': this.resolveFontWeight(unit, context),
      'fo:font-style': this.resolveFontStyle(unit, context),
      'fo:font-size': this.resolveFontSize(unit, context),
      'fo:color': this.resolveColor(unit, context),
      'fo:text-decoration': this.resolveTextDecoration(unit, context),
      'fo:background-color': this.resolveBackgroundColor(unit, context),
    }

    this.cache.set(cacheKey, resolved)
    return resolved
  }

  resolveAttributeTitle(title: AttributeTitle, context: StyleContext = {}): ResolvedStyle[] {
    if (!title || title.length === 0) return []
    return title.map(unit => this.resolveUnit(unit, context))
  }

  getBaseStyle(context: StyleContext = {}): ResolvedStyle {
    return {
      'fo:font-family': this.themeDefaults['fo:font-family'] 
        || this.getNodeStyleProperty(context.nodeStyle, 'font-family')
        || DEFAULT_STYLE['fo:font-family'],
      'fo:font-weight': this.themeDefaults['fo:font-weight']
        || this.getNodeStyleProperty(context.nodeStyle, 'font-weight')
        || DEFAULT_STYLE['fo:font-weight'],
      'fo:font-style': this.themeDefaults['fo:font-style']
        || this.getNodeStyleProperty(context.nodeStyle, 'font-style')
        || DEFAULT_STYLE['fo:font-style'],
      'fo:font-size': this.themeDefaults['fo:font-size']
        || this.getNodeStyleProperty(context.nodeStyle, 'font-size')
        || DEFAULT_STYLE['fo:font-size'],
      'fo:color': this.themeDefaults['fo:color']
        || this.getNodeStyleProperty(context.nodeStyle, 'text-color')
        || DEFAULT_STYLE['fo:color'],
      'fo:text-decoration': this.themeDefaults['fo:text-decoration']
        || DEFAULT_STYLE['fo:text-decoration'],
      'fo:background-color': this.themeDefaults['fo:background-color']
        || this.getNodeStyleProperty(context.nodeStyle, 'background-color')
        || DEFAULT_STYLE['fo:background-color'],
    }
  }

  clearCache(): void {
    this.cache.clear()
  }

  private resolveFontFamily(unit: AttributeTitleUnit, context: StyleContext): string {
    if (unit['fo:font-family']) return unit['fo:font-family']
    if (context.parentStyle?.['fo:font-family']) return context.parentStyle['fo:font-family']
    return this.getBaseStyle(context)['fo:font-family']
  }

  private resolveFontWeight(unit: AttributeTitleUnit, context: StyleContext): string | number {
    if (unit['fo:font-weight']) return unit['fo:font-weight']
    if (context.parentStyle?.['fo:font-weight']) return context.parentStyle['fo:font-weight']
    return this.getBaseStyle(context)['fo:font-weight']
  }

  private resolveFontStyle(unit: AttributeTitleUnit, context: StyleContext): string {
    if (unit['fo:font-style']) return unit['fo:font-style']
    if (context.parentStyle?.['fo:font-style']) return context.parentStyle['fo:font-style']
    return this.getBaseStyle(context)['fo:font-style']
  }

  private resolveFontSize(unit: AttributeTitleUnit, context: StyleContext): string | number {
    if (unit['fo:font-size']) return unit['fo:font-size']
    if (context.parentStyle?.['fo:font-size']) return context.parentStyle['fo:font-size']
    return this.getBaseStyle(context)['fo:font-size']
  }

  private resolveColor(unit: AttributeTitleUnit, context: StyleContext): string {
    if (unit['fo:color']) return unit['fo:color']
    if (context.parentStyle?.['fo:color']) return context.parentStyle['fo:color']
    return this.getBaseStyle(context)['fo:color']
  }

  private resolveTextDecoration(unit: AttributeTitleUnit, context: StyleContext): string {
    if (unit['fo:text-decoration']) return unit['fo:text-decoration']
    if (context.parentStyle?.['fo:text-decoration']) return context.parentStyle['fo:text-decoration']
    return this.getBaseStyle(context)['fo:text-decoration']
  }

  private resolveBackgroundColor(unit: AttributeTitleUnit, context: StyleContext): string {
    if (unit['fo:background-color']) return unit['fo:background-color']
    if (context.parentStyle?.['fo:background-color']) return context.parentStyle['fo:background-color']
    return this.getBaseStyle(context)['fo:background-color']
  }

  private getNodeStyleProperty(nodeStyle: StyleData | undefined, key: string): string | undefined {
    if (!nodeStyle?.properties) return undefined
    return (nodeStyle.properties as Record<string, any>)[key]
  }

  private getCacheKey(unit: AttributeTitleUnit, context: StyleContext): string {
    const unitKey = JSON.stringify(unit)
    const contextKey = JSON.stringify({
      theme: context.theme,
      nodeStyle: context.nodeStyle?.id,
      parentStyle: context.parentStyle,
    })
    return `${unitKey}|${contextKey}`
  }
}

let globalStyleResolver: StyleResolver | null = null

export function getStyleResolver(themeDefaults?: Partial<ResolvedStyle>): StyleResolver {
  if (!globalStyleResolver) {
    globalStyleResolver = new StyleResolver(themeDefaults)
  }
  return globalStyleResolver
}
