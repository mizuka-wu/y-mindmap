import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'
import type { TopicNodeView } from '../topic-node-view'
import { styleManager } from '../../core/style-manager'
import { StyleKey, DEFAULT_CONNECTION_STYLE, TopicType } from '@y-mindmap/core'
import { BoundaryNodeView } from './boundary-node-view'
import { SummaryNodeView } from './summary-node-view'
import { ConnectionNodeView } from '../connection-node-view'
import { CollapseExpandNodeView } from '../interactions/interaction-node-views'
import { Easing, type EasingFunction } from '@y-mindmap/layout'

export type ChildType = 'attached' | 'detached' | 'summary' | 'callout'

export interface CollapseExpandConfig {
  duration: number
  easing: EasingFunction
}

const DEFAULT_COLLAPSE_CONFIG: CollapseExpandConfig = {
  duration: 200,
  easing: Easing.easeIn,
}

const DEFAULT_EXPAND_CONFIG: CollapseExpandConfig = {
  duration: 200,
  easing: Easing.easeOut,
}

export class BranchNodeView extends NodeView {
  private _structureClass: string = 'map'
  private _isCollapsed: boolean = false
  private _isCentralBranch: boolean = false
  private _direction: 'right' | 'left' | 'both' = 'both'
  private _topicView: TopicNodeView | null = null

  private _attachedChildren: BranchNodeView[] = []
  private _detachedChildren: BranchNodeView[] = []
  private _summaryChildren: BranchNodeView[] = []
  private _calloutChildren: BranchNodeView[] = []

  private _boundaries: BoundaryNodeView[] = []
  private _summaries: SummaryNodeView[] = []
  private _connectionView: ConnectionNodeView | null = null
  private _collapseButton: CollapseExpandNodeView | null = null

  private _eventListeners: Array<() => void> = []

  constructor(node: MindMapNode) {
    super(node)
  }

  protected initialize(): void {
    this._initConnectionView()
    this._initCollapseButton()
    this._initEventListeners()
  }

  private _initConnectionView(): void {
    this._connectionView = new ConnectionNodeView(this._node)
    this._connectionView.setParent(this)
    this.group.add(this._connectionView.group)
  }

  private _initCollapseButton(): void {
    this._collapseButton = new CollapseExpandNodeView(this._node)
    this._collapseButton.setParent(this)
    this._collapseButton.setCollapsed(this._isCollapsed)
    this.group.add(this._collapseButton.group)

    // Click handler: toggle collapse on click
    this._collapseButton.group.on('tap', () => {
      this.setCollapsed(!this._isCollapsed, true)
    })
  }

  private _initEventListeners(): void {
    const node = this._node
  }

  private _addEventListener(cleanup: () => void): void {
    this._eventListeners.push(cleanup)
  }

  protected calculatePreferredSize(): Size {
    let width = 0
    let height = 0

    const allChildren = this.getAllChildren()
    for (const child of allChildren) {
      const childSize = child.getPreferredSize()
      width = Math.max(width, childSize.width)
      height += childSize.height
    }

    return { width, height }
  }

  protected applyLayout(): void {
    let currentY = 0

    const allChildren = this.getAllChildren()
    for (const child of allChildren) {
      const childSize = child.getPreferredSize()
      child.setPosition({ x: 0, y: currentY })
      child.setSize(childSize)
      currentY += childSize.height
    }

    // Position collapse button at the right edge of topic view
    this._updateCollapseButtonPosition()
    this._updateCollapseButtonVisibility()
  }

  private _updateCollapseButtonPosition(): void {
    if (!this._collapseButton || !this._topicView) return
    const topicSize = this._topicView.getSize()
    const btnSize = { width: 16, height: 16 }
    // Position at the right edge of the topic, vertically centered
    const x = topicSize.width + 2
    const y = (topicSize.height - btnSize.height) / 2
    this._collapseButton.setPosition({ x, y })
    this._collapseButton.setSize(btnSize)
  }

  private _updateCollapseButtonVisibility(): void {
    if (!this._collapseButton) return
    const hasChildren = this._attachedChildren.length > 0 ||
      this._detachedChildren.length > 0
    this._collapseButton.setVisible(hasChildren)
    this._collapseButton.setCollapsed(this._isCollapsed)
  }

