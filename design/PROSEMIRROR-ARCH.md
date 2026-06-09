# ProseMirror 风格架构设计 - Y-MindMap

> 参考 ProseMirror 的分层架构，为思维导图编辑器设计的完整架构方案

---

## 一、ProseMirror 核心架构分析

### 1.1 分层结构

```
prosemirror-model        → 数据模型 (Node, Fragment, Slice, Mark, Schema)
prosemirror-state        → 状态管理 (EditorState, Transaction, Selection, Plugin)
prosemirror-transform    → 变更系统 (Transform, Step, Mapping)
prosemirror-view         → 视图渲染 (EditorView, Decoration)
prosemirror-commands     → 命令系统
prosemirror-history      → 撤销重做
prosemirror-collab       → 协同编辑
prosemirror-keymap       → 快捷键
prosemirror-inputrules   → 输入规则
prosemirror-dropcursor   → 拖拽光标
prosemirror-gapcursor    → 间隙光标
```

### 1.2 核心设计原则

1. **不可变性**: 所有数据结构都是不可变的，变更产生新对象
2. **Schema 驱动**: 文档结构由 Schema 定义，所有操作都经过 Schema 验证
3. **Transaction 组合**: 多个 Step 组合成一个 Transaction，原子性应用
4. **Position Mapping**: 位置在变更后自动映射到新位置
5. **Plugin 系统**: 通过 Plugin 扩展状态和行为，不修改核心代码
6. **Command 模式**: 所有用户操作都是 Command 函数

---

## 二、Y-MindMap 包结构

```
@y-mindmap/
├── model/              # prosemirror-model 等价
│   ├── node.ts         # MindMapNode - 节点数据模型
│   ├── fragment.ts     # Fragment - 子节点序列
│   ├── slice.ts        # Slice - 文档片段 (剪贴板)
│   ├── mark.ts         # Mark - 节点标记 (优先级、图标等)
│   ├── schema.ts       # Schema - 文档结构定义
│   ├── content.ts      # ContentMatch - 内容表达式匹配
│   ├── resolved-pos.ts # ResolvedPos - 带上下文的位置
│   └── replace.ts      # ReplaceStep 相关
│
├── state/              # prosemirror-state 等价
│   ├── editor-state.ts # EditorState - 不可变状态快照
│   ├── transaction.ts  # Transaction - 变更事务
│   ├── selection.ts    # Selection - 选择抽象
│   ├── plugin.ts       # Plugin - 插件系统
│   └── node-selection.ts # NodeSelection - 节点选择
│
├── transform/          # prosemirror-transform 等价
│   ├── transform.ts    # Transform - 变换基类
│   ├── step.ts         # Step - 原子变更
│   ├── step-result.ts  # StepResult - 步骤结果
│   ├── mapping.ts      # Mapping - 位置映射
│   └── steps/          # 具体步骤类型
│       ├── add-mark.ts
│       ├── remove-mark.ts
│       ├── replace.ts
│       ├── move-node.ts
│       └── change-attr.ts
│
├── view/               # prosemirror-view 等价
│   ├── editor-view.ts  # EditorView - 视图管理器
│   ├── decoration.ts   # Decoration - 装饰器
│   └── input.ts        # 输入处理
│
├── commands/           # prosemirror-commands 等价
│   ├── commands.ts     # 命令定义
│   └── chain.ts        # 命令链
│
├── history/            # prosemirror-history 等价
│   ├── history.ts      # 历史管理
│   └── gap-map.ts      # 间隙映射
│
├── collab/             # prosemirror-collab 等价
│   ├── collab.ts       # 协同编辑
│   └── rebase.ts       # 变基算法
│
├── keymap/             # 快捷键映射
├── input-rules/        # 输入规则
└── yjs/                # Yjs 集成
```

---

## 三、Model 层设计

### 3.1 Schema - 文档结构定义

```typescript
// @y-mindmap/model/schema.ts

interface NodeSpec {
  // 节点属性定义
  attrs?: Record<string, AttributeSpec>
  
  // 内容表达式 (定义子节点规则)
  content?: string
  
  // 标记允许
  marks?: string
  
  // 分组 (用于内容表达式引用)
  group?: string
  
  // 是否为内联节点
  inline?: boolean
  
  // 是否为原子节点 (不可编辑)
  atom?: boolean
  
  // 叶子节点 (无子节点)
  leaf?: boolean
  
  // 选择行为
  selectable?: boolean
  draggable?: boolean
  
  // 定义属性
  defining?: boolean
  
  // 序列化/反序列化
  toDOM?: (node: MindMapNode) => DOMOutputSpec
  parseDOM?: ParseRule[]
  
  // 代码节点
  code?: boolean
}

interface MarkSpec {
  attrs?: Record<string, AttributeSpec>
  inclusive?: boolean
  spanning?: boolean
  toDOM?: (mark: Mark) => DOMOutputSpec
  parseDOM?: ParseRule[]
}

interface SchemaSpec {
  nodes: Record<string, NodeSpec>
  marks?: Record<string, MarkSpec>
  topNode?: string
}

class Schema {
  spec: SchemaSpec
  nodes: NodeType[]
  marks: MarkType[]
  
  constructor(spec: SchemaSpec) {
    // 编译 spec，创建 NodeType 和 MarkType
    // 验证内容表达式
    // 构建节点和标记的查找表
  }
  
  node(type: string | NodeType, attrs?: Record<string, any>, content?: Fragment, marks?: Mark[]): MindMapNode
  text(text: string, marks?: Mark[]): MindMapNode
  mark(type: string | MarkType, attrs?: Record<string, any>): Mark
}
```

**思维导图 Schema 定义示例**:

