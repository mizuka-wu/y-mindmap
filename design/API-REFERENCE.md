# API-REFERENCE.md - API 参考手册

> 思维导图编辑器 API 参考手册

---

## 一、EditorView

### 1.1 构造函数

```typescript
new EditorView(config: EditorConfig)
```

**参数:**
- `config.container` - 容器元素或选择器
- `config.document` - 初始文档
- `config.readOnly` - 只读模式
- `config.theme` - 主题
- `config.plugins` - 插件列表

### 1.2 方法

#### `getDocument(): MindMapNode`
获取当前文档

#### `getSelection(): Selection`
获取当前选择

#### `getState(): EditorState`
获取当前状态

#### `executeCommand(name: string, args?: any): void`
执行命令

#### `selectNode(nodeId: string): void`
选择节点

#### `zoomTo(level: number): void`
缩放到指定级别

#### `panTo(position: Point): void`
平移到指定位置

#### `fitToContent(): void`
适应内容

#### `on(event: string, handler: Function): void`
监听事件

#### `off(event: string, handler: Function): void`
取消监听

---

## 二、MindMapNode

### 2.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 节点 ID |
| `title` | `string` | 节点标题 |
| `type` | `TopicType` | 节点类型 |
| `children` | `Record<string, MindMapNode[]>` | 子节点 |
| `style` | `StyleData` | 样式 |
| `markers` | `MarkerData[]` | 标记 |
| `labels` | `string[]` | 标签 |
| `notes` | `NotesData` | 备注 |
| `image` | `ImageData` | 图片 |
| `href` | `string` | 链接 |

### 2.2 方法

#### `addChild(child: MindMapNode): MindMapNode`
添加子节点

#### `removeChild(nodeId: string): MindMapNode`
移除子节点

#### `updateTitle(title: string): MindMapNode`
更新标题

#### `getAllChildren(): MindMapNode[]`
获取所有子节点

#### `descendants(fn: Function): void`
遍历后代节点

#### `toJSON(): any`
序列化为 JSON

#### `static fromJSON(data: any): MindMapNode`
从 JSON 反序列化

---

## 三、Selection

### 3.1 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `type` | `'single' \| 'multiple' \| 'range' \| 'box'` | 选择类型 |
| `selectedIds` | `Set<string>` | 选中的节点 ID |
| `anchorId` | `string \| null` | 锚点节点 |
| `focusId` | `string \| null` | 焦点节点 |

### 3.2 方法

#### `static empty(): Selection`
创建空选择

#### `static single(nodeId: string): Selection`
创建单选

#### `isSelected(nodeId: string): boolean`
检查是否选中

---

## 四、Transaction

### 4.1 方法

#### `addNode(parentId: string, node: MindMapNode): Transaction`
添加节点

#### `removeNode(nodeId: string): Transaction`
移除节点

#### `moveNode(nodeId: string, newParentId: string, index?: number): Transaction`
移动节点

#### `updateNode(nodeId: string, changes: Partial<TopicData>): Transaction`
更新节点

#### `setSelection(selection: Selection): Transaction`
设置选择

#### `apply(): EditorState`
应用事务

---

## 五、Command

### 5.1 预定义命令

| 命令 | 说明 |
|------|------|
| `addSubTopic` | 添加子节点 |
| `addSiblingTopic` | 添加兄弟节点 |
| `deleteNode` | 删除节点 |
| `startEditing` | 开始编辑 |
| `finishEditing` | 完成编辑 |
| `toggleFold` | 折叠/展开 |
| `selectAll` | 全选 |
| `undo` | 撤销 |
| `redo` | 重做 |
| `copy` | 复制 |
| `cut` | 剪切 |
| `paste` | 粘贴 |
| `zoomIn` | 放大 |
| `zoomOut` | 缩小 |
| `fitToContent` | 适应内容 |

---

## 六、事件

### 6.1 事件列表

| 事件 | 参数 | 说明 |
|------|------|------|
| `stateChanged` | `EditorState` | 状态变更 |
| `selectionChanged` | `Selection` | 选择变更 |
| `nodeClick` | `MindMapNode` | 节点点击 |
| `nodeDblClick` | `MindMapNode` | 节点双击 |
| `nodeDragStart` | `MindMapNode` | 拖拽开始 |
| `nodeDragEnd` | `MindMapNode` | 拖拽结束 |
| `zoomChanged` | `number` | 缩放变更 |
| `viewportChanged` | `Bounds` | 视口变更 |
| `editStart` | `string` | 编辑开始 |
| `editEnd` | `string` | 编辑结束 |
| `save` | - | 保存 |
| `error` | `Error` | 错误 |

---

## 七、类型定义

### 7.1 枚举

```typescript
enum TopicType {
  ROOT = 'root',
  ATTACHED = 'attached',
  DETACHED = 'detached',
  SUMMARY = 'summary',
  CALLOUT = 'callout',
}

enum StructureType {
  MAP = 'org.xmind.ui.map',
  LOGIC_RIGHT = 'org.xmind.ui.logic.right',
  TREE_RIGHT = 'org.xmind.ui.tree.right',
  ORG_CHART_DOWN = 'org.xmind.ui.org-chart.down',
  FISHBONE = 'org.xmind.ui.fishbone.leftHeaded',
  TIMELINE = 'org.xmind.ui.timeline.horizontal',
}
```

### 7.2 接口

```typescript
interface Point {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface Bounds {
  x: number
  y: number
  width: number
  height: number
}
```
