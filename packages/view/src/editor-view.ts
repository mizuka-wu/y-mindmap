import { App, Leafer, Group } from 'leafer-ui'
import { EditorState, MindMapNode, Selection } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, MapLayout, NodeLayout, ConnectionLayout, LayoutTransition, AnimatedLayoutEngine } from '@y-mindmap/layout'
import { Point, Bounds } from '@y-mindmap/core'
import { TopicView } from './topic-view'
import { ConnectionView } from './connection-view'
import { ViewportController } from './viewport/viewport-controller'
import { DecorationManager, Decoration, DecorationSet } from './decorations'
import { CollabCursorView, CollabSelectionView, RemoteCursor, RemoteSelection } from './collab'

export interface EditorViewConfig {
  container: HTMLElement
  state: EditorState
  layoutEngine?: LayoutEngine
  enableAnimation?: boolean
}

export class EditorView {
  private app: App
  private state: EditorState
  private layoutEngine: AnimatedLayoutEngine
  private viewportController: ViewportController
  private decorationManager: DecorationManager

  private topicViews: Map<string, TopicView> = new Map()
  private connectionViews: Map<string, ConnectionView> = new Map()

  private topicLayer: Leafer
  private connectionLayer: Leafer
  private decorationLayer: Leafer
  private collabLayer: Leafer | null = null

  private container: HTMLElement
  private enableAnimation: boolean

  private collabCursorView: CollabCursorView | null = null
  private collabSelectionView: CollabSelectionView | null = null

  constructor(config: EditorViewConfig) {
    this.container = config.container
    this.state = config.state
    this.enableAnimation = config.enableAnimation ?? true

    const baseLayout = config.layoutEngine || new MapLayout()
    this.layoutEngine = new AnimatedLayoutEngine(baseLayout, {
      duration: 300,
      easing: 'ease-out',
      stagger: 20,
    })

    this.app = new App({
      view: config.container,
      type: 'viewport',
    })

    this.connectionLayer = this.app.addLeafer({ type: 'draw' })
    this.topicLayer = this.app.addLeafer({ type: 'draw' })
    this.decorationLayer = this.app.addLeafer({ type: 'draw' })

    this.viewportController = new ViewportController(this.app)
    this.decorationManager = new DecorationManager()

    this.initCollabLayer()

    this.render()
  }

  private initCollabLayer(): void {
    this.collabLayer = this.app.addLeafer({ type: 'draw' })
    const collabGroup = new Group()
    this.collabLayer.add(collabGroup)

    this.collabCursorView = new CollabCursorView(collabGroup)
    this.collabSelectionView = new CollabSelectionView(collabGroup, (nodeId) => {
      const view = this.topicViews.get(nodeId)
      if (!view) return null
      return {
        x: view.group.x || 0,
        y: view.group.y || 0,
        width: view.group.width || 0,
        height: view.group.height || 0,
      }
    })
  }

  getState(): EditorState {
    return this.state
  }

  updateState(newState: EditorState): void {
    this.state = newState
    this.render()
  }

  getZoom(): number {
    return this.viewportController.getZoom()
  }

  zoomTo(level: number): void {
    this.viewportController.zoomTo(level)
  }

  zoomIn(): void {
    this.viewportController.zoomIn()
  }

  zoomOut(): void {
    this.viewportController.zoomOut()
  }

  panTo(position: Point): void {
    this.viewportController.panToPoint(position, this.getContainerSize())
  }

  panBy(dx: number, dy: number): void {
    this.viewportController.panBy(dx, dy)
  }

  fitToContent(): void {
    const bounds = this.calculateContentBounds()
    if (!bounds) return
    this.viewportController.fitToContent(bounds, this.getContainerSize())
  }

  selectNode(nodeId: string): void {
    const tr = this.state.tr
    tr.setSelection(Selection.single(nodeId))
    this.updateState(this.state.apply(tr))
  }

  getSelection(): string[] {
    return Array.from(this.state.selection.selectedIds)
  }

  getViewportController(): ViewportController {
    return this.viewportController
  }

  getDecorationManager(): DecorationManager {
    return this.decorationManager
  }

  addDecoration(decoration: Decoration): void {
    this.decorationManager.addDecoration(decoration)
  }

  removeDecoration(predicate: (dec: Decoration) => boolean): void {
    this.decorationManager.removeDecoration(predicate)
  }

  setDecorations(decorations: DecorationSet): void {
    this.decorationManager.setDecorations(decorations)
  }

  getNodeBounds(nodeId: string): Bounds | null {
    const view = this.topicViews.get(nodeId)
    if (!view) return null
    
    const group = view.group
    return {
      x: group.x ?? 0,
      y: group.y ?? 0,
      width: group.width ?? 100,
      height: group.height ?? 40,
    }
  }

