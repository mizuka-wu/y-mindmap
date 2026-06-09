# NodeView 体系修复方案

> 基于 y-mindmap 与 Snowbrush 的深度对比分析，针对 NodeView 体系的致命偏差制定修复方案。

## 核心问题

### 问题 1: 样式继承方向反了

**现状**: TopicNodeView 直接从 `this._node.style` 读样式
**目标**: 从 parent BranchNodeView 级联读取（与 Snowbrush 的 `styleManager.getStyleValue(this.parent(), key)` 一致）

**Snowbrush 逻辑**:
```typescript
// topicview.ts
refreshFillColor() {
  const parentBranchView = this.parent();
  let fillColor = styleManager.getStyleValue(parentBranchView, STYLE_KEYS.FILL_COLOR);
  this.figure.setOriginalFillColor(fillColor);
}

// branchview.ts - 级联刷新
refreshColorStyles() {
  this.refreshLineColor();
  this.topicView.refreshColorStyles();
  this.getChildrenBranchesByType(allType).forEach(childBranch => {
    childBranch.refreshColorStyles();
  });
}
```

**修复方案**:
- 新建 `packages/view/src/core/style-manager.ts`
- `TopicNodeView.applyPaint()` 改为从 parent BranchNodeView 读取样式
- `BranchNodeView` 新增 `cascadeRefreshStyles()` 向下递归刷新

### 问题 2: BranchNodeView 过于简化（90 行 vs Snowbrush 2505 行）

**缺失功能**:
- 子节点分类管理（attached/detached/summary/callout）
- Boundaries 管理
- Summaries 管理
- ConnectionView 管理
- 折叠/展开系统
- 事件系统（model change → view update）
- 结构系统（20+ 结构类）
- 位置/边界管理

**修复方案**: 直接在 BranchNodeView 中补齐，不引入额外 Figure 层。BranchNodeView 自行协调子系统。

### 问题 3: 更新编排缺失

**现状**: EditorView.render() 每次 dispatch 跑全量 layout + 全量 view 更新，DirtyFlag 形同虚设

**目标**: 增量更新 + 分 phase 验证 + 微任务批处理

**Snowbrush 方案参考**:
- LazyRunner 优先级队列: beforeEach → layout → afterLayout → render → afterRender
- 按类型分组执行: titles → markers → topics → branches → relationships → boundaries
- 微任务批处理（Promise.resolve()）
- 防重入守卫（isLayout flag）

**修复方案**:

```
Transaction → State.apply() → 分析变更 → 标脏受影响节点 → 调度更新
                                                                    ↓
                                                    Promise.resolve() 微任务批处理
                                                                    ↓
                                                    Phase 1: Layout（自底向上算尺寸，自顶向下定位）
                                                    Phase 2: Paint（只更新 dirty 的）
                                                    Phase 3: Connections
                                                    Phase 4: Selection
```

关键点:
1. **自底向上标脏**: 子节点 invalidate → 向上传播到祖先
2. **自顶向下验证**: 先 layout 父节点（确定位置），再 layout 子节点
3. **Layout 和 Paint 分 phase**: layout 完全结束后才开始 paint
4. **增量 layout**: 只重算 dirty 子树，复用 cache
5. **防重入**: `_forbidInvalidateLayout` 守卫防止无限循环

### 问题 4: 不需要响应式系统

y-mindmap 是 Transaction 驱动（`tr → state.apply() → view.update()`），不是 Model 驱动。
脏标记 + 显式 invalidation 是正确方案，不需要 MobX/Vue reactivity。

---

## 修复路线图

### Phase 1: 更新编排基础设施（最高优先级）

**文件变更**:
- `packages/view/src/core/node-view.ts` — 完善 DirtyFlag 使用，确保 invalidate/validate 链正确
- `packages/view/src/editor-view.ts` — 引入微任务批处理、分 phase 验证、增量更新

