import { Path, Text, Group } from 'leafer-ui'
import { NodeView, Size, Bounds, Position } from '../../core/node-view'
import type { MindMapNode, RelationshipData } from '@y-mindmap/state'
import type { StyleData } from '@y-mindmap/core'
import { StyleKey, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'
import { styleManager } from '../../core/style-manager'
import type { TopicNodeView } from '../topic-node-view'

export class RelationshipNodeView extends NodeView {
  private _relationshipData: RelationshipData
  private _lineColor: string = DEFAULT_CONNECTION_STYLE.lineColor || '#999999'
  private _lineWidth: number = DEFAULT_CONNECTION_STYLE.lineWidth || 2
  private _linePattern: string = DEFAULT_CONNECTION_STYLE.lineStyle || 'solid'
  private _startArrow: string = 'none'
  private _endArrow: string = 'arrow'
  
  private pathElement: Path | null = null
  private startPoint: Position = { x: 0, y: 0 }
  private endPoint: Position = { x: 100, y: 100 }
  
  private _end1View: TopicNodeView | null = null
  private _end2View: TopicNodeView | null = null
  private _titleView: RelationshipTitleNodeView | null = null

  constructor(node: MindMapNode, relationshipData: RelationshipData) {
    super(node)
    this._relationshipData = relationshipData
  }

  /** Duck-type marker for StyleManager.getNodeLevel() */
  isRelationshipView(): boolean { return true }

  protected initialize(): void {
    this._loadStylesFromManager()
    
    this.pathElement = new Path({
      path: this.calculatePath(),
      fill: 'none',
      stroke: this._lineColor,
      strokeWidth: this._lineWidth,
      dashPattern: this.getDashPattern(),
      ...this._buildArrowConfig(),
    })
    this.group.add(this.pathElement)
  }

  private _loadStylesFromManager(): void {
    const relStyle = this._relationshipData.style
    if (relStyle?.properties) {
      if (relStyle.properties[StyleKey.LINE_COLOR]) {
        this._lineColor = relStyle.properties[StyleKey.LINE_COLOR]
      }
      if (relStyle.properties[StyleKey.LINE_WIDTH]) {
        this._lineWidth = relStyle.properties[StyleKey.LINE_WIDTH]
      }
      if (relStyle.properties[StyleKey.LINE_PATTERN]) {
        this._linePattern = relStyle.properties[StyleKey.LINE_PATTERN]
      }
      if (relStyle.properties[StyleKey.START_ARROW]) {
        this._startArrow = relStyle.properties[StyleKey.START_ARROW]
      }
      if (relStyle.properties[StyleKey.END_ARROW]) {
        this._endArrow = relStyle.properties[StyleKey.END_ARROW]
      }
      return
    }

    const themeLineColor = styleManager.getStyleValue(this, StyleKey.LINE_COLOR)
    if (themeLineColor !== undefined) {
      this._lineColor = themeLineColor
    }
    const themeLineWidth = styleManager.getStyleValue(this, StyleKey.LINE_WIDTH)
    if (themeLineWidth !== undefined) {
      this._lineWidth = themeLineWidth
    }
    const themeLinePattern = styleManager.getStyleValue(this, StyleKey.LINE_PATTERN)
    if (themeLinePattern !== undefined) {
      this._linePattern = themeLinePattern
    }
  }

  private _buildArrowConfig(): Record<string, any> {
    const config: Record<string, any> = {}
    
    if (this._startArrow && this._startArrow !== 'none') {
      config.startArrow = {
        type: 'path',
        path: this._getArrowPath(this._startArrow),
        fill: this._lineColor,
      }
    }
    
    if (this._endArrow && this._endArrow !== 'none') {
      config.endArrow = {
        type: 'path',
        path: this._getArrowPath(this._endArrow),
        fill: this._lineColor,
      }
    }
    
    return config
  }

  private _getArrowPath(arrowType: string): string {
    switch (arrowType) {
      case 'arrow':
        return 'M 0 0 L 8 4 L 8 -4 Z'
      case 'circle':
        return 'M -4 0 A 4 4 0 1 0 4 0 A 4 4 0 1 0 -4 0'
      case 'diamond':
        return 'M 0 -4 L 4 0 L 0 4 L -4 0 Z'
      default:
        return 'M 0 0 L 8 4 L 8 -4 Z'
    }
  }

  private getDashPattern(): number[] {
    switch (this._linePattern) {
      case 'dashed':
        return [6, 4]
      case 'dotted':
        return [2, 3]
      case 'dash-dot':
        return [6, 2, 2, 2]
      default:
        return []
    }
  }

  /**
   * Calculate the Bezier path using control points or fallback.
   * Priority: controlPoints > lineEndPoints > midpoint offset fallback
   */
  private calculatePath(): string {
    const sx = this.startPoint.x
    const sy = this.startPoint.y
    const ex = this.endPoint.x
    const ey = this.endPoint.y
    
    const cp = this._relationshipData.controlPoints
    const lineEndPoints = this._relationshipData.lineEndPoints
    
    if (cp && (cp[1].x !== 0 || cp[1].y !== 0 || cp[2].x !== 0 || cp[2].y !== 0)) {
      return `M ${sx} ${sy} C ${cp[1].x} ${cp[1].y}, ${cp[2].x} ${cp[2].y}, ${ex} ${ey}`
    }

    if (lineEndPoints && (lineEndPoints[1].x !== 0 || lineEndPoints[1].y !== 0 || 
        lineEndPoints[2].x !== 0 || lineEndPoints[2].y !== 0)) {
      return `M ${sx} ${sy} C ${lineEndPoints[1].x} ${lineEndPoints[1].y}, ${lineEndPoints[2].x} ${lineEndPoints[2].y}, ${ex} ${ey}`
    }
    
    const midX = (sx + ex) / 2
    const midY = (sy + ey) / 2
    const controlOffset = Math.min(Math.abs(ex - sx), Math.abs(ey - sy)) * 0.3
    
    return `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${ex - controlOffset} ${ey}, ${ex} ${ey}`
  }

  /**
   * Calculate the midpoint of the Bezier curve at t=0.5
   * B(0.5) = 0.125*P0 + 0.375*P1 + 0.375*P2 + 0.125*P3
   */
  getBezierMidpoint(): Position {
    const sx = this.startPoint.x
    const sy = this.startPoint.y
    const ex = this.endPoint.x
    const ey = this.endPoint.y
    
    const cp = this._relationshipData.controlPoints
    const lineEndPoints = this._relationshipData.lineEndPoints
    
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number
    
    if (cp && (cp[1].x !== 0 || cp[1].y !== 0 || cp[2].x !== 0 || cp[2].y !== 0)) {
      cp1x = cp[1].x
      cp1y = cp[1].y
      cp2x = cp[2].x
      cp2y = cp[2].y
    } else if (lineEndPoints && (lineEndPoints[1].x !== 0 || lineEndPoints[1].y !== 0 || 
        lineEndPoints[2].x !== 0 || lineEndPoints[2].y !== 0)) {
      cp1x = lineEndPoints[1].x
      cp1y = lineEndPoints[1].y
      cp2x = lineEndPoints[2].x
      cp2y = lineEndPoints[2].y
    } else {
      const controlOffset = Math.min(Math.abs(ex - sx), Math.abs(ey - sy)) * 0.3
      cp1x = sx + controlOffset
      cp1y = sy
      cp2x = ex - controlOffset
      cp2y = ey
    }
    
    // Cubic Bezier at t=0.5
    const t = 0.5
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    
    return {
      x: mt3 * sx + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * ex,
      y: mt3 * sy + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * ey,
    }
  }

  protected calculatePreferredSize(): Size {
    const minX = Math.min(this.startPoint.x, this.endPoint.x)
    const minY = Math.min(this.startPoint.y, this.endPoint.y)
    const maxX = Math.max(this.startPoint.x, this.endPoint.x)
    const maxY = Math.max(this.startPoint.y, this.endPoint.y)
    
    return {
      width: Math.abs(maxX - minX),
      height: Math.abs(maxY - minY),
    }
  }

  protected applyLayout(): void {
    if (this.pathElement) {
      this.pathElement.path = this.calculatePath()
    }
    
    if (this._titleView) {
      const midpoint = this.getBezierMidpoint()
      this._titleView.setPositionAtMidpoint(midpoint)
    }
  }

  protected applyPaint(): void {
    if (this.pathElement) {
      this.pathElement.stroke = this._lineColor
      this.pathElement.strokeWidth = this._lineWidth
      this.pathElement.dashPattern = this.getDashPattern()
      
      const arrowConfig = this._buildArrowConfig()
      if (arrowConfig.startArrow) {
        this.pathElement.setAttr('startArrow', arrowConfig.startArrow)
      }
      if (arrowConfig.endArrow) {
        this.pathElement.setAttr('endArrow', arrowConfig.endArrow)
      }
    }
  }

  protected updateStyle(): void {
    this._loadStylesFromManager()
    this.invalidatePaint()
  }

  setEnd1View(view: TopicNodeView | null): void {
    this._end1View = view
  }

  setEnd2View(view: TopicNodeView | null): void {
    this._end2View = view
  }

  getEnd1View(): TopicNodeView | null {
    return this._end1View
  }

  getEnd2View(): TopicNodeView | null {
    return this._end2View
  }

  updateEndpoints(): void {
    if (this._end1View) {
      const bounds1 = this._end1View.getBounds()
      this.startPoint = {
        x: bounds1.x + bounds1.width / 2,
        y: bounds1.y + bounds1.height / 2,
      }
    }
    
    if (this._end2View) {
      const bounds2 = this._end2View.getBounds()
      this.endPoint = {
        x: bounds2.x + bounds2.width / 2,
        y: bounds2.y + bounds2.height / 2,
      }
    }
    
    this.invalidateLayout()
  }

  setTitleView(view: RelationshipTitleNodeView | null): void {
    this._titleView = view
  }

  getTitleView(): RelationshipTitleNodeView | null {
    return this._titleView
  }

  setStartPoint(point: Position): void {
    this.startPoint = point
    this.invalidateLayout()
  }

  setEndPoint(point: Position): void {
    this.endPoint = point
    this.invalidateLayout()
  }

  setLineColor(color: string): void {
    if (this._lineColor === color) return
    this._lineColor = color
    this.invalidatePaint()
  }

  setLineWidth(width: number): void {
    if (this._lineWidth === width) return
    this._lineWidth = width
    this.invalidatePaint()
  }

  setLinePattern(pattern: string): void {
    if (this._linePattern === pattern) return
    this._linePattern = pattern
    this.invalidatePaint()
  }

  setStartArrow(arrow: string): void {
    if (this._startArrow === arrow) return
    this._startArrow = arrow
    this.invalidatePaint()
  }

  setEndArrow(arrow: string): void {
    if (this._endArrow === arrow) return
    this._endArrow = arrow
    this.invalidatePaint()
  }

  getRelationshipData(): RelationshipData {
    return this._relationshipData
  }

  /**
   * Update relationship data (e.g., after control points change)
   */
  updateRelationshipData(data: RelationshipData): void {
    this._relationshipData = data
    this.invalidateLayout()
  }

  refreshColorStyles(): void {
    this._loadStylesFromManager()
    this.invalidatePaint()
  }
}

export class RelationshipTitleNodeView extends NodeView {
  private _text: string
  private _isDefaultTitle: boolean = false
  private _textColor: string = '#666666'
  private _defaultTextColor: string = '#999999'
  private _fontSize: number = 12
  
  private textElement: Text | null = null

  constructor(node: MindMapNode, text: string) {
    super(node)
    this._text = text || ''
    this._isDefaultTitle = !text
  }

  protected initialize(): void {
    const displayText = this._text || 'Relationship'
    this._isDefaultTitle = !this._text
    
    this.textElement = new Text({
      text: displayText,
      fontSize: this._fontSize,
      fill: this._isDefaultTitle ? this._defaultTextColor : this._textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
      })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    if (!this.textElement) return { width: 0, height: 0 }
    
    const displayText = this._text || 'Relationship'
    return {
      width: this.textElement.width || displayText.length * 7,
      height: this.textElement.height || 16,
    }
  }

  protected applyLayout(): void {
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.textElement) {
      this.textElement.fill = this._isDefaultTitle ? this._defaultTextColor : this._textColor
      this.textElement.fontSize = this._fontSize
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getText(): string {
    return this._text
  }

  isDefaultTitle(): boolean {
    return this._isDefaultTitle
  }

  setText(text: string): void {
    const isEmpty = !text || text.trim() === ''
    this._text = text
    this._isDefaultTitle = isEmpty
    
    if (this.textElement) {
      this.textElement.text = isEmpty ? 'Relationship' : text
      this.textElement.fill = isEmpty ? this._defaultTextColor : this._textColor

    }
    this.invalidateLayout()
  }

  setTextColor(color: string): void {
    if (this._textColor === color) return
    this._textColor = color
    this.invalidatePaint()
  }

  setDefaultTextColor(color: string): void {
    if (this._defaultTextColor === color) return
    this._defaultTextColor = color
    this.invalidatePaint()
  }

  setFontSize(size: number): void {
    if (this._fontSize === size) return
    this._fontSize = size
    this.invalidateLayout()
  }

  getClientRect(): { x: number; y: number; width: number; height: number } {
    const bounds = this.getBounds()
    
    const globalX = bounds.x + (this.group.x || 0)
    const globalY = bounds.y + (this.group.y || 0)
    
    return {
      x: globalX,
      y: globalY,
      width: bounds.width,
      height: bounds.height,
    }
  }

  setPositionAtMidpoint(midpoint: Position): void {
    const offset = 10
    this.setPosition({
      x: midpoint.x - this._size.width / 2,
      y: midpoint.y - this._size.height - offset,
    })
  }
}

export default RelationshipNodeView