  protected applyPaint(): void {
  }

  protected updateStyle(): void {
    this.invalidateLayout()
  }

  getTopicView(): TopicNodeView | null {
    return this._topicView
  }

  setTopicView(topicView: TopicNodeView | null): void {
    if (this._topicView) {
      this._topicView.setOwningBranch(null)
    }
    this._topicView = topicView
    if (topicView) {
      topicView.setOwningBranch(this)
    }
  }

  getLineColor(): string {
    return styleManager.getStyleValueOrDefault(this, StyleKey.LINE_COLOR, DEFAULT_CONNECTION_STYLE.lineColor)
  }

  getLineWidth(): number {
    return styleManager.getStyleValueOrDefault(this, StyleKey.LINE_WIDTH, DEFAULT_CONNECTION_STYLE.lineWidth)
  }

  getLineClass(): string {
    return styleManager.getStyleValueOrDefault(this, StyleKey.LINE_CLASS, DEFAULT_CONNECTION_STYLE.lineClass ?? 'curve')
  }

  getLinePattern(): string {
    return styleManager.getStyleValueOrDefault(this, StyleKey.LINE_PATTERN, DEFAULT_CONNECTION_STYLE.lineStyle ?? 'solid')
  }

  isLineTapered(): boolean {
    return !!styleManager.getStyleValueOrDefault(this, StyleKey.LINE_TAPERED, DEFAULT_CONNECTION_STYLE.tapered ?? false)
  }

  refreshColorStyles(): void {
    this._topicView?.refreshColorStyles()

    for (const child of this._attachedChildren) {
      child.refreshColorStyles()
    }
    for (const child of this._detachedChildren) {
      child.refreshColorStyles()
    }
    for (const child of this._summaryChildren) {
      child.refreshColorStyles()
    }
    for (const child of this._calloutChildren) {
      child.refreshColorStyles()
    }

    for (const boundary of this._boundaries) {
      boundary.invalidatePaint()
    }
    for (const summary of this._summaries) {
      summary.invalidatePaint()
    }
    if (this._connectionView) {
      this._connectionView.invalidatePaint()
    }
  }

  getStructureClass(): string {
    return this._structureClass
  }

  setStructureClass(structureClass: string): void {
    if (this._structureClass === structureClass) return
    this._structureClass = structureClass
    this._onStructureChanged()
    this.invalidateLayout()
  }

  private _onStructureChanged(): void {
    const allChildren = this.getAllChildren()
    for (const child of allChildren) {
      child._onStructureChanged()
    }
  }

  isCollapsed(): boolean {
    return this._isCollapsed
  }

  async setCollapsed(collapsed: boolean, animate: boolean = true): Promise<void> {
    if (this._isCollapsed === collapsed) return
    this._isCollapsed = collapsed

    // Sync collapse button visual state
    this._collapseButton?.setCollapsed(collapsed)
    
    if (animate) {
      await this._animateCollapseExpand(collapsed)
    } else {
      this._updateChildrenVisibility()
    }
    this.invalidateLayout()
  }

  private async _animateCollapseExpand(collapsed: boolean): Promise<void> {
    const allChildren = this.getAllChildren()
    const config = collapsed ? DEFAULT_COLLAPSE_CONFIG : DEFAULT_EXPAND_CONFIG
    
    const animations: Promise<void>[] = []
    
    for (const child of allChildren) {
      if (collapsed) {
        animations.push(child.animateCollapse(config.duration))
      } else {
        animations.push(child.animateExpand(config.duration))
      }
    }
    
    await Promise.all(animations)
    
    if (!collapsed) {
      this._updateChildrenVisibility()
    }
  }

  isCentralBranch(): boolean {
    return this._isCentralBranch
  }

  setCentralBranch(isCentral: boolean): void {
    this._isCentralBranch = isCentral
  }

  private _updateChildrenVisibility(): void {
    const allChildren = this.getAllChildren()
    for (const child of allChildren) {
      child.setForcedInvisible(this._isCollapsed)
      if (this._isCollapsed) {
        child._updateChildrenVisibility()
      }
    }
  }

