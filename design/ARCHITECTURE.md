# MindMap Editor 架构设计

## 设计理念

参考 ProseMirror 的 state/view 分离架构，实现一个现代化的思维导图编辑器：
- **State**: 纯数据模型，不可变数据结构，所有变更通过 Transaction
- **View**: 渲染层，将 State 映射到 Canvas (Leafer.js)

---

## 核心原则

### 1. 单向数据流
```
User Action → Transaction → State.apply() → View.update()
```

### 2. 不可变 State
- State 对象一旦创建不可修改
- 所有变更产生新的 State
- 便于撤销/重做、协同编辑

### 3. 关注点分离
- State 只关心数据和逻辑
- View 只关心渲染和交互
- 两者通过明确定义的接口通信

---

## 模块划分

```
mindmap-core/
├── state/              # 状态层 (纯数据)
│   ├── document.ts     # 文档模型
│   ├── topic.ts        # 节点模型
│   ├── relationship.ts # 关系模型
│   ├── selection.ts    # 选择状态
│   ├── transaction.ts  # 变更操作
│   └── schema.ts       # 数据结构定义
│
├── view/               # 视图层 (渲染)
│   ├── editor-view.ts  # 编辑器视图
│   ├── topic-view.ts   # 节点视图
│   ├── connection-view.ts # 连线视图
│   ├── layer-manager.ts # 图层管理
│   └── input-handler.ts # 输入处理
│
├── transform/          # 变换层 (State → View 映射)
│   ├── layout.ts       # 布局算法
│   ├── structure.ts    # 结构定义
│   └── coordinate.ts   # 坐标转换
│
└── commands/           # 命令层 (预定义操作)
    ├── topic.ts        # 节点操作
    ├── style.ts        # 样式操作
    └── structure.ts    # 结构操作
```

---

## State 层设计

### Document (文档)
```typescript
class MindMapDocument {
  readonly root: Topic
  readonly relationships: ReadonlyMap<string, Relationship>
  readonly theme: Theme
  readonly metadata: DocumentMetadata
  
  // 不可变更新
  apply(tr: Transaction): MindMapDocument
  
  // 查询
  getTopic(id: string): Topic | null
  findTopics(predicate: (topic: Topic) => boolean): Topic[]
  getPath(from: Topic, to: Topic): Topic[]
}
```

### Topic (节点)
```typescript
class Topic {
  readonly id: string
  readonly title: string
  readonly children: ReadonlyArray<Topic>
  readonly parent: Topic | null
  readonly style: TopicStyle
  readonly data: TopicData  // 扩展数据 (markers, notes, etc.)
  
  // 结构查询
  get depth(): number
  get index(): number
  get path(): Topic[]
  get descendants(): Topic[]
  
  // 不可变操作
  addChild(child: Topic, index?: number): Topic
  removeChild(id: string): Topic
  update(changes: Partial<TopicData>): Topic
}
```

### Transaction (事务)
```typescript
class Transaction {
  readonly doc: MindMapDocument
  readonly steps: ReadonlyArray<Step>
  readonly selection: Selection
  readonly timestamp: number
  
  // 操作方法 (返回新 Transaction)
  addTopic(parentId: string, topic: TopicData): Transaction
  removeTopic(id: string): Transaction
  updateTopic(id: string, changes: Partial<TopicData>): Transaction
  moveTopic(id: string, newParentId: string, index: number): Transaction
  
  // 样式操作
  setStyle(topicId: string, style: Partial<TopicStyle>): Transaction
  setStructure(topicId: string, structure: StructureType): Transaction
  
  // 选择操作
  setSelection(selection: Selection): Transaction
  
  // 应用
  apply(): MindMapDocument
}
```

### Selection (选择)
```typescript
class Selection {
  readonly type: 'single' | 'range' | 'multi'
  readonly selectedIds: ReadonlySet<string>
  readonly anchor: string | null  // 锚点节点
  readonly focus: string | null   // 焦点节点
  
  // 工厂方法
  static empty(): Selection
  static single(id: string): Selection
  range(anchor: string, focus: string): Selection
  
  // 查询
  isSelected(id: string): boolean
  get selectedTopics(): Topic[]
}
```

