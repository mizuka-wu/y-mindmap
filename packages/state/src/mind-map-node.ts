import { 
  TopicData, TopicType, StructureType, StyleData, Point, 
  MarkerData, NotesData, ImageData, ExtensionData, 
  AttachmentData, MathFormulaData, CodeBlockData, 
  AttributeTitle, AttributeTitleUnit, AttributeTitleStyle,
  isAttributeTitleEmpty, isRichAttributeTitle, 
  getPlainTextFromAttributeTitle, normalizeAttributeTitle,
  isEqualAttributeTitle, extractGlobalStyle,
  removeGlobalStyleFromAttributeTitle
} from '@y-mindmap/core'

export class MindMapNode {
  readonly id: string
  readonly title: string
  readonly attributeTitle: AttributeTitle | undefined
  readonly type: TopicType
  readonly style: StyleData | undefined
  readonly children: Record<string, MindMapNode[]>
  readonly markers: MarkerData[]
  readonly labels: string[]
  readonly notes: NotesData | undefined
  readonly image: ImageData | undefined
  readonly href: string | undefined
  readonly position: Point | undefined
  readonly structureClass: StructureType | undefined
  readonly branch: 'expanded' | 'folded' | undefined
  readonly attachments: AttachmentData[]
  readonly mathFormulas: MathFormulaData[]
  readonly codeBlocks: CodeBlockData[]

  constructor(data: TopicData) {
    this.id = data.id
    this.title = data.title
    this.attributeTitle = data.attributeTitle
    this.type = data.type as TopicType
    this.style = data.style
    this.children = {}
    this.markers = data.markers || []
    this.labels = data.labels || []
    this.notes = data.notes
    this.image = data.image
    this.href = data.href
    this.position = data.position
    this.structureClass = data.structureClass as StructureType | undefined
    this.branch = data.branch
    this.attachments = data.attachments || []
    this.mathFormulas = data.mathFormulas || []
    this.codeBlocks = data.codeBlocks || []

    if (data.children) {
      for (const [type, children] of Object.entries(data.children)) {
        this.children[type] = children.map(child => new MindMapNode(child))
      }
    }
  }

  get isRichTitle(): boolean {
    return isRichAttributeTitle(this.attributeTitle)
  }

  get displayTitle(): string {
    if (this.isRichTitle) {
      return getPlainTextFromAttributeTitle(this.attributeTitle)
    }
    return this.title
  }

  withAttributeTitle(attributeTitle: AttributeTitle | undefined): MindMapNode {
    const normalized = normalizeAttributeTitle(attributeTitle, this.title)
    return new MindMapNode({
      ...this.toData(),
      title: normalized.title,
      attributeTitle: normalized.attributeTitle,
    })
  }

  withTitle(title: string | AttributeTitle): MindMapNode {
    if (typeof title === 'string') {
      return new MindMapNode({
        ...this.toData(),
        title,
        attributeTitle: undefined,
      })
    }

    const normalized = normalizeAttributeTitle(title, this.title)
    return new MindMapNode({
      ...this.toData(),
      title: normalized.title,
      attributeTitle: normalized.attributeTitle,
    })
  }

  getAttributeTitleWithGlobalStyle(): { title: AttributeTitle | undefined; globalStyle: Partial<AttributeTitleStyle> | undefined } {
    if (!this.isRichTitle) {
      return { title: undefined, globalStyle: undefined }
    }

    const globalStyle = extractGlobalStyle(this.attributeTitle)
    if (globalStyle) {
      const cleanedTitle = removeGlobalStyleFromAttributeTitle(this.attributeTitle!, globalStyle)
      return { title: cleanedTitle, globalStyle }
    }

    return { title: this.attributeTitle, globalStyle: undefined }
  }

  withAttributeTitleAndGlobalStyle(
    attributeTitle: AttributeTitle | undefined,
    globalStyle: Partial<AttributeTitleStyle> | undefined
  ): MindMapNode {
    if (!attributeTitle || attributeTitle.length === 0) {
      return new MindMapNode({
        ...this.toData(),
        title: this.title,
        attributeTitle: undefined,
      })
    }

    let mergedTitle = [...attributeTitle]
    if (globalStyle) {
      mergedTitle = mergedTitle.map(unit => ({
        ...unit,
        ...globalStyle,
      }))
    }

    const normalized = normalizeAttributeTitle(mergedTitle, this.title)
    return new MindMapNode({
      ...this.toData(),
      title: normalized.title,
      attributeTitle: normalized.attributeTitle,
    })
  }

  hasAttributeTitleChanged(other: MindMapNode): boolean {
    return !isEqualAttributeTitle(this.attributeTitle, other.attributeTitle)
  }

  get attachedChildren(): MindMapNode[] {
    return this.children['attached'] || []
  }

  get detachedChildren(): MindMapNode[] {
    return this.children['detached'] || []
  }

  get summaryChildren(): MindMapNode[] {
    return this.children['summary'] || []
  }

  get calloutChildren(): MindMapNode[] {
    return this.children['callout'] || []
  }

  getAllChildren(): MindMapNode[] {
    const result: MindMapNode[] = []
    for (const children of Object.values(this.children)) {
      result.push(...children)
    }
    return result
  }

  descendants(fn: (node: MindMapNode) => void): void {
    fn(this)
    for (const child of this.getAllChildren()) {
      child.descendants(fn)
    }
  }

