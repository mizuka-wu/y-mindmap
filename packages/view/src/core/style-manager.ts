import { StyleKey, DEFAULT_TOPIC_STYLE, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'
import type { NodeView } from './node-view'
import type { TopicNodeView } from '../node-views/topic-node-view'
import { themeManager } from './theme-manager'

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

export class StyleManager {
  private static instance: StyleManager
  private _styleCache: WeakMap<NodeView, Map<StyleKey, any>> = new WeakMap()

  static getInstance(): StyleManager {
    if (!StyleManager.instance) {
      StyleManager.instance = new StyleManager()
    }
    return StyleManager.instance
  }

  getStyleValue(nodeView: NodeView, key: StyleKey): any {
    const cached = this._styleCache.get(nodeView)
    if (cached?.has(key)) {
      return cached.get(key)
    }

    const sourceNode = this.getStyleSourceNode(nodeView)
    if (sourceNode) {
      const style = sourceNode.getNode().style
      if (style?.properties) {
        const value = style.properties[key]
        if (value !== undefined) {
          this.setCacheEntry(nodeView, key, value)
          return value
        }
      }
    }

    const level = this.getNodeLevel(nodeView)
    if (level) {
      const themeValue = themeManager.getThemeStyleValue(level, key)
      if (themeValue !== undefined) {
        this.setCacheEntry(nodeView, key, themeValue)
        return themeValue
      }
    }

    const defaultValue = this.getDefaultStyleValue(key)
    this.setCacheEntry(nodeView, key, defaultValue)
    return defaultValue
  }

  private setCacheEntry(nodeView: NodeView, key: StyleKey, value: any): void {
    let cache = this._styleCache.get(nodeView)
    if (!cache) {
      cache = new Map()
      this._styleCache.set(nodeView, cache)
    }
    cache.set(key, value)
  }

  invalidateCache(nodeView: NodeView): void {
    this._styleCache.delete(nodeView)
  }

  invalidateAllCache(): void {
    this._styleCache = new WeakMap()
  }

  getStyleValueOrDefault(nodeView: NodeView, key: StyleKey, defaultValue: any): any {
    const value = this.getStyleValue(nodeView, key)
    return value !== undefined ? value : defaultValue
  }

  private getStyleSourceNode(nodeView: NodeView): NodeView | null {
    if (this.isBranchNodeView(nodeView)) {
      return nodeView
    }

    const owningBranch = this.getOwningBranch(nodeView)
    if (owningBranch) {
      return owningBranch
    }

    return nodeView
  }

  private getOwningBranch(nodeView: NodeView): NodeView | null {
    if (typeof (nodeView as any).getOwningBranch === 'function') {
      return (nodeView as any).getOwningBranch() as NodeView | null
    }
    return null
  }

  private isBranchNodeView(nodeView: NodeView): boolean {
    return typeof (nodeView as any).getStructureClass === 'function'
  }

  isCalloutBranch(branchView: NodeView): boolean {
    return branchView.getNode().type === 'callout'
  }

  private getNodeLevel(nodeView: NodeView): 'central' | 'main' | 'sub' | null {
    const node = nodeView.getNode()
    if (node.type === 'root') return 'central'

    const parent = nodeView.getParent?.()
    if (parent?.getNode?.()?.type === 'root') return 'main'

    return 'sub'
  }

  getDefaultStyleValue(key: StyleKey): any {
    const defaults: Record<string, any> = {
      'shape-class': DEFAULT_TOPIC_STYLE.shapeClass,
      'corner-radius': DEFAULT_TOPIC_STYLE.cornerRadius,
      'fill-color': DEFAULT_TOPIC_STYLE.fillColor,
      'fill-opacity': DEFAULT_TOPIC_STYLE.fillOpacity,
      'border-color': DEFAULT_TOPIC_STYLE.borderColor,
      'border-width': DEFAULT_TOPIC_STYLE.borderWidth,
      'border-pattern': DEFAULT_TOPIC_STYLE.borderStyle,
      'border-opacity': DEFAULT_TOPIC_STYLE.borderOpacity,
      'font-family': DEFAULT_TOPIC_STYLE.fontFamily,
      'font-size': DEFAULT_TOPIC_STYLE.fontSize,
      'font-weight': DEFAULT_TOPIC_STYLE.fontWeight,
      'font-style': DEFAULT_TOPIC_STYLE.fontStyle,
      'text-color': DEFAULT_TOPIC_STYLE.textColor,
      'text-align': DEFAULT_TOPIC_STYLE.textAlign,
      'text-decoration': DEFAULT_TOPIC_STYLE.textDecoration,
      'text-transform': DEFAULT_TOPIC_STYLE.textTransform,
      'line-class': DEFAULT_CONNECTION_STYLE.lineClass,
      'line-color': DEFAULT_CONNECTION_STYLE.lineColor,
      'line-width': DEFAULT_CONNECTION_STYLE.lineWidth,
      'line-pattern': DEFAULT_CONNECTION_STYLE.lineStyle,
      'line-tapered': DEFAULT_CONNECTION_STYLE.tapered,
    }
    return defaults[key]
  }

  computeVisualFillColor(nodeView: NodeView, backgroundColor: string = '#ffffff'): string | undefined {
    const fillColor = this.getStyleValue(nodeView, StyleKey.FILL_COLOR)
    if (!fillColor || fillColor === 'none') {
      return undefined
    }

    const rgba = this.parseColor(fillColor)
    if (!rgba) {
      return fillColor
    }

    if (rgba.a >= 1) {
      return fillColor
    }

    const bg = this.parseColor(backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }
    const blended = this.blendColors(rgba, bg)
    return this.toHexColor(blended)
  }

  private parseColor(color: string): RGBA | null {
    if (!color) return null

    if (color.startsWith('#')) {
      const hex = color.slice(1)
      if (hex.length === 3) {
        return {
          r: parseInt((hex[0] || "0") + (hex[0] || "0"), 16),
          g: parseInt((hex[1] || "0") + (hex[1] || "0"), 16),
          b: parseInt((hex[2] || "0") + (hex[2] || "0"), 16),
          a: 1,
        }
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2) || "0", 16),
          g: parseInt(hex.slice(2, 4) || "0", 16),
          b: parseInt(hex.slice(4, 6) || "0", 16),
          a: 1,
        }
      } else if (hex.length === 8) {
        return {
          r: parseInt(hex.slice(0, 2) || "0", 16),
          g: parseInt(hex.slice(2, 4) || "0", 16),
          b: parseInt(hex.slice(4, 6) || "0", 16),
          a: parseInt(hex.slice(6, 8) || "ff", 16) / 255,
        }
      }
    }

    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (rgbaMatch) {
      return {
        r: parseInt(rgbaMatch[1] || "0"),
        g: parseInt(rgbaMatch[2] || "0"),
        b: parseInt(rgbaMatch[3] || "0"),
        a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
      }
    }

    return null
  }

  private blendColors(fg: RGBA, bg: RGBA): RGBA {
    const a = fg.a
    return {
      r: Math.round(fg.r * a + bg.r * (1 - a)),
      g: Math.round(fg.g * a + bg.g * (1 - a)),
      b: Math.round(fg.b * a + bg.b * (1 - a)),
      a: 1,
    }
  }

  private toHexColor(color: RGBA): string {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
  }
}

export const styleManager = StyleManager.getInstance()