### Schema (数据结构)
```typescript
// Topic 数据结构
interface TopicData {
  id: string
  title: string
  structureClass?: StructureType
  branch?: 'folded' | 'expanded'
  labels?: string[]
  markers?: MarkerData[]
  notes?: NotesData
  image?: ImageData
  href?: string
  numbering?: NumberingData
  children?: { [type: string]: TopicData[] }
}

// 样式
interface TopicStyle {
  shape?: ShapeType
  fill?: Color
  border?: BorderStyle
  font?: FontStyle
  textColor?: Color
}

// 结构类型
enum StructureType {
  MAP = 'map',
  LOGIC_RIGHT = 'logic-right',
  LOGIC_LEFT = 'logic-left',
  TREE_RIGHT = 'tree-right',
  TREE_LEFT = 'tree-left',
  ORG_CHART = 'org-chart',
  FISHBONE = 'fishbone',
  TIMELINE = 'timeline',
  // ...
}
```

---

## View 层设计

### EditorView (编辑器视图)
```typescript
class EditorView {
  readonly leafer: Leafer
  readonly state: MindMapDocument
  readonly dom: HTMLElement
  
  // 图层
  private backgroundLayer: Leafer
  private connectionLayer: Leafer
  private topicLayer: Leafer
  private overlayLayer: Leafer
  
  // 视图映射
  private topicViews: Map<string, TopicView>
  private connectionViews: Map<string, ConnectionView>
  
  constructor(dom: HTMLElement, doc: MindMapDocument, config?: EditorConfig)
  
  // 更新
  updateState(newState: MindMapDocument): void
  
  // 交互
  dispatch(tr: Transaction): void
  
  // 视口
  zoomTo(scale: number, center?: Point): void
  panTo(x: number, y: number): void
  fitToContent(): void
  
  // 销毁
  destroy(): void
}
```

### TopicView (节点视图)
```typescript
class TopicView {
  readonly group: Group        // Leafer.js Group
  readonly topic: Topic        // 关联的 Topic 数据
  
  // 子元素
  private shape: Rect | Ellipse | Path
  private titleText: Text
  private markers: Image[]
  private expandButton: Group
  
  // 布局
  private bounds: Bounds
  private layoutCache: LayoutResult
  
  constructor(topic: Topic, layer: Leafer)
  
  // 更新
  update(topic: Topic, style: ComputedStyle): void
  
  // 布局
  calculateBounds(): Bounds
  applyLayout(layout: LayoutResult): void
  
  // 交互
  on(event: string, handler: Function): void
  
  // 销毁
  destroy(): void
}
```

### ConnectionView (连线视图)
```typescript
class ConnectionView {
  readonly path: Path  // Leafer.js Path
  readonly from: TopicView
  readonly to: TopicView
  
  constructor(from: TopicView, to: TopicView, layer: Leafer)
  
  // 更新
  update(style: ConnectionStyle): void
  
  // 路径计算
  calculatePath(): string  // SVG path data
  
  // 动画
  animate(from: Point, to: Point, duration: number): void
}
```

---

## Transform 层设计

### Layout (布局)
```typescript
interface LayoutEngine {
  calculateLayout(doc: MindMapDocument): LayoutResult
}

interface LayoutResult {
  topics: Map<string, TopicLayout>
  connections: Map<string, ConnectionLayout>
  bounds: Bounds
}

interface TopicLayout {
  x: number
  y: number
  width: number
  height: number
}

interface ConnectionLayout {
  path: string  // SVG path data
  startPoint: Point
  endPoint: Point
  controlPoints: Point[]
}

// 实现类
class MapLayout implements LayoutEngine { ... }
class TreeLayout implements LayoutEngine { ... }
class OrgChartLayout implements LayoutEngine { ... }
class FishboneLayout implements LayoutEngine { ... }
```

### Coordinate (坐标转换)
```typescript
class CoordinateSystem {
  // 三个坐标空间
  private documentSpace: Matrix  // 文档坐标
  private viewSpace: Matrix      // 视图坐标
  private screenSpace: Matrix    // 屏幕坐标
  
  // 转换方法
  documentToScreen(point: Point): Point
  screenToDocument(point: Point): Point
  documentToView(point: Point): Point
  viewToDocument(point: Point): Point
  
  // 视口操作
  zoom(scale: number, center: Point): void
  pan(dx: number, dy: number): void
  fitBounds(bounds: Bounds, padding: number): void
}
```

