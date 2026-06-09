import { App, Leafer, Group } from 'leafer-ui'
import { EditorState, MindMapDocument, MindMapNode, Transaction, Selection } from '@y-mindmap/state'
import type { RelationshipData } from '@y-mindmap/state'
import type { ConnectionLayout } from '@y-mindmap/layout'
import { MapLayoutEngine, AnimatedLayoutEngine, type LayoutEngine, type LayoutResult } from '@y-mindmap/layout'
import { NodeViewFactory, NodeViewType } from './node-views/node-view-factory'
import { TopicNodeView } from './node-views/topic-node-view'
import { BranchNodeView } from './node-views/containers/branch-node-view'
import { ConnectionNodeView } from './node-views/connection-node-view'
import { RelationshipNodeView, RelationshipTitleNodeView } from './node-views/relationships/relationship-node-view'
import { DirtyFlag, Bounds } from './core/node-view'
import { themeManager, type ThemeChangeListener } from './core/theme-manager'
import type { ThemeData, Point } from '@y-mindmap/core'
import { DragPreviewView, DropIndicatorView, DropPosition, DropTarget } from './node-views/interactions/drag-node-views'

export interface EditorViewConfig {
  container: HTMLElement
  state?: EditorState
  layoutEngine?: LayoutEngine
  enableAnimations?: boolean
  animationDuration?: number
}

export class EditorView {
  private app: App
  private nodeViewFactory: NodeViewFactory
  private layoutEngine: LayoutEngine
  private animatedLayoutEngine: AnimatedLayoutEngine | null = null
  private enableAnimations: boolean
  private animationDuration: number
  
  private topicLayer: Leafer
  private connectionLayer: Leafer
  private overlayLayer: Leafer
  
  private container: HTMLElement
  private state: EditorState | null = null
  private _rootView: TopicNodeView | null = null
  private _rootBranch: BranchNodeView | null = null
  private _branchMap: Map<string, BranchNodeView> = new Map()
  private _relationshipViews: Map<string, RelationshipNodeView> = new Map()
  private _relationshipTitleViews: Map<string, RelationshipTitleNodeView> = new Map()
  
  private _updateScheduled: boolean = false
  private _isUpdating: boolean = false
  private _pendingDirtyNodeIds: Set<string> = new Set()
  private _isAnimating: boolean = false
  
  private _themeUnsubscribe: (() => void) | null = null
  
  // Drag handling
  private _dragPreviewView: DragPreviewView | null = null
  private _dropIndicatorView: DropIndicatorView | null = null
  private _isDragging: boolean = false
  private _dragSourceId: string | null = null
  private _dragStartPosition: Point | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  
  constructor(config: EditorViewConfig) {
    this.container = config.container
    this.layoutEngine = config.layoutEngine || new MapLayoutEngine()
    this.enableAnimations = config.enableAnimations ?? true
    this.animationDuration = config.animationDuration ?? 300
    this.nodeViewFactory = new NodeViewFactory()
    
    if (this.enableAnimations) {
      this.animatedLayoutEngine = new AnimatedLayoutEngine(this.layoutEngine, {
        duration: this.animationDuration,
        easing: 'ease-out',
        stagger: 30,
      })
    }
    
    this.app = new App({
      view: config.container,
      type: 'viewport',
    })
    
    this.connectionLayer = this.app.addLeafer({ type: 'draw' })
    this.topicLayer = this.app.addLeafer({ type: 'draw' })
    this.overlayLayer = this.app.addLeafer({ type: 'draw' })
    
    this._themeUnsubscribe = themeManager.onThemeChange(() => {
      this._refreshAllColorStyles()
    })
    
    this.initDragHandling()
    
    if (config.state) {
      this.setState(config.state)
    }
  }
  
  setState(state: EditorState): void {
    this.state = state
    this.scheduleUpdate()
  }
  
  getState(): EditorState | null {
    return this.state
  }
  