  findChild(id: string): MindMapNode | null {
    for (const children of Object.values(this.children)) {
      for (const child of children) {
        if (child.id === id) return child
        const found = child.findChild(id)
        if (found) return found
      }
    }
    return null
  }

  findDescendant(predicate: (node: MindMapNode) => boolean): MindMapNode | null {
    if (predicate(this)) return this
    for (const child of this.getAllChildren()) {
      const found = child.findDescendant(predicate)
      if (found) return found
    }
    return null
  }

  findAllDescendants(predicate: (node: MindMapNode) => boolean): MindMapNode[] {
    const result: MindMapNode[] = []
    this.descendants(node => {
      if (predicate(node)) result.push(node)
    })
    return result
  }

  addChild(child: MindMapNode, type: string = 'attached', index?: number): MindMapNode {
    const newChildren = { ...this.children }
    const list = [...(newChildren[type] || [])]
    if (index !== undefined && index >= 0 && index <= list.length) {
      list.splice(index, 0, child)
    } else {
      list.push(child)
    }
    newChildren[type] = list
    return this.withChildren(newChildren)
  }

  removeChild(childId: string): MindMapNode {
    const newChildren: Record<string, TopicData[]> = {}
    for (const [type, children] of Object.entries(this.children)) {
      newChildren[type] = children
        .filter(child => child.id !== childId)
        .map(child => child.toJSON())
    }
    return new MindMapNode({
      ...this.toData(),
      children: newChildren,
    })
  }

  updateChild(childId: string, updater: (child: MindMapNode) => MindMapNode): MindMapNode {
    const newChildren: Record<string, TopicData[]> = {}
    for (const [type, children] of Object.entries(this.children)) {
      newChildren[type] = children.map(child => {
        if (child.id === childId) {
          return updater(child).toJSON()
        }
        return child.toJSON()
      })
    }
    return new MindMapNode({
      ...this.toData(),
      children: newChildren,
    })
  }

  withStyle(style: StyleData | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      style,
    })
  }

  withBranch(branch: 'expanded' | 'folded'): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      branch,
    })
  }

  withPosition(position: Point | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      position,
    })
  }

  withStructureClass(structureClass: StructureType | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      structureClass,
    })
  }

  withChildren(children: Record<string, MindMapNode[]>): MindMapNode {
    const serialized: Record<string, TopicData[]> = {}
    for (const [type, nodes] of Object.entries(children)) {
      serialized[type] = nodes.map(node => node.toJSON())
    }
    return new MindMapNode({
      ...this.toData(),
      children: serialized,
    })
  }

  withMarkers(markers: MarkerData[]): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      markers,
    })
  }

  withLabels(labels: string[]): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      labels,
    })
  }

  withNotes(notes: NotesData | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      notes,
    })
  }

  withImage(image: ImageData | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      image,
    })
  }

  withHref(href: string | undefined): MindMapNode {
    return new MindMapNode({
      ...this.toData(),
      href,
    })
  }

  get isFolded(): boolean {
    return this.branch === 'folded'
  }

  get isExpanded(): boolean {
    return this.branch !== 'folded'
  }

  toggleFold(): MindMapNode {
    return this.withBranch(this.isFolded ? 'expanded' : 'folded')
  }

  fold(): MindMapNode {
    return this.withBranch('folded')
  }

  expand(): MindMapNode {
    return this.withBranch('expanded')
  }

  get isRoot(): boolean {
    return this.type === TopicType.ROOT
  }

  get isAttached(): boolean {
    return this.type === TopicType.ATTACHED
  }

  get isDetached(): boolean {
    return this.type === TopicType.DETACHED
  }

  get isSummary(): boolean {
    return this.type === TopicType.SUMMARY
  }

  get isCallout(): boolean {
    return this.type === TopicType.CALLOUT
  }

  get childCount(): number {
    return this.getAllChildren().length
  }

  get attachedChildCount(): number {
    return this.attachedChildren.length
  }

  get descendantCount(): number {
    let count = 0
    this.descendants(() => count++)
    return count
  }

  get hasChildren(): boolean {
    return this.getAllChildren().length > 0
  }

  toData(): TopicData {
    return {
      id: this.id,
      title: this.title,
      attributeTitle: this.attributeTitle,
      type: this.type,
      style: this.style,
      children: this.serializeChildren(this.children),
      markers: this.markers,
      labels: this.labels,
      notes: this.notes,
      image: this.image,
      href: this.href,
      position: this.position,
      structureClass: this.structureClass,
      branch: this.branch,
    }
  }

  toJSON(): TopicData {
    return this.toData()
  }

  private serializeChildren(children: Record<string, MindMapNode[]>): Record<string, TopicData[]> {
    const result: Record<string, TopicData[]> = {}
    for (const [type, nodes] of Object.entries(children)) {
      result[type] = nodes.map(node => node.toJSON())
    }
    return result
  }

  static fromJSON(data: TopicData): MindMapNode {
    return new MindMapNode(data)
  }

  static createEmpty(): MindMapNode {
    return new MindMapNode({
      id: crypto.randomUUID(),
      title: 'New Topic',
      type: TopicType.ATTACHED,
    })
  }

  static create(title: string): MindMapNode {
    return new MindMapNode({
      id: crypto.randomUUID(),
      title,
      type: TopicType.ATTACHED,
    })
  }
}
