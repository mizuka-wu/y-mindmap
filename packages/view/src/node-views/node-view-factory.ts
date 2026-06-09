import type { MindMapNode, ConnectionLayout, MarkerData, ImageData, RelationshipData } from '@y-mindmap/state'
import type { StyleData } from '@y-mindmap/core'
import { DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import { NodeView } from '../core/node-view'
import { TopicNodeView } from './topic-node-view'
import { ConnectionNodeView } from './connection-node-view'
import { TitleNodeView } from './components/title-node-view'
import { NumberingNodeView } from './components/numbering-node-view'
import { MarkerNodeView, MarkersNodeView } from './components/marker-node-view'
import { ImageNodeView } from './components/image-node-view'
import { InformationNodeView } from './components/information-node-view'
import { LabelNodeView, LabelsNodeView } from './components/label-node-view'
import { MathJaxNodeView } from './components/mathjax-node-view'
import { BranchNodeView } from './containers/branch-node-view'
import { BoundaryNodeView } from './containers/boundary-node-view'
import { SelectBoxNodeView, ResizeBoxNodeView, CollapseExpandNodeView } from './interactions/interaction-node-views'
import { RelationshipNodeView, RelationshipTitleNodeView } from './relationships/relationship-node-view'
import { MatrixNodeView, MatrixCellNodeView, TreeTableCellNodeView } from './special/special-node-views'
import { FishBoneHeadLineNodeView, FishBoneMainLineNodeView, TimelineMainLineNodeView } from './special/fishbone-timeline-node-views'
import { PlaceholderTopicNodeView, SheetNodeView } from './advanced/advanced-node-views'

export enum NodeViewType {
  TOPIC = 'topic',
  CONNECTION = 'connection',
  TITLE = 'title',
  NUMBERING = 'numbering',
  MARKER = 'marker',
  MARKERS = 'markers',
  IMAGE = 'image',
  INFORMATION = 'information',
  LABEL = 'label',
  LABELS = 'labels',
  BRANCH = 'branch',
  BOUNDARY = 'boundary',
  SELECT_BOX = 'select-box',
  RESIZE_BOX = 'resize-box',
  COLLAPSE_EXPAND = 'collapse-expand',
  RELATIONSHIP = 'relationship',
  RELATIONSHIP_TITLE = 'relationship-title',
  MATRIX = 'matrix',
  MATRIX_CELL = 'matrix-cell',
  TREE_TABLE_CELL = 'tree-table-cell',
  FISHBONE_HEAD_LINE = 'fishbone-head-line',
  FISHBONE_MAIN_LINE = 'fishbone-main-line',
  TIMELINE_MAIN_LINE = 'timeline-main-line',
  MATH_JAX = 'math-jax',
  PLACEHOLDER_TOPIC = 'placeholder-topic',
  SHEET = 'sheet',
}

export class NodeViewFactory {
  private viewCaches: Map<NodeViewType, Map<string, NodeView>> = new Map()
  private _disposedViews: WeakSet<NodeView> = new WeakSet()
  
  constructor() {
    for (const type of Object.values(NodeViewType)) {
      this.viewCaches.set(type, new Map())
    }
  }
  
  createTopicView(node: MindMapNode): TopicNodeView {
    return this.getOrCreate(NodeViewType.TOPIC, node.id, () => new TopicNodeView(node)) as TopicNodeView
  }
  
  getOrCreateTopicView(node: MindMapNode): TopicNodeView {
    const existing = this.getView(NodeViewType.TOPIC, node.id) as TopicNodeView | undefined
    if (existing) {
      existing.updateNode(node)
      return existing
    }
    return this.createTopicView(node)
  }
  
  getTopicView(nodeId: string): TopicNodeView | undefined {
    return this.getView(NodeViewType.TOPIC, nodeId) as TopicNodeView | undefined
  }
  
  getAllTopicViews(): Map<string, TopicNodeView> {
    return this.viewCaches.get(NodeViewType.TOPIC) as Map<string, TopicNodeView>
  }
  
  createConnectionView(connectionId: string, layout: ConnectionLayout): ConnectionNodeView {
    return this.getOrCreate(NodeViewType.CONNECTION, connectionId, () => {
      const view = new ConnectionNodeView({ id: connectionId } as MindMapNode)
      view.updateConnectionLayout(layout)
      return view
    }) as ConnectionNodeView
  }
  
  getConnectionView(connectionId: string): ConnectionNodeView | undefined {
    return this.getView(NodeViewType.CONNECTION, connectionId) as ConnectionNodeView | undefined
  }
  
  createTitleView(node: MindMapNode, text: string): TitleNodeView {
    return this.getOrCreate(NodeViewType.TITLE, node.id, () => new TitleNodeView(node, text)) as TitleNodeView
  }
  
  createNumberingView(node: MindMapNode, text: string, level: number): NumberingNodeView {
    return this.getOrCreate(NodeViewType.NUMBERING, node.id, () => new NumberingNodeView(node, text, level)) as NumberingNodeView
  }
  
  createMarkerView(node: MindMapNode, markerData: MarkerData): MarkerNodeView {
    const key = `${node.id}-${markerData.markerId}`
    return this.getOrCreate(NodeViewType.MARKER, key, () => new MarkerNodeView(node, markerData)) as MarkerNodeView
  }
  
  createMarkersView(node: MindMapNode, markers: MarkerData[]): MarkersNodeView {
    return this.getOrCreate(NodeViewType.MARKERS, node.id, () => new MarkersNodeView(node, markers)) as MarkersNodeView
  }
  
  createImageView(node: MindMapNode, imageData: ImageData): ImageNodeView {
    return this.getOrCreate(NodeViewType.IMAGE, node.id, () => new ImageNodeView(node, imageData)) as ImageNodeView
  }
  
  createInformationView(node: MindMapNode, iconType: string): InformationNodeView {
    return this.getOrCreate(NodeViewType.INFORMATION, node.id, () => new InformationNodeView(node, iconType)) as InformationNodeView
  }
  
  createLabelView(node: MindMapNode, text: string): LabelNodeView {
    const key = `${node.id}-${text}`
    return this.getOrCreate(NodeViewType.LABEL, key, () => new LabelNodeView(node, text)) as LabelNodeView
  }
  
  createLabelsView(node: MindMapNode, labels: string[]): LabelsNodeView {
    return this.getOrCreate(NodeViewType.LABELS, node.id, () => new LabelsNodeView(node, labels)) as LabelsNodeView
  }
  
  createBranchView(node: MindMapNode): BranchNodeView {
    return this.getOrCreate(NodeViewType.BRANCH, node.id, () => new BranchNodeView(node)) as BranchNodeView
  }
  
  createBoundaryView(node: MindMapNode): BoundaryNodeView {
    return this.getOrCreate(NodeViewType.BOUNDARY, node.id, () => new BoundaryNodeView(node)) as BoundaryNodeView
  }
  
  createSelectBoxView(node: MindMapNode): SelectBoxNodeView {
    return this.getOrCreate(NodeViewType.SELECT_BOX, node.id, () => new SelectBoxNodeView(node)) as SelectBoxNodeView
  }
  
  createResizeBoxView(node: MindMapNode): ResizeBoxNodeView {
    return this.getOrCreate(NodeViewType.RESIZE_BOX, node.id, () => new ResizeBoxNodeView(node)) as ResizeBoxNodeView
  }
  
  createCollapseExpandView(node: MindMapNode): CollapseExpandNodeView {
    return this.getOrCreate(NodeViewType.COLLAPSE_EXPAND, node.id, () => new CollapseExpandNodeView(node)) as CollapseExpandNodeView
  }
  
  createRelationshipView(node: MindMapNode, data: RelationshipData): RelationshipNodeView {
    return this.getOrCreate(NodeViewType.RELATIONSHIP, node.id, () => new RelationshipNodeView(node, data)) as RelationshipNodeView
  }
  
  createRelationshipTitleView(node: MindMapNode, text: string): RelationshipTitleNodeView {
    return this.getOrCreate(NodeViewType.RELATIONSHIP_TITLE, node.id, () => new RelationshipTitleNodeView(node, text)) as RelationshipTitleNodeView
  }
  
  createMatrixView(node: MindMapNode, rows: number, columns: number): MatrixNodeView {
    return this.getOrCreate(NodeViewType.MATRIX, node.id, () => new MatrixNodeView(node, rows, columns)) as MatrixNodeView
  }
  
  createMatrixCellView(node: MindMapNode, row: number, column: number): MatrixCellNodeView {
    const key = `${node.id}-${row}-${column}`
    return this.getOrCreate(NodeViewType.MATRIX_CELL, key, () => new MatrixCellNodeView(node, row, column)) as MatrixCellNodeView
  }
  
  createTreeTableCellView(node: MindMapNode, text: string, isHeader: boolean): TreeTableCellNodeView {
    return this.getOrCreate(NodeViewType.TREE_TABLE_CELL, node.id, () => new TreeTableCellNodeView(node, text, isHeader)) as TreeTableCellNodeView
  }
  
  createFishBoneHeadLineView(node: MindMapNode): FishBoneHeadLineNodeView {
    return this.getOrCreate(NodeViewType.FISHBONE_HEAD_LINE, node.id, () => new FishBoneHeadLineNodeView(node)) as FishBoneHeadLineNodeView
  }
  
  createFishBoneMainLineView(node: MindMapNode): FishBoneMainLineNodeView {
    return this.getOrCreate(NodeViewType.FISHBONE_MAIN_LINE, node.id, () => new FishBoneMainLineNodeView(node)) as FishBoneMainLineNodeView
  }
  
  createTimelineMainLineView(node: MindMapNode): TimelineMainLineNodeView {
    return this.getOrCreate(NodeViewType.TIMELINE_MAIN_LINE, node.id, () => new TimelineMainLineNodeView(node)) as TimelineMainLineNodeView
  }
  
  createMathJaxView(node: MindMapNode, latex: string): MathJaxNodeView {
    return this.getOrCreate(NodeViewType.MATH_JAX, node.id, () => new MathJaxNodeView(node, latex)) as MathJaxNodeView
  }
  
  createPlaceholderTopicView(node: MindMapNode): PlaceholderTopicNodeView {
    return this.getOrCreate(NodeViewType.PLACEHOLDER_TOPIC, node.id, () => new PlaceholderTopicNodeView(node)) as PlaceholderTopicNodeView
  }
  
  createSheetView(node: MindMapNode): SheetNodeView {
    return this.getOrCreate(NodeViewType.SHEET, node.id, () => new SheetNodeView(node)) as SheetNodeView
  }
  
  private getOrCreate(type: NodeViewType, key: string, factory: () => NodeView): NodeView {
    const cache = this.viewCaches.get(type)!
    const existing = cache.get(key)
    if (existing) {
      return existing
    }
    
    const view = factory()
    cache.set(key, view)
    return view
  }
  
  getView(type: NodeViewType, key: string): NodeView | undefined {
    return this.viewCaches.get(type)?.get(key)
  }
  
  removeView(type: NodeViewType, key: string): void {
    const cache = this.viewCaches.get(type)
    if (!cache) return
    
    const view = cache.get(key)
    if (view) {
      this._disposedViews.add(view)
      view.destroy()
      cache.delete(key)
    }
  }
  
  clear(): void {
    for (const cache of this.viewCaches.values()) {
      for (const view of cache.values()) {
        this._disposedViews.add(view)
        view.destroy()
      }
      cache.clear()
    }
  }
  
  clearByType(type: NodeViewType): void {
    const cache = this.viewCaches.get(type)
    if (!cache) return
    
    for (const view of cache.values()) {
      this._disposedViews.add(view)
      view.destroy()
    }
    cache.clear()
  }
  
  cleanupDisposedViews(): void {
    for (const [type, cache] of this.viewCaches) {
      for (const [key, view] of cache) {
        if (view.isDisposed()) {
          cache.delete(key)
        }
      }
    }
  }
  
  getViewCount(type?: NodeViewType): number {
    if (type) {
      return this.viewCaches.get(type)?.size || 0
    }
    
    let total = 0
    for (const cache of this.viewCaches.values()) {
      total += cache.size
    }
    return total
  }
  
  getAllViews(): NodeView[] {
    const views: NodeView[] = []
    for (const cache of this.viewCaches.values()) {
      for (const view of cache.values()) {
        views.push(view)
      }
    }
    return views
  }
  
  getViewsByType(type: NodeViewType): NodeView[] {
    const cache = this.viewCaches.get(type)
    if (!cache) return []
    return Array.from(cache.values())
  }
  
  removeViewsByNodeId(nodeId: string): void {
    for (const [type, cache] of this.viewCaches) {
      const keysToDelete: string[] = []
      
      for (const [key, view] of cache) {
        if (key === nodeId || key.startsWith(`${nodeId}-`)) {
          this._disposedViews.add(view)
          view.destroy()
          keysToDelete.push(key)
        }
      }
      
      for (const key of keysToDelete) {
        cache.delete(key)
      }
    }
  }
  
  hasView(type: NodeViewType, key: string): boolean {
    return this.viewCaches.get(type)?.has(key) ?? false
  }
}

export default NodeViewFactory
