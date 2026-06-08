import { App, Leafer } from 'leafer-ui'
import { Bounds, Point } from '@y-mindmap/core'

export class ViewportController {
  private app: App
  private zoomLevel: number = 1
  private panX: number = 0
  private panY: number = 0

  private minZoom: number = 0.1
  private maxZoom: number = 5

  constructor(app: App) {
    this.app = app
  }

  getZoom(): number {
    return this.zoomLevel
  }

  setZoom(level: number): void {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level))
  }

  zoomIn(): void {
    this.setZoom(this.zoomLevel * 1.2)
  }

  zoomOut(): void {
    this.setZoom(this.zoomLevel / 1.2)
  }

  zoomTo(level: number, _center?: Point): void {
    this.setZoom(level)
  }

  getPan(): Point {
    return { x: this.panX, y: this.panY }
  }

  setPan(x: number, y: number): void {
    this.panX = x
    this.panY = y
    this.app.x = x
    this.app.y = y
  }

  panBy(dx: number, dy: number): void {
    this.setPan(this.panX + dx, this.panY + dy)
  }

  fitToContent(bounds: Bounds, containerSize: { width: number; height: number }): void {
    if (bounds.width === 0 || bounds.height === 0) return

    const padding = 40
    const scaleX = (containerSize.width - padding * 2) / bounds.width
    const scaleY = (containerSize.height - padding * 2) / bounds.height
    const scale = Math.min(scaleX, scaleY, 2)

    this.setZoom(scale)

    const centerX = bounds.x + bounds.width / 2
    const centerY = bounds.y + bounds.height / 2

    this.setPan(
      containerSize.width / 2 - centerX * scale,
      containerSize.height / 2 - centerY * scale
    )
  }

  panToPoint(point: Point, containerSize: { width: number; height: number }): void {
    this.setPan(
      containerSize.width / 2 - point.x * this.zoomLevel,
      containerSize.height / 2 - point.y * this.zoomLevel
    )
  }

  screenToCanvas(screenX: number, screenY: number): Point {
    return {
      x: (screenX - this.panX) / this.zoomLevel,
      y: (screenY - this.panY) / this.zoomLevel,
    }
  }

  canvasToScreen(canvasX: number, canvasY: number): Point {
    return {
      x: canvasX * this.zoomLevel + this.panX,
      y: canvasY * this.zoomLevel + this.panY,
    }
  }

  getVisibleBounds(containerSize: { width: number; height: number }): Bounds {
    const topLeft = this.screenToCanvas(0, 0)
    const bottomRight = this.screenToCanvas(containerSize.width, containerSize.height)

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }

  destroy(): void {
    // Cleanup resources
  }
}
