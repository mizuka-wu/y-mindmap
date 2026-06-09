# y-mindmap 设计审查与 Bug 清单

> 参考 snowbrush（XMind 渲染引擎）架构对比分析
> 生成时间: 2026-06-09

---

## 目录

1. [架构设计问题](#一架构设计问题)
2. [State 层 Bug](#二state-层-bug)
3. [View 层 Bug](#三view-层-bug)
4. [Layout 层 Bug](#四layout-层-bug)
5. [Commands 层 Bug](#五commands-层-bug)
6. [其他问题](#六其他问题)

---

## 一、架构设计问题

### 1.1 缺少独立的 Interaction 层

| 项目 | 现状 |
|------|------|
| **snowbrush** | 有独立的 `@mindmap/interaction` 包，交互逻辑与渲染完全分离 |
| **y-mindmap** | `EditorView` 一个类 1700+ 行，硬编码了拖拽、框选、右键菜单、富文本编辑等所有交互**实现**代码 |

> **注：** `extensions/` 目录已经存在 `DragDrop`、`ContextMenu`、`BoxSelect` 等扩展，但它们只是薄层开关——调用 `view.initDragDrop()` / `view.destroyDragDrop()`，真正的事件监听、命中测试、transaction 生成逻辑仍全部在 `EditorView` 内部。

**影响：**

- 严重违反单一职责原则
- 无法独立测试交互逻辑（extension 只是开关，没有实现）
- 无法支持不同的输入方式（键盘、触摸、MCP 等）
- 无法实现交互插件的热插拔（只能开关已有的硬编码功能）

**相关文件：**

- `EditorView` 交互实现：`@/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:701-1100`
- Extension 开关层：`@/Users/mizuka/Projects/y-mindmap/extensions/src/extensions/`

---

### 1.2 State/View 分离不彻底

**snowbrush 设计模式：**

```
User Action → Command → Transaction → State.apply() → View.update()
```

**y-mindmap 问题：**

- `EditorView.dispatch()` 直接修改 `this.state`，没有统一的事件总线
- `setState()` 和 `dispatch()` 职责边界模糊
- 缺少 `@mindmap/editor` 组装层，View 直接承担了协调器角色

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:220-243`

---

### 1.3 NodeView 渲染管线 ✅ 设计意图

**说明：** `NodeView` 直接承担渲染管线的职责是**有意设计**，而非架构缺失。`DirtyFlag` 的验证机制（`validateLayout` → `validatePaint`）已经覆盖了脏标记和批处理的基础能力。

**与 snowbrush 的区别：**

| 层级 | snowbrush | y-mindmap |
|------|-----------|-----------|
| 脏标记 | `LazyRunner` 统一调度 | `NodeView.validate()` 自驱 |
| 渲染拆分 | `RenderWorker` + `LayoutWorker` | `calculatePreferredSize` + `applyLayout` + `applyPaint` |

**当前限制（非 Bug）：**

- `DirtyFlag` 已有但缺少类似 `LazyRunner` 的**统一帧调度器**，大量节点同时 dirty 时可能帧率下降
- 缺少 `RenderWorker` 的**Worker 线程渲染**能力（大图导出等场景会阻塞主线程）

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/view/src/core/node-view.ts:41-530`

---

### 1.4 `MindMapDocument` 数据结构不完整 ✅ 已修复（引入 Sheet 类）

**snowbrush 的 `SheetModel` 包含：**

- `rootTopic`
- `relationships`
- `theme`
- `boundaries`
- `summaries`
- `legend`
- `metadata`

**y-mindmap 的 `MindMapDocument` 仅有 `root` 节点。**

**影响：** 关系线、边界、摘要等虽有独立类，但没有真正集成到文档模型中，难以支持文档级操作。

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/state/src/mind-map-document.ts:1-155`

---

### 1.5 缺少多 Sheet/Workbook 支持 🔴 ✅ 已修复（单 Sheet 数据结构已就绪）

**snowbrush 架构：**

```
WorkbookModel (多个 Sheet)
  ├── SheetModel #1 (rootTopic + relationships + theme + ...)
  ├── SheetModel #2
  └── SheetModel #3
```

**y-mindmap 现状：**
只有单一的 `MindMapDocument`，没有 `Workbook` 或 `Sheet` 概念。`MindMapEditor` 直接持有 `EditorState`，`EditorState` 直接持有 `MindMapDocument`。

**具体缺失：**

1. **没有 Sheet 抽象层**
   - `MindMapDocument` 即等于一个 Sheet，但没有 id、title、元数据
   - 无法支持多个 Sheet 的切换、增删、重命名

2. **没有 Workbook 容器**
   - 无法加载包含多个 Sheet 的 XMind 文件
   - 无法保存多 Sheet 结构到 JSON/XMind

3. **序列化层面断裂**
   - `SheetData` 接口已存在于 `@y-mindmap/core`，但没有任何类使用它
   - `MindMapDocument.toJSON()` 返回 `TopicData`，不是 `SheetData`

4. **UI 层面缺失**
   - 没有 Sheet 标签栏（Tab bar）
   - 没有 Sheet 右键菜单（重命名、删除、复制）

5. **与 1.4 的关联**
   - 修复 1.4 引入 `Sheet` 类后，`Workbook` 应该是 `Sheet[]` 的容器
   - 需要决定：先只支持单 Sheet（但数据结构预留多 Sheet），还是直接实现多 Sheet UI

**设计决策待确认：**

- `EditorState` 持有 `Sheet` 还是 `Workbook`？
- `Transaction` 是否支持跨 Sheet 操作（如剪切粘贴）？
- 文件格式：JSON 是否需要从 `TopicData` 升级为 `SheetData[]`？

---

## 二、State 层 Bug

### 2.1 `MindMapNode.toData()` 丢失字段 🔴 ✅ 已修复

**问题：** `toData()` 方法中缺少 `attachments`、`mathFormulas`、`codeBlocks` 字段的序列化。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/state/src/mind-map-node.ts:372-389
get toData(): TopicData {
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
    // ❌ 缺少: attachments, mathFormulas, codeBlocks
  }
}
```

**影响：** 序列化/反序列化会丢失附件、数学公式、代码块数据。

---

### 2.2 `MindMapNode` 缺少 `parent` 引用

**snowbrush：** `BaseComponent` 提供 `parent`/`owner` 引用，查找父节点 O(1)。

**y-mindmap：** 每次 `findParent` 都需要遍历整棵树，O(n)。

**相关文件：**

- `@/Users/mizuka/Projects/y-mindmap/packages/state/src/mind-map-document.ts:15-31`
- `@/Users/mizuka/Projects/y-mindmap/packages/state/src/mind-map-node.ts:171-179`

---

### 2.3 `Selection` 缺少 `range` 工厂方法

**问题：** 构造函数中定义了 `range` 类型，但 `Selection` 类缺少 `Selection.range(anchor, focus)` 静态方法。

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/state/src/selection.ts:1-123`

---

### 2.4 `Transaction.setDoc()` 历史记录膨胀风险

**问题：** `setDoc` 会序列化整个文档到 step 中，对于大文档历史栈会急剧膨胀。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/state/src/editor-state.ts:76-80
setDoc(doc: MindMapDocument): Transaction {
  this._doc = doc;
  this._steps.push({ type: "setDoc", doc: doc.toJSON() });  // ❌ 全量序列化
  return this;
}
```

---

## 三、View 层 Bug

### 3.1 `TopicNodeView.applyLayout()` 重复赋值 Bug 🔴 ✅ 已修复

**问题：** Ellipse 形状处理中重复设置了 `width`。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/view/src/node-views/topic-node-view.ts:88-93
} else if (this.shape instanceof Ellipse) {
  this.shape.x = width / 2
  this.shape.y = height / 2
  this.shape.width = width
  this.shape.width = width   // ❌ 重复设置 width，应该设置其他属性（如 radiusX/radiusY）
  this.shape.height = height
}
```

---

### 3.2 `NodeViewFactory` 的 View 缓存 key 策略有风险

**问题：** 返回已缓存的 view 时不检查是否已 dispose。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/view/src/node-views/node-view-factory.ts:195-204
private getOrCreate(type: NodeViewType, key: string, factory: () => NodeView): NodeView {
  const cache = this.viewCaches.get(type)!
  const existing = cache.get(key)
  if (existing) {
    return existing   // ❌ 不检查 existing 是否已 dispose
  }
```

**影响：** 如果 view 被 `destroy()` 但缓存未清理，再次获取时可能返回已销毁的 view。

---

### 3.3 `clientToWorld` 坐标转换可能不准确 ✅ 已修复（使用 Leafer getInnerPoint）

**问题：** 假设 Leafer.js 的视口变换只是简单的平移+缩放，但 Leafer 可能有更复杂的变换矩阵。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:690-696
clientToWorld(clientX: number, clientY: number): Point {
  const rect = this.container.getBoundingClientRect()
  const viewportX = clientX - rect.left
  const viewportY = clientY - rect.top
  const worldX = (viewportX - (this.app.x ?? 0)) / ((this.app as any).zoom ?? 1)
  const worldY = (viewportY - (this.app.y ?? 0)) / ((this.app as any).zoom ?? 1)
  return { x: worldX, y: worldY }
}
```

**建议：** 应该使用 Leafer 提供的 `worldToScreen`/`screenToWorld` 方法。

---

### 3.4 `getNodeAtPoint` 和 `_findNodeIdAtPoint` 逻辑不一致 ✅ 已修复

| 方法 | 使用的坐标 |
|------|-----------|
| `_findNodeIdAtPoint` | `getAbsoluteBounds()`（考虑父级偏移） |
| `getNodeAtPoint` | `getBounds()`（局部坐标） |

**影响：** 命中测试可能给出错误结果。

**相关文件：**

- `@/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:754-767`
- `@/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:1330-1344`

---

### 3.5 `contextmenu` 事件监听器泄漏风险 ✅ 已修复

**问题：** `_showContextMenu` 中注册了 document 级别的 click/keydown 监听器，如果组件在菜单打开期间被销毁，这些监听器不会被清理。

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:1199-1237`

---

### 3.6 `_onEditBlur` 竞态条件

**问题：** 使用 `setTimeout` 延迟保存，在快速切换编辑目标时可能导致状态不一致。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/view/src/editor-view.ts:1689-1690
private _onEditBlur(): void {
  setTimeout(() => this.stopEditing(true), 0)
}
```

---

## 四、Layout 层 Bug

### 4.1 `TimelineLayoutEngine.calculateChildren` 子节点重叠 Bug 🔴 ✅ 已修复

**问题：** 循环中 `currentPos` 没有递增，所有子节点重叠在同一位置。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/layout/src/layout-engine.ts:800-843
let currentPos = this.orientation === 'horizontal'
  ? parentLayout.x + parentLayout.width + options.horizontalSpacing
  : parentLayout.y + parentLayout.height + options.verticalSpacing

for (const child of children) {
  const childLayout = this.calculateNodeLayout(child, options)
  if (this.orientation === 'horizontal') {
    childLayout.x = currentPos
    childLayout.y = parentLayout.y
  } else {
    childLayout.x = parentLayout.x
    childLayout.y = currentPos
  }
  // ❌ 循环结束后 currentPos 没有增加，所有子节点重叠！
}
```

---

### 4.2 `MapLayoutEngine` 增量布局缓存逻辑有缺陷 ✅ 已修复

**问题：** 如果没有 `dirtyNodes` 但文档结构已改变（节点增删），会直接返回过期缓存。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/layout/src/layout-engine.ts:32-43
calculate(root: MindMapNode, options?: LayoutOptions, dirtyNodes?: Set<string>): LayoutResult {
  if (!dirtyNodes || dirtyNodes.size === 0) {
    if (this._cache.size > 0) {
      return { nodes: new Map(this._cache), ... }  // ❌ 可能返回过期缓存
    }
  }
```

**影响：** `EditorView` 调用 `layoutEngine.calculate(root)` 时没有传 `dirtyNodes`，连接视图更新总是用全量计算，但 topic 布局却可能用缓存——导致不一致。

---

### 4.3 多个 LayoutEngine 不支持增量布局

`TreeLayoutEngine`、`FishboneLayoutEngine`、`TimelineLayoutEngine` 的 `calculate` 方法完全忽略 `dirtyNodes` 参数，每次调用都重新计算全部。

**相关文件：** `@/Users/mizuka/Projects/y-mindmap/packages/layout/src/layout-engine.ts:451-870`

---

### 4.4 `calculateNodeLayout` 的 `childrenBounds` 始终为 0 ✅ 已修复（calculate 后统一递归更新）

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/layout/src/layout-engine.ts:113-125
private calculateNodeLayout(node: MindMapNode, options: LayoutOptions): NodeLayout {
  return {
    id: node.id,
    x: 0,
    y: 0,
    width,
    height,
    childrenBounds: { x: 0, y: 0, width: 0, height: 0 },  // ❌ 始终为 0
  }
}
```

**影响：** `childrenBounds` 接口存在但从未被正确计算和填充。

---

## 五、Commands 层 Bug

### 5.1 `undo`/`redo` 命令历史栈风险 🔴 ✅ 已修复

**问题：** undo 后再次 dispatch transaction，增加了不必要的复杂性和潜在的死循环风险。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/commands/src/commands.ts:216-241
export function undo(): Command {
  return (state, dispatch) => {
    if (!state.canUndo()) return false;
    const newState = state.undo();  // 已经 undo 一次
    if (dispatch) {
      const tr = newState.tr;
      tr.setMeta("source", "undo");
      dispatch(tr);  // ❌ 再次 dispatch 会触发 History.push
    }
    return true;
  };
}
```

---

### 5.2 `deleteNode` 选择逻辑 Bug ✅ 已修复

**问题：** `tr.removeNode(id)` 修改了 `tr._doc`，但 `state.doc.findParent(lastValidId)` 使用的是原始 `state.doc`，不是更新后的 `tr.doc`。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/commands/src/commands.ts:64-92
export function deleteNode(nodeId?: string): Command {
  return (state, dispatch) => {
    for (const id of ids) {
      tr.removeNode(id);  // 修改了 tr._doc
      lastValidId = id;
    }
    if (lastValidId) {
      const parent = state.doc.findParent(lastValidId);  // ❌ 使用原始 doc，节点可能已不在
```

**影响：** 删除多个节点时，最后一个节点的父节点可能已经被前面的删除操作改变了结构。

---

## 六、其他问题

### 6.1 测试覆盖率极低

| 文件 | 代码行数 | 测试覆盖 |
|------|---------|---------|
| `EditorView` | 1700+ | ❌ 零测试 |
| `commands.ts` | 360 | ❌ 零测试 |
| `diff.ts` | 200 | ❌ 零测试 |
| `mind-map-node.ts` | 423 | ⚠️ 基础测试 |
| `layout-engine.ts` | 870 | ⚠️ 基础测试 |

---

### 6.2 边界/摘要的 range 解析脆弱 ✅ 已修复

**问题：** 使用正则解析固定格式字符串，健壮性差。

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/state/src/boundary.ts:24-31
getRangeStart(): number {
  const match = this.range.match(/\((\d+),/)
  return match && match[1] ? parseInt(match[1]) : 0
}
```

**建议：** 使用结构化数据而不是字符串。

---

### 6.3 `NodeView._sharedScheduler` 静态单例的潜在内存泄漏

```typescript
// @/Users/mizuka/Projects/y-mindmap/packages/view/src/core/node-view.ts:526
private static _sharedScheduler: AnimationScheduler = new AnimationScheduler()
```

**问题：** 作为静态单例，所有动画都注册在同一个调度器中，大量节点同时动画时可能导致内存泄漏或性能下降。

---

## 优先级汇总

| 优先级 | 问题 | 影响 |
|--------|------|------|
| 🔴 P0 | Timeline 布局子节点重叠 | 功能完全不可用 |
| 🔴 P0 | `undo`/`redo` 历史栈风险 | 数据可能损坏 |
| 🔴 P0 | `deleteNode` 选择逻辑 Bug | 删除后选择状态错误 |
| 🔴 P0 | `toData()` 丢失字段 | 数据序列化不完整 |
| 🟡 P1 | `MapLayoutEngine` 缓存逻辑 | 布局不一致 |
| 🟡 P1 | `clientToWorld` 坐标转换 | 交互命中偏移 |
| 🟡 P1 | `TopicNodeView.applyLayout()` 重复赋值 | Ellipse 渲染异常 |
| 🟡 P1 | `NodeViewFactory` 缓存策略 | 可能返回已销毁 view |
| 🟡 P1 | 缺少 Interaction 层 | 可测试性差 |
| 🟡 P1 | 缺少 Figure 渲染管线 | 扩展性差 |
| 🟢 P2 | 测试覆盖率极低 | 维护困难 |
| 🟢 P2 | 缺少 parent 引用 | 性能/API 体验 |
| 🟢 P2 | range 解析脆弱 | 健壮性 |
| 🟢 P2 | 缺少 Workbook 层 | 功能缺失 |

---

*文档结束，共 16 项问题*