```typescript
const mindmapSchema = new Schema({
  nodes: {
    // 文档根节点
    doc: {
      content: 'topic+',
      attrs: {
        title: { default: '' },
        theme: { default: null },
      }
    },
    
    // 主题节点
    topic: {
      content: '(topic | boundary | summary)*',
      group: 'topic',
      attrs: {
        id: { default: '' },
        title: { default: '' },
        structureClass: { default: 'org.xmind.ui.map' },
        branch: { default: 'expanded' },  // 'expanded' | 'folded'
        position: { default: null },       // { x, y } for floating topics
        style: { default: {} },
        markers: { default: [] },
        labels: { default: [] },
        notes: { default: null },
        image: { default: null },
        href: { default: null },
        numbering: { default: null },
        extensions: { default: [] },
      },
      defining: true,       // 变更时保留此节点
      selectable: true,
      draggable: true,
    },
    
    // 边界
    boundary: {
      group: 'boundary',
      attrs: {
        id: { default: '' },
        title: { default: '' },
        range: { default: '' },      // '(0,3)'
        style: { default: {} },
      },
      atom: true,
      selectable: true,
    },
    
    // 摘要
    summary: {
      group: 'summary',
      attrs: {
        id: { default: '' },
        range: { default: '' },
        topicId: { default: '' },
        style: { default: {} },
      },
      atom: true,
      selectable: true,
    },
    
    // 关系线
    relationship: {
      group: 'relationship',
      attrs: {
        id: { default: '' },
        end1Id: { default: '' },
        end2Id: { default: '' },
        controlPoints: { default: {} },
        style: { default: {} },
      },
      atom: true,
      selectable: true,
      draggable: true,
    },
  },
  
  marks: {
    // 标记 (优先级、旗帜等)
    marker: {
      attrs: {
        markerId: { default: '' },
      },
    },
    
    // 样式覆盖
    style: {
      attrs: {
        properties: { default: {} },
      },
      inclusive: false,
    },
  },
  
  topNode: 'doc',
})
```

### 3.2 MindMapNode - 节点模型

```typescript
// @y-mindmap/model/node.ts

class MindMapNode {
  readonly type: NodeType
  readonly attrs: Record<string, any>
  readonly content: Fragment
  readonly marks: Mark[]
  
  // 只读属性
  get nodeSize(): number
  get childCount(): number
  get textContent(): string
  get isBlock(): boolean
  get isInline(): boolean
  get isLeaf(): boolean
  get isText(): boolean
  get isAtom(): boolean
  
  // 子节点访问
  child(index: number): MindMapNode
  maybeChild(index: number): MindMapNode | null
  forEach(fn: (node: MindMapNode, offset: number, index: number) => void): void
  
  // 节点查找
  nodesBetween(
    from: number,
    to: number,
    fn: (node: MindMapNode, pos: number, parent: MindMapNode, index: number) => boolean | void,
    startPos?: number
  ): void
  
  // 属性操作 (返回新节点)
  copy(content?: Fragment): MindMapNode
  mark(marks: Mark[]): MindMapNode
  
  // 序列化
  toJSON(): Record<string, any>
  static fromJSON(schema: Schema, json: Record<string, any>): MindMapNode
  
  // 相等性比较
  eq(other: MindMapNode): boolean
  
  // 检查内容是否匹配
  check(): void
  
  // 同级节点操作 (思维导图扩展)
  get index(): number
  get parent(): MindMapNode | null
  get path(): MindMapNode[]
  get depth(): number
  
  // 子节点操作 (返回新节点)
  addChild(child: MindMapNode, index?: number): MindMapNode
  removeChild(index: number): MindMapNode
  replaceChild(index: number, child: MindMapNode): MindMapNode
  
  // 批量子节点操作
  withChildren(children: Fragment): MindMapNode
  
  // 标记操作
  addMark(mark: Mark): MindMapNode
  removeMark(mark: Mark): MindMapNode
  
  // 查询
  descendants(fn: (node: MindMapNode) => boolean): MindMapNode[]
  get children(): MindMapNode[]
}
```

### 3.3 Fragment - 子节点序列

```typescript
// @y-mindmap/model/fragment.ts

class Fragment {
  readonly content: MindMapNode[]
  readonly size: number
  
  constructor(content: MindMapNode[], size?: number)
  
  // 访问
  get childCount(): number
  child(index: number): MindMapNode
  maybeChild(index: number): MindMapNode | null
  forEach(fn: (node: MindMapNode, offset: number, index: number) => void): void
  
  // 查找
  findDiffStart(other: Fragment): number | null
  findDiffEnd(other: Fragment): { a: number; b: number } | null
  
  // 操作 (返回新 Fragment)
  replace(index: number, remove: number, insert?: Fragment): Fragment
  append(other: Fragment): Fragment
  cut(from: number, to?: number): Fragment
  
  // 静态方法
  static empty: Fragment
  static from(nodes: MindMapNode | MindMapNode[] | Fragment): Fragment
  
  // 序列化
  toJSON(): any[]
  static fromJSON(schema: Schema, value: any[]): Fragment
  
  // 相等性
  eq(other: Fragment): boolean
}
```

### 3.4 Slice - 文档片段

```typescript
// @y-mindmap/model/slice.ts

class Slice {
  readonly content: Fragment
  readonly openStart: number  // 开放深度 (左)
  readonly openEnd: number    // 开放深度 (右)
  
  constructor(content: Fragment, openStart: number, openEnd: number)
  
  get size(): number
  
  // 插入到文档
  insertAt(pos: number, fragment: Fragment): Slice | null
  
  // 移除内容
  removeBetween(from: number, to: number): Slice
  
  // 相等性
  eq(other: Slice): boolean
  
  // 空 Slice
  static empty: Slice
}
```

### 3.5 Mark - 节点标记

```typescript
// @y-mindmap/model/mark.ts

class Mark {
  readonly type: MarkType
  readonly attrs: Record<string, any>
  
  // 相等性
  eq(other: Mark): boolean
  
  // 属性修改
  addToSet(marks: Mark[]): Mark[]
  removeFromSet(marks: Mark[]): Mark[]
  isInSet(marks: Mark[]): boolean
  
  // 序列化
  toJSON(): Record<string, any>
  static fromJSON(schema: Schema, json: Record<string, any>): Mark
}

class MarkType {
  name: string
  schema: Schema
  spec: MarkType
  
  create(attrs?: Record<string, any>): Mark
  removeFromSet(marks: Mark[]): Mark[]
  isInSet(marks: Mark[]): boolean
}
```

