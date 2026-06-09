import { MindMapNode } from '@y-mindmap/state'
import { StyleKey } from '@y-mindmap/core'
import { ExportOptions } from '../index'

export interface SVGExportOptions extends ExportOptions {
  width?: number
  height?: number
  backgroundColor?: string
  padding?: number
  fontFamily?: string
  fontSize?: number
  nodeColor?: string
  textColor?: string
  lineColor?: string
}

const NODE_WIDTH = 160
const NODE_HEIGHT = 40
const HORIZONTAL_SPACING = 200
const VERTICAL_SPACING = 24
const DEFAULT_CORNER_RADIUS = 8
const MAX_VISIBLE_CHARS = 22

interface NodeLayout {
  node: MindMapNode
  x: number
  y: number
  w: number
  h: number
}

export class SVGExporter {
  readonly name = 'svg'
  readonly extensions = ['.svg']
  readonly mimeType = 'image/svg+xml'

  async export(root: MindMapNode, options?: SVGExportOptions): Promise<string> {
    const padding = options?.padding ?? 40
    const defaultNodeColor = options?.nodeColor ?? '#4A90D9'
    const defaultTextColor = options?.textColor ?? '#333333'
    const lineColor = options?.lineColor ?? '#666666'
    const defaultFontFamily = options?.fontFamily ?? 'Arial, sans-serif'
    const defaultFontSize = options?.fontSize ?? 14
    const backgroundColor = options?.backgroundColor ?? '#ffffff'

    const subtreeHeights = new Map<string, number>()
    this.calcSubtreeHeight(root, subtreeHeights)

    const layouts: NodeLayout[] = []
    this.assignPositions(root, 0, padding, subtreeHeights, layouts)

    let maxX = 0
    let maxY = 0
    for (const l of layouts) {
      if (l.x + l.w > maxX) maxX = l.x + l.w
      if (l.y + l.h > maxY) maxY = l.y + l.h
    }

    const width = options?.width ?? (maxX + padding)
    const height = options?.height ?? (maxY + padding)

    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `  <rect width="100%" height="100%" fill="${this.esc(backgroundColor)}"/>`,
    ]

    this.renderConnections(layouts, lineColor, lines)

    for (const l of layouts) {
      this.renderNode(l, defaultNodeColor, defaultTextColor, defaultFontFamily, defaultFontSize, lines)
    }

    lines.push('</svg>')
    return lines.join('\n')
  }

  private calcSubtreeHeight(node: MindMapNode, heights: Map<string, number>): number {
    if (node.isFolded || !node.hasChildren) {
      heights.set(node.id, NODE_HEIGHT)
      return NODE_HEIGHT
    }

    const children = node.attachedChildren
    let total = 0
    for (const [i, child] of children.entries()) {
      total += this.calcSubtreeHeight(child, heights)
      if (i < children.length - 1) {
        total += VERTICAL_SPACING
      }
    }

    const h = Math.max(NODE_HEIGHT, total)
    heights.set(node.id, h)
    return h
  }

  private assignPositions(
    node: MindMapNode,
    depth: number,
    startY: number,
    heights: Map<string, number>,
    layouts: NodeLayout[],
  ): void {
    const subtreeHeight = heights.get(node.id) ?? NODE_HEIGHT
    const x = depth * (NODE_WIDTH + HORIZONTAL_SPACING)
    const y = startY + (subtreeHeight - NODE_HEIGHT) / 2

    layouts.push({ node, x, y, w: NODE_WIDTH, h: NODE_HEIGHT })

    if (!node.isFolded && node.hasChildren) {
      const children = node.attachedChildren
      let childStartY = startY
      for (const child of children) {
        const childHeight = heights.get(child.id) ?? NODE_HEIGHT
        this.assignPositions(child, depth + 1, childStartY, heights, layouts)
        childStartY += childHeight + VERTICAL_SPACING
      }
    }
  }

  private renderConnections(
    layouts: NodeLayout[],
    lineColor: string,
    lines: string[],
  ): void {
    const layoutMap = new Map<string, NodeLayout>()
    for (const l of layouts) {
      layoutMap.set(l.node.id, l)
    }

    for (const l of layouts) {
      if (l.node.isFolded) continue

      for (const child of l.node.attachedChildren) {
        const childLayout = layoutMap.get(child.id)
        if (!childLayout) continue

        const x1 = l.x + l.w
        const y1 = l.y + l.h / 2
        const x2 = childLayout.x
        const y2 = childLayout.y + childLayout.h / 2
        const dx = (x2 - x1) * 0.4

        lines.push(
          `  <path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" ` +
          `fill="none" stroke="${this.esc(lineColor)}" stroke-width="2"/>`,
        )
      }
    }
  }

  private renderNode(
    layout: NodeLayout,
    defaultNodeColor: string,
    defaultTextColor: string,
    defaultFontFamily: string,
    defaultFontSize: number,
    lines: string[],
  ): void {
    const { node, x, y, w, h } = layout

    let fillColor = defaultNodeColor
    let tColor = defaultTextColor
    let fFamily = defaultFontFamily
    let fSize = defaultFontSize
    let cornerRadius = DEFAULT_CORNER_RADIUS

    if (node.style?.properties) {
      const p = node.style.properties
      if (p[StyleKey.FILL_COLOR]) fillColor = String(p[StyleKey.FILL_COLOR])
      if (p[StyleKey.TEXT_COLOR]) tColor = String(p[StyleKey.TEXT_COLOR])
      if (p[StyleKey.FONT_FAMILY]) fFamily = String(p[StyleKey.FONT_FAMILY])
      if (p[StyleKey.FONT_SIZE]) fSize = this.parseFontSize(p[StyleKey.FONT_SIZE])
      if (p[StyleKey.CORNER_RADIUS]) cornerRadius = Number(p[StyleKey.CORNER_RADIUS])
    }

    const displayText = node.displayTitle
    const label = displayText.length > MAX_VISIBLE_CHARS
      ? displayText.substring(0, MAX_VISIBLE_CHARS) + '\u2026'
      : displayText

    lines.push(
      `  <g>`,
      `    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${cornerRadius}" ry="${cornerRadius}" ` +
      `fill="${this.esc(fillColor)}" stroke="${this.esc(tColor)}" stroke-width="1.5"/>`,
      `    <text x="${x + w / 2}" y="${y + h / 2}" ` +
      `fill="${this.esc(tColor)}" font-family="${this.esc(fFamily)}" ` +
      `font-size="${fSize}" text-anchor="middle" dominant-baseline="central">${this.esc(label)}</text>`,
      `  </g>`,
    )
  }

  private parseFontSize(value: unknown): number {
    if (typeof value === 'number') return Math.round(value)
    const str = String(value).replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(str)
    return Number.isFinite(parsed) ? Math.round(parsed) : 14
  }

  private esc(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
