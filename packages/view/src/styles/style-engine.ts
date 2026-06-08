import { MindMapNode } from '@y-mindmap/state'
import { NodeStyle, ConnectionStyle, DEFAULT_TOPIC_STYLE, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'

export interface ComputedStyle {
  topic: NodeStyle
  connection: ConnectionStyle
}

export class StyleEngine {
  private styleCache: Map<string, ComputedStyle> = new Map()

  computeStyle(node: MindMapNode, parentStyle?: ComputedStyle): ComputedStyle {
    const cached = this.styleCache.get(node.id)
    if (cached) return cached

    const topicStyle = this.computeTopicStyle(node, parentStyle?.topic)
    const connectionStyle = this.computeConnectionStyle(node, parentStyle?.connection)

    const result: ComputedStyle = {
      topic: topicStyle,
      connection: connectionStyle,
    }

    this.styleCache.set(node.id, result)
    return result
  }

  private computeTopicStyle(node: MindMapNode, parentStyle?: NodeStyle): NodeStyle {
    const base = DEFAULT_TOPIC_STYLE
    const inherited = parentStyle || base
    const nodeStyle = node.style?.properties || {}

    return {
      shapeClass: this.getString(nodeStyle, 'shape-class', inherited.shapeClass, base.shapeClass),
      cornerRadius: this.getNum(nodeStyle, 'corner-radius', inherited.cornerRadius ?? base.cornerRadius ?? 8),
      fillColor: this.getString(nodeStyle, 'fill-color', inherited.fillColor, base.fillColor),
      fillOpacity: this.getNum(nodeStyle, 'fill-opacity', inherited.fillOpacity ?? base.fillOpacity ?? 1),
      borderColor: this.getString(nodeStyle, 'border-color', inherited.borderColor, base.borderColor),
      borderWidth: this.getNum(nodeStyle, 'border-width', inherited.borderWidth ?? base.borderWidth ?? 2),
      borderStyle: (this.getString(nodeStyle, 'border-style', inherited.borderStyle, base.borderStyle) as any),
      borderOpacity: this.getNum(nodeStyle, 'border-opacity', inherited.borderOpacity ?? base.borderOpacity ?? 1),
      fontFamily: this.getString(nodeStyle, 'font-family', inherited.fontFamily, base.fontFamily),
      fontSize: this.getNum(nodeStyle, 'font-size', inherited.fontSize ?? base.fontSize ?? 14),
      fontWeight: (this.getString(nodeStyle, 'font-weight', String(inherited.fontWeight), String(base.fontWeight)) as any),
      fontStyle: (this.getString(nodeStyle, 'font-style', inherited.fontStyle, base.fontStyle) as any),
      textColor: this.getString(nodeStyle, 'text-color', inherited.textColor, base.textColor),
      textAlign: (this.getString(nodeStyle, 'text-align', inherited.textAlign, base.textAlign) as any),
      textDecoration: (this.getString(nodeStyle, 'text-decoration', inherited.textDecoration, base.textDecoration) as any),
      textTransform: (this.getString(nodeStyle, 'text-transform', inherited.textTransform, base.textTransform) as any),
      lineHeight: this.getNum(nodeStyle, 'line-height', inherited.lineHeight ?? base.lineHeight ?? 1.2),
      shadowColor: this.getString(nodeStyle, 'shadow-color', inherited.shadowColor, base.shadowColor),
      shadowBlur: this.getNum(nodeStyle, 'shadow-blur', inherited.shadowBlur ?? base.shadowBlur ?? 0),
      shadowOffsetX: this.getNum(nodeStyle, 'shadow-offset-x', inherited.shadowOffsetX ?? base.shadowOffsetX ?? 0),
      shadowOffsetY: this.getNum(nodeStyle, 'shadow-offset-y', inherited.shadowOffsetY ?? base.shadowOffsetY ?? 0),
      paddingTop: this.getNum(nodeStyle, 'padding-top', inherited.paddingTop ?? base.paddingTop ?? 10),
      paddingRight: this.getNum(nodeStyle, 'padding-right', inherited.paddingRight ?? base.paddingRight ?? 20),
      paddingBottom: this.getNum(nodeStyle, 'padding-bottom', inherited.paddingBottom ?? base.paddingBottom ?? 10),
      paddingLeft: this.getNum(nodeStyle, 'padding-left', inherited.paddingLeft ?? base.paddingLeft ?? 20),
      marginTop: this.getNum(nodeStyle, 'margin-top', inherited.marginTop ?? base.marginTop ?? 5),
      marginRight: this.getNum(nodeStyle, 'margin-right', inherited.marginRight ?? base.marginRight ?? 10),
      marginBottom: this.getNum(nodeStyle, 'margin-bottom', inherited.marginBottom ?? base.marginBottom ?? 5),
      marginLeft: this.getNum(nodeStyle, 'margin-left', inherited.marginLeft ?? base.marginLeft ?? 10),
    }
  }

  private computeConnectionStyle(node: MindMapNode, parentStyle?: ConnectionStyle): ConnectionStyle {
    const base = DEFAULT_CONNECTION_STYLE
    const inherited = parentStyle || base
    const nodeStyle = node.style?.properties || {}

    return {
      lineClass: this.getString(nodeStyle, 'line-class', inherited.lineClass, base.lineClass),
      lineColor: this.getString(nodeStyle, 'line-color', inherited.lineColor, base.lineColor),
      lineWidth: this.getNum(nodeStyle, 'line-width', inherited.lineWidth ?? base.lineWidth ?? 2),
      lineStyle: (this.getString(nodeStyle, 'line-style', inherited.lineStyle, base.lineStyle) as any),
      lineOpacity: this.getNum(nodeStyle, 'line-opacity', inherited.lineOpacity ?? base.lineOpacity ?? 1),
      tapered: this.getBool(nodeStyle, 'line-tapered', inherited.tapered ?? base.tapered ?? false),
    }
  }

  private getString(
    props: Record<string, any>,
    key: string,
    inherited: string | undefined,
    defaultValue: string | undefined
  ): string | undefined {
    const value = props[key]
    if (value !== undefined && value !== null && value !== '') {
      return String(value)
    }
    return inherited ?? defaultValue
  }

  private getNum(
    props: Record<string, any>,
    key: string,
    defaultValue: number
  ): number {
    const value = props[key]
    if (value !== undefined && value !== null) {
      const num = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(num)) return num
    }
    return defaultValue
  }

  private getBool(
    props: Record<string, any>,
    key: string,
    defaultValue: boolean
  ): boolean {
    const value = props[key]
    if (value !== undefined && value !== null) {
      return Boolean(value)
    }
    return defaultValue
  }

  clearCache(): void {
    this.styleCache.clear()
  }

  invalidateNode(nodeId: string): void {
    this.styleCache.delete(nodeId)
  }
}
