import { Group, Rect, Text, Image as LeaferImage } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'
import type { StyleData, MarkerData } from '@y-mindmap/core'
import { DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'

export class MarkerNodeView extends NodeView {
  private _markerData: MarkerData
  private iconElement: Text | LeaferImage | null = null
  private backgroundElement: Rect | null = null

  constructor(node: MindMapNode, markerData: MarkerData) {
    super(node)
    this._markerData = markerData
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      width: 20,
      height: 20,
      fill: 'transparent',
      cornerRadius: 4,
    })
    this.group.add(this.backgroundElement)

    this.iconElement = new Text({
      text: this.getMarkerIcon(),
      fontSize: 16,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.iconElement)
  }

  protected calculatePreferredSize(): Size {
    return { width: 20, height: 20 }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.iconElement) {
      this.iconElement.text = this.getMarkerIcon()
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  private getMarkerIcon(): string {
    const icons: Record<string, string> = {
      'priority-1': '🔴',
      'priority-2': '🟡',
      'priority-3': '🟢',
      'flag': '🚩',
      'star': '⭐',
      'smile': '😊',
      'heart': '❤️',
      'thumbup': '👍',
      'question': '❓',
      'exclamation': '❗',
      'clock': '🕐',
      'bell': '🔔',
    }
    return icons[this._markerData.markerId] || '•'
  }

  getMarkerData(): MarkerData {
    return this._markerData
  }

  setMarkerData(markerData: MarkerData): void {
    if (this._markerData.markerId === markerData.markerId) return
    this._markerData = markerData
    this.invalidatePaint()
  }
}

export class MarkersNodeView extends NodeView {
  private markerViews: MarkerNodeView[] = []
  private _markers: MarkerData[] = []

  constructor(node: MindMapNode, markers: MarkerData[]) {
    super(node)
    this._markers = markers
  }

  protected initialize(): void {
    this.createMarkerViews()
  }

  private createMarkerViews(): void {
    for (const view of this.markerViews) {
      view.destroy()
    }
    this.markerViews = []

    let offsetX = 0
    for (const marker of this._markers) {
      const view = new MarkerNodeView(this._node, marker)
      view.setPosition({ x: offsetX, y: 0 })
      this.addChild(view)
      this.markerViews.push(view)
      offsetX += 24
    }
  }

  protected calculatePreferredSize(): Size {
    const width = this._markers.length * 24
    const height = 20
    return { width, height }
  }

  protected applyLayout(): void {
    let offsetX = 0
    for (const view of this.markerViews) {
      view.setPosition({ x: offsetX, y: 0 })
      offsetX += 24
    }
  }

  protected applyPaint(): void {
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setMarkers(markers: MarkerData[]): void {
    this._markers = markers
    this.createMarkerViews()
    this.invalidateLayout()
  }

  getMarkers(): MarkerData[] {
    return [...this._markers]
  }
}

export default MarkerNodeView
