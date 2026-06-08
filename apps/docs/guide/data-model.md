# 数据模型

## 核心类型

### TopicData

节点数据结构：

```typescript
interface TopicData {
  id: string
  title: string
  attributeTitle?: AttributeTitle  // 富文本标题
  type: TopicType
  style?: StyleData
  children?: Record<string, TopicData[]>
  markers?: MarkerData[]
  labels?: string[]
  notes?: NotesData
  image?: ImageData
  href?: string
  position?: Point
  structureClass?: StructureType
  branch?: 'expanded' | 'folded'
}
```

### TopicType

```typescript
enum TopicType {
  ROOT = 'root',           // 根节点
  ATTACHED = 'attached',   // 子节点
  DETACHED = 'detached',   // 浮动节点
  SUMMARY = 'summary',     // 摘要节点
  CALLOUT = 'callout',     // 标注节点
}
```

### StructureType

```typescript
enum StructureType {
  MAP = 'org.xmind.ui.map',
  LOGIC_RIGHT = 'org.xmind.ui.logic.right',
  LOGIC_LEFT = 'org.xmind.ui.logic.left',
  TREE_RIGHT = 'org.xmind.ui.tree.right',
  TREE_LEFT = 'org.xmind.ui.tree.left',
  ORG_CHART_DOWN = 'org.xmind.ui.org-chart.down',
  // ... 更多布局
}
```

## MindMapNode

不可变节点类：

```typescript
class MindMapNode {
  readonly id: string
  readonly title: string
  readonly attributeTitle: AttributeTitle | undefined
  readonly type: TopicType
  readonly style: StyleData | undefined
  readonly children: Record<string, MindMapNode[]>
  readonly markers: MarkerData[]
  readonly labels: string[]
  
  // 只读属性
  get isRichTitle(): boolean
  get displayTitle(): string
  get hasChildren(): boolean
  get attachedChildren(): MindMapNode[]
  
  // 不可变更新
  withTitle(title: string): MindMapNode
  withAttributeTitle(title: AttributeTitle): MindMapNode
  withStyle(style: StyleData): MindMapNode
  withMarkers(markers: MarkerData[]): MindMapNode
  withLabels(labels: string[]): MindMapNode
  
  // 树操作
  descendants(fn: (node: MindMapNode) => void): void
  findDescendant(predicate: (node: MindMapNode) => boolean): MindMapNode | null
  findAllDescendants(predicate: (node: MindMapNode) => boolean): MindMapNode[]
  
  // 序列化
  toJSON(): TopicData
}
```

## MindMapDocument

文档管理：

```typescript
class MindMapDocument {
  readonly root: MindMapNode
  
  // 节点查询
  getNodeById(id: string): MindMapNode | null
  getNodesByType(type: TopicType): MindMapNode[]
  findNodes(predicate: (node: MindMapNode) => boolean): MindMapNode[]
  
  // 不可变更新
  updateNode(id: string, updater: (node: MindMapNode) => MindMapNode): MindMapDocument
  addNode(parentId: string, child: MindMapNode): MindMapDocument
  removeNode(id: string): MindMapDocument
  moveNode(nodeId: string, newParentId: string): MindMapDocument
  
  // 序列化
  toJSON(): TopicData
  static fromJSON(data: TopicData): MindMapDocument
}
```

## Selection

选择状态：

```typescript
class Selection {
  readonly selectedIds: Set<string>
  
  get all(): string[]
  get first(): string | null
  get last(): string | null
  get count(): number
  
  isSelected(nodeId: string): boolean
  select(nodeId: string): Selection
  deselect(nodeId: string): Selection
  toggle(nodeId: string): Selection
  clear(): Selection
}
```

## Transaction

事务更新：

```typescript
class Transaction {
  updateNode(id: string, updater: (node: MindMapNode) => MindMapNode): Transaction
  setSelection(selection: Selection): Transaction
  
  // 批量操作
  batch(operations: (() => void)[]): Transaction
}
```
