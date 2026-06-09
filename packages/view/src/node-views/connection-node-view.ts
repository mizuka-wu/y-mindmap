import { Path, Group } from 'leafer-ui'
import type { MindMapNode } from '@y-mindmap/state'
import { NodeView, Size, Bounds } from '../core/node-view'
import type { BranchNodeView } from './containers/branch-node-view'
import { styleManager } from '../core/style-manager'
import { StyleKey, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'
import type { ArrowStyle } from '@y-mindmap/core'

export interface ConnectionLayout {
  connectionId: string
  path: string
  startPoint: { x: number; y: number }
  endPoint: { x: number; y: number }
  controlPoints: { x: number; y: number }[]
}

export class ConnectionNodeView extends NodeView {
  private path: Path | null = null
  private connectionLayout: ConnectionLayout | null = null
  private _lineClass: string = 'curve'
  private _linePattern: string = 'solid'
  private _lineTapered: boolean = false
  private _lineCorner: number = 8
  private _startArrow: ArrowStyle | null = null
  private _endArrow: ArrowStyle | null = null

  protected initialize(): void {
    this.path = new Path({
      stroke: '#999999',
      strokeWidth: 2,
      fill: 'none',
    })
    this.group.add(this.path)
  }
  
  protected calculatePreferredSize(): Size {
    return { width: 0, height: 0 }
  }
  
  protected applyLayout(): void {
    if (!this.path || !this.connectionLayout) return
    
    this._lineClass = (this.getParent() as BranchNodeView | null)?.getLineClass?.() ?? 'curve'
    this.path.path = this.getStyledPath(this._lineClass)
  }
  
  protected applyPaint(): void {
    if (!this.path) return

    const parent = this.getParent() as BranchNodeView | null
    const lineColor = parent && typeof parent.getLineColor === 'function' ? parent.getLineColor() : '#999999'
    const lineWidth = parent && typeof parent.getLineWidth === 'function' ? parent.getLineWidth() : 2
    const lineClass = parent && typeof parent.getLineClass === 'function' ? parent.getLineClass() : 'curve'
    const linePattern = parent && typeof parent.getLinePattern === 'function' ? parent.getLinePattern() : 'solid'
    const lineTapered = parent && typeof parent.isLineTapered === 'function' ? parent.isLineTapered() : false
    const lineCorner = styleManager.getStyleValueOrDefault(
      parent || this,
      StyleKey.LINE_CORNER,
      DEFAULT_CONNECTION_STYLE.lineCorner ?? 8
    )

    if (lineClass !== this._lineClass || lineCorner !== this._lineCorner) {
      this._lineClass = lineClass
      this._lineCorner = lineCorner
      this.path.path = this.getStyledPath(lineClass)
    }

    this._linePattern = linePattern
    this._lineTapered = lineTapered

    this.path.stroke = this._isSelected ? '#4A90D9' : lineColor
    this.path.strokeWidth = this._isSelected ? 3 : lineWidth
    this.path.dashPattern = this.getDashPattern(linePattern)
    this.path.fill = lineTapered ? lineColor : 'none'

    this._applyArrows(lineColor)
  }

  private _applyArrows(lineColor: string): void {
    if (!this.path) return

    const startArrow = styleManager.getStyleValue(this, StyleKey.START_ARROW) as ArrowStyle | undefined
    const endArrow = styleManager.getStyleValue(this, StyleKey.END_ARROW) as ArrowStyle | undefined

    this._startArrow = startArrow || null
    this._endArrow = endArrow || null

    if (this._startArrow && this._startArrow.type !== 'none') {
      this.path.startArrow = this._createArrowAttr(this._startArrow, lineColor)
    } else {
      this.path.startArrow = undefined
    }

    if (this._endArrow && this._endArrow.type !== 'none') {
      this.path.endArrow = this._createArrowAttr(this._endArrow, lineColor)
    } else {
      this.path.endArrow = undefined
    }
  }

  private _createArrowAttr(arrowStyle: ArrowStyle, lineColor: string): any {
    const size = arrowStyle.size || 8
    
    switch (arrowStyle.type) {
      case 'arrow':
        return {
          type: 'path',
          path: `M 0 0 L ${size} ${size / 2} L ${size} -${size / 2} Z`,
          fill: lineColor,
        }
      case 'circle':
        return {
          type: 'circle',
          radius: size / 2,
          fill: lineColor,
        }
      case 'diamond':
        return {
          type: 'path',
          path: `M 0 0 L ${size / 2} ${size / 2} L ${size} 0 L ${size / 2} -${size / 2} Z`,
          fill: lineColor,
        }
      default:
        return {
          type: 'path',
          path: `M 0 0 L ${size} ${size / 2} L ${size} -${size / 2} Z`,
          fill: lineColor,
        }
    }
  }
  
  protected updateStyle(): void {
    this.invalidatePaint()
  }
  
  updateConnectionLayout(layout: ConnectionLayout): void {
    this.connectionLayout = layout
    this.invalidateLayout()
  }
  
  getBounds(): Bounds {
    if (!this.connectionLayout) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }
    
    return {
      x: Math.min(this.connectionLayout.startPoint.x, this.connectionLayout.endPoint.x),
      y: Math.min(this.connectionLayout.startPoint.y, this.connectionLayout.endPoint.y),
      width: Math.abs(this.connectionLayout.endPoint.x - this.connectionLayout.startPoint.x),
      height: Math.abs(this.connectionLayout.endPoint.y - this.connectionLayout.startPoint.y),
    }
  }

  private getStyledPath(lineClass: string): string {
    if (!this.connectionLayout) return ''
    const { startPoint, endPoint } = this.connectionLayout
    switch (lineClass) {
      case 'cubic-bezier':
        return this.computeCubicBezierPath(startPoint, endPoint)
      case 'rounded-elbow':
        return this.computeRoundedElbowPath(startPoint, endPoint)
      case 'right-angle-elbow':
        return this.computeRightAngleElbowPath(startPoint, endPoint)
      default:
        return this.connectionLayout.path
    }
  }

  private computeCubicBezierPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
    const dx = end.x - start.x
    const cpOffset = Math.max(40, Math.abs(dx) * 0.4)
    const cp1x = start.x + (dx >= 0 ? cpOffset : -cpOffset)
    const cp2x = end.x - (dx >= 0 ? cpOffset : -cpOffset)
    return `M ${start.x} ${start.y} C ${cp1x} ${start.y}, ${cp2x} ${end.y}, ${end.x} ${end.y}`
  }

  private computeRoundedElbowPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const radius = Math.max(this._lineCorner, Math.min(24, Math.abs(dx) * 0.2, Math.abs(dy) * 0.25))

    if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }

    const signX = dx >= 0 ? 1 : -1
    const signY = dy >= 0 ? 1 : -1
    const r = Math.min(radius, Math.abs(dx) / 2, Math.abs(dy) / 2)

    const midX = start.x + dx / 2
    return [
      `M ${start.x} ${start.y}`,
      `L ${midX - r * signX} ${start.y}`,
      `Q ${midX} ${start.y} ${midX} ${start.y + r * signY}`,
      `L ${midX} ${end.y - r * signY}`,
      `Q ${midX} ${end.y} ${midX + r * signX} ${end.y}`,
      `L ${end.x} ${end.y}`,
    ].join(' ')
  }

  private computeRightAngleElbowPath(start: { x: number; y: number }, end: { x: number; y: number }): string {
    const midX = start.x + (end.x - start.x) / 2
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
  }

  private getDashPattern(linePattern: string): number[] {
    switch (linePattern) {
      case 'dashed':
        return [6, 4]
      case 'dotted':
        return [2, 3]
      default:
        return []
    }
  }
}

export default ConnectionNodeView
