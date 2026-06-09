import { Group, Ellipse, Text } from 'leafer-ui'
import { NodeView, Size } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export type InformationType = 'note' | 'comment' | 'href' | 'task' | 'audio' | 'info'

export interface InformationData {
  notesInfo?: { plain?: string }
  commentsInfo?: any[]
  hrefInfo?: string
  taskInfo?: { content?: { name: string }[] }
  audioNotesInfo?: any
}

export class InformationNodeView extends NodeView {
  private _iconType: InformationType = 'info'
  private _color: string = '#4A90D9'
  private _informationData: InformationData | null = null
  private circleElement: Ellipse | null = null
  private iconElement: Text | null = null

  constructor(node: MindMapNode, informationData?: InformationData) {
    super(node)
    this._informationData = informationData || null
    this._iconType = this.resolveIconType(informationData)
  }

  private resolveIconType(data?: InformationData): InformationType {
    if (!data) return 'info'
    
    const keys = Object.keys(data).filter(k => data[k as keyof InformationData] !== undefined)
    
    if (keys.length > 1) return 'info'
    if (keys.length === 0) return 'info'
    
    const key = keys[0]
    switch (key) {
      case 'notesInfo':
        return 'note'
      case 'commentsInfo':
        return 'comment'
      case 'hrefInfo':
        return this.resolveHrefType(data.hrefInfo!)
      case 'taskInfo':
        return 'task'
      case 'audioNotesInfo':
        return 'audio'
      default:
        return 'info'
    }
  }

  private resolveHrefType(href: string): InformationType {
    if (!href) return 'href'
    const protocol = href.split(':')[0]
    if (protocol === 'file') return 'href'
    if (protocol === 'xap') return 'href'
    if (protocol === 'xmind') return 'href'
    return 'href'
  }

  protected initialize(): void {
    this.circleElement = new Ellipse({
      radiusX: 10,
      radiusY: 10,
      fill: this._color,
      stroke: 'none',
    })
    this.group.add(this.circleElement)

    this.iconElement = new Text({
      text: this.getIconSymbol(),
      fontSize: 12,
      fill: '#ffffff',
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.iconElement)
  }

  private getIconSymbol(): string {
    switch (this._iconType) {
      case 'note':
        return 'N'
      case 'comment':
        return '💬'
      case 'href':
        return '🔗'
      case 'task':
        return '✓'
      case 'audio':
        return '🎵'
      case 'info':
      default:
        return 'i'
    }
  }

  protected calculatePreferredSize(): Size {
    return { width: 20, height: 20 }
  }

  protected applyLayout(): void {
  }

  protected applyPaint(): void {
    if (this.circleElement) {
      this.circleElement.fill = this._color
    }
    if (this.iconElement) {
      this.iconElement.text = this.getIconSymbol()
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getIconType(): InformationType {
    return this._iconType
  }

  setIconType(type: InformationType): void {
    if (this._iconType === type) return
    this._iconType = type
    this.invalidatePaint()
  }

  setColor(color: string): void {
    if (this._color === color) return
    this._color = color
    this.invalidatePaint()
  }

  getInformationData(): InformationData | null {
    return this._informationData
  }

  setInformationData(data: InformationData | null): void {
    this._informationData = data
    this._iconType = this.resolveIconType(data || undefined)
    this.invalidatePaint()
  }
}

export default InformationNodeView