---

## Commands 层设计

### 命令模式
```typescript
interface Command {
  execute(state: MindMapDocument, selection: Selection): Transaction | null
  isActive?(state: MindMapDocument, selection: Selection): boolean
  isEnabled?(state: MindMapDocument, selection: Selection): boolean
}

// 预定义命令
const commands = {
  // 节点操作
  addTopic: (parentId?: string) => Command,
  deleteTopic: () => Command,
  duplicateTopic: () => Command,
  
  // 编辑操作
  editTopic: () => Command,
  finishEditing: () => Command,
  
  // 样式操作
  setStructure: (type: StructureType) => Command,
  toggleFold: () => Command,
  
  // 选择操作
  selectAll: () => Command,
  selectSiblings: () => Command,
  
  // 导航
  navigateUp: () => Command,
  navigateDown: () => Command,
  navigateLeft: () => Command,
  navigateRight: () => Command,
  
  // 历史
  undo: () => Command,
  redo: () => Command,
}
```

---

## 数据流示例

### 添加节点
```typescript
// 1. 用户操作
view.on('keydown', (e) => {
  if (e.key === 'Tab') {
    view.dispatch(commands.addTopic()(view.state, view.selection))
  }
})

// 2. 命令执行
function addTopic(): Command {
  return {
    execute(state, selection) {
      const parent = state.getTopic([...selection.selectedIds][0])
      if (!parent) return null
      
      const newTopic = createTopic({ title: 'New Topic' })
      return new Transaction(state)
        .addTopic(parent.id, newTopic)
        .setSelection(Selection.single(newTopic.id))
    }
  }
}

// 3. State 更新
const newState = transaction.apply()

// 4. View 更新
view.updateState(newState)
// → 计算新布局
// → 更新/创建 TopicView
// → 更新/创建 ConnectionView
// → 应用动画
```

### 缩放/平移
```typescript
// 用户操作
view.on('wheel', (e) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const center = { x: e.clientX, y: e.clientY }
  view.zoomTo(view.scale * delta, center)
})

// View 内部实现
zoomTo(scale: number, center: Point) {
  // 更新坐标系统
  this.coordinateSystem.zoom(scale, center)
  
  // 更新 Leafer 视口
  this.leafer.zoom = scale
  this.leafer.x = ...
  this.leafer.y = ...
}
```

---

## 与现有 Snowbrush 代码的映射

| Snowbrush | 新架构 |
|-----------|--------|
| `SheetModel` | `MindMapDocument` |
| `TopicModel` | `Topic` |
| `SheetEditor` | `EditorView` + `CommandManager` |
| `BranchView` | `TopicView` |
| `ConnectionView` | `ConnectionView` |
| `SvgView` | `EditorView` (Leafer) |
| `Layout` module | `LayoutEngine` |
| `SelectionManager` | `Selection` |
| `UndoManager` | `Transaction` (内置撤销) |
| `Action` | `Command` |
| `Structure` classes | `LayoutEngine` implementations |
| `Figure` + `RenderWorker` | `TopicView` (直接渲染) |
| `LazyRunner` | Leafer.js 内部优化 |

---

## Leafer.js 集成详解

### 1. 引擎初始化

```typescript
import { App, Leafer, Rect, Ellipse, Path, Text, Group } from 'leafer-ui'

// 创建 App 应用 (支持多层 Canvas)
const app = new App({
  // 视口配置
  view: document.getElementById('canvas-container'),
  width: 800,
  height: 600,
  
  // 缩放和平移
  zoom: { min: 0.1, max: 10 },
  move: { disabled: false },
  
  // 性能优化
  type: 'viewport',  // 视口模式，自动裁剪屏幕外元素
  
  // 多层渲染 (事件可穿透层)
  layers: [
    { name: 'background', type: 'draw' },      // 背景层 (无事件)
    { name: 'connection', type: 'draw' },       // 连线层 (无事件)
    { name: 'topic', type: 'platform' },        // 节点层 (支持事件)
    { name: 'overlay', type: 'platform' }       // 覆盖层 (选择框等)
  ]
})

// 或使用单个 Leafer 实例
const leafer = new Leafer({
  view: document.getElementById('canvas-container'),
  type: 'viewport'
})
```

