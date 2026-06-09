import { App, Leafer, Group } from 'leafer-ui'
import { EditorState, MindMapDocument, MindMapNode, Transaction, Selection } from '@y-mindmap/state'
import type { RelationshipData } from '@y-mindmap/state'
import type { ConnectionLayout } from '@y-mindmap/layout'
import { MapLayoutEngine, type LayoutEngine, type LayoutResult } from '@y-mindmap/layout'
import { NodeViewFactory } from './node-views/node-view-factory'
import { TopicNodeView } from './node-views/topic-node-view'
import { BranchNodeView } from './node-views/containers/branch-node-view'
import { ConnectionNodeView } from './node-views/connection-node-view'
import { RelationshipNodeView, RelationshipTitleNodeView } from './node-views/relationships/relationship-node-view'
import { DirtyFlag } from './core/node-view'
import { themeManager, type ThemeChangeListener } from './core/theme-manager'
import type { ThemeData } from '@y-mindmap/core'

export interface EditorViewConfig {
  container: HTMLElement
  state?: EditorState
  layoutEngine?: LayoutEngine
}

export class EditorView {
  private app: App
  private nodeViewFactory: NodeViewFactory
  private layoutEngine: LayoutEngine
  
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
  
  private _themeUnsubscribe: (() => void) | null = null
  
  constructor(config: EditorViewConfig) {
    this.container = config.container
    this.layoutEngine = config.layoutEngine || new MapLayoutEngine()
    this.nodeViewFactory = new NodeViewFactory()
    
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

    this._routeTransactionToBranchViews(tr)
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
        const layoutResult = this.layoutEngine.calculate(root, undefined, dirtyNodeIds)
        this.applyLayoutToViews(root, layoutResult)
      }
      
      this.validateLayoutViews(root)
      this.validatePaintViews(root)
      this.updateConnectionViews()
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
  
  destroy(): void {
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
