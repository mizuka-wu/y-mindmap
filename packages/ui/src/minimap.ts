import { EditorState, MindMapNode } from '@y-mindmap/state'
import { Bounds, Point } from '@y-mindmap/core'

export interface UIContext {
  state: EditorState
  getDocument: () => MindMapNode
  getNodeBounds: (nodeId: string) => Bounds | null
  getViewportBounds: () => Bounds
  panTo: (x: number, y: number) => void
  getZoom: () => number
}

export class MiniMap {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private context: UIContext
  private scale: number = 0.1
  
  private isDragging: boolean = false
  private dragStartPoint: Point | null = null
  private dragStartViewport: Bounds | null = null

  constructor(container: HTMLElement, context: UIContext) {
    this.container = container
    this.context = context

    this.canvas = document.createElement('canvas')
    this.canvas.className = 'y-mindmap-minimap'
    this.container.appendChild(this.canvas)

    this.bindEvents()
    this.render()
  }

  update(): void {
    this.render()
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true
      this.dragStartPoint = { x: e.clientX, y: e.clientY }
      this.dragStartViewport = this.context.getViewportBounds()
      this.canvas.setPointerCapture(e.pointerId)
    })

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.isDragging || !this.dragStartPoint || !this.dragStartViewport) return
      
      const dx = (e.clientX - this.dragStartPoint.x) / this.scale
      const dy = (e.clientY - this.dragStartPoint.y) / this.scale
      
      this.context.panTo(
        this.dragStartViewport.x + this.dragStartViewport.width / 2 + dx,
        this.dragStartViewport.y + this.dragStartViewport.height / 2 + dy
      )
    })

    this.canvas.addEventListener('pointerup', () => {
      this.isDragging = false
      this.dragStartPoint = null
      this.dragStartViewport = null
    })

    this.canvas.addEventListener('click', (e) => {
      if (this.isDragging) return
      
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const contentBounds = this.getContentBounds()
      const targetX = contentBounds.x + x / this.scale
      const targetY = contentBounds.y + y / this.scale

      this.context.panTo(targetX, targetY)
    })
  }

  private render(): void {
    const doc = this.context.getDocument()
    const bounds = this.getContentBounds()

    if (bounds.width === 0 || bounds.height === 0) return

    const padding = 20
    const width = (bounds.width + padding * 2) * this.scale
    const height = (bounds.height + padding * 2) * this.scale

    this.canvas.width = width
    this.canvas.height = height

    const ctx = this.canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    this.renderBackground(ctx, width, height)
    this.renderNodes(ctx, doc, bounds, padding)
    this.renderViewport(ctx, bounds, padding)
  }

  private renderBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)
  }

  private renderNodes(ctx: CanvasRenderingContext2D, doc: MindMapNode, offset: Bounds, padding: number): void {
    doc.descendants((node) => {
      const nodeBounds = this.context.getNodeBounds(node.id)
      if (!nodeBounds) return

      const x = (nodeBounds.x - offset.x + padding) * this.scale
      const y = (nodeBounds.y - offset.y + padding) * this.scale
      const w = Math.max(nodeBounds.width * this.scale, 2)
      const h = Math.max(nodeBounds.height * this.scale, 2)

      const isSelected = this.context.state.selection.isSelected(node.id)
      
      ctx.fillStyle = isSelected ? '#4A90D9' : '#666666'
      ctx.fillRect(x, y, w, h)
    })
  }

  private renderViewport(ctx: CanvasRenderingContext2D, offset: Bounds, padding: number): void {
    const viewport = this.context.getViewportBounds()

    const x = (viewport.x - offset.x + padding) * this.scale
    const y = (viewport.y - offset.y + padding) * this.scale
    const w = viewport.width * this.scale
    const h = viewport.height * this.scale

    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'
    ctx.fillRect(x, y, w, h)
  }

  private getContentBounds(): Bounds {
    const doc = this.context.getDocument()

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    doc.descendants((node) => {
      const bounds = this.context.getNodeBounds(node.id)
      if (!bounds) return

      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    if (minX === Infinity) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', () => {})
    this.canvas.removeEventListener('pointermove', () => {})
    this.canvas.removeEventListener('pointerup', () => {})
    this.canvas.removeEventListener('click', () => {})
  }
}