### 2. 元素创建

```typescript
// 矩形节点
const topicShape = new Rect({
  x: 0, y: 0,
  width: 200, height: 80,
  fill: '#4A90D9',
  cornerRadius: 8,
  stroke: { color: '#2E6DB4', width: 2 },
  shadow: { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' }
})

// 椭圆节点
const ellipseTopic = new Ellipse({
  x: 100, y: 100,
  radiusX: 60, radiusY: 40,
  fill: '#FF6B6B'
})

// 文字
const titleText = new Text({
  x: 20, y: 20,
  text: 'Topic Title',
  fontSize: 14,
  fontFamily: 'Arial',
  fill: '#333333',
  textAlign: 'center',
  verticalAlign: 'middle'
})

// 路径 (连线)
const connection = new Path({
  path: 'M 0 0 C 50 0, 50 80, 100 80',  // 贝塞尔曲线
  stroke: { color: '#999999', width: 2 },
  fill: 'none'
})

// Group (节点容器)
const topicGroup = new Group({
  x: 100, y: 200
})
topicGroup.add(topicShape)
topicGroup.add(titleText)
```

### 3. 事件处理

```typescript
import { PointerEvent, DragEvent, KeyEvent } from 'leafer-ui'

// 点击事件
topicGroup.on(PointerEvent.CLICK, (e) => {
  console.log('Clicked:', e.target)
  // 阻止冒泡
  e.stop()
})

// 双击编辑
topicGroup.on(PointerEvent.DOUBLE_CLICK, (e) => {
  // 进入编辑模式
  startEditing(topic)
})

// 拖拽事件
topicGroup.draggable = true
topicGroup.on(DragEvent.START, (e) => {
  console.log('Drag start')
})
topicGroup.on(DragEvent.DRAG, (e) => {
  // 更新位置
  topicGroup.x += e.moveX
  topicGroup.y += e.moveY
})
topicGroup.on(DragEvent.END, (e) => {
  console.log('Drag end')
})

// 键盘事件
app.on(KeyEvent.DOWN, (e) => {
  if (e.key === 'Delete') {
    deleteSelectedTopics()
  }
})

// 悬停状态
topicGroup.on(PointerEvent.ENTER, (e) => {
  topicGroup.cursor = 'pointer'
  // 添加悬停效果
  topicShape.stroke = { color: '#FFD700', width: 3 }
})
topicGroup.on(PointerEvent.LEAVE, (e) => {
  topicShape.stroke = { color: '#2E6DB4', width: 2 }
})
```

### 4. 缩放和平移

```typescript
// 内置缩放平移 (viewport 模式自动支持)
// 鼠标滚轮缩放
// 鼠标拖拽平移

// 编程控制
app.zoom = 1.5  // 设置缩放
app.x = -100    // 设置平移
app.y = -200

// 适应内容
app.zoomToFit({
  padding: 40,
  maxZoom: 2
})

// 监听缩放变化
app.on(ZoomEvent.CHANGE, (e) => {
  console.log('Current zoom:', e.zoom)
})
```

### 5. 动画

```typescript
import { Animate } from 'leafer-ui'

// 元素动画
topicGroup.animate({
  x: 300,
  y: 200,
  opacity: 1,
  duration: 300,
  easing: 'ease-out'
})

// CSS 风格过渡
topicGroup.transition({
  x: { duration: 300, easing: 'ease-out' },
  y: { duration: 300, easing: 'ease-out' },
  opacity: { duration: 200 }
})

// 状态变化时自动过渡
topicGroup.state = 'selected'  // 触发 transition
```

### 6. 坐标转换

```typescript
// 本地坐标 ↔ 世界坐标
const localPoint = { x: 10, y: 20 }
const worldPoint = topicGroup.getWorldPoint(localPoint)

// 世界坐标 ↔ 屏幕坐标
const screenPoint = app.worldToScreen(worldPoint)
const backToWorld = app.screenToWorld(screenPoint)

// 获取元素包围盒
const bounds = topicGroup.getBounds('world')  // 世界坐标包围盒
const localBounds = topicGroup.getBounds('local')  // 本地坐标包围盒
```

