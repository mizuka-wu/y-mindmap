import { Path, Group } from 'leafer-ui'
import type { MindMapNode } from '@y-mindmap/state'
import { NodeView, Size, Bounds } from '../core/node-view'
import type { BranchNodeView } from './containers/branch-node-view'

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
    
    this.path.path = this.connectionLayout.path
  }
  
  protected applyPaint(): void {
    if (!this.path) return

    const parent = this.getParent() as BranchNodeView | null
    if (parent && typeof parent.getLineColor === 'function') {
      this.path.stroke = this._isSelected ? '#4A90D9' : parent.getLineColor()
      this.path.strokeWidth = this._isSelected ? 3 : parent.getLineWidth()
    } else {
      this.path.stroke = this._isSelected ? '#4A90D9' : '#999999'
      this.path.strokeWidth = this._isSelected ? 3 : 2
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
}

export default ConnectionNodeView
