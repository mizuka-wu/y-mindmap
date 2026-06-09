# MindMapEditor

主编辑器类，整合所有功能模块。

## 构造函数

```typescript
new MindMapEditor(options: MindMapEditorOptions)
```

### 选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| container | HTMLElement | - | 容器元素 |
| doc | MindMapDocument | - | 初始文档 |
| layoutEngine | LayoutEngine | MapLayout | 布局引擎 |
| readOnly | boolean | false | 是否只读 |
| keymap | Record<string, string> | - | 自定义快捷键 |
| showToolbar | boolean | true | 显示工具栏 |
| showPropertyPanel | boolean | true | 显示属性面板 |
| showStatusBar | boolean | true | 显示状态栏 |
| showMiniMap | boolean | true | 显示小地图 |
| enableInertialScroll | boolean | true | 启用惯性滚动 |
| enableGestures | boolean | true | 启用手势 |
| ydoc | Y.Doc | - | Yjs 文档（协作模式） |
| user | CollaboratorUser | - | 协作用户信息 |
| extensions | ExtensionDefinition[] | - | 扩展列表 |

## 方法

### 命令执行

```typescript
executeCommand(name: string, args?: any): boolean
```

执行命名命令。返回是否成功。

### 文档操作

```typescript
loadDocument(doc: MindMapDocument): void
loadXMindFile(file: File): Promise<any>
exportXMind(): Promise<Blob>
getDocument(): MindMapDocument
```

### 选择操作

```typescript
selectNode(nodeId: string): void
getSelection(): string[]
```

### 视图操作

```typescript
zoomIn(): void
zoomOut(): void
fitToContent(): void
```

### 状态查询

```typescript
getState(): EditorState
getView(): EditorView
canUndo(): boolean
canRedo(): boolean
isEditing(): boolean
```

### 协作操作

```typescript
getCollaboratorManager(): CollaboratorManager | null
getCollaborators(): Map<number, CollaboratorState>
isNodeLocked(nodeId: string, field?: string): boolean
canEditTitle(nodeId: string): boolean
canDrag(nodeId: string): boolean
```

### 扩展操作

```typescript
getExtensions(): ExtensionManager
```

### 生命周期

```typescript
destroy(): void
```

## 事件

通过扩展系统监听事件：

```typescript
import { createExtension } from '@y-mindmap/extension'

const EventListener = createExtension({
  name: 'event-listener',
  type: 'behavior',
  defaultOptions: { enabled: true },
  setup(ctx) {
    ctx.on('node:select', (nodeIds) => {
      console.log('Nodes selected:', nodeIds)
    })
    
    ctx.on('document:change', (tr) => {
      console.log('Document changed:', tr)
    })
  },
})

const editor = createMindMap(container, {
  extensions: [EventListener],
})
```