  getViewportBounds(): Bounds {
    const size = this.getContainerSize()
    const pan = this.viewportController.getPan()
    const zoom = this.viewportController.getZoom()
    
    return {
      x: -pan.x / zoom,
      y: -pan.y / zoom,
      width: size.width / zoom,
      height: size.height / zoom,
    }
  }

  getNodeAtPoint(point: Point): string | null {
    for (const [nodeId, view] of this.topicViews) {
      const bounds = this.getNodeBounds(nodeId)
      if (bounds && this.isPointInBounds(point, bounds)) {
        return nodeId
      }
    }
    return null
  }

  private isPointInBounds(point: Point, bounds: Bounds): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    )
  }

  private getContainerSize(): { width: number; height: number } {
    return {
      width: this.container.clientWidth || 800,
      height: this.container.clientHeight || 600,
    }
  }

  private render(): void {
    if (this.enableAnimation) {
      const layoutResult = this.layoutEngine.calculateAnimated(
        this.state.doc.root,
        (nodeId, position) => {
          const view = this.topicViews.get(nodeId)
          if (view) {
            view.group.x = position.x
            view.group.y = position.y
          }
        },
        () => {
          this.updateDecorations()
        }
      )

      this.updateTopicViews(layoutResult)
      this.updateConnectionViews(layoutResult)
      this.updateSelection()
    } else {
      const layoutResult = this.layoutEngine.calculate(this.state.doc.root)
      this.updateTopicViews(layoutResult)
      this.updateConnectionViews(layoutResult)
      this.updateSelection()
      this.updateDecorations()
    }
  }

  private updateTopicViews(layoutResult: LayoutResult): void {
    const existingIds = new Set(this.topicViews.keys())

    for (const [nodeId, nodeLayout] of layoutResult.nodes) {
      existingIds.delete(nodeId)

      const node = this.state.doc.getNodeById(nodeId)
      if (!node) continue

      let view = this.topicViews.get(nodeId)
      if (view) {
        view.updateNode(node)
        view.updateLayout(nodeLayout)
      } else {
        view = new TopicView(node, nodeLayout)
        this.topicViews.set(nodeId, view)
        this.topicLayer.add(view.group)
        this.decorationManager.setNodeView(nodeId, view.group)
      }
    }

    for (const id of existingIds) {
      const view = this.topicViews.get(id)
      if (view) {
        view.destroy()
        this.topicViews.delete(id)
        this.decorationManager.removeNodeView(id)
      }
    }
  }

  private updateConnectionViews(layoutResult: LayoutResult): void {
    const existingIds = new Set(this.connectionViews.keys())

    for (const [connectionId, connectionLayout] of layoutResult.connections) {
      existingIds.delete(connectionId)

      let view = this.connectionViews.get(connectionId)
      if (view) {
        view.updateLayout(connectionLayout)
      } else {
        view = new ConnectionView(connectionLayout)
        this.connectionViews.set(connectionId, view)
        this.connectionLayer.add(view.path)
      }
    }

    for (const id of existingIds) {
      const view = this.connectionViews.get(id)
      if (view) {
        view.destroy()
        this.connectionViews.delete(id)
      }
    }
  }

  private updateSelection(): void {
    const selectedIds = this.state.selection.selectedIds

    for (const [nodeId, view] of this.topicViews) {
      view.setSelected(selectedIds.has(nodeId))
    }
  }

  private updateDecorations(): void {
    // Update decoration manager with current node views
    for (const [nodeId, view] of this.topicViews) {
      this.decorationManager.setNodeView(nodeId, view.group)
    }
  }

  updateRemoteCursors(cursors: Map<number, RemoteCursor>): void {
    this.collabCursorView?.updateCursors(cursors)
  }

  updateRemoteSelections(selections: Map<number, RemoteSelection>): void {
    this.collabSelectionView?.updateSelections(selections)
  }

  private calculateContentBounds(): Bounds | null {
    const bounds = this.layoutEngine.calculate(this.state.doc.root).bounds
    if (bounds.width === 0 && bounds.height === 0) return null
    return bounds
  }

  destroy(): void {
    this.layoutEngine.stopAnimation()
    this.decorationManager.clear()
    
    this.collabCursorView?.destroy()
    this.collabSelectionView?.destroy()

    for (const view of this.topicViews.values()) {
      view.destroy()
    }
    for (const view of this.connectionViews.values()) {
      view.destroy()
    }
    
    this.topicViews.clear()
    this.connectionViews.clear()
    this.viewportController.destroy()
    this.app.destroy()
  }
}