### 7. 查找元素

```typescript
// 按 id 查找
const topic = app.findOne('#topic-123')

// 按条件查找
const selectedTopics = app.find((el) => el.data?.selected === true)

// 按类型查找
const allRects = app.find('Rect')

// 碰撞检测
const hitElement = app.pick({ x: 150, y: 200 })
```

### 8. 性能优化

```typescript
// 1. 局部渲染 (默认开启)
// 只重绘变化的区域

// 2. 批量操作
app.lock = true  // 锁定，暂停渲染
// ... 批量修改元素 ...
app.lock = false  // 解锁，触发一次渲染

// 3. 隐藏不可见元素
topicGroup.visible = false  // 不参与渲染和事件

// 4. 关闭事件 (纯展示层)
backgroundLayer.hittable = false

// 5. 使用 Group 嵌套
// 相关元素放在同一 Group，便于批量操作
```

---

## 实现优先级

### Phase 1: 核心 State
1. `Topic` - 节点数据模型
2. `MindMapDocument` - 文档模型
3. `Transaction` - 事务系统
4. `Selection` - 选择状态

### Phase 2: 基础 View
1. `EditorView` - 编辑器容器
2. `TopicView` - 节点渲染
3. `ConnectionView` - 连线渲染
4. 基础交互 (点击选择)

### Phase 3: 布局系统
1. `LayoutEngine` 接口
2. `MapLayout` 实现 (径向布局)
3. `TreeLayout` 实现 (树形布局)
4. 布局动画

### Phase 4: 完整功能
1. 命令系统
2. 键盘导航
3. 拖拽操作
4. 缩放/平移
5. 小地图

### Phase 5: 高级功能
1. 多选操作
2. 复制粘贴
3. 撤销/重做
4. 导入/导出
5. 主题系统

---

## 完整实现示例

### State 层 (纯数据)

```typescript
// state/topic.ts
export class Topic {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly children: ReadonlyArray<Topic> = [],
    public readonly style: TopicStyle = {},
    public readonly data: TopicData = {}
  ) {}
  
  addChild(child: Topic): Topic {
    return new Topic(
      this.id,
      this.title,
      [...this.children, child],
      this.style,
      this.data
    )
  }
  
  removeChild(id: string): Topic {
    return new Topic(
      this.id,
      this.title,
      this.children.filter(c => c.id !== id),
      this.style,
      this.data
    )
  }
  
  updateTitle(title: string): Topic {
    return new Topic(
      this.id,
      title,
      this.children,
      this.style,
      this.data
    )
  }
}

// state/document.ts
export class MindMapDocument {
  constructor(
    public readonly root: Topic,
    public readonly metadata: DocumentMetadata = {}
  ) {}
  
  apply(tr: Transaction): MindMapDocument {
    return tr.apply(this)
  }
  
  getTopic(id: string): Topic | null {
    return this.findTopic(this.root, id)
  }
  
  private findTopic(current: Topic, id: string): Topic | null {
    if (current.id === id) return current
    for (const child of current.children) {
      const found = this.findTopic(child, id)
      if (found) return found
    }
    return null
  }
}

// state/transaction.ts
export class Transaction {
  private steps: Step[] = []
  
  constructor(private doc: MindMapDocument) {}
  
  addTopic(parentId: string, topicData: TopicData): Transaction {
    const newTopic = new Topic(
      topicData.id,
      topicData.title,
      [],
      topicData.style,
      topicData.data
    )
    this.steps.push({
      type: 'add',
      parentId,
      topic: newTopic
    })
    return this
  }
  
  removeTopic(id: string): Transaction {
    this.steps.push({ type: 'remove', id })
    return this
  }
  
  updateTopic(id: string, changes: Partial<TopicData>): Transaction {
    this.steps.push({ type: 'update', id, changes })
    return this
  }
  
  apply(doc: MindMapDocument): MindMapDocument {
    let current = doc.root
    for (const step of this.steps) {
      current = this.applyStep(current, step)
    }
    return new MindMapDocument(current, doc.metadata)
  }
  
  private applyStep(topic: Topic, step: Step): Topic {
    // 递归应用变更...
  }
}
```