  dispatch(tr: Transaction): void {
    if (!this.state) return

    const oldState = this.state
    const newState = this.state.apply(tr)
    this.state = newState

    const source = tr.getMeta('source')
    if (source === 'undo' || source === 'redo') {
      this._fullRebuild()
    } else {
      this._routeTransactionToBranchViews(tr)
      this.scheduleUpdate()
    }
  }

  private _fullRebuild(): void {
    if (!this.state) return

    if (this._rootBranch) {
      this._rootBranch.destroy()
      this._rootBranch = null
    }
    
    this._rootView = null
    this._branchMap.clear()
    this.nodeViewFactory.clear()

    this.topicLayer.clear()
    this.connectionLayer.clear()

    this.scheduleUpdate()
  }

  private _routeTransactionToBranchViews(tr: Transaction): void {
    for (const step of tr.steps) {
      switch (step.type) {
        case 'addNode': {
          const parentBranch = this._branchMap.get(step.parentId)
          if (parentBranch) {
            parentBranch.onNodeChanged('addTopic', {
              topic: step.node,
              type: step.nodeType || 'attached',
            })
          }
          break
        }
        case 'removeNode': {
          const branch = this._branchMap.get(step.id)
          if (branch) {
            branch.destroy()
          }
          
          const parentId = this._findParentId(step.id)
          if (parentId) {
            const parentBranch = this._branchMap.get(parentId)
            if (parentBranch) {
              parentBranch.onNodeChanged('removeTopic', {
                topicId: step.id,
                type: 'attached',
              })
            }
          }
          
          this._branchMap.delete(step.id)
          this.nodeViewFactory.removeViewsByNodeId(step.id)
          break
        }
        case 'updateNode': {
          const branch = this._branchMap.get(step.id)
          if (branch) {
            branch.refreshColorStyles()
            branch.getTopicView()?.invalidatePaint()
            branch.invalidateLayout()
          }
          break
        }
        case 'moveNode': {
          const branch = this._branchMap.get(step.id)
          if (branch) {
            branch.invalidateLayout()
          }
          break
        }
      }
    }
  }

  private _findParentId(childId: string): string | null {
    if (!this.state) return null
    const parent = this.state.doc.findParent(childId)
    return parent ? parent.id : null
  }
  
  private scheduleUpdate(): void {
    if (this._updateScheduled) return
    
    this._updateScheduled = true
    Promise.resolve().then(() => {
      this._updateScheduled = false
      this.performUpdate()
    })
  }
  
  private performUpdate(): void {
    if (!this.state || this._isUpdating) return
    
    this._isUpdating = true
    
    try {
      const root = this.state.doc.root
      
      this.ensureRootView(root)
      
      const dirtyNodeIds = this._rootView!.collectDirtyNodeIds()
      
      if (dirtyNodeIds.size > 0) {
        if (this.animatedLayoutEngine && this.enableAnimations) {
          const layoutResult = this.animatedLayoutEngine.calculateAnimated(
            root,
            (nodeId, position) => {
              const view = this.nodeViewFactory.getTopicView(nodeId)
              if (view) {
                view.setPosition(position)
              }
            },
            () => {
              this._isAnimating = false
              this.updateConnectionViews()
            }
          )
          this._isAnimating = true
          this.applyLayoutToViews(root, layoutResult)
        } else {
          const layoutResult = this.layoutEngine.calculate(root, undefined, dirtyNodeIds)
          this.applyLayoutToViews(root, layoutResult)
        }
      }
      
      this.validateLayoutViews(root)
      this.validatePaintViews(root)
      if (!this._isAnimating) {
        this.updateConnectionViews()
      }
      this.updateRelationshipViews()
      this.updateSelection()
      
      this._pendingDirtyNodeIds.clear()
    } finally {
      this._isUpdating = false
    }
  }
  