### 3.6 ResolvedPos - 带上下文的位置

```typescript
// @y-mindmap/model/resolved-pos.ts

class ResolvedPos {
  readonly pos: number
  readonly depth: number
  readonly parent: MindMapNode
  
  // 路径信息
  path: Array<{ node: MindMapNode, index: number, offset: number }>
  
  // 节点信息
  node(depth?: number): MindMapNode
  index(depth?: number): number
  start(depth?: number): number
  end(depth?: number): number
  before(depth?: number): number
  after(depth?: number): number
  
  // 标记
  marks(): Mark[]
  marksAcross(other: ResolvedPos): Mark[] | null
  
  // 共享深度
  sharedDepth(pos: number): number
  
  // 块范围
  blockRange(other?: ResolvedPos, pred?: (node: MindMapNode) => boolean): NodeRange | null
}

class NodeRange {
  readonly $from: ResolvedPos
  readonly $to: ResolvedPos
  readonly depth: number
  
  get start(): number
  get end(): number
  get parent(): MindMapNode
  get startIndex(): number
  get endIndex(): number
}
```

### 3.7 ContentMatch - 内容表达式匹配

```typescript
// @y-mindmap/model/content.ts

class ContentMatch {
  readonly validEnd: boolean
  
  // 匹配节点
  matchType(type: NodeType): ContentMatch | null
  matchFragment(frag: Fragment, from?: number, to?: number): ContentMatch | null
  
  // 允许的类型
  validType(type: NodeType): boolean
  get allowsMark(): boolean
  
  // 找到填充匹配
  fillBefore(after: Fragment, toEnd?: boolean, startIndex?: number): Fragment | null
  
  // 找到匹配的结束
  findWrapping(target: NodeType): NodeType[] | null
}
```

---

## 四、State 层设计

### 4.1 EditorState - 不可变状态快照

```typescript
// @y-mindmap/state/editor-state.ts

class EditorState {
  readonly schema: Schema
  readonly doc: MindMapNode
  readonly selection: Selection
  readonly storedMarks: Mark[] | null
  readonly plugins: Plugin[]
  
  // 插件状态
  pluginStates: Map<Plugin, any>
  
  // 配置
  configuration: Record<string, any>
  
  constructor(config: {
    schema: Schema
    doc: MindMapNode
    selection?: Selection
    storedMarks?: Mark[] | null
    plugins?: Plugin[]
    configuration?: Record<string, any>
  })
  
  // 创建新状态 (不可变)
  apply(tr: Transaction): EditorState
  
  // 创建 Transaction
  get tr(): Transaction
  
  // 插件状态
  plugin<T>(plugin: Plugin<T>): T
  
  // 查询
  toJSON(): Record<string, any>
  static fromJSON(config: {
    schema: Schema
    doc: MindMapNode
    plugins?: Plugin[]
    configuration?: Record<string, any>
  }, json: Record<string, any>): EditorState
  
  // 创建带默认值的状态
  static create(config: {
    schema: Schema
    doc?: MindMapNode
    plugins?: Plugin[]
    configuration?: Record<string, any>
  }): EditorState
}
```

### 4.2 Transaction - 变更事务

```typescript
// @y-mindmap/state/transaction.ts

class Transaction extends Transform {
  // 选择
  selection: Selection
  
  // 存储的标记 (下一个输入的标记)
  storedMarks: Mark[] | null
  
  // 元数据
  metadata: Map<string, any>
  
  // 是否为胶合事务 (用于历史分组)
  isGeneric: boolean
  
  // 文档变更后设置选择
  setSelection(selection: Selection): this
  
  // 替换选择
  replaceSelection(slice: Slice): this
  replaceSelectionWith(node: MindMapNode): this
  deleteSelection(): this
  
  // 插入
  insertText(text: string, from?: number, to?: number): this
  insert(pos: number, nodes: MindMapNode | MindMapNode[]): this
  
  // 标记操作
  addMark(from: number, to: number, mark: Mark): this
  removeMark(from: number, to: number, mark?: Mark): this
  ensureMarks(marks: Mark[]): this
  
  // 节点操作 (思维导图扩展)
  addNode(parentPos: number, node: MindMapNode, index?: number): this
  removeNode(pos: number): this
  moveNode(from: number, to: number, index?: number): this
  toggleFold(pos: number): this
  
  // 分割/合并
  split(pos: number, depth?: number, typesAfter?: Array<{ type: NodeType, attrs?: Record<string, any> }>): this
  join(pos: number, depth?: number): this
  
  // 提升/下沉
  lift(range: NodeRange, target: number): this
  wrap(range: NodeRange, wrappers: Array<{ type: NodeType, attrs?: Record<string, any> }>): this
  
  // 属性
  setNodeMarkup(pos: number, type?: NodeType, attrs?: Record<string, any>, marks?: Mark[]): this
  setNodeAttribute(pos: number, attr: string, value: any): this
  
  // 根节点属性
  setDocAttribute(attr: string, value: any): this
  
  // 元数据
  setMeta(key: string | Plugin, value: any): this
  getMeta(key: string | Plugin): any
  
  // 时间戳
  time: number
  
  // 是否有变更
  get scrolledIntoView(): boolean
  
  // 标记为通用事务 (历史分组)
  setIsGeneric(isGeneric: boolean): this
}
```

### 4.3 Selection - 选择抽象