### View 层 (Leafer.js 渲染)

```typescript
// view/topic-view.ts
import { Group, Rect, Text, Path, PointerEvent, DragEvent } from 'leafer-ui'
import type { Topic } from '../state/topic'
import type { EditorView } from './editor-view'

export class TopicView {
  readonly group: Group
  private shape: Rect
  private titleText: Text
  private expandButton: Group | null = null
  private topic: Topic
  
  constructor(
    topic: Topic,
    private editor: EditorView,
    private layer: Leafer
  ) {
    this.topic = topic
    this.group = new Group({
      x: 0,
      y: 0,
      data: { topicId: topic.id }  // 关联数据
    })
    
    this.createShape()
    this.createTitle()
    this.createExpandButton()
    this.bindEvents()
    
    layer.add(this.group)
  }
  
  private createShape() {
    this.shape = new Rect({
      x: 0,
      y: 0,
      width: 200,
      height: 60,
      fill: this.topic.style.fill || '#4A90D9',
      cornerRadius: 8,
      stroke: {
        color: this.topic.style.borderColor || '#2E6DB4',
        width: 2
      }
    })
    this.group.add(this.shape)
  }
  
  private createTitle() {
    this.titleText = new Text({
      x: 20,
      y: 15,
      text: this.topic.title,
      fontSize: 14,
      fill: this.topic.style.textColor || '#333',
      width: 160,
      textAlign: 'center',
      verticalAlign: 'middle'
    })
    this.group.add(this.titleText)
  }
  
  private createExpandButton() {
    if (this.topic.children.length === 0) return
    
    this.expandButton = new Group({
      x: 190,
      y: 25,
      cursor: 'pointer'
    })
    
    const circle = new Ellipse({
      radiusX: 8,
      radiusY: 8,
      fill: '#fff',
      stroke: { color: '#999', width: 1 }
    })
    
    const minus = new Text({
      text: '-',
      fontSize: 12,
      fill: '#999',
      textAlign: 'center',
      verticalAlign: 'middle'
    })
    
    this.expandButton.add(circle)
    this.expandButton.add(minus)
    this.group.add(this.expandButton)
  }
  
  private bindEvents() {
    // 点击选择
    this.group.on(PointerEvent.CLICK, (e) => {
      e.stop()
      this.editor.selectTopic(this.topic.id)
    })
    
    // 双击编辑
    this.group.on(PointerEvent.DOUBLE_CLICK, (e) => {
      e.stop()
      this.editor.startEditing(this.topic.id)
    })
    
    // 拖拽
    this.group.draggable = true
    this.group.on(DragEvent.START, () => {
      this.editor.onTopicDragStart(this.topic.id)
    })
    this.group.on(DragEvent.DRAG, (e) => {
      this.editor.onTopicDrag(this.topic.id, e.moveX, e.moveY)
    })
    this.group.on(DragEvent.END, () => {
      this.editor.onTopicDragEnd(this.topic.id)
    })
    
    // 悬停效果
    this.group.on(PointerEvent.ENTER, () => {
      this.shape.stroke = { color: '#FFD700', width: 3 }
    })
    this.group.on(PointerEvent.LEAVE, () => {
      const isSelected = this.editor.isSelected(this.topic.id)
      this.shape.stroke = {
        color: isSelected ? '#FF6B6B' : '#2E6DB4',
        width: isSelected ? 3 : 2
      }
    })
  }
  
  update(topic: Topic) {
    this.topic = topic
    this.titleText.text = topic.title
    this.shape.fill = topic.style.fill || '#4A90D9'
    // ... 更新其他属性
  }
  
  setPosition(x: number, y: number) {
    this.group.x = x
    this.group.y = y
  }
  
  setSelected(selected: boolean) {
    this.shape.stroke = {
      color: selected ? '#FF6B6B' : '#2E6DB4',
      width: selected ? 3 : 2
    }
  }
  
  destroy() {
    this.group.remove()
  }
}
```

### EditorView (协调器)