  private ensureRootView(root: MindMapNode): void {
    if (!this._rootView) {
      this._rootView = this.nodeViewFactory.createTopicView(root)
      this.topicLayer.add(this._rootView.group)
    }

    if (!this._rootBranch) {
      this._rootBranch = new BranchNodeView(root)
      this._rootBranch.setTopicView(this._rootView)
      this._branchMap.set(root.id, this._rootBranch)
    }

    this.syncNodeViews(root, this._rootView, this._rootBranch)
  }

  private syncNodeViews(node: MindMapNode, parentView: TopicNodeView, parentBranch: BranchNodeView): void {
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        let childView = this.nodeViewFactory.getTopicView(child.id)
        if (!childView) {
          childView = this.nodeViewFactory.createTopicView(child)
          parentView.addChild(childView)
        } else {
          childView.updateNode(child)
        }

        const existingBranch = this._branchMap.get(child.id)
        if (!existingBranch || existingBranch.isDisposed()) {
          if (existingBranch) {
            this._branchMap.delete(child.id)
          }
          const childBranch = new BranchNodeView(child)
          childBranch.setTopicView(childView)
          parentBranch.addChildBranch(childBranch, 'attached')
          this._branchMap.set(child.id, childBranch)
          childBranch.refreshColorStyles()
        }

        this.syncNodeViews(child, childView, this._branchMap.get(child.id)!)
      }
    }
  }
  
  private applyLayoutToViews(node: MindMapNode, layoutResult: LayoutResult): void {
    const nodeLayout = layoutResult.nodes.get(node.id)
    if (!nodeLayout) return
    
    const view = this.nodeViewFactory.getTopicView(node.id)
    if (view) {
      view.setPosition({ x: nodeLayout.x, y: nodeLayout.y })
      view.setSize({ width: nodeLayout.width, height: nodeLayout.height })
    }
    
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.applyLayoutToViews(child, layoutResult)
      }
    }
  }
  
  private validateLayoutViews(node: MindMapNode): void {
    const view = this.nodeViewFactory.getTopicView(node.id)
    if (view) {
      view.validateLayout()
    }
    
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.validateLayoutViews(child)
      }
    }
  }
  
  private validatePaintViews(node: MindMapNode): void {
    const view = this.nodeViewFactory.getTopicView(node.id)
    if (view) {
      view.validatePaint()
    }
    
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.validatePaintViews(child)
      }
    }
  }
  
  private updateConnectionViews(): void {
    if (!this.state) return
    
    const root = this.state.doc.root
    const layoutResult = this.layoutEngine.calculate(root)
    
    for (const [connectionId, connectionLayout] of layoutResult.connections) {
      const view = this.nodeViewFactory.createConnectionView(connectionId, connectionLayout)
      this.connectionLayer.add(view.group)
      view.validate()
    }
  }

  private updateRelationshipViews(): void {
    for (const [relId, relView] of this._relationshipViews) {
      relView.updateEndpoints()
      relView.validate()
    }
  }

  setRelationships(relationships: RelationshipData[]): void {
    for (const [relId, relView] of this._relationshipViews) {
      relView.destroy()
    }
    this._relationshipViews.clear()
    this._relationshipTitleViews.clear()

    for (const relData of relationships) {
      const relNode = {
        id: relData.id,
        title: relData.title || '',
        type: 'relationship',
        children: {},
        markers: [],
        labels: [],
        attachments: [],
        mathFormulas: [],
        codeBlocks: [],
      } as unknown as MindMapNode

      const relView = this.nodeViewFactory.createRelationshipView(relNode, relData)
      const titleView = this.nodeViewFactory.createRelationshipTitleView(relNode, relData.title || '')

      const end1View = this.nodeViewFactory.getTopicView(relData.end1Id)
      const end2View = this.nodeViewFactory.getTopicView(relData.end2Id)

      relView.setEnd1View(end1View || null)
      relView.setEnd2View(end2View || null)
      relView.setTitleView(titleView)

      this.overlayLayer.add(relView.group)
      this.overlayLayer.add(titleView.group)

      this._relationshipViews.set(relData.id, relView)
      this._relationshipTitleViews.set(relData.id, titleView)
    }
  }

  getRelationshipView(relId: string): RelationshipNodeView | undefined {
    return this._relationshipViews.get(relId)
  }

  getRelationshipTitleView(relId: string): RelationshipTitleNodeView | undefined {
    return this._relationshipTitleViews.get(relId)
  }
  
  private updateSelection(): void {
    if (!this.state) return
    
    const selectedIds = this.state.selection.selectedIds
    
    for (const nodeId of selectedIds) {
      const view = this.nodeViewFactory.getTopicView(nodeId)
      if (view) {
        view.setSelected(true)
      }
    }
  }
  
  selectNode(nodeId: string): void {
    if (!this.state) return
    
    const tr = new Transaction(this.state.doc, this.state.selection)
    tr.setSelection(Selection.single(nodeId))
    this.dispatch(tr)
  }
  
  selectNodes(nodeIds: string[]): void {
    if (!this.state) return
    
    const tr = new Transaction(this.state.doc, this.state.selection)
    tr.setSelection(Selection.multiple(nodeIds))
    this.dispatch(tr)
  }
  
  clearSelection(): void {
    if (!this.state) return
    
    const tr = new Transaction(this.state.doc, this.state.selection)
    tr.setSelection(Selection.empty())
    this.dispatch(tr)
  }
  
  getSelection(): string[] {
    if (!this.state) return []
    return Array.from(this.state.selection.selectedIds)
  }
  
  getZoom(): number {
    return this.app.zoom
  }
  
  zoomTo(level: number): void {
    this.app.zoom = level
  }
  
  zoomIn(): void {
    this.app.zoom = Math.min(this.app.zoom * 1.2, 10)
  }
  
  zoomOut(): void {
    this.app.zoom = Math.max(this.app.zoom * 0.8, 0.1)
  }
  
  panTo(x: number, y: number): void {
    this.app.x = x
    this.app.y = y
  }
  
  panBy(dx: number, dy: number): void {
    this.app.x += dx
    this.app.y += dy
  }
  
  fitToContent(): void {
    this.app.zoomToFit({ padding: 40 })
  }

  setTheme(theme: ThemeData): void {
    themeManager.setTheme(theme)
    this._refreshAllColorStyles()
  }

  setThemeById(themeId: string): void {
    themeManager.setThemeById(themeId)
    this._refreshAllColorStyles()
  }

  private _refreshAllColorStyles(): void {
    if (this._rootBranch) {
      this._rootBranch.refreshColorStyles()
    }
    for (const relView of this._relationshipViews.values()) {
      relView.refreshColorStyles()
    }
  }
  
  getTopicView(nodeId: string): TopicNodeView | undefined {
    return this.nodeViewFactory.getTopicView(nodeId)
  }
  
  getConnectionView(connectionId: string): ConnectionNodeView | undefined {
    return this.nodeViewFactory.getConnectionView(connectionId)
  }

  getOverlayLayer(): Leafer {
    return this.overlayLayer
  }

  getTopicLayer(): Leafer {
    return this.topicLayer
  }

  getConnectionLayer(): Leafer {
    return this.connectionLayer
  }
  
  // ── Coordinate Conversion ──

  private _clientToWorld(clientX: number, clientY: number): Point {
    const rect = this.container.getBoundingClientRect()
    const viewportX = clientX - rect.left
    const viewportY = clientY - rect.top
    const worldX = (viewportX - this.app.x) / this.app.zoom
    const worldY = (viewportY - this.app.y) / this.app.zoom
    return { x: worldX, y: worldY }
  }

  // ── Drag Handling ──

  private initDragHandling(): void {
    this.container.addEventListener('pointerdown', this._onPointerDown)
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return
    if (!this.state) return
    if (this._isDragging || this._dragSourceId) return

    const worldPoint = this._clientToWorld(e.clientX, e.clientY)

    const nodeId = this.getNodeAtPoint(worldPoint)
    if (!nodeId) return

    const node = this.state.doc.getNodeById(nodeId)
    if (!node || node.isRoot) return

    const sourceView = this.nodeViewFactory.getTopicView(nodeId)
    if (!sourceView) return

    this._isDragging = false
    this._dragSourceId = nodeId
    this._dragStartPosition = { ...worldPoint }

    const sourceBounds = sourceView.getBounds()

    const srcNode = this.state.doc.getNodeById(nodeId)!
    this._dragPreviewView = new DragPreviewView(srcNode)
    this._dropIndicatorView = new DropIndicatorView(srcNode)

    this._dragPreviewView.show(sourceBounds.width, sourceBounds.height)

    this.overlayLayer.add(this._dragPreviewView.group)
    this.overlayLayer.add(this._dropIndicatorView.group)

    document.addEventListener('pointermove', this._onPointerMove)
    document.addEventListener('pointerup', this._onPointerUp)
  }

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragSourceId || !this._dragPreviewView || !this._dragStartPosition) return

    const currentWorldPoint = this._clientToWorld(e.clientX, e.clientY)
    const sourceId = this._dragSourceId

    const dx = currentWorldPoint.x - this._dragStartPosition.x
    const dy = currentWorldPoint.y - this._dragStartPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const DRAG_THRESHOLD = 5

    if (!this._isDragging && distance >= DRAG_THRESHOLD) {
      this._isDragging = true
      const srcView = this.nodeViewFactory.getTopicView(sourceId)
      if (srcView) {
        srcView.setForcedInvisible(true)
      }
    }

    if (this._isDragging) {
      const previewBounds = this._dragPreviewView.getBounds()
      this._dragPreviewView.setPosition({
        x: currentWorldPoint.x - previewBounds.width / 2,
        y: currentWorldPoint.y - previewBounds.height / 2,
      })

      const target = this.hitTest(currentWorldPoint, sourceId)
      if (target && this._dropIndicatorView) {
        this._dropIndicatorView.showDropTarget(target)
      } else if (this._dropIndicatorView) {
        this._dropIndicatorView.hide()
      }
    }
  }

  private _onPointerUp = (e: PointerEvent): void => {
    document.removeEventListener('pointermove', this._onPointerMove)
    document.removeEventListener('pointerup', this._onPointerUp)

    if (this._isDragging && this._dragSourceId && this.state) {
      const currentWorldPoint = this._clientToWorld(e.clientX, e.clientY)
      const sourceId = this._dragSourceId
      const target = this.hitTest(currentWorldPoint, sourceId)

      if (target && target.position !== DropPosition.NONE) {
        const targetId = target.nodeId
        const dropPos = target.position

        const sourceNode = this.state.doc.getNodeById(sourceId)
        const targetNode = this.state.doc.getNodeById(targetId)

        let isValid = true
        if (sourceNode && targetNode && sourceId !== targetId) {
          let isDescendant = false
          targetNode.descendants((n: MindMapNode) => {
            if (n.id === sourceId) isDescendant = true
          })
          isValid = !isDescendant
        } else if (sourceId === targetId) {
          isValid = false
        }

        if (isValid) {
          const tr = this.state.tr

          if (dropPos === DropPosition.INSIDE) {
            tr.moveNode(sourceId, targetId)
          } else {
            const parent = this.state.doc.findParent(targetId)
            if (parent) {
              const siblings = parent.attachedChildren
              const targetIndex = siblings.findIndex(n => n.id === targetId)
              const insertIndex = dropPos === DropPosition.BEFORE ? targetIndex : targetIndex + 1
              tr.moveNode(sourceId, parent.id, insertIndex)
            }
          }

          tr.setSelection(Selection.single(sourceId))
          this.dispatch(tr)
        }
      }
    }

    this._cleanupDragVisuals()

    if (this._dragSourceId) {
      const srcView = this.nodeViewFactory.getTopicView(this._dragSourceId)
      if (srcView) {
        srcView.setForcedInvisible(false)
      }
    }

    this._isDragging = false
    this._dragSourceId = null
    this._dragStartPosition = null
  }

  private _cleanupDragVisuals(): void {
    if (this._dragPreviewView) {
      this._dragPreviewView.group.remove()
      this._dragPreviewView = null
    }
    if (this._dropIndicatorView) {
      this._dropIndicatorView.group.remove()
      this._dropIndicatorView = null
    }
  }

  private _cleanupDrag(): void {
    this.container.removeEventListener('pointerdown', this._onPointerDown)
    document.removeEventListener('pointermove', this._onPointerMove)
    document.removeEventListener('pointerup', this._onPointerUp)
    this._cleanupDragVisuals()
    this._isDragging = false
    this._dragSourceId = null
    this._dragStartPosition = null
    this._pointerMoveHandler = null
    this._pointerUpHandler = null
  }

  // ── Hit Testing ──

  hitTest(worldPoint: Point, sourceId: string): DropTarget | null {
    const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)

    for (const view of views) {
      if (view.nodeId === sourceId) continue
      if (!view.isVisible() || view.isForcedInvisible()) continue

      const bounds = view.getBounds()

      if (worldPoint.x >= bounds.x && worldPoint.x <= bounds.x + bounds.width &&
          worldPoint.y >= bounds.y && worldPoint.y <= bounds.y + bounds.height) {
        const relativeY = worldPoint.y - bounds.y
        const heightRatio = relativeY / bounds.height

        let position: DropPosition
        if (heightRatio < 0.25) {
          position = DropPosition.BEFORE
        } else if (heightRatio > 0.75) {
          position = DropPosition.AFTER
        } else {
          position = DropPosition.INSIDE
        }

        return {
          nodeId: view.nodeId,
          position,
          bounds: { ...bounds },
        }
      }
    }

    return null
  }

  getNodeBounds(nodeId: string): Bounds | null {
    const view = this.nodeViewFactory.getTopicView(nodeId)
    if (!view) return null

    return view.getBounds()
  }

  getNodeAtPoint(worldPoint: Point): string | null {
    const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)

    for (const view of views) {
      if (!view.isVisible() || view.isForcedInvisible()) continue

      const bounds = view.getBounds()
      if (worldPoint.x >= bounds.x && worldPoint.x <= bounds.x + bounds.width &&
          worldPoint.y >= bounds.y && worldPoint.y <= bounds.y + bounds.height) {
        return view.nodeId
      }
    }

    return null
  }

  // ── Viewport ──

  updateState(state: EditorState): void {
    this.setState(state)
  }

  getViewportController(): { getPan: () => { x: number; y: number } } {
    return {
      getPan: () => ({ x: this.app.x, y: this.app.y }),
    }
  }

  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const rect = this.container.getBoundingClientRect()
    return {
      x: -this.app.x / this.app.zoom,
      y: -this.app.y / this.app.zoom,
      width: rect.width / this.app.zoom,
      height: rect.height / this.app.zoom,
    }
  }

  // ── Collaboration Stubs ──

  updateRemoteCursors(_cursors: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  updateRemoteSelections(_selections: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  // ── Lifecycle ──

  destroy(): void {
    this._cleanupDrag()

    if (this._themeUnsubscribe) {
      this._themeUnsubscribe()
      this._themeUnsubscribe = null
    }
    for (const relView of this._relationshipViews.values()) {
      relView.destroy()
    }
    this._relationshipViews.clear()
    this._relationshipTitleViews.clear()
    this._rootBranch?.destroy()
    this._rootBranch = null
    this._branchMap.clear()
    this.nodeViewFactory.clear()
    this.app.destroy()
  }
}

export default EditorView