```typescript
// @y-mindmap/state/selection.ts

abstract class Selection {
  readonly $anchor: ResolvedPos
  readonly $head: ResolvedPos
  readonly anchor: number
  readonly head: number
  readonly from: number
  readonly to: number
  readonly empty: boolean
  
  // 映射位置
  map(mapping: Mapping): Selection
  
  // 替换
  replace(tr: Transaction, content?: Slice): void
  
  // JSON
  toJSON(): Record<string, any>
  static fromJSON(doc: MindMapNode, json: Record<string, any>): Selection
  
  // 等于
  eq(other: Selection): boolean
  
  // 获取书签
  getBookmark(): SelectionBookmark
  
  // 静态方法
  static findFrom($pos: ResolvedPos, dir: number, textOnly?: boolean): Selection | null
  static near($pos: ResolvedPos, bias?: number): Selection
  static atStart(doc: MindMapNode): Selection
  static atEnd(doc: MindMapNode): Selection
  static between($anchor: ResolvedPos, $head: ResolvedPos, bias?: number): Selection
}

// 文本选择 (用于节点标题编辑)
class TextSelection extends Selection {
  readonly $cursor: ResolvedPos | null
  
  constructor($anchor: ResolvedPos, $head?: ResolvedPos)
}

// 节点选择 (选中整个节点)
class NodeSelection extends Selection {
  readonly node: MindMapNode
  
  constructor($pos: ResolvedPos)
  
  content(): Slice
  static isSelectable(node: MindMapNode): boolean
}

// 全选
class AllSelection extends Selection {
  constructor(doc: MindMapNode)
}
```

### 4.4 Plugin - 插件系统

```typescript
// @y-mindmap/state/plugin.ts

interface PluginSpec<T = any> {
  // 视图
  view?: (view: EditorView) => {
    update?: (view: EditorView, prevState: EditorState) => void
    destroy?: () => void
  }
  
  // 状态
  state?: {
    init: (config: Record<string, any>, instance: EditorState) => T
    apply: (tr: Transaction, value: T, oldState: EditorState, newState: EditorState) => T
  }
  
  // 键绑定
  key?: Record<string, Command>
  
  // 属性
  props?: {
    // 装饰器
    decorations?: (state: EditorState) => DecorationSet
    
    // 事件处理
    handleDOMEvents?: Record<string, (view: EditorView, event: Event) => boolean>
    handleKeyDown?: (view: EditorView, event: KeyboardEvent) => boolean
    handleTextInput?: (view: EditorView, from: number, to: number, text: string) => boolean
    handleClickOn?: (view: EditorView, pos: number, node: MindMapNode, nodePos: number, event: MouseEvent) => boolean
    handleClick?: (view: EditorView, pos: number, event: MouseEvent) => boolean
    handleDrop?: (view: EditorView, event: DragEvent, slice: Slice, moved: boolean) => boolean
    
    // 选择
    selectionToDOM?: (view: EditorView) => void
    
    // 光标样式
    createSelectionBetween?: (view: EditorView, $anchor: ResolvedPos, $head: ResolvedPos) => Selection | null
    
    // 序列化
    transformPasted?: (slice: Slice, view: EditorView) => Slice
    clipboardSerializer?: (state: EditorState) => string
  }
  
  // 过滤事务
  filterTransaction?: (tr: Transaction, state: EditorState) => boolean
  
  // 附加 Transaction
  appendTransaction?: (
    transactions: readonly Transaction[],
    oldState: EditorState,
    newState: EditorState
  ) => Transaction | null
  
  // 序列化
  toJSON?: (pluginState: T) => any
  fromJSON?: (config: Record<string, any>, value: any) => T
}

class Plugin<T = any> {
  readonly spec: PluginSpec<T>
  readonly key: string
  
  constructor(spec: PluginSpec<T>)
  
  getState(state: EditorState): T
}
```

---

## 五、Transform 层设计

### 5.1 Transform - 变换基类

```typescript
// @y-mindmap/transform/transform.ts

class Transform {
  readonly doc: MindMapNode
  readonly steps: Step[]
  readonly docs: MindMapNode[]
  readonly mapping: Mapping
  
  constructor(doc: MindMapNode)
  
  // 应用步骤
  step(step: Step): this
  
  // 位置映射
  mapPos(pos: number, assoc?: number): number
  
  // 文档操作
  replace(from: number, to: number, slice: Slice): this
  replaceWith(from: number, to: number, content: MindMapNode | MindMapNode[]): this
  insert(pos: number, content: MindMapNode | MindMapNode[]): this
  delete(from: number, to: number): this
  
  // 标记操作
  addMark(from: number, to: number, mark: Mark): this
  removeMark(from: number, to: number, mark: Mark): this
  
  // 节点操作
  setNodeMarkup(pos: number, type?: NodeType, attrs?: Record<string, any>, marks?: Mark[]): this
  setNodeAttribute(pos: number, attr: string, value: any): this
  
  // 分割/合并
  split(pos: number, depth?: number, typesAfter?: Array<{ type: NodeType, attrs?: Record<string, any> }>): this
  join(pos: number, depth?: number): this
  
  // 提升/下沉
  lift(range: NodeRange, target: number): this
  wrap(range: NodeRange, wrappers: Array<{ type: NodeType, attrs?: Record<string, any> }>): this
  
  // 获取结果
  get docChanged(): boolean
}
```

### 5.2 Step - 原子变更

```typescript
// @y-mindmap/transform/step.ts

abstract class Step {
  // 应用到文档
  abstract apply(doc: MindMapNode): StepResult
  
  // 获取反转步骤
  abstract invert(doc: MindMapNode): Step
  
  // 映射位置
  abstract map(mapping: Mapping): Step | null
  
  // 合并相邻步骤
  merge(other: Step): Step | null
  
  // 序列化
  abstract toJSON(): Record<string, any>
  static fromJSON(schema: Schema, json: Record<string, any>): Step
  
  // 步骤类型注册
  static jsonID(id: string, stepClass: typeof Step): void
}

class StepResult {
  readonly doc: MindMapNode | null
  readonly failed: string | null
  
  static ok(doc: MindMapNode): StepResult
  static fail(message: string): StepResult
  static fromReplace(doc: MindMapNode, from: number, to: number, slice: Slice): StepResult
}
```