```typescript
// view/editor-view.ts
import { App, Leafer } from 'leafer-ui'
import type { MindMapDocument } from '../state/document'
import type { Transaction } from '../state/transaction'
import type { Selection } from '../state/selection'
import { TopicView } from './topic-view'
import { ConnectionView } from './connection-view'
import { MapLayout } from '../transform/layout'

export class EditorView {
  private app: App
  private topicViews: Map<string, TopicView> = new Map()
  private connectionViews: Map<string, ConnectionView> = new Map()
  private layoutEngine: MapLayout
  
  private state: MindMapDocument
  private selection: Selection
  
  constructor(
    private container: HTMLElement,
    initialState: MindMapDocument
  ) {
    this.state = initialState
    this.layoutEngine = new MapLayout()
    
    this.app = new App({
      view: container,
      type: 'viewport',
      zoom: { min: 0.1, max: 10 }
    })
    
    this.render()
  }
  
  // 更新状态
  updateState(newState: MindMapDocument) {
    this.state = newState
    this.render()
  }
  
  // 分发事务
  dispatch(tr: Transaction) {
    const newState = this.state.apply(tr)
    this.updateState(newState)
  }
  
  // 渲染
  private render() {
    // 1. 计算布局
    const layout = this.layoutEngine.calculate(this.state)
    
    // 2. 更新/创建 TopicView
    this.updateTopicViews(layout)
    
    // 3. 更新/创建 ConnectionView
    this.updateConnectionViews(layout)
  }
  
  private updateTopicViews(layout: LayoutResult) {
    const existingIds = new Set(this.topicViews.keys())
    
    // 遍历布局结果
    layout.topics.forEach((topicLayout, topicId) => {
      existingIds.delete(topicId)
      
      const topic = this.state.getTopic(topicId)
      if (!topic) return
      
      let view = this.topicViews.get(topicId)
      if (view) {
        // 更新现有视图
        view.update(topic)
        view.setPosition(topicLayout.x, topicLayout.y)
      } else {
        // 创建新视图
        view = new TopicView(topic, this, this.app.tree)
        view.setPosition(topicLayout.x, topicLayout.y)
        this.topicViews.set(topicId, view)
      }
      
      // 更新选中状态
      view.setSelected(this.selection?.selectedIds.has(topicId) ?? false)
    })
    
    // 移除不存在的视图
    existingIds.forEach(id => {
      this.topicViews.get(id)?.destroy()
      this.topicViews.delete(id)
    })
  }
  
  // 选择操作
  selectTopic(id: string) {
    // 触发命令
    this.editor.dispatch(
      commands.setSelection(Selection.single(id))
    )
  }
  
  isSelected(id: string): boolean {
    return this.selection?.selectedIds.has(id) ?? false
  }
  
  // 编辑操作
  startEditing(id: string) {
    // 打开文本编辑器...
  }
  
  // 拖拽操作
  onTopicDragStart(id: string) { ... }
  onTopicDrag(id: string, dx: number, dy: number) { ... }
  onTopicDragEnd(id: string) { ... }
  
  // 视口操作
  zoomTo(scale: number) {
    this.app.zoom = scale
  }
  
  fitToContent() {
    this.app.zoomToFit({ padding: 40 })
  }
  
  destroy() {
    this.topicViews.forEach(v => v.destroy())
    this.connectionViews.forEach(v => v.destroy())
    this.app.destroy()
  }
}
```

### 完整使用示例

```typescript
import { MindMapDocument, Topic, Transaction, Selection } from './state'
import { EditorView } from './view'

// 1. 创建初始状态
const root = new Topic('root', 'Central Topic', [
  new Topic('1', 'Branch 1', [
    new Topic('1-1', 'Sub Topic 1'),
    new Topic('1-2', 'Sub Topic 2')
  ]),
  new Topic('2', 'Branch 2')
])
const doc = new MindMapDocument(root)

// 2. 创建视图
const container = document.getElementById('app')
const view = new EditorView(container, doc)

// 3. 用户交互 → 事务 → 更新
function addSubTopic(parentId: string) {
  const newTopic = new Topic(
    crypto.randomUUID(),
    'New Topic'
  )
  
  const tr = new Transaction(view.state)
    .addTopic(parentId, newTopic)
    .setSelection(Selection.single(newTopic.id))
  
  view.dispatch(tr)
}

// 4. 键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    const selectedId = [...view.selection.selectedIds][0]
    if (selectedId) {
      addSubTopic(selectedId)
    }
  }
})
```
