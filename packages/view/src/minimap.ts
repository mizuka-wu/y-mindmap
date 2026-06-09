import type { Bounds, Point } from '@y-mindmap/core'

export interface MinimapConfig {
  /** Width of minimap in pixels */
  width?: number
  /** Height of minimap in pixels */
  height?: number
  /** Background color */
  backgroundColor?: string
  /** Node color */
  nodeColor?: string
  /** Selected node color */
  selectedNodeColor?: string
  /** Viewport rect border color */
  viewportBorderColor?: string
  /** Viewport rect fill color */
  viewportFillColor?: string
  /** Padding around content */
  padding?: number
}

interface MinimapDependencies {
  getDocument: () => { descendants: (cb: (node: any) => void) => void } | null
  getNodeBounds: (nodeId: string) => Bounds | null
  getSelectedNodeIds: () => string[]
  getViewportBounds: () => Bounds
  getZoom: () => number
  panTo: (x: number, y: number) => void
  zoomTo: (level: number) => void
}

export class Minimap {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null
  private deps: MinimapDependencies

  private width: number
  private height: number
  private backgroundColor: string
  private nodeColor: string
  private selectedNodeColor: string
  private viewportBorderColor: string
  private viewportFillColor: string
  private padding: number

  private scale: number = 0.1
  private contentBounds: Bounds = { x: 0, y: 0, width: 0, height: 0 }

  private isDragging: boolean = false
  private dragStartClientPoint: Point | null = null
  private dragStartViewport: Bounds | null = null

  private _boundPointerDown: (e: PointerEvent) => void
  private _boundPointerMove: (e: PointerEvent) => void
  private _boundPointerUp: (e: PointerEvent) => void
  private _boundClick: (e: MouseEvent) => void

  constructor(container: HTMLElement, deps: MinimapDependencies, config?: MinimapConfig) {
    this.container = container
    this.deps = deps

    this.width = config?.width ?? 200
    this.height = config?.height ?? 150
    this.backgroundColor = config?.backgroundColor ?? '#ffffff'
    this.nodeColor = config?.nodeColor ?? '#666666'
    this.selectedNodeColor = config?.selectedNodeColor ?? '#4A90D9'
    this.viewportBorderColor = config?.viewportBorderColor ?? '#FF4444'
    this.viewportFillColor = config?.viewportFillColor ?? 'rgba(255, 68, 68, 0.1)'
    this.padding = config?.padding ?? 20

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.cssText = `
      display: block;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      background: ${this.backgroundColor};
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `
    this.ctx = this.canvas.getContext('2d')

    this.container.appendChild(this.canvas)

    this._boundPointerDown = this.onPointerDown.bind(this)
    this._boundPointerMove = this.onPointerMove.bind(this)
    this._boundPointerUp = this.onPointerUp.bind(this)
    this._boundClick = this.onClick.bind(this)

    this.canvas.addEventListener('pointerdown', this._boundPointerDown)
    this.canvas.addEventListener('click', this._boundClick)
  }

  update(): void {
    this.computeContentBounds()
    this.computeScale()
    this.render()
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this._boundPointerDown)
    this.canvas.removeEventListener('click', this._boundClick)
    document.removeEventListener('pointermove', this._boundPointerMove)
    document.removeEventListener('pointerup', this._boundPointerUp)
    this.canvas.remove()
  }

  private computeContentBounds(): void {
    const doc = this.deps.getDocument()
    if (!doc) {
      this.contentBounds = { x: 0, y: 0, width: 0, height: 0 }
      return
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    doc.descendants((node: any) => {
      const bounds = this.deps.getNodeBounds(node.id)
      if (!bounds) return

      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    if (minX === Infinity) {
      this.contentBounds = { x: 0, y: 0, width: 0, height: 0 }
      return
    }

    this.contentBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  private computeScale(): void {
    if (this.contentBounds.width === 0 || this.contentBounds.height === 0) {
      this.scale = 0.1
      return
    }

    const availableWidth = this.width - this.padding * 2
    const availableHeight = this.height - this.padding * 2

    const scaleX = availableWidth / this.contentBounds.width
    const scaleY = availableHeight / this.contentBounds.height

    this.scale = Math.min(scaleX, scaleY, 1)
  }

  private render(): void {
    if (!this.ctx) return

    const ctx = this.ctx
    ctx.clearRect(0, 0, this.width, this.height)

    ctx.fillStyle = this.backgroundColor
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, this.width, this.height)

    if (this.contentBounds.width === 0 || this.contentBounds.height === 0) return

    this.renderNodes(ctx)
    this.renderViewport(ctx)
  }

  private renderNodes(ctx: CanvasRenderingContext2D): void {
    const doc = this.deps.getDocument()
    if (!doc) return

    const selectedIds = new Set(this.deps.getSelectedNodeIds())
    const offset = this.contentBounds

    doc.descendants((node: any) => {
      const bounds = this.deps.getNodeBounds(node.id)
      if (!bounds) return

      const x = (bounds.x - offset.x) * this.scale + this.padding
      const y = (bounds.y - offset.y) * this.scale + this.padding
      const w = Math.max(bounds.width * this.scale, 2)
      const h = Math.max(bounds.height * this.scale, 2)

      ctx.fillStyle = selectedIds.has(node.id) ? this.selectedNodeColor : this.nodeColor
      ctx.fillRect(x, y, w, h)
    })
  }

  private renderViewport(ctx: CanvasRenderingContext2D): void {
    const viewport = this.deps.getViewportBounds()
    const offset = this.contentBounds

    const x = (viewport.x - offset.x) * this.scale + this.padding
    const y = (viewport.y - offset.y) * this.scale + this.padding
    const w = viewport.width * this.scale
    const h = viewport.height * this.scale

    ctx.strokeStyle = this.viewportBorderColor
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)

    ctx.fillStyle = this.viewportFillColor
    ctx.fillRect(x, y, w, h)
  }

  private minimapToWorld(clientX: number, clientY: number): Point {
    const rect = this.canvas.getBoundingClientRect()
    const canvasX = clientX - rect.left
    const canvasY = clientY - rect.top

    const worldX = (canvasX - this.padding) / this.scale + this.contentBounds.x
    const worldY = (canvasY - this.padding) / this.scale + this.contentBounds.y

    return { x: worldX, y: worldY }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return

    e.preventDefault()
    e.stopPropagation()

    this.isDragging = true
    this.dragStartClientPoint = { x: e.clientX, y: e.clientY }
    this.dragStartViewport = this.deps.getViewportBounds()

    this.canvas.setPointerCapture(e.pointerId)
    document.addEventListener('pointermove', this._boundPointerMove)
    document.addEventListener('pointerup', this._boundPointerUp)
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.dragStartClientPoint || !this.dragStartViewport) return

    const dx = (e.clientX - this.dragStartClientPoint.x) / this.scale
    const dy = (e.clientY - this.dragStartClientPoint.y) / this.scale

    const viewport = this.dragStartViewport
    this.deps.panTo(
      viewport.x + viewport.width / 2 + dx,
      viewport.y + viewport.height / 2 + dy,
    )
  }

  private onPointerUp(e: PointerEvent): void {
    this.isDragging = false
    this.dragStartClientPoint = null
    this.dragStartViewport = null

    document.removeEventListener('pointermove', this._boundPointerMove)
    document.removeEventListener('pointerup', this._boundPointerUp)
  }

  private onClick(e: MouseEvent): void {
    if (this.isDragging) return

    const worldPoint = this.minimapToWorld(e.clientX, e.clientY)
    this.deps.panTo(worldPoint.x, worldPoint.y)
  }
}