### 5.3 具体步骤类型

```typescript
// @y-mindmap/transform/steps/replace-step.ts

class ReplaceStep extends Step {
  readonly from: number
  readonly to: number
  readonly slice: Slice
  readonly structure: boolean
  
  constructor(from: number, to: number, slice: Slice, structure?: boolean)
  
  apply(doc: MindMapNode): StepResult
  invert(doc: MindMapNode): ReplaceStep
  map(mapping: Mapping): ReplaceStep | null
  merge(other: Step): ReplaceStep | null
  toJSON(): Record<string, any>
}

// @y-mindmap/transform/steps/add-mark-step.ts

class AddMarkStep extends Step {
  readonly from: number
  readonly to: number
  readonly mark: Mark
  
  constructor(from: number, to: number, mark: Mark)
  
  apply(doc: MindMapNode): StepResult
  invert(): RemoveMarkStep
  map(mapping: Mapping): AddMarkStep | null
  toJSON(): Record<string, any>
}

// @y-mindmap/transform/steps/remove-mark-step.ts

class RemoveMarkStep extends Step {
  readonly from: number
  readonly to: number
  readonly mark: Mark
  
  constructor(from: number, to: number, mark: Mark)
  
  apply(doc: MindMapNode): StepResult
  invert(): AddMarkStep
  map(mapping: Mapping): RemoveMarkStep | null
  toJSON(): Record<string, any>
}

// @y-mindmap/transform/steps/move-node-step.ts (思维导图特有)

class MoveNodeStep extends Step {
  readonly from: number       // 源位置
  readonly to: number         // 目标父节点位置
  readonly index: number      // 目标索引
  
  constructor(from: number, to: number, index: number)
  
  apply(doc: MindMapNode): StepResult
  invert(): MoveNodeStep
  map(mapping: Mapping): MoveNodeStep | null
  toJSON(): Record<string, any>
}

// @y-mindmap/transform/steps/change-attr-step.ts

class ChangeAttrStep extends Step {
  readonly pos: number
  readonly attr: string
  readonly value: any
  
  constructor(pos: number, attr: string, value: any)
  
  apply(doc: MindMapNode): StepResult
  invert(): ChangeAttrStep
  map(mapping: Mapping): ChangeAttrStep | null
  toJSON(): Record<string, any>
}

// @y-mindmap/transform/steps/toggle-fold-step.ts (思维导图特有)

class ToggleFoldStep extends Step {
  readonly pos: number
  
  constructor(pos: number)
  
  apply(doc: MindMapNode): StepResult
  invert(): ToggleFoldStep
  map(mapping: Mapping): ToggleFoldStep | null
  toJSON(): Record<string, any>
}
```

### 5.4 Mapping - 位置映射

```typescript
// @y-mindmap/transform/mapping.ts

class Mapping {
  readonly maps: Mappable[]
  readonly from: number
  readonly to: number
  
  constructor(maps?: Mappable[], from?: number, to?: number)
  
  // 映射位置
  map(pos: number, assoc?: number): number
  mapResult(pos: number, assoc?: number): MapResult
  
  // 切片
  slice(from?: number, to?: number): Mapping
  
  // 追加
  appendMap(map: Mappable, mirrors?: number): void
  appendMapping(mapping: Mapping): void
  
  // 获取反转
  getMirror(n: number): number | null
  invert(): Mapping
}

interface Mappable {
  map(pos: number, assoc?: number): number
  recover?(index: number): number
}

class MapResult {
  readonly pos: number
  readonly deleted: boolean
  readonly recover?: number
}
```

---

## 六、View 层设计

### 6.1 EditorView - 视图管理器

```typescript
// @y-mindmap/view/editor-view.ts

class EditorView {
  readonly dom: HTMLElement
  readonly state: EditorState
  readonly dispatch: (tr: Transaction) => void
  
  // 更新状态
  updateState(state: EditorState): void
  
  // 聚焦/失焦
  focus(): void
  hasFocus(): boolean
  
  // 选择
  setSelection(selection: Selection): void
  
  // 坐标转换
  posAtCoords(coords: { left: number, top: number }): { pos: number, inside: number } | null
  coordsAtPos(pos: number, side?: number): { left: number, right: number, top: number, bottom: number }
  
  // 节点 DOM
  domAtPos(pos: number): { node: Node, offset: number }
  nodeDOM(pos: number): Node | null
  
  // 序列化
  serializeForClipboard(selection: Selection): { dom: Element, text: string }
  deserializeFromClipboard(event: ClipboardEvent): Slice | null
  
  // 销毁
  destroy(): void
  
  // 插件视图
  someProp(propName: string, f?: (prop: any) => any): any
  
  // 根
  readonly root: Document | DocumentFragment
}
```

### 6.2 Decoration - 装饰器

```typescript
// @y-mindmap/view/decoration.ts

class Decoration {
  readonly from: number
  readonly to: number
  readonly type: DecorationType
  
  // 创建内联装饰
  static inline(from: number, to: number, spec: InlineDecorationSpec): Decoration
  
  // 创建节点装饰
  static node(pos: number, spec: NodeDecorationSpec): Decoration
  
  // 创建小部件装饰
  static widget(pos: number, toDOM: (() => Node) | Node, spec?: WidgetDecorationSpec): Decoration
}

interface InlineDecorationSpec {
  class?: string
  style?: string
  attributes?: Record<string, string>
  inclusiveStart?: boolean
  inclusiveEnd?: boolean
}

interface NodeDecorationSpec {
  class?: string
  style?: string
  attributes?: Record<string, string>
}

interface WidgetDecorationSpec {
  side?: number
  stopEvent?: (event: Event) => boolean
  ignoreSelection?: boolean
  key?: string
  marks?: Mark[]
}

class DecorationSet {
  // 创建
  static create(doc: MindMapNode, decorations: Decoration[]): DecorationSet
  
  // 查找
  find(from?: number, to?: number, predicate?: (spec: any) => boolean): Decoration[]
  
  // 映射
  map(mapping: Mapping, doc: MindMapNode, options?: { onRemove?: (spec: any) => void }): DecorationSet
  
  // 添加
  add(from: number, to: number, decoration: Decoration): DecorationSet
  
  // 移除
  remove(decorations: Decoration[]): DecorationSet
  
  // 空集合
  static empty: DecorationSet
}
```