  shouldHide(): boolean {
    const parent = this.getParent()
    if (!parent) return true

    if (this.isCentralBranch()) return false

    if (!(parent instanceof BranchNodeView)) return false

    if (this.isCalloutBranch() && this.isInMatrix()) return true

    if ((this.isSummaryBranch() || this.isCalloutBranch()) &&
        parent.isTreeTableCell()) {
      return true
    }

    if (this.isSummaryBranch() && parent.isFishBoneHead()) return true

    if (parent.isCollapsed() && !this.isCalloutBranch()) return true

    return parent.shouldHide()
  }

  private isCalloutBranch(): boolean {
    return this._node.type === TopicType.CALLOUT
  }

  private isSummaryBranch(): boolean {
    return this._node.type === TopicType.SUMMARY
  }

  private isTreeTableCell(): boolean {
    return this._structureClass === 'org.xmind.ui.treetable'
  }

  private isFishBoneHead(): boolean {
    return this._structureClass.includes('fishbone')
  }

  private isInMatrix(): boolean {
    const parent = this.getParent()
    if (!(parent instanceof BranchNodeView)) return false
    return parent._structureClass === 'org.xmind.ui.spreadsheet' ||
           parent._structureClass === 'org.xmind.ui.columnspreadsheet'
  }

  getDirection(): 'right' | 'left' | 'both' {
    return this._direction
  }

  setDirection(direction: 'right' | 'left' | 'both'): void {
    if (this._direction === direction) return
    this._direction = direction
    this.invalidateLayout()
  }

  private _getChildList(type: ChildType): BranchNodeView[] {
    switch (type) {
      case 'attached':
        return this._attachedChildren
      case 'detached':
        return this._detachedChildren
      case 'summary':
        return this._summaryChildren
      case 'callout':
        return this._calloutChildren
      default:
        return this._attachedChildren
    }
  }

  private _setupChildBoundsListener(child: BranchNodeView): void {
  }

  getChildrenByType(type: ChildType): BranchNodeView[] {
    return [...this._getChildList(type)]
  }

  getAllChildren(): BranchNodeView[] {
    return [
      ...this._attachedChildren,
      ...this._detachedChildren,
      ...this._summaryChildren,
      ...this._calloutChildren,
    ]
  }

  getAttachedChildren(): BranchNodeView[] {
    return [...this._attachedChildren]
  }

  getDetachedChildren(): BranchNodeView[] {
    return [...this._detachedChildren]
  }

  getSummaryChildren(): BranchNodeView[] {
    return [...this._summaryChildren]
  }

  getCalloutChildren(): BranchNodeView[] {
    return [...this._calloutChildren]
  }

  getDescendantBranches(): BranchNodeView[] {
    const result: BranchNodeView[] = []
    const iter = (view: BranchNodeView) => {
      result.push(view)
      const children = view.getAllChildren()
      for (const child of children) {
        iter(child)
      }
    }
    iter(this)
    return result
  }

  getBoundaries(): BoundaryNodeView[] {
    return [...this._boundaries]
  }

  addBoundary(boundaryData: any): BoundaryNodeView {
    const boundaryNode = new BoundaryNodeView(boundaryData)
    boundaryNode.setParent(this)
    this._boundaries.push(boundaryNode)
    this.group.add(boundaryNode.group)
    this.invalidateLayout()
    return boundaryNode
  }

  removeBoundary(boundaryId: string): void {
    const index = this._boundaries.findIndex(b => b.nodeId === boundaryId)
    if (index === -1) return

    const boundary = this._boundaries[index]!
    boundary.setParent(null)
    this._boundaries.splice(index, 1)
    boundary.group.remove()
    this.invalidateLayout()
  }

  getSummaries(): SummaryNodeView[] {
    return [...this._summaries]
  }

  addSummary(summaryData: any): SummaryNodeView {
    const summaryNode = new SummaryNodeView(summaryData)
    summaryNode.setParent(this)
    this._summaries.push(summaryNode)
    this.group.add(summaryNode.group)
    this.invalidateLayout()
    return summaryNode
  }

  removeSummary(summaryId: string): void {
    const index = this._summaries.findIndex(s => s.nodeId === summaryId)
    if (index === -1) return

    const summary = this._summaries[index]!
    summary.setParent(null)
    this._summaries.splice(index, 1)
    summary.group.remove()
    this.invalidateLayout()
  }

