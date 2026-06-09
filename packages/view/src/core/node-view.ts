import { Group, Rect, Ellipse, Path, Text } from 'leafer-ui'
import type { MindMapNode } from '@y-mindmap/state'
import type { StyleData } from '@y-mindmap/core'

export interface NodeLayout {
  nodeId: string
  x: number
  y: number
  width: number
  height: number
}

export enum DirtyFlag {
  NONE = 0,
  LAYOUT = 1 << 0,
  PAINT = 1 << 1,
  STYLE = 1 << 2,
  SIZE = 1 << 3,
  POSITION = 1 << 4,
  ALL = LAYOUT | PAINT | STYLE | SIZE | POSITION,
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export abstract class NodeView {
  protected _node: MindMapNode
  readonly group: Group
  readonly nodeId: string
  
  protected _size: Size = { width: -1, height: -1 }
  protected _preferredSize: Size | null = null
  protected _position: Position = { x: 0, y: 0 }
  
  protected _dirtyFlags: DirtyFlag = DirtyFlag.ALL
  protected _forbidInvalidateLayout: boolean = false
  protected _forbidInvalidateLayoutParent: boolean = false
  protected _forbidInvalidatePaint: boolean = false
  
  protected _isVisible: boolean = true
  protected _opacity: number = 1
  protected _isDisposed: boolean = false
  protected _isSelected: boolean = false
  
  protected _parent: NodeView | null = null
  protected _children: NodeView[] = []
  
  constructor(node: MindMapNode) {
    this._node = node
    this.nodeId = node.id
    
    this.group = new Group({
      data: { nodeId: node.id },
    })
    
    this.initialize()
    this.invalidate(DirtyFlag.ALL)
  }
  
  protected abstract initialize(): void
  protected abstract calculatePreferredSize(): Size
  protected abstract applyLayout(): void
  protected abstract applyPaint(): void
  protected abstract updateStyle(): void
  
  validateLayout(): void {
    if (!(this._dirtyFlags & DirtyFlag.LAYOUT)) return
    
    this._forbidInvalidateLayout = true
    this._preferredSize = this.calculatePreferredSize()
    this.applyLayout()
    
    for (const child of this._children) {
      child.validateLayout()
    }
    
    this._dirtyFlags &= ~DirtyFlag.LAYOUT
    this._forbidInvalidateLayout = false
  }
  
  validatePaint(): void {
    if (!(this._dirtyFlags & DirtyFlag.PAINT)) return
    
    this._forbidInvalidatePaint = true
    this.applyPaint()
    
    for (const child of this._children) {
      child.validatePaint()
    }
    
    this._dirtyFlags &= ~DirtyFlag.PAINT
    this._forbidInvalidatePaint = false
  }
  
  validate(): void {
    this.validateLayout()
    this.validatePaint()
  }
  
  isDirty(flags?: DirtyFlag): boolean {
    if (flags === undefined) return this._dirtyFlags !== DirtyFlag.NONE
    return (this._dirtyFlags & flags) !== 0
  }
  
  getDirtyNodeId(): string | null {
    return (this._dirtyFlags & DirtyFlag.LAYOUT) ? this.nodeId : null
  }
  
  collectDirtyNodeIds(): Set<string> {
    const dirtyIds = new Set<string>()
    this._collectDirtyNodeIdsRecursive(dirtyIds)
    return dirtyIds
  }
  
  private _collectDirtyNodeIdsRecursive(result: Set<string>): void {
    if (this._dirtyFlags & DirtyFlag.LAYOUT) {
      result.add(this.nodeId)
    }
    for (const child of this._children) {
      child._collectDirtyNodeIdsRecursive(result)
    }
  }
  
  clearDirtyFlags(flags: DirtyFlag): void {
    this._dirtyFlags &= ~flags
  }
  
  invalidateLayout(): void {
    if (this._forbidInvalidateLayout) return
    if (this._dirtyFlags & DirtyFlag.LAYOUT) return
    
    this._dirtyFlags |= DirtyFlag.LAYOUT
    this._dirtyFlags |= DirtyFlag.PAINT
    
    if (!this._forbidInvalidateLayoutParent && this._parent) {
      this._parent.invalidateLayout()
    }
  }
  
  invalidatePaint(): void {
    if (this._forbidInvalidatePaint) return
    if (this._dirtyFlags & DirtyFlag.PAINT) return
    
    this._dirtyFlags |= DirtyFlag.PAINT
  }
  
  invalidateStyle(): void {
    this._dirtyFlags |= DirtyFlag.STYLE
    this.invalidatePaint()
  }
  
  invalidate(flags: DirtyFlag): void {
    if (flags & DirtyFlag.LAYOUT) this.invalidateLayout()
    if (flags & DirtyFlag.PAINT) this.invalidatePaint()
    if (flags & DirtyFlag.STYLE) this.invalidateStyle()
    if (flags & DirtyFlag.SIZE) {
      this._dirtyFlags |= DirtyFlag.SIZE
      this.invalidateLayout()
    }
    if (flags & DirtyFlag.POSITION) {
      this._dirtyFlags |= DirtyFlag.POSITION
      this.invalidatePaint()
    }
  }
  
  getSize(): Size {
    return { ...this._size }
  }
  
  setSize(size: Size, forceUpdate = false): void {
    if (!forceUpdate && 
        this._size.width === size.width && 
        this._size.height === size.height) {
      return
    }
    
    this._size = { ...size }
    this._dirtyFlags |= DirtyFlag.SIZE
    this.invalidateLayout()
  }
  
  getPreferredSize(refreshCache = false): Size {
    if (refreshCache || !this._preferredSize) {
      this._preferredSize = this.calculatePreferredSize()
    }
    return this._preferredSize
  }
  
  setPreferredSize(size: Size | null): void {
    this._preferredSize = size
  }
  
  getPosition(): Position {
    return { ...this._position }
  }
  
  setPosition(position: Position): void {
    if (this._position.x === position.x && this._position.y === position.y) {
      return
    }
    
    this._position = { ...position }
    this._dirtyFlags |= DirtyFlag.POSITION
    
    this.group.x = position.x
    this.group.y = position.y
  }
  
  isVisible(): boolean {
    return this._isVisible
  }
  
  setVisible(visible: boolean): void {
    if (this._isVisible === visible) return
    
    this._isVisible = visible
    this.group.visible = visible
    this.invalidatePaint()
  }
  
  getOpacity(): number {
    return this._opacity
  }
  
  setOpacity(opacity: number): void {
    if (this._opacity === opacity) return
    
    this._opacity = opacity
    this.group.opacity = opacity
    this.invalidatePaint()
  }
  
  isSelected(): boolean {
    return this._isSelected
  }
  
  setSelected(selected: boolean): void {
    if (this._isSelected === selected) return
    this._isSelected = selected
    this.invalidatePaint()
  }
  
  isDisposed(): boolean {
    return this._isDisposed
  }
  
  getParent(): NodeView | null {
    return this._parent
  }
  
  setParent(parent: NodeView | null): void {
    this._parent = parent
  }
  
  getChildren(): NodeView[] {
    return [...this._children]
  }
  
  addChild(child: NodeView): void {
    if (this._children.includes(child)) return
    
    child.setParent(this)
    this._children.push(child)
    this.group.add(child.group)
    this.invalidateLayout()
  }
  
  removeChild(child: NodeView): void {
    const index = this._children.indexOf(child)
    if (index === -1) return
    
    child.setParent(null)
    this._children.splice(index, 1)
    child.group.remove()
    this.invalidateLayout()
  }
  
  getCentralNodeView(): NodeView | null {
    let current: NodeView | null = this
    while (current?._parent) {
      current = current._parent
    }
    return current
  }
  
  getNode(): MindMapNode {
    return this._node
  }
  
  updateNode(node: MindMapNode): void {
    this._node = node
    this.invalidateStyle()
  }
  
  getBounds(): Bounds {
    return {
      x: this._position.x,
      y: this._position.y,
      width: this._size.width,
      height: this._size.height,
    }
  }
  
  getContentBounds(): Bounds {
    return this.getBounds()
  }
  
  destroy(): void {
    if (this._isDisposed) return
    
    for (const child of [...this._children]) {
      child.destroy()
    }
    this._children = []
    
    if (this._parent) {
      this._parent.removeChild(this)
    }
    
    this.group.remove()
    this._isDisposed = true
  }
}

export default NodeView