---

## 七、Command 系统

### 7.1 Command 类型

```typescript
// @y-mindmap/commands/commands.ts

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => boolean
```

### 7.2 预定义命令

```typescript
// @y-mindmap/commands/commands.ts

// 基础命令
const deleteSelection: Command          // 删除选中内容
const selectAll: Command                // 全选
const selectParentNode: Command         // 选择父节点

// 节点操作
const addSubTopic: Command              // 添加子节点 (Tab)
const addSiblingTopic: Command          // 添加兄弟节点 (Enter)
const deleteTopic: Command              // 删除节点 (Delete)
const duplicateTopic: Command           // 复制节点

// 折叠
const toggleFold: Command               // 切换折叠 (Space)

// 导航
const navigateUp: Command               // 向上导航 (ArrowUp)
const navigateDown: Command             // 向下导航 (ArrowDown)
const navigateLeft: Command             // 向左导航 (ArrowLeft)
const navigateRight: Command            // 向右导航 (ArrowRight)

// 编辑
const startEditing: Command             // 开始编辑 (Enter on selected)
const finishEditing: Command            // 完成编辑 (Enter)
const cancelEditing: Command            // 取消编辑 (Escape)

// 拖拽
const moveNodeUp: Command               // 上移节点
const moveNodeDown: Command             // 下移节点
const moveNodeLeft: Command             // 左移节点 (改变父节点)
const moveNodeRight: Command            // 右移节点 (改变父节点)

// 样式
const setStructure: (structureClass: string) => Command
const setShape: (shapeClass: string) => Command
const setFillColor: (color: string) => Command
const setTextColor: (color: string) => Command

// 视口
const zoomIn: Command
const zoomOut: Command
const zoomToFit: Command
const panToNode: (pos: number) => Command
```

### 7.3 命令链

```typescript
// @y-mindmap/commands/chain.ts

function chainCommands(...commands: Command[]): Command {
  return (state, dispatch, view) => {
    for (const cmd of commands) {
      if (cmd(state, dispatch, view)) return true
    }
    return false
  }
}

function ifInNodeType(type: NodeType | string, command: Command): Command {
  return (state, dispatch, view) => {
    const { $from } = state.selection
    const node = $from.node
    if (node.type.name === (typeof type === 'string' ? type : type.name)) {
      return command(state, dispatch, view)
    }
    return false
  }
}

function ifNotInNodeType(type: NodeType | string, command: Command): Command {
  return (state, dispatch, view) => {
    const { $from } = state.selection
    const node = $from.node
    if (node.type.name !== (typeof type === 'string' ? type : type.name)) {
      return command(state, dispatch, view)
    }
    return false
  }
}
```

---

## 八、History 系统

### 8.1 History 插件

```typescript
// @y-mindmap/history/history.ts

interface HistoryConfig {
  depth?: number           // 最大历史深度 (默认 100)
  newGroupDelay?: number   // 新分组延迟 (默认 500ms)
  preserveItems?: boolean  // 是否保留项
}

function history(config?: HistoryConfig): Plugin<HistoryState>

interface HistoryState {
  done: Branch
  undone: Branch
}

class Branch {
  items: ItemType[]
  eventCount: number
  
  // 添加项
  addEvent(item: ItemType, newGroupDelay: number): Branch
  
  // 映射
  remapping(from: number, to: number): Branch
  
  // 获取最后一个事件
  lastEvent(): ItemType | null
  
  // 弹出事件
  popEvent(state: EditorState, preserveItems: boolean): { transaction: Transaction, state: Branch } | null
}

// 历史命令
const undo: Command
const redo: Command
const undoDepth: (state: EditorState) => number
const redoDepth: (state: EditorState) => number
```

### 8.2 历史项

```typescript
// @y-mindmap/history/item.ts

interface HistoryItem {
  // 事务的映射
  map: Mapping
  
  // 是否为选择变更
  selection: Selection | undefined
  
  // 时间戳
  time: number
}
```

---

## 九、Collab 系统

### 9.1 Collab 插件

```typescript
// @y-mindmap/collab/collab.ts

interface CollabConfig {
  version?: number         // 初始版本
  clientID?: number | string  // 客户端 ID
}

function collab(config?: CollabConfig): Plugin<CollabState>

interface CollabState {
  version: number
  clientID: number | string
  unconfirmed: UnconfirmedStep[]
}

interface UnconfirmedStep {
  step: Step
  clientID: number | string
  map: Mapping
}

// 获取待确认的步骤
function sendableSteps(state: EditorState): { steps: Step[], clientID: number | string, version: number } | null

// 接收远程步骤
function receiveTransaction(
  state: EditorState,
  steps: Array<{ step: Step, clientID: number | string }>,
  clientIDs: Array<number | string>
): Transaction
```

### 9.2 Rebase 算法

```typescript
// @y-mindmap/collab/rebase.ts

function rebaseSteps(
  steps: Step[],
  over: Step[],
  oldState: EditorState
): { rebased: Step[], mapping: Mapping }
```

---

## 十、Plugin 示例

### 10.1 Selection 插件