**具体改动**:

1. EditorView 引入更新调度:
   - `dispatch()` 只做: state.apply + 分析变更 + 标脏 + scheduleUpdate
   - `scheduleUpdate()` 用 `Promise.resolve()` 批处理
   - `performUpdate()` 分 phase: layout → paint → connections → selection

2. 增量 layout:
   - `layoutEngine.calculate()` 接受 dirtyNodes 集合
   - 只重算 dirty 子树，复用 cache
   - dirtyNodes 为空时跳过 layout

3. Layout 分两步:
   - 自底向上: `calculatePreferredSize()` 从叶节点开始算尺寸
   - 自顶向下: `applyLayout()` 从根节点开始分配位置

### Phase 2: 样式继承修复

**文件变更**:
- 新建 `packages/view/src/core/style-manager.ts`
- `packages/view/src/node-views/topic-node-view.ts` — 改样式读取来源
- `packages/view/src/node-views/containers/branch-node-view.ts` — 添加级联刷新

**具体改动**:

1. StyleManager:
   - `getStyleValue(nodeView, key)` — 从 parent branch 读取
   - `cascadeRefreshStyles(branch)` — 向下递归刷新 topic + 子 branch

2. TopicNodeView:
   - `applyPaint()` 中所有样式读取改为通过 StyleManager 从 parent 读取
   - `refreshVisualFillColor()` 颜色混合逻辑

3. BranchNodeView:
   - `refreshColorStyles()` — 刷新自身 lineColor + 递归刷新子节点
   - 样式变更时触发 `cascadeRefreshStyles()`

### Phase 3: BranchNodeView 扩展

**文件变更**:
- `packages/view/src/node-views/containers/branch-node-view.ts` — 大幅扩展
- 新建 `packages/view/src/node-views/boundary-node-view.ts`
- 新建 `packages/view/src/node-views/summary-node-view.ts`
- 新建 `packages/view/src/node-views/collapse-extend-node-view.ts`

**具体改动**:

1. 子节点分类管理:
   - `_attachedChildren`, `_detachedChildren`, `_summaryChildren`, `_calloutChildren`
   - `addChildBranch(child, type)` / `removeChildBranch(child, type)`
   - `getChildrenByType(type)`

2. Boundaries 管理:
   - `_boundaries: BoundaryNodeView[]`
   - `addBoundary()` / `removeBoundary()`
   - 监听 model 的 `addBoundary` / `removeBoundary` 事件

3. Summaries 管理:
   - `_summaries: SummaryNodeView[]`
   - `addSummary()` / `removeSummary()`

4. 折叠系统:
   - `setCollapsed(collapsed)` — 触发布局更新
   - `shouldHide()` — 递归判断是否被父节点折叠隐藏
   - `collapseExtendView` — 折叠按钮视图

5. 事件系统:
   - 监听 model 变更: `addTopic`, `removeTopic`, `moveChildTopic`, `addBoundary`, `removeBoundary`, `addSummary`, `removeSummary`, `changeStructureClass`, `change:branch`
   - 事件处理 → 对应的 view 操作 + 标脏

6. ConnectionView 管理:
   - `_connectionView: ConnectionNodeView`
   - 连线的创建/更新/销毁

---

## 不做的事情

1. **不引入 Figure 抽象层** — Figure 的职责由 NodeView 直接承担
2. **不引入响应式系统** — Transaction 驱动，脏标记 + 显式 invalidation 足够
3. **不引入 MobX/Vue reactivity** — 与当前架构理念不符

## 验证标准

修复完成后，以下场景应与 Snowbrush 渲染一致:
1. 基础 map 结构：topic 样式从 branch 级联读取，连线正确绘制
2. 折叠/展开：子节点正确隐藏/显示，连线更新
3. 添加/删除子节点：增量更新，不全量重绘
4. 样式变更：级联向下刷新，不影响未变更的子树