  findSummaryView(childBranchView: BranchNodeView): SummaryNodeView | undefined {
    return this._summaries.find(s => s.getTopicId() === childBranchView.nodeId)
  }

  getConnectionView(): ConnectionNodeView | null {
    return this._connectionView
  }

  updateConnection(): void {
    if (this._connectionView) {
      this._connectionView.invalidateLayout()
    }
  }

  onNodeChanged(changeType: string, data?: any): void {
    switch (changeType) {
      case 'addTopic':
        this._handleAddTopic(data)
        break
      case 'removeTopic':
        this._handleRemoveTopic(data)
        break
      case 'changeStructureClass':
        this._handleChangeStructureClass(data)
        break
      case 'change:branch':
        this._handleChangeBranch(data)
        break
      case 'addBoundary':
        this.addBoundary(data)
        break
      case 'removeBoundary':
        this.removeBoundary(data?.boundaryId)
        break
      case 'addSummary':
        this.addSummary(data)
        break
      case 'removeSummary':
        this.removeSummary(data?.summaryId)
        break
      case 'moveChildTopic':
        this._handleMoveChildTopic(data)
        break
    }
  }

  private _handleAddTopic(data: { topic: MindMapNode; type?: ChildType }): void {
    const { topic, type = 'attached' } = data
    const childBranch = new BranchNodeView(topic)
    this.addChildBranch(childBranch, type)
    this.invalidateLayout()
  }

  private _handleRemoveTopic(data: { topicId: string; type?: ChildType }): void {
    const { topicId, type = 'attached' } = data
    const list = this._getChildList(type)
    const child = list.find(c => c.nodeId === topicId)
    if (child) {
      this.removeChildBranch(child, type)
      this.invalidateLayout()
    }
  }

  private _handleChangeStructureClass(data: { structureClass: string }): void {
    this.setStructureClass(data.structureClass)
  }

  private _handleChangeBranch(data: { collapsed: boolean }): void {
    this.setCollapsed(data.collapsed, true)
  }

  private _handleMoveChildTopic(data: { topicId: string; fromType: ChildType; toType: ChildType }): void {
    const { topicId, fromType, toType } = data
    const fromList = this._getChildList(fromType)
    const childIndex = fromList.findIndex(c => c.nodeId === topicId)
    if (childIndex === -1) return

    const child = fromList[childIndex]
    if (!child) return
    fromList.splice(childIndex, 1)
    const toList = this._getChildList(toType)
    toList.push(child)
    this.invalidateLayout()
  }

  addChildBranch(child: BranchNodeView, type: ChildType = 'attached', animate: boolean = false): void {
    const list = this._getChildList(type)
    if (list.includes(child)) return

    child.setParent(this)
    list.push(child)
    this.group.add(child.group)

    this._setupChildBoundsListener(child)
    
    if (animate) {
      child.animateExpand(200)
    }
    
    this.invalidateLayout()
  }

  removeChildBranch(child: BranchNodeView, type: ChildType, animate: boolean = false): void {
    const list = this._getChildList(type)
    const index = list.indexOf(child)
    if (index === -1) return

    const doRemove = () => {
      child.setParent(null)
      list.splice(index, 1)
      child.group.remove()
      this.invalidateLayout()
    }

    if (animate) {
      child.animateCollapse(200).then(doRemove)
    } else {
      doRemove()
    }
  }

  destroy(): void {
    for (const cleanup of this._eventListeners) {
      cleanup()
    }
    this._eventListeners = []

    for (const child of [...this._attachedChildren]) {
      child.destroy()
    }
    for (const child of [...this._detachedChildren]) {
      child.destroy()
    }
    for (const child of [...this._summaryChildren]) {
      child.destroy()
    }
    for (const child of [...this._calloutChildren]) {
      child.destroy()
    }
    this._attachedChildren = []
    this._detachedChildren = []
    this._summaryChildren = []
    this._calloutChildren = []

    for (const boundary of [...this._boundaries]) {
      boundary.destroy()
    }
    this._boundaries = []

    for (const summary of [...this._summaries]) {
      summary.destroy()
    }
    this._summaries = []

    if (this._connectionView) {
      this._connectionView.destroy()
      this._connectionView = null
    }

    this._topicView = null

    super.destroy()
  }
}

export default BranchNodeView