```typescript
// @y-mindmap/plugins/selection-plugin.ts

const selectionPlugin = new Plugin({
  state: {
    init(config, state) {
      return {
        selectedNodes: new Set<number>(),
        anchor: null,
        head: null,
      }
    },
    
    apply(tr, value, oldState, newState) {
      // 从 Transaction 元数据获取选择变更
      const newSelection = tr.getMeta('selection')
      if (newSelection) {
        return newSelection
      }
      
      // 映射位置
      return {
        selectedNodes: new Set(
          [...value.selectedNodes].map(pos => tr.mapping.map(pos))
        ),
        anchor: value.anchor !== null ? tr.mapping.map(value.anchor) : null,
        head: value.head !== null ? tr.mapping.map(value.head) : null,
      }
    }
  },
  
  props: {
    handleKeyDown(view, event) {
      // 处理选择相关的快捷键
      if (event.key === 'Escape') {
        // 清空选择
        const tr = view.state.tr
        tr.setSelection(NodeSelection.create(view.state.doc, 0))
        tr.setMeta('selection', { selectedNodes: new Set() })
        view.dispatch(tr)
        return true
      }
      return false
    }
  }
})
```

### 10.2 Drag 插件

```typescript
// @y-mindmap/plugins/drag-plugin.ts

const dragPlugin = new Plugin({
  state: {
    init() {
      return {
        dragging: false,
        sourcePos: null,
        targetPos: null,
        preview: null,
      }
    },
    
    apply(tr, value) {
      const dragMeta = tr.getMeta('drag')
      if (dragMeta) {
        return { ...value, ...dragMeta }
      }
      return value
    }
  },
  
  props: {
    handleDOMEvents: {
      dragstart(view, event) {
        // 开始拖拽
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!pos) return false
        
        const tr = view.state.tr
        tr.setMeta('drag', {
          dragging: true,
          sourcePos: pos.pos,
        })
        view.dispatch(tr)
        
        // 设置拖拽数据
        event.dataTransfer.setData('application/y-mindmap', JSON.stringify({ pos: pos.pos }))
        return false
      },
      
      dragover(view, event) {
        // 拖拽悬停
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!pos) return false
        
        const tr = view.state.tr
        tr.setMeta('drag', {
          targetPos: pos.pos,
        })
        view.dispatch(tr)
        return false
      },
      
      drop(view, event) {
        // 放置
        event.preventDefault()
        const data = event.dataTransfer.getData('application/y-mindmap')
        if (!data) return false
        
        const { pos: sourcePos } = JSON.parse(data)
        const target = view.posAtCoords({ left: event.clientX, top: event.clientY })
        if (!target) return false
        
        // 执行移动
        const tr = view.state.tr
        const sourceNode = view.state.doc.nodeAt(sourcePos)
        if (sourceNode) {
          tr.delete(sourcePos, sourcePos + sourceNode.nodeSize)
          tr.insert(target.pos, sourceNode)
        }
        tr.setMeta('drag', { dragging: false, sourcePos: null, targetPos: null })
        view.dispatch(tr)
        return true
      }
    }
  }
})
```

### 10.3 Layout 插件

```typescript
// @y-mindmap/plugins/layout-plugin.ts

const layoutPlugin = new Plugin({
  state: {
    init() {
      return {
        layoutQueue: new Map<number, boolean>(),
        layoutResults: new Map<number, LayoutResult>(),
      }
    },
    
    apply(tr, value, oldState, newState) {
      // 检测哪些节点需要重新布局
      const needsLayout = new Map<number, boolean>()
      
      tr.steps.forEach(step => {
        if (step instanceof ReplaceStep || step instanceof MoveNodeStep) {
          // 标记受影响的节点
          const affected = getAffectedNodes(step, oldState.doc)
          affected.forEach(pos => needsLayout.set(pos, true))
        }
      })
      
      return {
        layoutQueue: new Map([...value.layoutQueue, ...needsLayout]),
        layoutResults: value.layoutResults,
      }
    }
  },
  
  appendTransaction(transactions, oldState, newState) {
    // 异步布局计算
    const pluginState = this.getState(newState)
    if (pluginState.layoutQueue.size === 0) return null
    
    // 批量计算布局
    const tr = newState.tr
    pluginState.layoutQueue.forEach((_, pos) => {
      const node = newState.doc.nodeAt(pos)
      if (node) {
        const layout = calculateLayout(node, newState.doc)
        tr.setNodeAttribute(pos, 'position', layout.position)
      }
    })
    
    tr.setMeta('layout', { layoutQueue: new Map() })
    return tr
  }
})
```

---

## 十一、Yjs 集成

### 11.1 Yjs Schema 映射

```typescript
// @y-mindmap/yjs/schema-mapping.ts

function mindmapSchemaToYDoc(schema: Schema, doc: MindMapNode): Y.Doc {
  const yDoc = new Y.Doc()
  const yNodes = yDoc.getMap('nodes')
  
  // 递归映射
  function mapNode(node: MindMapNode, path: string) {
    const yNode = new Y.Map()
    yNode.set('type', node.type.name)
    yNode.set('attrs', Y.encode(new Uint8Array(msgpack.encode(node.attrs))))
    
    if (node.content) {
      const yContent = new Y.Array()
      node.content.forEach((child, i) => {
        const childPath = `${path}.${i}`
        mapNode(child, childPath)
        yContent.push([childPath])
      })
      yNode.set('content', yContent)
    }
    
    if (node.marks && node.marks.length > 0) {
      const yMarks = new Y.Array()
      node.marks.forEach(mark => {
        yMarks.push([mark.toJSON()])
      })
      yNode.set('marks', yMarks)
    }
    
    yNodes.set(path, yNode)
  }
  
  mapNode(doc, 'root')
  return yDoc
}
```

### 11.2 Collab + Yjs 集成

