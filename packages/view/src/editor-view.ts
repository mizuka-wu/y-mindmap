import { App, Leafer, Group, Rect } from 'leafer-ui'
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
import { StyleKey, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import { styleManager } from './core/style-manager'
import { DragPreviewView, DropIndicatorView, DropPosition, DropTarget } from './node-views/interactions/drag-node-views'
import { Minimap, type MinimapConfig } from './minimap'
import { ZoomControls, type ZoomControlsConfig } from './zoom-controls'

export interface EditorViewConfig {
  container: HTMLElement
  state?: EditorState
  layoutEngine?: LayoutEngine
  enableAnimations?: boolean
  animationDuration?: number
  onTitleUpdate?: (nodeId: string, title: string) => void
  showMiniMap?: boolean
  miniMapConfig?: MinimapConfig
  showZoomControls?: boolean
  zoomControlsConfig?: ZoomControlsConfig
  getPluginMenuItems?: () => Array<{id: string, label: string, icon?: string, shortcut?: string, action: () => void}>
  enableContextMenu?: boolean
  enableDragDrop?: boolean
  enableBoxSelect?: boolean
  enableRichTextEdit?: boolean
  enableFormatToolbar?: boolean
  enableMiniMap?: boolean
  enableZoomControls?: boolean
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
  
  private _editingNodeId: string | null = null
  private _hoveredNodeId: string | null = null
  private _editOverlay: HTMLElement | null = null
  private _editToolbar: HTMLElement | null = null
  private _onTitleUpdate: ((nodeId: string, title: string) => void) | null = null
  private _editKeyDownHandler: ((e: KeyboardEvent) => void) | null = null
  private _editBlurHandler: ((e: FocusEvent) => void) | null = null
  
  // Drag handling
  private _dragPreviewView: DragPreviewView | null = null
  private _dropIndicatorView: DropIndicatorView | null = null
  private _isDragging: boolean = false
  private _dragSourceId: string | null = null
  private _dragStartPosition: Point | null = null
  private _pointerMoveHandler: ((e: PointerEvent) => void) | null = null
  private _pointerUpHandler: ((e: PointerEvent) => void) | null = null
  
  // Context menu
  private _contextMenu: HTMLElement | null = null
  private _contextMenuClickHandler: ((e: MouseEvent) => void) | null = null
  private _contextMenuKeyHandler: ((e: KeyboardEvent) => void) | null = null
  
  // Multi-select & box selection
  private _boxSelectStartPoint: Point | null = null
  private _boxSelectRect: Rect | null = null
  private _isBoxSelecting: boolean = false

  private _minimap: Minimap | null = null
  private _minimapContainer: HTMLElement | null = null
  private _zoomControls: ZoomControls | null = null
  private _zoomControlsContainer: HTMLElement | null = null
  private _getPluginMenuItems: (() => Array<{id: string, label: string, icon?: string, shortcut?: string, action: () => void}>) | null = null
  
  private _enableContextMenu: boolean = true
  private _enableDragDrop: boolean = true
  private _enableBoxSelect: boolean = true
  private _enableRichTextEdit: boolean = true
  private _enableFormatToolbar: boolean = true
  
  constructor(config: EditorViewConfig) {
    this.container = config.container
    this.layoutEngine = config.layoutEngine || new MapLayoutEngine()
    this.enableAnimations = config.enableAnimations ?? true
    this.animationDuration = config.animationDuration ?? 300
    this.nodeViewFactory = new NodeViewFactory()
    this._onTitleUpdate = config.onTitleUpdate ?? null
    this._getPluginMenuItems = config.getPluginMenuItems ?? null
    
    this._enableContextMenu = config.enableContextMenu ?? true
    this._enableDragDrop = config.enableDragDrop ?? true
    this._enableBoxSelect = config.enableBoxSelect ?? true
    this._enableRichTextEdit = config.enableRichTextEdit ?? true
    this._enableFormatToolbar = config.enableFormatToolbar ?? true
    
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
    
    this.initPointerHandling()
    
    if (this._enableContextMenu) {
      this.initContextMenu()
    }
    
    if (this._enableDragDrop) {
      this.initDragDrop()
    }
    
    if (this._enableBoxSelect) {
      this.initBoxSelect()
    }
    
    if (this._enableRichTextEdit) {
      this.initRichTextEdit()
    }
    
    if (this._enableFormatToolbar) {
      this.initFormatToolbar()
    }
    
    const showMiniMap = config.enableMiniMap ?? config.showMiniMap ?? false
    if (showMiniMap) {
      this._createMiniMap(config.miniMapConfig)
    }
    
    const showZoomControls = config.enableZoomControls ?? config.showZoomControls ?? false
    if (showZoomControls) {
      this._createZoomControls(config.zoomControlsConfig)
    }
    
    if (config.state) {
      this.setState(config.state)
    }
  }

  private _createMiniMap(config?: MinimapConfig): void {
    this._minimapContainer = document.createElement('div')
    this._minimapContainer.style.cssText = `
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10;
    `
    this.container.appendChild(this._minimapContainer)

    this._minimap = new Minimap(this._minimapContainer, {
      getDocument: () => this.state?.doc.root ?? null,
      getNodeBounds: (nodeId) => this.getNodeBounds(nodeId),
      getSelectedNodeIds: () => this.getSelection(),
      getViewportBounds: () => this.getViewportBounds(),
      getZoom: () => this.getZoom(),
      panTo: (x, y) => this.panTo(x, y),
      zoomTo: (level) => this.zoomTo(level),
    }, config)
  }

  private _createZoomControls(config?: ZoomControlsConfig): void {
    this._zoomControlsContainer = document.createElement('div')
    this._zoomControlsContainer.style.cssText = `
      position: absolute;
      bottom: 12px;
      right: ${this._minimap ? '224px' : '12px'};
      z-index: 10;
    `
    this.container.appendChild(this._zoomControlsContainer)

    this._zoomControls = new ZoomControls(this._zoomControlsContainer, {
      getZoom: () => this.getZoom(),
      zoomTo: (level) => this.zoomTo(level),
      zoomIn: () => this.zoomIn(),
      zoomOut: () => this.zoomOut(),
      fitToContent: () => this.fitToContent(),
    }, config)
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
          const layoutResult = this.layoutEngine.calculate(root, this._getLayoutOptions(), dirtyNodeIds)
          this.applyLayoutToViews(root, layoutResult)
        }
      }
      
      this.validateViews(root)
      if (!this._isAnimating) {
        this.updateConnectionViews()
      }
      this.updateRelationshipViews()
      this.updateSelection()
      this._minimap?.update()
      this._zoomControls?.update()
      
      this._pendingDirtyNodeIds.clear()
    } finally {
      this._isUpdating = false
    }
  }
  
  private validateViews(node: MindMapNode): void {
    const view = this.nodeViewFactory.getTopicView(node.id)
    if (view) {
      view.validate()
    }
    
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.validateViews(child)
      }
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
  

  
  private updateConnectionViews(): void {
    if (!this.state) return
    
    const root = this.state.doc.root
    const layoutResult = this.layoutEngine.calculate(root, this._getLayoutOptions())
    
    const existingConnectionIds = new Set<string>()
    for (const [connectionId, connectionLayout] of layoutResult.connections) {
      existingConnectionIds.add(connectionId)
      const view = this.nodeViewFactory.createConnectionView(connectionId, connectionLayout as any)
      if (!view.group.parent) {
        this.connectionLayer.add(view.group)
      }
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
    
    const selectedIds = new Set(this.state.selection.selectedIds)
    
    // Clear deselected nodes
    for (const [, view] of this.nodeViewFactory.getAllTopicViews()) {
      if (!selectedIds.has(view.nodeId)) {
        view.setSelected(false)
      }
    }
    
    // Set selected nodes
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
    return (this.app as any).zoom ?? 1
  }
  
  zoomTo(level: number): void {
    ;(this.app as any).zoom = level
  }
  
  zoomIn(): void {
    (this.app as any).zoom = Math.min((this.app as any).zoom * 1.2, 10)
  }
  
  zoomOut(): void {
    (this.app as any).zoom = Math.max((this.app as any).zoom * 0.8, 0.1)
  }
  
  panTo(x: number, y: number): void {
    this.app.x = x as any
    this.app.y = y as any
  }
  
  panBy(dx: number, dy: number): void {
    this.app.x = (this.app.x ?? 0) + dx
    this.app.y = (this.app.y ?? 0) + dy
  }
  
  fitToContent(): void {
    (this.app as any).zoomToFit?.({ padding: 40 })
  }

  setTheme(theme: ThemeData): void {
    themeManager.setTheme(theme)
    this._refreshAllColorStyles()
  }

  setThemeById(themeId: string): void {
    themeManager.setThemeById(themeId)
    this._refreshAllColorStyles()
  }

  getTheme(): ThemeData {
    return themeManager.getTheme()
  }

  registerTheme(theme: ThemeData): void {
    themeManager.registerTheme(theme)
  }

  getAvailableThemes(): Array<{ id: string; title: string }> {
    return themeManager.getAvailableThemes()
  }

  exportTheme(themeId?: string): ThemeData | null {
    return themeManager.exportTheme(themeId)
  }

  importTheme(data: ThemeData): void {
    themeManager.importTheme(data)
  }

  getBackgroundColor(): string | undefined {
    return themeManager.getBackgroundColor()
  }

  private _getLayoutOptions(): any {
    return {
      nodeSpacingResolver: (nodeId: string): [number, number] | null => {
        const view = this.nodeViewFactory.getTopicView(nodeId)
        if (!view) return null
        const majorSpacing = styleManager.getStyleValue(view, StyleKey.MAJOR_SPACING)
        const minorSpacing = styleManager.getStyleValue(view, StyleKey.MINOR_SPACING)
        if (majorSpacing === undefined && minorSpacing === undefined) return null
        return [
          majorSpacing ?? 40,
          minorSpacing ?? 20,
        ]
      },
    }
  }

  private _refreshAllColorStyles(): void {
    styleManager.invalidateAllCache()
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

  clientToWorld(clientX: number, clientY: number): Point {
    const rect = this.container.getBoundingClientRect()
    const viewportX = clientX - rect.left
    const viewportY = clientY - rect.top
    const worldX = (viewportX - (this.app.x ?? 0)) / ((this.app as any).zoom ?? 1)
    const worldY = (viewportY - (this.app.y ?? 0)) / ((this.app as any).zoom ?? 1)
    return { x: worldX, y: worldY }
  }

  // ── Feature Initialization ──

  private initPointerHandling(): void {
    this.container.addEventListener('pointerdown', this._onPointerDown)
    this.container.addEventListener('pointermove', this._onPointerHover)
    this.container.addEventListener('pointerleave', this._onPointerLeave)
  }

  private destroyPointerHandling(): void {
    this.container.removeEventListener('pointerdown', this._onPointerDown)
    this.container.removeEventListener('pointermove', this._onPointerHover)
    this.container.removeEventListener('pointerleave', this._onPointerLeave)
    document.removeEventListener('pointermove', this._onPointerMove)
    document.removeEventListener('pointerup', this._onPointerUp)
    document.removeEventListener('pointermove', this._onBoxSelectMove)
    document.removeEventListener('pointerup', this._onBoxSelectUp)
  }

  private _onPointerHover = (e: PointerEvent): void => {
    const worldPoint = this.clientToWorld(e.clientX, e.clientY)
    const nodeId = this._findNodeIdAtPoint(worldPoint)

    if (nodeId !== this._hoveredNodeId) {
      // Remove previous hover
      if (this._hoveredNodeId) {
        const prevView = this.nodeViewFactory.getTopicView(this._hoveredNodeId)
        if (prevView && !prevView.isSelected()) {
          prevView.setHovered(false)
        }
      }
      // Apply new hover
      this._hoveredNodeId = nodeId
      if (nodeId) {
        const view = this.nodeViewFactory.getTopicView(nodeId)
        if (view && !view.isSelected()) {
          view.setHovered(true)
        }
        this.container.style.cursor = 'pointer'
      } else {
        this.container.style.cursor = 'default'
      }
    }
  }

  private _onPointerLeave = (): void => {
    if (this._hoveredNodeId) {
      const prevView = this.nodeViewFactory.getTopicView(this._hoveredNodeId)
      if (prevView) {
        prevView.setHovered(false)
      }
      this._hoveredNodeId = null
    }
    this.container.style.cursor = 'default'
  }

  private _findNodeIdAtPoint(worldPoint: { x: number; y: number }): string | null {
    // Walk node views to find which one contains the point
    for (const [id, view] of this.nodeViewFactory.getAllTopicViews()) {
      if (view.isVisible() && !view.isForcedInvisible()) {
        const bounds = view.getBounds()
        const absBounds = view.getAbsoluteBounds()
        if (worldPoint.x >= absBounds.x && worldPoint.x <= absBounds.x + absBounds.width &&
            worldPoint.y >= absBounds.y && worldPoint.y <= absBounds.y + absBounds.height) {
          return id
        }
      }
    }
    return null
  }

  initContextMenu(): void {
    this.container.removeEventListener('contextmenu', this._onContextMenu)
    this.container.addEventListener('contextmenu', this._onContextMenu)
  }

  destroyContextMenu(): void {
    this.container.removeEventListener('contextmenu', this._onContextMenu)
    this._hideContextMenu()
  }

  initDragDrop(): void {
    // Drag handling is integrated into _onPointerDown
  }

  destroyDragDrop(): void {
    this._cleanupDragVisuals()
    this._isDragging = false
    this._dragSourceId = null
    this._dragStartPosition = null
  }

  initBoxSelect(): void {
    // Box select handling is integrated into _onPointerDown
  }

  destroyBoxSelect(): void {
    this._restoreAllNodesVisibility()
    this._boxSelectStartPoint = null
    this._isBoxSelecting = false
    if (this._boxSelectRect) {
      this._boxSelectRect.remove()
      this._boxSelectRect = null
    }
  }

  initRichTextEdit(): void {
    this.container.removeEventListener('dblclick', this._onDblClick)
    this.container.addEventListener('dblclick', this._onDblClick)
  }

  destroyRichTextEdit(): void {
    this.container.removeEventListener('dblclick', this._onDblClick)
    if (this._editingNodeId) {
      this.stopEditing(false)
    }
  }

  initFormatToolbar(): void {
    // Format toolbar is created in _createEditOverlay
  }

  destroyFormatToolbar(): void {
    if (this._editToolbar) {
      this._editToolbar.remove()
      this._editToolbar = null
    }
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return
    if (!this.state) return
    if (this._isDragging || this._dragSourceId) return

    const worldPoint = this.clientToWorld(e.clientX, e.clientY)
    const nodeId = this.getNodeAtPoint(worldPoint)

    if (nodeId) {
      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey
      if (isMultiSelect) {
        const currentSelection = Array.from(this.state.selection.selectedIds)
        const isSelected = currentSelection.includes(nodeId)
        let newSelection: string[]
        if (isSelected) {
          newSelection = currentSelection.filter(id => id !== nodeId)
        } else {
          newSelection = [...currentSelection, nodeId]
        }
        const tr = new Transaction(this.state.doc, this.state.selection)
        tr.setSelection(newSelection.length > 0 ? Selection.multiple(newSelection) : Selection.empty())
        this.dispatch(tr)
        return
      }

      if (!this._enableDragDrop) return

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
    } else {
      if (!this._enableBoxSelect) return

      this._boxSelectStartPoint = { ...worldPoint }
      this._isBoxSelecting = false

      const selectionRect = new Rect({
        x: worldPoint.x,
        y: worldPoint.y,
        width: 0,
        height: 0,
        stroke: '#4A90D9',
        strokeWidth: 1,
        dashPattern: [4, 4],
        fill: 'rgba(74, 144, 217, 0.1)',
      })
      this.overlayLayer.add(selectionRect)
      this._boxSelectRect = selectionRect

      document.addEventListener('pointermove', this._onBoxSelectMove)
      document.addEventListener('pointerup', this._onBoxSelectUp)
    }
  }

  private _onDblClick = (e: MouseEvent): void => {
    if (!this._enableRichTextEdit) return
    if (!this.state) return

    const worldPoint = this.clientToWorld(e.clientX, e.clientY)
    const nodeId = this.getNodeAtPoint(worldPoint)
    if (nodeId) {
      this.startEditing(nodeId)
    }
  }

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._dragSourceId || !this._dragPreviewView || !this._dragStartPosition) return

    const currentWorldPoint = this.clientToWorld(e.clientX, e.clientY)
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
      const currentWorldPoint = this.clientToWorld(e.clientX, e.clientY)
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

  private _onBoxSelectMove = (e: PointerEvent): void => {
    if (!this._boxSelectStartPoint || !this._boxSelectRect) return

    const currentPoint = this.clientToWorld(e.clientX, e.clientY)
    const start = this._boxSelectStartPoint

    const x = Math.min(start.x, currentPoint.x)
    const y = Math.min(start.y, currentPoint.y)
    const width = Math.abs(currentPoint.x - start.x)
    const height = Math.abs(currentPoint.y - start.y)

    this._boxSelectRect.set({ x, y, width, height })

    if (!this._isBoxSelecting && (width > 2 || height > 2)) {
      this._isBoxSelecting = true
      this._setOutsideBoxSelectNodesForcedInvisible({ x, y, width, height })
    }
  }

  private _onBoxSelectUp = (e: PointerEvent): void => {
    document.removeEventListener('pointermove', this._onBoxSelectMove)
    document.removeEventListener('pointerup', this._onBoxSelectUp)

    // Restore all nodes visibility
    this._restoreAllNodesVisibility()

    if (this._isBoxSelecting && this._boxSelectRect && this.state) {
      const rect = this._boxSelectRect
      const rectBounds = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      }

      const selectedNodeIds: string[] = []
      const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)

      for (const view of views) {
        if (!view.isVisible() || view.isForcedInvisible()) continue

        const bounds = view.getBounds()
        if (bounds && this._rectsIntersect(rectBounds, bounds as any)) {
          selectedNodeIds.push(view.nodeId)
        }
      }

      if (selectedNodeIds.length > 0) {
        const tr = new Transaction(this.state.doc, this.state.selection)
        tr.setSelection(Selection.multiple(selectedNodeIds))
        this.dispatch(tr)
      }
    }

    if (this._boxSelectRect) {
      this._boxSelectRect.remove()
      this._boxSelectRect = null
    }
    this._boxSelectStartPoint = null
    this._isBoxSelecting = false
  }

  private _setOutsideBoxSelectNodesForcedInvisible(boxBounds: { x: number; y: number; width: number; height: number }): void {
    const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)
    const expandedBox = {
      x: boxBounds.x - 100,
      y: boxBounds.y - 100,
      width: boxBounds.width + 200,
      height: boxBounds.height + 200,
    }
    
    for (const view of views) {
      const bounds = view.getBounds()
      const isInside = this._rectsIntersect(expandedBox, bounds)
      view.setForcedInvisible(!isInside)
    }
  }

  private _restoreAllNodesVisibility(): void {
    const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)
    for (const view of views) {
      view.setForcedInvisible(false)
    }
  }

  private _rectsIntersect(a: any, b: any): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y
  }

  private _onContextMenu = (e: MouseEvent): void => {
    if (!this._enableContextMenu) return
    e.preventDefault()
    if (!this.state) return

    const worldPoint = this.clientToWorld(e.clientX, e.clientY)
    const nodeId = this.getNodeAtPoint(worldPoint)

    if (nodeId) {
      this.selectNode(nodeId)
      this._showContextMenu(e.clientX, e.clientY, nodeId)
    }
  }

  private _showContextMenu(clientX: number, clientY: number, nodeId: string): void {
    this._hideContextMenu()

    const menu = document.createElement('div')
    menu.className = 'y-mindmap-context-menu'

    menu.style.position = 'fixed'
    menu.style.left = `${clientX}px`
    menu.style.top = `${clientY}px`
    menu.style.zIndex = '10001'
    menu.style.background = '#fff'
    menu.style.borderRadius = '8px'
    menu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
    menu.style.padding = '4px 0'
    menu.style.minWidth = '160px'
    menu.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    menu.style.fontSize = '13px'
    menu.style.color = '#333'
    menu.style.userSelect = 'none'

    const items = [
      { label: '添加子节点', action: () => this._dispatchCommand('addSubTopic', nodeId) },
      { label: '添加兄弟节点', action: () => this._dispatchCommand('addSiblingTopic', nodeId) },
      { label: '删除', action: () => this._dispatchCommand('deleteNode', nodeId), danger: true },
      { label: '折叠/展开', action: () => this._dispatchCommand('toggleFold', nodeId) },
      { label: '编辑标题', action: () => this.startEditing(nodeId) },
    ]

    if (this._getPluginMenuItems) {
      const pluginItems = this._getPluginMenuItems()
      if (pluginItems.length > 0) {
        items.push({ label: '', action: () => {}, divider: true } as any)
        for (const pluginItem of pluginItems) {
          items.push({
            label: pluginItem.label,
            action: pluginItem.action,
          })
        }
      }
    }

    for (const item of items) {
      if ((item as any).divider) {
        const divider = document.createElement('div')
        divider.style.height = '1px'
        divider.style.background = '#e0e0e0'
        divider.style.margin = '4px 0'
        menu.appendChild(divider)
        continue
      }

      const menuItem = document.createElement('div')
      menuItem.textContent = item.label
      menuItem.style.padding = '8px 16px'
      menuItem.style.cursor = 'pointer'
      menuItem.style.transition = 'background 0.1s'

      if (item.danger) {
        menuItem.style.color = '#e74c3c'
      }

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.background = '#f5f5f5'
      })
      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.background = 'transparent'
      })
      menuItem.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation()
        item.action()
        this._hideContextMenu()
      })

      menu.appendChild(menuItem)
    }

    this.container.appendChild(menu)
    this._contextMenu = menu

    const menuRect = menu.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()
    if (menuRect.right > containerRect.right) {
      menu.style.left = `${clientX - menuRect.width}px`
    }
    if (menuRect.bottom > containerRect.bottom) {
      menu.style.top = `${clientY - menuRect.height}px`
    }

    this._contextMenuClickHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        this._hideContextMenu()
      }
    }
    this._contextMenuKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this._hideContextMenu()
      }
    }

    setTimeout(() => {
      document.addEventListener('click', this._contextMenuClickHandler!)
      document.addEventListener('keydown', this._contextMenuKeyHandler!)
    }, 0)
  }

  private _hideContextMenu(): void {
    if (this._contextMenu) {
      this._contextMenu.remove()
      this._contextMenu = null
    }
    if (this._contextMenuClickHandler) {
      document.removeEventListener('click', this._contextMenuClickHandler)
      this._contextMenuClickHandler = null
    }
    if (this._contextMenuKeyHandler) {
      document.removeEventListener('keydown', this._contextMenuKeyHandler)
      this._contextMenuKeyHandler = null
    }
  }

  private _dispatchCommand(command: string, nodeId: string): void {
    if (!this.state) return
    const tr = this.state.tr

    switch (command) {
      case 'addSubTopic': {
        const newNode = MindMapNode.create('New Topic')
        tr.addNode(nodeId, newNode)
        tr.setSelection(Selection.single(newNode.id))
        break
      }
      case 'addSiblingTopic': {
        const parent = this.state.doc.findParent(nodeId)
        if (parent) {
          const newNode = MindMapNode.create('New Topic')
          tr.addNode(parent.id, newNode)
          tr.setSelection(Selection.single(newNode.id))
        }
        break
      }
      case 'deleteNode': {
        tr.removeNode(nodeId)
        break
      }
      case 'toggleFold': {
        const node = this.state.doc.getNodeById(nodeId)
        if (node) {
          tr.updateNode(nodeId, (n) => n.toggleFold())
        }
        break
      }
    }

    this.dispatch(tr)
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
      getPan: () => ({ x: this.app.x ?? 0, y: this.app.y ?? 0 }),
    }
  }

  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const rect = this.container.getBoundingClientRect()
    return {
      x: -(this.app.x ?? 0) / ((this.app as any).zoom ?? 1),
      y: -(this.app.y ?? 0) / ((this.app as any).zoom ?? 1),
      width: rect.width / ((this.app as any).zoom ?? 1),
      height: rect.height / ((this.app as any).zoom ?? 1),
    }
  }

  // ── Collaboration Stubs ──

  updateRemoteCursors(_cursors: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  updateRemoteSelections(_selections: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  // ── Rich Text Editing ──

  isEditing(): boolean {
    return this._editingNodeId !== null
  }

  getEditingNodeId(): string | null {
    return this._editingNodeId
  }

  startEditing(nodeId: string): void {
    if (this._editingNodeId === nodeId) return
    if (this._editingNodeId) {
      this.stopEditing(true)
    }

    const view = this.nodeViewFactory.getTopicView(nodeId)
    if (!view) return

    this._editingNodeId = nodeId
    
    // Optimize rendering - set non-editing nodes as forced invisible
    this._setNonEditingNodesForcedInvisible(nodeId, true)
    
    this._createEditOverlay(nodeId, view)
  }

  stopEditing(save: boolean): void {
    if (!this._editingNodeId || !this._editOverlay) return

    if (save) {
      const newText = this._editOverlay.innerText
      const originalTitle = this.state?.doc.getNodeById(this._editingNodeId)?.title ?? ''
      if (newText !== originalTitle && this._onTitleUpdate) {
        this._onTitleUpdate(this._editingNodeId, newText)
      }
    }

    // Restore non-editing nodes visibility
    this._setNonEditingNodesForcedInvisible(this._editingNodeId, false)
    
    this._removeEditOverlay()
    this._editingNodeId = null
  }

  private _setNonEditingNodesForcedInvisible(editingNodeId: string, forcedInvisible: boolean): void {
    const views = this.nodeViewFactory.getViewsByType(NodeViewType.TOPIC)
    for (const view of views) {
      if (view.nodeId !== editingNodeId) {
        view.setForcedInvisible(forcedInvisible)
      }
    }
  }

  private _createEditOverlay(nodeId: string, view: TopicNodeView): void {
    const titleBounds = view.getTitleBounds()
    const titleStyle = view.getTitleStyle()
    const worldBounds = view.getBounds()

    const absX = worldBounds.x + titleBounds.x
    const absY = worldBounds.y + titleBounds.y
    const screenX = absX * ((this.app as any).zoom ?? 1) + (this.app.x ?? 0)
    const screenY = absY * ((this.app as any).zoom ?? 1) + (this.app.y ?? 0)
    const screenWidth = titleBounds.width * ((this.app as any).zoom ?? 1)
    const screenHeight = titleBounds.height * ((this.app as any).zoom ?? 1)

    if (this._enableFormatToolbar) {
      const toolbar = this._createFormatToolbar(screenX, screenY - 36)
      this.container.appendChild(toolbar)
      this._editToolbar = toolbar
    }

    const overlay = document.createElement('div')
    overlay.className = 'y-mindmap-edit-overlay'
    overlay.contentEditable = 'true'
    overlay.setAttribute('spellcheck', 'false')

    const node = this.state?.doc.getNodeById(nodeId)
    overlay.textContent = node?.title ?? ''

    overlay.style.position = 'absolute'
    overlay.style.left = `${screenX}px`
    overlay.style.top = `${screenY}px`
    overlay.style.width = `${screenWidth}px`
    overlay.style.minHeight = `${screenHeight}px`
    overlay.style.fontSize = `${titleStyle.fontSize * ((this.app as any).zoom ?? 1)}px`
    overlay.style.fontFamily = titleStyle.fontFamily
    overlay.style.color = titleStyle.color
    overlay.style.fontWeight = String(titleStyle.fontWeight)
    overlay.style.fontStyle = titleStyle.fontStyle
    overlay.style.textAlign = titleStyle.textAlign
    overlay.style.lineHeight = '1.4'
    overlay.style.padding = '2px 4px'
    overlay.style.outline = 'none'
    overlay.style.border = '2px solid #4A90D9'
    overlay.style.borderRadius = '4px'
    overlay.style.background = '#fff'
    overlay.style.zIndex = '10000'
    overlay.style.boxSizing = 'border-box'
    overlay.style.overflow = 'hidden'
    overlay.style.whiteSpace = 'pre-wrap'
    overlay.style.wordBreak = 'break-word'

    this._editKeyDownHandler = (e: KeyboardEvent) => this._onEditKeyDown(e)
    this._editBlurHandler = () => this._onEditBlur()
    overlay.addEventListener('keydown', this._editKeyDownHandler)
    overlay.addEventListener('blur', this._editBlurHandler)

    this.container.appendChild(overlay)
    this._editOverlay = overlay

    requestAnimationFrame(() => {
      overlay.focus()
      const range = document.createRange()
      range.selectNodeContents(overlay)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    })
  }

  private _createFormatToolbar(x: number, y: number): HTMLElement {
    const toolbar = document.createElement('div')
    toolbar.className = 'y-mindmap-format-toolbar'
    toolbar.style.position = 'absolute'
    toolbar.style.left = `${x}px`
    toolbar.style.top = `${y}px`
    toolbar.style.zIndex = '10001'
    toolbar.style.display = 'flex'
    toolbar.style.gap = '2px'
    toolbar.style.padding = '4px 6px'
    toolbar.style.background = '#fff'
    toolbar.style.borderRadius = '6px'
    toolbar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
    toolbar.style.userSelect = 'none'

    const buttons = [
      { label: 'B', command: 'bold', style: 'font-weight:bold' },
      { label: 'I', command: 'italic', style: 'font-style:italic' },
      { label: 'U', command: 'underline', style: 'text-decoration:underline' },
    ]

    for (const btn of buttons) {
      const button = document.createElement('button')
      button.textContent = btn.label
      button.setAttribute('data-command', btn.command)
      button.style.cssText = `
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: center;
        ${btn.style};
      `
      button.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        document.execCommand(btn.command, false)
        this._editOverlay?.focus()
      })
      button.addEventListener('mouseenter', () => {
        button.style.background = '#f0f0f0'
      })
      button.addEventListener('mouseleave', () => {
        button.style.background = 'transparent'
      })
      toolbar.appendChild(button)
    }

    const separator = document.createElement('div')
    separator.style.cssText = 'width:1px;height:20px;background:#e0e0e0;margin:4px 2px'
    toolbar.appendChild(separator)

    const colorContainer = document.createElement('div')
    colorContainer.style.position = 'relative'

    const colorButton = document.createElement('button')
    colorButton.textContent = 'A'
    colorButton.style.cssText = `
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      border-bottom: 3px solid #e74c3c;
    `
    colorButton.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    const colorPalette = document.createElement('div')
    colorPalette.style.cssText = `
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      padding: 6px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10002;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
    `

    const colors = [
      '#000000', '#333333', '#666666', '#999999', '#cccccc',
      '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db',
      '#9b59b6', '#1abc9c', '#d35400', '#2c3e50', '#7f8c8d',
    ]

    for (const color of colors) {
      const swatch = document.createElement('div')
      swatch.style.cssText = `
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 3px;
        cursor: pointer;
        border: 1px solid rgba(0,0,0,0.1);
      `
      swatch.addEventListener('mousedown', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
      swatch.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        document.execCommand('foreColor', false, color)
        colorPalette.style.display = 'none'
        this._editOverlay?.focus()
      })
      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.2)'
      })
      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = 'scale(1)'
      })
      colorPalette.appendChild(swatch)
    }

    colorButton.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      colorPalette.style.display = colorPalette.style.display === 'none' ? 'grid' : 'none'
    })
    colorButton.addEventListener('mouseenter', () => {
      colorButton.style.background = '#f0f0f0'
    })
    colorButton.addEventListener('mouseleave', () => {
      colorButton.style.background = 'transparent'
    })

    colorContainer.appendChild(colorButton)
    colorContainer.appendChild(colorPalette)
    toolbar.appendChild(colorContainer)

    return toolbar
  }

  private _removeEditOverlay(): void {
    if (this._editToolbar) {
      this._editToolbar.remove()
      this._editToolbar = null
    }
    
    if (!this._editOverlay) return

    if (this._editKeyDownHandler) {
      this._editOverlay.removeEventListener('keydown', this._editKeyDownHandler)
      this._editKeyDownHandler = null
    }
    if (this._editBlurHandler) {
      this._editOverlay.removeEventListener('blur', this._editBlurHandler)
      this._editBlurHandler = null
    }

    this._editOverlay.remove()
    this._editOverlay = null
  }

  private _onEditKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this.stopEditing(true)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      this.stopEditing(false)
    }
  }

  private _onEditBlur(): void {
    setTimeout(() => this.stopEditing(true), 0)
  }

  // ── Export ──

  getDom(): HTMLElement {
    return this.container
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas as unknown as HTMLCanvasElement
  }

  getContentBounds(): Bounds {
    const allBounds: Bounds[] = []
    const root = this.state?.doc.root
    if (root == null) return { x: 0, y: 0, width: 0, height: 0 }
    root.descendants((node) => {
      const bounds = this.getNodeBounds(node.id)
      if (bounds) allBounds.push(bounds)
    })

    if (allBounds.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 }
    }

    const minX = Math.min(...allBounds.map(b => b.x))
    const minY = Math.min(...allBounds.map(b => b.y))
    const maxX = Math.max(...allBounds.map(b => b.x + b.width))
    const maxY = Math.max(...allBounds.map(b => b.y + b.height))

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  // ── Lifecycle ──

  destroy(): void {
    this.destroyPointerHandling()
    this.destroyContextMenu()
    this.destroyDragDrop()
    this.destroyBoxSelect()
    this.destroyRichTextEdit()
    this.destroyFormatToolbar()

    this._minimap?.destroy()
    this._minimapContainer?.remove()
    this._minimap = null
    this._minimapContainer = null

    this._zoomControls?.destroy()
    this._zoomControlsContainer?.remove()
    this._zoomControls = null
    this._zoomControlsContainer = null

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
