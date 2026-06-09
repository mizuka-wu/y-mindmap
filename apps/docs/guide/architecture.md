# 架构设计

## 核心原则

Y-MindMap 采用 **State/View 分离** 架构，类似于 ProseMirror 的设计模式。

```
┌─────────────────────────────────────────────────────────┐
│                    MindMapEditor                         │
│  (入口，整合所有模块)                                      │
├─────────────────────────────────────────────────────────┤
│  Commands    │  Interaction    │  UI      │  Extensions  │
│  (命令系统)   │  (交互处理)      │  (界面)  │  (扩展)     │
├─────────────────────────────────────────────────────────┤
│                    State Layer                           │
│  (MindMapDocument, MindMapNode, Selection, Transaction) │
│  纯数据，不可变，通过 Transaction 更新                       │
├─────────────────────────────────────────────────────────┤
│                    View Layer                            │
│  (EditorView, TopicView, ConnectionView, Themes)        │
│  Canvas 渲染，响应状态变化                                  │
├─────────────────────────────────────────────────────────┤
│                    Layout Layer                          │
│  (21 Layout Algorithms, Incremental Layout)             │
│  计算节点位置                                              │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                            │
│  (Types, Constants, Errors, Utils)                      │
│  基础定义                                                 │
└─────────────────────────────────────────────────────────┘
```

## 数据流

```
用户操作 → Interaction Handler → Command → Transaction
                                              ↓
                                         State.apply(tr)
                                              ↓
                                         View.update()
                                              ↓
                                         Canvas 重绘
```

## 状态管理

### EditorState

```typescript
class EditorState {
  doc: MindMapDocument    // 文档
  selection: Selection    // 选择
  history: History        // 历史记录
}
```

### Transaction

```typescript
const tr = state.tr
tr.updateNode('node-1', node => node.withTitle('New Title'))
const newState = state.apply(tr)
```

### 不可变更新

所有数据都是不可变的，更新时返回新对象：

```typescript
const node = new MindMapNode({ id: '1', title: 'Hello' })
const updated = node.withTitle('World')
// node.title === 'Hello'
// updated.title === 'World'
```

## 渲染层

### EditorView

```typescript
class EditorView {
  private app: App              // Leafer.js App
  private topicLayer: Leafer    // 节点层
  private connectionLayer: Leafer // 连线层
  private decorationLayer: Leafer // 装饰层
  
  updateState(state: EditorState): void
  getNodeBounds(nodeId: string): Bounds
}
```

### TopicView

每个节点对应一个 TopicView：

```typescript
class TopicView {
  group: Group           // Leafer.js Group
  nodeId: string
  
  updateNode(node: MindMapNode): void
  updateLayout(layout: NodeLayout): void
  setSelected(selected: boolean): void
}
```

## 布局系统

### LayoutEngine

```typescript
interface LayoutEngine {
  calculate(root: MindMapNode): LayoutResult
}

interface LayoutResult {
  nodes: Map<string, NodeLayout>
  connections: Map<string, ConnectionLayout>
  bounds: Bounds
}
```

### 增量布局

只重新计算变化的节点：

```typescript
class IncrementalLayout implements LayoutEngine {
  calculate(root: MindMapNode): LayoutResult {
    // 只计算变化的节点
  }
}
```

## Extension 系统

### Extension 定义

```typescript
interface ExtensionDefinition<T> {
  name: string
  type: 'block' | 'mark' | 'node' | 'behavior' | 'collaboration'
  defaultOptions: ExtensionOptions<T>
  configure: (options: Partial<ExtensionOptions<T>>) => ExtensionDefinition<T>
  setup?: (ctx: ExtensionContext, options: ExtensionOptions<T>) => void | (() => void)
  destroy?: () => void
  commands?: Record<string, Function>
  shortcuts?: Record<string, string>
  menuItems?: Array<{ id: string; label: string; icon?: string; shortcut?: string; action: () => void }>
}
```

### ExtensionContext

```typescript
interface ExtensionContext {
  state: EditorState
  dispatch: (tr: Transaction) => void
  view: EditorView | null
  executeCommand: (name: string, args?: any) => boolean
  registerCommand: (name: string, command: Function) => void
  unregisterCommand: (name: string) => void
  on: (event: string, handler: Function) => void
  off: (event: string, handler: Function) => void
  emit: (event: string, ...args: any[]) => void
}
```