```typescript
// @y-mindmap/yjs/yjs-collab.ts

interface YjsCollabConfig {
  yDoc: Y.Doc
  awareness: awarenessProtocol.Awareness
  provider: WebsocketProvider | WebrtcProvider
}

function yjsCollab(config: YjsCollabConfig): Plugin<YjsCollabState> {
  const { yDoc, awareness, provider } = config
  
  return new Plugin({
    state: {
      init() {
        return {
          version: 0,
          pending: [],
          isRebasing: false,
        }
      },
      
      apply(tr, value, oldState, newState) {
        if (tr.getMeta('yjs-sync')) {
          return { ...value, version: value.version + 1 }
        }
        return value
      }
    },
    
    view(view) {
      // 监听 Yjs 文档变更
      yDoc.on('update', (update, origin) => {
        if (origin === 'local') return
        
        // 将 Yjs 变更转换为 Transaction
        const tr = yDocToTransaction(yDoc, view.state)
        if (tr) {
          view.dispatch(tr.setMeta('yjs-sync', true))
        }
      })
      
      // 监听本地 Transaction
      const originalDispatch = view.dispatch
      view.dispatch = (tr: Transaction) => {
        // 将 Transaction 转换为 Yjs 变更
        const yUpdate = transactionToYUpdate(tr, yDoc)
        if (yUpdate) {
          Y.applyUpdate(yDoc, yUpdate, 'local')
        }
        
        originalDispatch(tr)
      }
      
      return {
        destroy() {
          // 清理
        }
      }
    }
  })
}
```

---

## 十二、完整数据流示例

### 12.1 添加子节点

```typescript
// 用户按下 Tab
function handleTab(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  const { selection } = state
  if (!(selection instanceof NodeSelection)) return false
  
  const { $from } = selection
  const parent = $from.node
  const index = $from.index
  
  // 创建新节点
  const newNode = state.schema.nodes.topic.create({
    id: generateId(),
    title: 'New Topic',
  })
  
  // 创建 Transaction
  const tr = state.tr
  
  // 插入节点
  const insertPos = $from.after()
  tr.insert(insertPos, newNode)
  
  // 设置选择到新节点
  const $newPos = tr.doc.resolve(insertPos)
  tr.setSelection(new NodeSelection($newPos))
  
  // 添加元数据 (用于历史分组)
  tr.setMeta('addToHistory', true)
  tr.setMeta('operation', 'addSubTopic')
  
  dispatch(tr)
  return true
}
```

### 12.2 拖拽移动节点

```typescript
// 拖拽结束
function handleDrop(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  sourcePos: number,
  targetPos: number
): boolean {
  const sourceNode = state.doc.nodeAt(sourcePos)
  if (!sourceNode) return false
  
  // 创建 Transaction
  const tr = state.tr
  
  // 删除源节点
  tr.delete(sourcePos, sourcePos + sourceNode.nodeSize)
  
  // 重新计算目标位置 (因为删除可能影响位置)
  const mapping = tr.mapping
  const newTargetPos = mapping.map(targetPos)
  
  // 插入到新位置
  tr.insert(newTargetPos, sourceNode)
  
  // 设置选择
  const $newPos = tr.doc.resolve(newTargetPos)
  tr.setSelection(new NodeSelection($newPos))
  
  // 元数据
  tr.setMeta('addToHistory', true)
  tr.setMeta('operation', 'moveNode')
  tr.setMeta('sourcePos', sourcePos)
  tr.setMeta('targetPos', targetPos)
  
  dispatch(tr)
  return true
}
```

### 12.3 协同编辑流程

```typescript
// 本地编辑
function localEdit(state: EditorState, dispatch: (tr: Transaction) => void) {
  const tr = state.tr
  // ... 本地操作 ...
  
  // 标记为本地
  tr.setMeta('collab', { local: true })
  dispatch(tr)
}

// Yjs 更新处理
function handleYjsUpdate(update: Uint8Array, origin: any) {
  if (origin === 'local') return
  
  // 解码更新
  const yUpdate = Y.decodeUpdate(update)
  
  // 转换为 Transaction
  const tr = yUpdateToTransaction(yUpdate, view.state)
  
  // 应用
  view.dispatch(tr.setMeta('yjs-sync', true))
}

// Transaction 转 Yjs 更新
function transactionToYUpdate(tr: Transaction, yDoc: Y.Doc): Uint8Array | null {
  if (!tr.docChanged) return null
  
  const yDoc = new Y.Doc()
  const yNodes = yDoc.getMap('nodes')
  
  // 遍历 steps
  tr.steps.forEach(step => {
    if (step instanceof ReplaceStep) {
      // 将 ReplaceStep 转换为 Yjs 操作
      const fromPath = posToPath(step.from, tr.before)
      const toPath = posToPath(step.to, tr.before)
      
      // 删除
      yNodes.delete(fromPath)
      
      // 插入
      if (step.slice.content) {
        const newNode = sliceToYMap(step.slice)
        yNodes.set(fromPath, newNode)
      }
    }
    // ... 其他 step 类型
  })
  
  return Y.encodeStateAsUpdate(yDoc)
}
```

---

## 十三、与现有代码的映射

| ProseMirror 概念 | Y-MindMap 实现 | Snowbrush 对应 |
|-----------------|----------------|----------------|
| `Schema` | `mindmapSchema` | `STRUCTURECLASS`, `TOPIC_TYPE`, `STYLE_KEYS` |
| `Node` | `MindMapNode` | `TopicModel`, `SheetModel` |
| `Fragment` | `Fragment` | `children` 数组 |
| `Slice` | `Slice` | 复制粘贴数据 |
| `Mark` | `Mark` | `MarkerModel`, `StyleComponent` |
| `EditorState` | `EditorState` | `SheetEditor` 状态 |
| `Transaction` | `Transaction` | `Action` + `UndoManager` |
| `Step` | `Step` | Action 的 undo/redo |
| `Selection` | `Selection` | `SelectionManager` |
| `EditorView` | `EditorView` | `SvgView` + `SheetView` |
| `Plugin` | `Plugin` | Module 系统 |
| `Command` | `Command` | Action |
| `history()` | `history()` | `UndoManager` |
| `collab()` | `yjsCollab()` | 无 (需新增) |
| `Mapping` | `Mapping` | 无 (需新增) |
| `Decoration` | `Decoration` | Figure 的样式 |
