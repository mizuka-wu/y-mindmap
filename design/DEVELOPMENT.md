# MindMap Editor 开发文档

## 项目概述

基于 Leafer.js 的思维导图编辑器，采用 ProseMirror 风格的 state/view 分离架构。

**技术栈**:
- 包管理: pnpm workspace + turborepo
- 渲染引擎: Leafer.js (Canvas)
- 语言: TypeScript
- 构建: Vite

---

## 一、Monorepo 包结构

```
mindmap-editor/
├── packages/
│   ├── core/              # @mindmap/core
│   ├── state/             # @mindmap/state
│   ├── interaction/       # @mindmap/interaction
│   ├── view/              # @mindmap/view
│   ├── layout/            # @mindmap/layout
│   ├── commands/          # @mindmap/commands
│   └── editor/            # @mindmap/editor
├── apps/
│   └── demo/              # 演示应用
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 包依赖关系

```
@mindmap/core           ← 所有包依赖 (类型定义)
    ↑
@mindmap/state          ← 纯数据层
    ↑
@mindmap/interaction    ← 交互抽象层
    ↑
@mindmap/commands       ← 命令层
    ↑
@mindmap/layout         ← 布局引擎
    ↑
@mindmap/view           ← 渲染层 (Leafer.js)
    ↑
@mindmap/editor         ← 编辑器组装层
```

---

## 二、各包详细设计

### 2.1 @mindmap/core

**职责**: 定义所有包共享的类型、接口、常量

**依赖**: 无外部依赖

**功能模块**:

#### 2.1.1 数据类型
- `TopicData` - 节点数据结构
- `SheetData` - Sheet 数据结构
- `RelationshipData` - 关系线数据结构
- `BoundaryData` - 边界数据结构
- `SummaryData` - 摘要数据结构
- `StyleData` - 样式数据结构
- `ThemeData` - 主题数据结构
- `MarkerData` - 标记数据结构
- `ImageData` - 图片数据结构
- `NotesData` - 备注数据结构

#### 2.1.2 枚举常量
- `TOPIC_TYPE` - 节点类型 (attached/detached/summary/callout/root)
- `STRUCTURE_TYPE` - 结构类型 (map/tree/logic/org-chart/fishbone/timeline 等)
- `SHAPE_TYPE` - 形状类型 (rect/rounded-rect/ellipse/diamond/cloud 等)
- `CONNECTION_STYLE` - 连线样式 (curve/straight/elbow/horn/sinus 等)
- `MARKER_TYPE` - 标记类型 (priority/flag/smile 等)

#### 2.1.3 接口定义
- `Point` - 坐标点 { x, y }
- `Size` - 尺寸 { width, height }
- `Bounds` - 边界 { x, y, width, height }
- `EdgeInsets` - 内边距 { top, right, bottom, left }
- `Command` - 命令接口
- `LayoutEngine` - 布局引擎接口
- `InteractionHandler` - 交互处理器接口

---

### 2.2 @mindmap/state

**职责**: 纯数据模型层，不可变数据结构，所有变更通过 Transaction

**依赖**: @mindmap/core

**功能模块**:

#### 2.2.1 Topic (节点)
- 创建节点
- 添加/移除子节点
- 更新节点属性 (标题、样式、数据)
- 查询节点 (按 id、按条件)
- 遍历节点树 (深度优先、广度优先)
- 获取节点路径
- 获取节点深度
- 获取兄弟节点

#### 2.2.2 MindMapDocument (文档)
- 创建文档
- 获取根节点
- 按 id 查找节点
- 按条件查找节点
- 应用事务
- 序列化 (toJSON)
- 反序列化 (fromJSON)

#### 2.2.3 Transaction (事务)
- 添加节点
- 移除节点
- 更新节点
- 移动节点 (改变父节点)
- 复制节点
- 设置样式
- 设置结构类型
- 批量操作
- 生成撤销/重做数据

#### 2.2.4 Selection (选择)
- 创建选择 (空/单选/多选/范围)
- 添加/移除选中节点
- 切换选中状态
- 全选/反选
- 获取选中节点列表
- 判断是否选中

#### 2.2.5 History (历史记录)
- 记录事务
- 撤销
- 重做
- 获取撤销/重做栈
- 清空历史

#### 2.2.6 Relationship (关系)
- 创建关系 (连接两个节点)
- 更新关系样式
- 删除关系
- 获取关系的起止节点

#### 2.2.7 Boundary (边界)
- 创建边界 (包含一组节点)
- 更新边界范围
- 删除边界

#### 2.2.8 Summary (摘要)
- 创建摘要 (关联一组节点)
- 更新摘要范围
- 删除摘要

---

### 2.3 @mindmap/interaction

**职责**: 交互逻辑抽象层，处理用户输入，生成命令

**依赖**: @mindmap/core, @mindmap/state

**设计原则**:
- 交互逻辑与渲染完全分离
- 交互处理器只关心输入事件，不关心 DOM/Canvas
- 所有交互结果通过 Command 表达
- 可独立测试

**功能模块**:

#### 2.3.1 事件类型定义
- `PointerEvent` - 指针事件 (点击、双击、悬停)
- `DragEvent` - 拖拽事件 (开始、进行中、结束)
- `KeyEvent` - 键盘事件 (按下、释放)
- `WheelEvent` - 滚轮事件
- `GestureEvent` - 手势事件 (缩放、旋转)

#### 2.3.2 交互处理器

**选择交互**:
- 点击选择单个节点
- Ctrl+点击 多选
- Shift+点击 范围选择
- 框选 (拖拽选择区域)
- 点击空白处取消选择

**编辑交互**:
- 双击进入编辑模式
- Enter 确认编辑
- Escape 取消编辑
- Tab 添加子节点
- Enter 添加兄弟节点
- Delete/Backspace 删除节点

**导航交互**:
- 方向键切换选中节点
- Tab 跳转到子节点
- Shift+Tab 跳转到父节点
- Home 跳转到根节点
- End 跳转到当前分支最后一个节点

**拖拽交互**:
- 拖拽节点移动位置
- 拖拽节点到其他节点 (改变父节点)
- 拖拽节点排序
- 拖拽时显示放置位置提示

**视口交互**:
- 鼠标滚轮缩放
- 触摸板手势缩放
- 鼠标拖拽平移视口
- 触摸板双指平移
- 点击空白处拖拽平移

**样式交互**:
- 快捷键切换折叠/展开
- 右键菜单 (上下文菜单)

#### 2.3.3 交互状态管理
- 当前选中节点
- 当前编辑节点
- 拖拽状态 (拖拽中、放置目标)
- 视口状态 (缩放比例、平移位置)
- 焦点状态

#### 2.3.4 快捷键映射
- 可配置的快捷键绑定
- 快捷键冲突检测
- 平台适配 (Mac/Windows/Linux)

---

### 2.4 @mindmap/view

**职责**: Canvas 渲染层，将 State 映射到 Leafer.js 元素

**依赖**: @mindmap/core, @mindmap/state, leafer-ui

**功能模块**:

#### 2.4.1 引擎管理
- 初始化 Leafer.js App
- 管理多层 Canvas (background/connection/topic/overlay)
- 处理窗口大小变化
- 销毁引擎

#### 2.4.2 元素创建

**TopicView (节点视图)**:
- 创建节点形状 (Rect/Ellipse/Path)
- 创建标题文字 (Text)
- 创建展开/折叠按钮
- 创建标记图标 (Image)
- 创建图片元素
- 创建备注图标
- 创建编号文字
- 创建选择框
- 创建拖拽阴影

**ConnectionView (连线视图)**:
- 创建连线路径 (Path)
- 支持多种连线样式 (曲线/直线/肘线/圆角等)
- 连线动画

**BoundaryView (边界视图)**:
- 创建边界矩形
- 边界标题

**SummaryView (摘要视图)**:
- 创建摘要括号
- 摘要连线

**RelationshipView (关系视图)**:
- 创建自由连线
- 关系标题
- 控制点拖拽

**OverlayView (覆盖层)**:
- 选择框
- 拖拽占位符
- 框选矩形
- 编辑输入框

#### 2.4.3 视图更新
- 增量更新 (只更新变化的元素)
- 批量更新 (锁定/解锁渲染)
- 过渡动画

#### 2.4.4 坐标转换
- 文档坐标 ↔ 屏幕坐标
- 节点坐标 ↔ 文档坐标
- 视口坐标 ↔ 屏幕坐标

#### 2.4.5 视口控制
- 缩放到指定比例
- 平移到指定位置
- 适应内容
- 聚焦到节点
- 平滑动画

#### 2.4.6 主题系统
- 应用主题
- 动态切换主题
- 自定义主题

---

### 2.5 @mindmap/layout

**职责**: 布局引擎，计算节点位置和连线路径

**依赖**: @mindmap/core, @mindmap/state

**功能模块**:

#### 2.5.1 布局接口
- `calculateLayout(doc)` → `LayoutResult`
- `LayoutResult` 包含所有节点位置和连线路径

#### 2.5.2 布局算法

**Map (径向布局)**:
- 中心节点居中
- 子节点向两侧展开
- 支持顺时针/逆时针
- 支持平衡/非平衡模式

**Tree (树形布局)**:
- 向右展开
- 向左展开
- 左右展开

**Logic (逻辑布局)**:
- 向右逻辑
- 向左逻辑
- 左右逻辑

**OrgChart (组织图)**:
- 向下展开
- 向上展开
- 上下展开

**Fishbone (鱼骨图)**:
- 左头鱼骨
- 右头鱼骨
- 上下骨

**Timeline (时间线)**:
- 水平时间线
- 垂直时间线
- 侧向时间线

**Spreadsheet (表格)**:
- 行布局
- 列布局

**Brace (括号)**:
- 左括号
- 右括号
- 左右括号

#### 2.5.3 布局计算
- 节点尺寸计算 (根据内容)
- 节点间距计算
- 子节点定位
- 连线路径计算 (贝塞尔曲线/直线)
- 边界框计算
- 碰撞检测

#### 2.5.4 布局缓存
- 缓存布局结果
- 增量布局 (只重新计算变化的部分)
- 布局动画

---

### 2.6 @mindmap/commands

**职责**: 命令系统，封装可执行的操作

**依赖**: @mindmap/core, @mindmap/state, @mindmap/interaction

**功能模块**:

#### 2.6.1 命令接口
- `execute(state, selection)` → `Transaction | null`
- `isEnabled(state, selection)` → `boolean`
- `isActive(state, selection)` → `boolean`

#### 2.6.2 节点命令
- `addSubTopic` - 添加子节点
- `addSiblingTopic` - 添加兄弟节点
- `addParentTopic` - 添加父节点
- `deleteTopic` - 删除节点
- `duplicateTopic` - 复制节点
- `moveTopicUp` - 上移节点
- `moveTopicDown` - 下移节点
- `moveTopicLeft` - 左移节点 (改变父节点)
- `moveTopicRight` - 右移节点 (改变父节点)

#### 2.6.3 编辑命令
- `startEditing` - 进入编辑模式
- `finishEditing` - 完成编辑
- `cancelEditing` - 取消编辑
- `updateTitle` - 更新标题

#### 2.6.4 选择命令
- `selectNode` - 选择节点
- `selectAll` - 全选
- `deselectAll` - 取消全选
- `selectParent` - 选择父节点
- `selectFirstChild` - 选择第一个子节点
- `selectNextSibling` - 选择下一个兄弟节点
- `selectPreviousSibling` - 选择上一个兄弟节点

#### 2.6.5 样式命令
- `setStructure` - 设置结构类型
- `setShape` - 设置形状
- `setFillColor` - 设置填充颜色
- `setBorderColor` - 设置边框颜色
- `setTextColor` - 设置文字颜色
- `setFontFamily` - 设置字体
- `setFontSize` - 设置字号
- `toggleBold` - 切换粗体
- `toggleItalic` - 切换斜体

#### 2.6.6 折叠命令
- `toggleFold` - 切换折叠/展开
- `foldAll` - 全部折叠
- `unfoldAll` - 全部展开
- `foldToLevel` - 折叠到指定层级

#### 2.6.7 视口命令
- `zoomIn` - 放大
- `zoomOut` - 缩小
- `zoomToFit` - 适应内容
- `zoomToSelection` - 适应选中
- `resetZoom` - 重置缩放
- `panToNode` - 平移到节点

#### 2.6.8 历史命令
- `undo` - 撤销
- `redo` - 重做

#### 2.6.9 剪贴板命令
- `copy` - 复制
- `cut` - 剪切
- `paste` - 粘贴
- `pasteAsChild` - 粘贴为子节点

#### 2.6.10 关系命令
- `addRelationship` - 添加关系
- `deleteRelationship` - 删除关系
- `updateRelationship` - 更新关系

#### 2.6.11 边界命令
- `addBoundary` - 添加边界
- `deleteBoundary` - 删除边界

#### 2.6.12 摘要命令
- `addSummary` - 添加摘要
- `deleteSummary` - 删除摘要

---

### 2.7 @mindmap/editor

**职责**: 编辑器组装层，协调所有包

**依赖**: 所有其他包

**功能模块**:

#### 2.7.1 Editor (编辑器)
- 初始化所有子系统
- 连接 State → Layout → View
- 连接 Interaction → Commands → State
- 管理编辑器生命周期

#### 2.7.2 配置
- 编辑器配置 (只读模式、主题、语言等)
- 快捷键配置
- 布局配置
- 主题配置

#### 2.7.3 插件系统
- 插件注册
- 插件生命周期
- 插件扩展点

#### 2.7.4 导入导出
- 导入 XMind
- 导入 Markdown
- 导入 OPML
- 导出 XMind
- 导出 Markdown
- 导出 OPML
- 导出 PNG/SVG

---

## 三、交互迁移方案

### 3.1 迁移策略

**原则**: 渐进式迁移，一次一个交互

**步骤**:
1. 在 @mindmap/interaction 定义交互处理器接口
2. 实现交互处理器 (纯逻辑，不依赖渲染)
3. 在 @mindmap/editor 连接交互和命令
4. 在 @mindmap/view 添加视觉反馈
5. 测试验证

### 3.2 交互迁移优先级

**P0 - 核心交互** (必须首先实现):
- 点击选择
- 双击编辑
- 键盘导航 (方向键)
- Tab 添加子节点
- Enter 添加兄弟节点
- Delete 删除节点

**P1 - 基础交互**:
- 拖拽移动节点
- 拖拽排序
- 缩放视口
- 平移视口
- 折叠/展开

**P2 - 增强交互**:
- 多选 (Ctrl+点击)
- 框选
- 复制/粘贴
- 撤销/重做
- 右键菜单

**P3 - 高级交互**:
- 拖拽改变父节点
- 关系线拖拽
- 边界拖拽
- 编号编辑
- 标记添加

### 3.3 交互状态机

```
┌─────────────────────────────────────────────────────────┐
│                    Interaction State Machine             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Idle] ──click──► [Selected] ──double-click──► [Editing]│
│    │                   │                           │     │
│    │                   │ click elsewhere            │     │
│    │                   ▼                           │     │
│    │               [Idle] ◄──Enter/Escape──────────┘     │
│    │                                                     │
│    │──drag──► [Dragging] ──drop──► [Idle]                │
│    │              │                                       │
│    │              │ cancel                                │
│    │              ▼                                       │
│    │          [Idle]                                      │
│    │                                                     │
│    │──wheel──► [Zooming] ──end──► [Idle]                  │
│    │                                                     │
│    │──middle-button──► [Panning] ──end──► [Idle]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 事件流

```
用户输入
    │
    ▼
@mindmap/interaction
    │ (PointerEvent / DragEvent / KeyEvent)
    ▼
交互处理器
    │ (生成 Command)
    ▼
@mindmap/commands
    │ (生成 Transaction)
    ▼
@mindmap/state
    │ (应用 Transaction，产生新 State)
    ▼
@mindmap/editor
    │ (通知 View 更新)
    ▼
@mindmap/view
    │ (更新 Canvas 元素)
    ▼
视觉反馈
```

---

## 四、功能清单

### 4.1 核心功能 (MVP)

#### 节点操作
- [ ] 创建根节点
- [ ] 添加子节点
- [ ] 添加兄弟节点
- [ ] 删除节点
- [ ] 编辑节点标题
- [ ] 节点选择

#### 视图
- [ ] 渲染节点树
- [ ] 渲染连线
- [ ] 缩放视口
- [ ] 平移视口

#### 交互
- [ ] 点击选择
- [ ] 双击编辑
- [ ] 键盘添加节点
- [ ] 键盘删除节点

### 4.2 基础功能

#### 节点操作
- [ ] 折叠/展开
- [ ] 移动节点位置
- [ ] 拖拽排序
- [ ] 拖拽改变父节点

#### 样式
- [ ] 设置节点形状
- [ ] 设置填充颜色
- [ ] 设置边框颜色
- [ ] 设置文字样式
- [ ] 应用主题

#### 视图
- [ ] 节点动画
- [ ] 连线动画
- [ ] 适应内容
- [ ] 聚焦节点

#### 交互
- [ ] 多选
- [ ] 框选
- [ ] 拖拽移动
- [ ] 拖拽缩放

### 4.3 进阶功能

#### 高级节点
- [ ] 节点图片
- [ ] 节点备注
- [ ] 节点标记
- [ ] 节点编号
- [ ] 节点标签
- [ ] 节点链接

#### 关系和边界
- [ ] 自由关系线
- [ ] 边界框
- [ ] 摘要

#### 布局
- [ ] 多种布局算法
- [ ] 切换布局
- [ ] 自定义布局参数

#### 剪贴板
- [ ] 复制
- [ ] 剪切
- [ ] 粘贴
- [ ] 粘贴为子节点

#### 历史
- [ ] 撤销
- [ ] 重做

### 4.4 高级功能

#### 导入导出
- [ ] 导入 XMind
- [ ] 导入 Markdown
- [ ] 导入 OPML
- [ ] 导出 XMind
- [ ] 导出 Markdown
- [ ] 导出 OPML
- [ ] 导出 PNG
- [ ] 导出 SVG

#### 协同编辑 (Yjs)
- [ ] Yjs Document 集成
- [ ] Awareness (在线状态)
- [ ] 冲突解决
- [ ] WebSocket Provider
- [ ] 离线支持

#### 插件系统
- [ ] 插件注册
- [ ] 插件生命周期
- [ ] 扩展点

#### 性能优化
- [ ] 虚拟渲染
- [ ] 布局缓存
- [ ] 增量更新
- [ ] Web Worker

---

## 五、开发路线图

### Phase 1: 基础架构 (2周)
- 搭建 monorepo 项目结构
- 实现 @mindmap/core 类型定义
- 实现 @mindmap/state 核心数据层
- 实现基础 Transaction

### Phase 2: 核心渲染 (2周)
- 实现 @mindmap/view 基础渲染
- 实现 @mindmap/layout 基础布局 (Map)
- 实现节点和连线渲染
- 实现缩放/平移

### Phase 3: 核心交互 (2周)
- 实现 @mindmap/interaction 基础交互
- 实现 @mindmap/commands 核心命令
- 实现点击选择、双击编辑
- 实现键盘添加/删除节点

### Phase 4: 增强功能 (2周)
- 实现拖拽移动/排序
- 实现多选/框选
- 实现折叠/展开
- 实现样式设置

### Phase 5: 进阶功能 (2周)
- 实现更多布局算法
- 实现节点图片/备注/标记
- 实现关系线/边界/摘要
- 实现剪贴板和历史

### Phase 6: 导入导出 (1周)
- 实现 XMind 导入导出
- 实现 Markdown 导入导出
- 实现图片导出

### Phase 7: 高级功能 (持续)
- Yjs 协同编辑
- 插件系统
- 性能优化
- 更多布局算法

---

## 六、源代码子系统分析

> 以下所有内容均基于对 `/src/` 源代码的实际扫描分析

### 6.1 布局子系统 (39 个结构文件)

**源码位置**: `/src/structures/`

**核心文件**:
- `abstractstructure.ts` - 布局基类 (923 行)，定义所有布局的公共接口
- `basemap.ts` - Map 布局的公共基类
- `helper/` - 布局辅助工具 (hitdetect、dragareautil、structuresutil)

**架构**: 每个结构是一个普通的 JS 对象，扩展自 `AbstractStructure`

**AbstractStructure 核心接口**:
- `getRangeGrowthDirection()` → 子节点增长方向 (UP/DOWN/LEFT/RIGHT)
- `getSourceOrientation()` → 父节点连接出发点
- `getChildTargetOrientation()` → 子节点连接接受点
- `calAttachedChildrenPos(branch, newBounds)` → **必须重写** - 计算子节点位置
- `calCalloutChildrenPos(branch, newBounds)` → 计算标注位置
- `calSummaryChildrenPos(branch, newBounds)` → 计算摘要位置
- `calDetachedChildrenPos(branchView, newBounds)` → 计算浮动节点位置
- `drawConnectLine(parentBranch, childBranch)` → 绘制连线
- `drawAttachedConnectLine(parentBranch, childBranch)` → 绘制附着连线
- `layoutExtendCollapse(branch, newBounds)` → 布局展开/折叠按钮
- `renderSummary(parentBranch, summaryBranch, newBounds)` → 渲染摘要
- `calcPolygons(branchView)` → **拖拽区域计算** (凸包算法)
- `getChildStructure(parentStructure, index, branch)` → 子节点应该使用的布局
- `calcSpacingMajor(branchView)` → 计算主间距
- `getChildrenSize(branch)` → 获取子节点组尺寸
- `isInSameRange(parent, index)` → 判断是否在同一 boundary/summary 范围内

**连线绘制流程**:
1. `getTopicShape().getStartAnchorPosition(parent, child)` → 起始锚点
2. `getTopicShape().getControlPosition(parent, child)` → 控制点
3. `getTopicShape().getEndAnchorPosition(structure, child)` → 终止锚点
4. `getTopicLineStyle(style)(child, points, isTapered, special)` → 生成 SVG path

**布局文件清单** (39 个):

| 类别 | 文件 | 说明 |
|------|------|------|
| 径向 | `map.ts`, `mapclockwise.ts`, `mapanticlockwise.ts`, `mapunbalanced.ts` | Map 及其变体 |
| 逻辑 | `logicright.ts`, `logicleft.ts`, `logicleftandright.ts` | 逻辑布局 |
| 树形 | `treeright.ts`, `treeleft.ts`, `treeleftandright.ts` | 树形布局 |
| 组织图 | `orgchartdown.ts`, `orgchartup.ts`, `orgchartupanddown.ts` | 组织图布局 |
| 时间线 | `timelinehorizontal.ts`, `timelinevertical.ts`, `timelinesidedhorizontal.ts`, `timelinethroughvertical.ts`, `timelinehorizontalup.ts`, `timelinehorizontaldown.ts` | 时间线布局 (6 个) |
| 鱼骨 | `fishbonebasehead.ts`, `fishbonebasemainbone.ts`, `fishbonelefthead.ts`, `fishbonerighthead.ts`, + 4 个 top/bottom bone | 鱼骨图 (8 个) |
| 表格 | `spreadsheet.ts`, `spreadsheetrow.ts`, `spreadsheetcolumn.ts`, `columnspreadsheet.ts` | 矩阵/表格布局 |
| 括号 | `braceleft.ts`, `braceright.ts`, `braceleftandright.ts` | 括号布局 |
| 树表 | `treetable.ts`, `treetabletoptitle.ts` | 树形表格 |

**Map 布局 (`map.ts`) 源码分析**:
- 继承 `baseMap`，扩展 `calAttachedChildrenPos`
- `calcNumRight(branch)` → 计算右侧子节点数量
- 将子节点分为 `rightChildren` 和 `leftChildren`
- `calSidePos({ side, spacingMajor, spacingMinor, newBounds, children, isUpToDown, offsetX })` → 分别计算两侧位置
- `getChildStructure(structure, index, branch)` → 右侧返回 `LOGICRIGHT`，左侧返回 `LOGICLEFT`
- `getSourceOrientation()` → 返回 `DIRECTION.NONE` (中心)

---

### 6.2 拖拽子系统 (10 个文件)

**源码位置**: `/src/modules/dragmanager.ts` + `/src/modules/draghandler/` + `/src/modules/svgdraggable/`

**核心文件**:
- `dragmanager.ts` (297 行) - 拖拽管理器，协调整个拖拽流程
- `draghandler/basehandler.ts` - 拖拽处理器基类
- `draghandler/branchdraghandler.ts` (591 行) - **最复杂** - 分支拖拽处理器
- `draghandler/freebranchdraghandler.ts` - 浮动分支拖拽
- `draghandler/calloutdraghandler.ts` - 标注拖拽
- `draghandler/imagedraghanlder.ts` - 图片拖拽
- `draghandler/matrixlabeldraghandler.ts` - 矩阵标签拖拽
- `draghandler/filedraghandler.ts` - 文件拖放
- `draghandler/mathjaxdraghandler.ts` - MathJax 拖拽
- `svgdraggable/view/dragshadow.ts` - 拖拽阴影视图
- `svgdraggable/view/placeholderbranch.ts` - 占位分支视图

**DragManager 流程**:
1. `prepareStartDrag(e, view)` → 入口，记录初始选择
2. `dragThreshold(e, callback)` → 等待超过阈值
3. 创建 `DragShadowView` → 半透明拖拽预览
4. `_startDragView(view, position)` → 根据 view 类型获取对应的 DragHandler
5. 监听 `dragViewMoving` 和 `dragViewFinish`
6. `_onDragViewMoving(position)` → 调用 `handler.dragMoving()`
7. `_onDragViewFinish(position)` → 调用 `handler.dragFinish()`

**BranchDragHandler (核心) 状态**:
- `_draggedViews` - 被拖拽的 branch 列表
- `_draggedViewOldIndex` - 初始 index
- `_draggedViewOldParentView` - 初始 parent
- `_draggedViewNewIndex` - 实时最新 index
- `_draggedViewNewParentView` - 实时最新 parent
- `_relatedDraggingViewsSet` - 被拖拽节点及所有子节点的 Set (用于跳过)
- `_isDuplicate` - Alt 键按下时复制模式
- `_draggedViewAttachDisabled` - 是否禁止挂载 (浮动节点模式)
- `_currentPolygon` - 当前命中的多边形区域

**拖拽移动检测 (`getDragOverView`)**:
1. 遍历所有分支，使用 `pointutils.isPointInPolygon` 进行凸包碰撞检测
2. 获取 `branchView.getPolyPointsArr()` 多边形点数组
3. 对每个 polygon 检测鼠标位置是否在内部
4. 返回命中的 branchView

**拖拽完成 (`dragFinish`)**:
- 无目标 → `mountAsDetach()` 浮动节点
- 自由位置 → `mountAsFreePosition()` 自由位置节点
- 有目标 → `mountAsAttach()` 附着节点
- 计算真实 `_getNewTargetIndex()` (考虑被删除节点的影响)

**PlaceHolderManager**:
- 创建半透明占位符节点 (蓝色，60px 宽)
- `attachTo(parentBranchView, options)` → 挂载到目标位置
- `detach()` → 移除占位符

**SVG 可拖拽组件** (`/src/modules/svgdraggable/`):
- `resizebox` - 调整大小框
- `topicselectbox` - 节点选择框
- `placeholderbranch` - 占位分支
- `dragshadow` - 拖拽阴影
- `selectbox` - 通用选择框

---

### 6.3 选择子系统

**源码位置**: `/src/modules/selectionmanager.ts` (509 行)

**数据结构**:
- `selections: BranchView[]` - 当前选中的 view 数组
- `_lastSelectedBranch` - 最后选中的分支 (用于 Shift 范围选择)
- `_preBounchSelectInfo` - 上一次范围选择信息 `{ start, selections }`
- `_multiSelectModeEnabled` - 多选模式开关
- `_isSilent` - 静默模式 (不触发通知)

**选择模式**:
- **单选**: `selectSingle(view, { forceFlush, ignoreIncluded })`
- **多选**: `toggleSelection(view)` - Ctrl/Command + 点击
- **范围选择**: `_addSelectionBetweenBranches(preBranch, curBranch)` - Shift + 点击
  - 限制: 两个节点必须有相同的 parent
  - 获取 siblings，取 start 到 end 之间的所有节点
- **清空**: `selectNone()`

**事件监听**:
- 监听 `mousedown` on BRANCH, BOUNDARY, RELATIONSHIP, IMAGE, MATH_JAX, AUDIO, INFOITEM, MATRIX_LABEL
- 监听 `mousedown` on MARKER, INFORMATION_ICON, LABELUNIT (冒泡到父 Branch)
- 监听 `mousedown` on SVG (点击空白清空)
- 监听 `tap` (触摸平台)

**选择通知**:
- `notify()` → 触发 `EVENTS.SELECTION_CHANGED`
- 提交到 `UiStatusManager` 的 `selectionChange` mutation

---

### 6.4 快捷键子系统

**源码位置**: `/src/modules/keybind.ts` (224 行)

**键码映射**:
```
9 → Tab, 13 → Enter, 8/46 → Delete, 90 → Z, 65 → A
38 → Up, 40 → Down, 37 → Left, 39 → Right, 32 → Space, 27 → Esc
```

**只读模式允许**: Up/Down/Left/Right
**编辑标题模式允许**: Tab

**操作映射**:
- `Tab` → `ADD_SUB_TOPIC` (单选 branch 时)
- `Enter` → `ADD_TOPIC_AFTER` (普通) / `ADD_TOPIC_BEFORE` (Shift) / `ADD_SUB_TOPIC` (中央节点) / `ADD_PARENT_TOPIC` (Ctrl)
- `Delete` → `DELETE_ITEM`
- `Z` → `UNDO` (Ctrl/Cmd) / `REDO` (Ctrl/Cmd + Shift)
- `A` → `SELECT_ALL` (Ctrl/Cmd)
- `Up/Down/Left/Right` → `SELECTION_NAVIGATE` (普通) / `EXCHANGE_SIBLING_TOPIC` (Alt)
- `Space` → preventDefault (阻止滚动)

**forceOperationMap**: 只执行 preventDefault，不执行操作 (用于阻止浏览器默认滚动)

---

### 6.5 视口子系统

**源码位置**: `/src/modules/moveviewport.ts` (422 行) + `/src/view/helper/canvascontrol.ts` (602 行) + `/src/view/helper/coordinate-transfer.ts` (88 行)

**三个坐标空间**:
1. **Viewport** - 窗口左上角为原点
2. **VisibleArea** - 可见区域左上角为原点
3. **MindMap** - 中央节点中心为原点

**CoordinateTransfer 转换方法**:
- `mindMapToViewport(p)` / `viewportToMindMap(p)`
- `mindMapToVisibleArea(p)` / `visibleAreaToMindMap(p)`
- `mindMapToEnlargedArea(p)` / `enlargedAreaToMindMap(p)`
- `visibleAreaToViewport(p)` / `viewportToVisibleArea(p)`

**CanvasControl 核心功能**:
- `_scroll(x, y, options)` → 滚动容器，支持动画 (easeOut 缓动: `Math.sqrt(ratio * 2 - ratio * ratio)`)
- `move(x, y, options)` → 移动视口
- `center(position, options)` → 居中某个位置
- `fitMap()` → 适应内容 (最大缩放 2x)
- `restorePosition(position)` → 恢复位置
- `_updateSBContainerSize()` → 更新容器大小和 translate

**MoveViewPort 模块**:
- `onMouseWheel(e)` → 处理滚轮事件
- `onDragViewPort(e, view, failFn)` → 右键/空白拖拽平移
- `startDragProcess(lastDragPoint, view)` → 桌面拖拽流程
- `startIOSDragProcess(lastDragPoint)` → iOS 拖拽流程
- `showBranchInViewPort(branchView, callback)` → 将分支滚入视口
- `showMouseInViewPort(mouseClientPosition, allowDirection, speed)` → **鼠标边缘自动滚动** (5px/帧, requestAnimationFrame)

**鼠标边缘自动滚动**:
- `getMouseOutOfViewPortDirection()` → 检测鼠标是否在视口边缘 20px 内
- `MouseMoveDirection` 类 → 管理上下左右方向状态
- 使用 `requestAnimationFrame` 循环移动

**惯性平移** (`/src/utils/interialpanning.ts`, 77 行):
- 记录最近 6 个位置和时间戳
- 计算速度 = `deltaX / deltaT`
- `_inertia()` → 使用 `requestAnimationFrame` 循环，速度衰减 = `friction * deltaT` (friction = -0.005)
- 速度降为 0 时停止

---

### 6.6 小地图子系统

**源码位置**: `/src/modules/minimap.ts` (487 行)

**容器**: 336x208px，右下角，白色背景，圆角，阴影

**核心实现**:
- 使用 SVG `<use href="#sheetContainerID">` 复用主 SVG 内容
- `viewBox` 红色矩形 (`#fb5151`) 表示当前视口位置
- `scaleValue` = 根据容器比例和内容比例计算
- 最大内容区域 = 容器的 80%

**更新策略**:
- 监听 `change:bounds` → 防抖 500ms 更新
- 监听 `VIEW_PORT_MOVING` → 立即更新 viewBox
- 监听 `SCALE_CHANGED` → 防抖 500ms 更新
- 监听 `SE_OVERRIDE_STYLE_CHANGED` / `AFTER_THEME_CHANGED` → 更新背景色

**交互**:
- 点击 minimap → `miniDeltaToMindMapDelta()` 转换坐标 → `moveViewPortModule.tryToMoveViewPort()`
- 拖拽 viewBox → `MiniMapViewBoxDragManager` → 同样转换坐标移动视口

---

### 6.7 撤销/重做子系统

**源码位置**: `/src/common/undo.ts` (279 行)

**架构**:
- `UndoManager` 继承 `BaseEvent`
- `_undoStack: Group[]` / `_redoStack: Group[]`
- 每个 `Group` 包含 `_tasks: Task[]`
- 每个 Task 有 `undo()` 和 `redo()` 方法

**Group 执行**:
- 默认 executor: undo 时逆序执行，redo 时顺序执行
- 返回 `EXECUTOR_RESULT_BREAK` (停止) 或 `EXECUTOR_RESULT_NEXT` (继续下一个 group)

**自动分组**:
- `push(task, type)` → 如果没有 standby group，创建新 group
- `_autoStandbyGroup()` → 使用 `setTimeout(0)` 延迟重置
- 连续操作会合并到同一个 group (因为 setTimeout 在下一个事件循环才执行)

**手动分组**:
- `keepAllInOne(true)` → 所有操作合并到一个 group (拖拽时使用)
- `keepAllInOne(false)` → 结束合并
- `pushTag(tagName, executor)` → 创建命名 group (可独立移除)
- `popTag(tagName)` → 移除命名 group

**栈限制**: 默认 20，可设置

**事件**: `UNDO_STATE_CHANGE` → `{ canUndo, canRedo }`

---

### 6.8 事件子系统

**源码位置**: `/src/uievents/events.ts` (444 行) + `/src/uieventhandlers/dom/` (16 个处理器)

**三层事件架构**:

1. **EventEntity** (底层事件源):
   - `JQueryEntity` → jQuery 事件绑定
   - `HammerEntity` → Hammer.js 手势识别 (tap, doubletap, pan, press, pinch)
   - `PointerEventEntity` → PointerEvent 兼容层

2. **Events** (事件分发器):
   - `dataMap: Record<eventName, Record<selector, handler[]>>`
   - `dispatch(e, selectors, context)` → 按 selector 查找 handler 并执行

3. **UiEventsManager** (事件管理器):
   - 管理多个 EventEntity
   - 自动选择合适的 entity 绑定事件
   - `on(eventName, selector, handler)` → 注册事件
   - `dispatch(e)` → 从 target 向上冒泡，找到 `sbView` 后分发

**事件冒泡**:
- 从 `e.target` 向上遍历到 rootElem
- 找到有 `sbView` 属性的元素
- 获取 view 的 `getTypeList()` 作为 selectors
- 调用 `events.dispatch(SBEventCreator(e), selectors, view)`
- 可通过 `stopPropagation()` 阻止

**DOM 事件处理器** (16 个):
- `branchhandler.ts` - 分支事件 (点击、双击、悬停)
- `boundaryhandler.ts` - 边界事件
- `collapseextendhandler.ts` - 折叠/展开事件
- `connectionhandler.ts` - 连线事件
- `relationshiphandler.ts` - 关系线事件
- `imagehandler.ts` - 图片事件
- `labelshandler.ts` - 标签事件
- `labelunithandler.ts` - 标签单元事件
- `legendhandler.ts` - 图例事件
- `markerlisthandler.ts` - 标记列表事件
- `informationiconhandler.ts` - 信息图标事件
- `mathjaxhandler.ts` - MathJax 事件
- `matrixcellhandler.ts` - 矩阵单元格事件
- `matrixlabelhandler.ts` - 矩阵标签事件
- `matrixplushandler.ts` - 矩阵加号事件
- `legendmarkerlisthandler.ts` - 图例标记列表事件

**PointerEvent 兼容**:
- 检测 `isSupportPointerEvent()`
- 不支持时 fallback: `pointerdown` → `mousedown` + `tap`
- 为 handler 包装 `pointerType` 属性

---

### 6.9 动画子系统

**源码位置**: `/src/modules/animationmanager/` (4 个文件)

**架构**:
- `AnimationManager` → 管理动画生命周期
- `currentAnimationMap: Record<flag, animationHook[]>` → 按 flag 分组
- `startAnimation(flag, params)` → 创建并注册动画
- `killAnimationByFlag(flag)` → 终止指定 flag 的所有动画
- `reverseAnimationByFlag(flag)` → 反向播放

**动画类型** (3 个文件):
- `branch.ts` - 分支动画 (缩放进入、高亮选择框)
- `boundary.ts` - 边界动画
- `relationship.ts` - 关系线动画

**动画 flag 常量**: `ANIMATION_FLAGS.BRANCH_ZOOM_IN` 等

---

### 6.10 信号量子系统

**源码位置**: `/src/modules/semaphore.ts` (121 行)

**功能**: UI 状态的引用计数管理

**UI_STATUS 枚举**:
- `LAYOUT` - 布局中
- `ANIMATION` - 动画中
- `PINCH` - 缩放中
- `DRAG` - 拖拽中
- `ADD_RELATIONSHIP` - 添加关系中
- `ADD_FLOATINGTOPIC` - 添加浮动节点中
- `EDIT_TITLE` - 编辑标题中
- `DRAG_VIEWPORT` - 拖拽视口中
- `LOADING_IMAGE` - 加载图片中
- `DE_FOCUS` - 失焦中
- `DRAG_TOPIC_SELECT_BOX` - 拖拽选择框中
- `SHOW_BRANCH_ONLY` - 只显示分支模式
- `FILTER_MODE` - 过滤模式
- `MULTI_SELECT_MODE` - 多选模式
- `CHANGING_THEME` - 切换主题中

**API**:
- `increase(status)` → 计数 +1，首次激活触发 `AFTER_UI_STATUS_ACTIVATE`
- `decrease(status)` → 计数 -1，降至 0 触发 `AFTER_UI_STATUS_DEACTIVATE`
- `isStatusActive(status)` → 是否激活
- `getActiveUIStatus()` → 所有激活的状态
- `onceNotInStatus(statusArr, fn)` → 等待所有指定状态结束后执行

---

### 6.11 复制粘贴子系统

**源码位置**: `/src/modules/copypaste/` (5 个文件)

**核心文件**:
- `copypaste.ts` (574 行) - 复制粘贴管理器
- `clipboardhelper.ts` - 剪贴板 API 封装
- `copytopicprocessor.ts` - 节点序列化处理器
- `cputil.ts` - 工具函数 (序列化/反序列化)
- `indexdbaccesser.ts` - IndexedDB 存储

**支持的类型**:
- `BRANCH` → 节点 (含子树)
- `IMAGE` → 图片
- `MARKER` → 标记
- `MATH_JAX` → MathJax 公式

**复制流程**:
1. `CopyTopicProcessor.generateData()` → 序列化选中节点及其子树
2. `cpUtil.serializeBranchToString()` → 生成纯文本
3. `clipboardHelper.write()` → 写入剪贴板 (text/plain + text/x-array-json + text/x-type + text/x-other-object-json)

**粘贴流程**:
1. `_processXMindObject()` → 优先处理 XMind 内部数据
2. `_processImageList()` → 处理图片 (macOS/Windows 差异)
3. `_processPlainText()` → 处理纯文本
4. `_processSystemPaste()` → 系统默认粘贴

**粘贴节点**:
- `mommonFuncs.replaceId()` → 替换所有 ID (UUID)
- `parseTopic()` → 反序列化为 TopicModel
- 浮动节点 → 使用 `viewportToMindMap()` 转换鼠标位置
- 跨 Sheet 粘贴 → `styleManager.fixUserStyle()` 修复样式
- 自动处理 boundary、summary、relationship 的 ID 映射

---

### 6.12 22 个模块注册表

**源码位置**: `/src/modules/index.ts`

**完整模块列表** (从 MODULE_NAME 常量):

| 模块名 | 标识符 | 职责 |
|--------|--------|------|
| AddRelationshipManager | `addrelationshipmanager` | 添加关系线 |
| CopyPaste | `copypastemanager` | 复制粘贴 |
| DragManager | `dragmanager` | 拖拽管理 |
| DropManager | `dropmanager` | 文件拖放 |
| PreAddFloatingTopic | `preaddfloatingtopic` | 预添加浮动节点 |
| SelectionManager | `selectionmanager` | 选择管理 |
| KeyBind | `keybind` | 快捷键绑定 |
| EditReceiver | `editreceiver` | 编辑接收器 |
| MiniMap | `minimap` | 小地图 |
| MoveViewPort | `moveviewport` | 视口移动 |
| Semphore | `semaphore` | 信号量 (UI 状态计数) |
| Layout | `layout` | 布局调度器 |
| MouseBoxSelect | `mouseboxselect` | 鼠标框选 |
| ModifyCheck | `modifycheck` | 修改检查 |
| SelectDragManager | `selectdragmanager` | 选择拖拽管理 |
| OverrideStyle | `overridestyle` | 样式覆盖 (紧凑/手绘) |
| SvgDraggable | `svgdraggable` | SVG 拖拽组件 |
| UiStatusManager | `uistatusmanager` | UI 状态管理 |
| AnimationManager | `animationmanager` | 动画管理 |
| Snowball | `snowball` | 主题数据 |
| Snowbird | `snowbird` | 贴纸/图标资源 |

---

### 6.13 152+ Action 系统

**源码位置**: `/src/actions/` + `/src/common/constants/action.ts`

**Action 分类**:

| 类别 | Action 示例 | 数量 |
|------|------------|------|
| 节点操作 | ADD_SUB_TOPIC, ADD_TOPIC_AFTER, ADD_TOPIC_BEFORE, ADD_PARENT_TOPIC, DELETE_ITEM, DUPLICATE_TOPIC | ~10 |
| 标题编辑 | CHANGE_TITLE, SHOW_EDIT_BOX, HIDE_EDIT_BOX | ~3 |
| 样式 - 形状 | CHANGE_SHAPE_CLASS, CHANGE_SHAPE_COLOR | ~2 |
| 样式 - 颜色 | CHANGE_COLOR, CHANGE_TEXT_COLOR, CHANGE_LINE_COLOR, CHANGE_BORDER_COLOR | ~10 |
| 样式 - 字体 | CHANGE_FONT_FAMILY, CHANGE_FONT_SIZE, CHANGE_FONT_STYLE, CHANGE_FONT_WEIGHT, CHANGE_CJK_FONT_FAMILY | ~5 |
| 样式 - 边框 | CHANGE_BORDER_WIDTH, CHANGE_BORDER_GRADIENT, CHANGE_BORDER_PATTERN | ~3 |
| 样式 - 填充 | CHANGE_FILL_GRADIENT, CHANGE_FILL_PATTERN | ~2 |
| 样式 - 连线 | CHANGE_LINE_WIDTH, CHANGE_LINE_PATTERN, CHANGE_LINE_TAPERED, CHANGE_BRANCH_LINE_STYLE | ~4 |
| 样式 - 对齐 | CHANGE_TEXT_ALIGN, CHANGE_TEXT_DECORATION, CHANGE_TEXT_TRANSFORM | ~3 |
| 结构 | CHANGE_STRUCTURE, COLLAPSE_BRANCHES, EXTEND_BRANCHES | ~3 |
| 标记 | CHANGE_MARKER, REMOVE_MARKER, REMOVE_MARKER_GROUP | ~3 |
| 图片 | ADD_IMAGE, CHANGE_IMAGE, RESIZE_IMAGE, RESET_IMAGE | ~6 |
| 关系 | ADD_RELATIONSHIP, CANCEL_ADD_RELATIONSHIP | ~2 |
| 边界 | ADD_BOUNDARY, CHANGE_BOUNDARY_* | ~6 |
| 摘要 | ADD_SUMMARY, CHANGE_SUMMARY_* | ~5 |
| 标签 | CHANGE_LABEL | ~1 |
| 备注 | CHANGE_NOTE | ~1 |
| 链接 | CHANGE_HYPER_LINK | ~1 |
| 复制粘贴 | COPY, CUT, PASTE, COPY_STYLE, PASTE_STYLE | ~5 |
| 选择 | SELECT_ALL, SELECT, SELECTION_NAVIGATE, TOGGLE_SELECT, CLEAR_SELECTION | ~6 |
| 视口 | ZOOM, FIT_MAP, FOCUS_CENTER, MOVE_VIEWPORT, SHOW_VIEW_IN_VIEWPORT | ~5 |
| 历史 | UNDO, REDO | ~2 |
| 主题 | CHANGE_THEME, UPDATE_CLASS_INTO_THEME, REMOVE_CLASS_FROM_THEME | ~3 |
| Sheet | CHANGE_SHEET_BACKGROUND, CHANGE_TOPIC_POSITIONING, CHANGE_TOPIC_OVERLAP, CHANGE_FLOATING_TOPIC_FLEXIBLE | ~4 |
| 模式 | TOGGLE_COMPACT_MODE, CHANGE_HAND_DRAWN_MODE_ACTIVE, SHOW_BRANCH_ONLY, FILTER_BRANCH | ~5 |
| 其他 | ALIGN, DIVIDE, RESIZE_EDITOR, SET_DEVICE_SCALE, SET_MINI_MAP_DISPLAY | ~10 |

---

### 6.14 53 个事件常量

**源码位置**: `/src/common/constants/events.ts`

**事件分类**:

| 前缀 | 事件 | 说明 |
|------|------|------|
| WE_ | (无) | Workbook Editor 事件 |
| SE_ | SE_BRANCH_DRAG_START, SE_BRANCH_DRAG_END, SE_OVERRIDE_STYLE_CHANGED, SE_BRANCH_COLLAPSE_TOGGLE, SE_UI_STATUS_CHANGED | Sheet Editor 事件 |
| BEFORE_ | BEFORE_SWITCH_SHEET, BEFORE_CREATE_SHEET_EDITOR, BEFORE_ADD_TOPIC, BEFORE_REMOVE_TOPIC, BEFORE_ADD_NEW_SHEET, BEFORE_REMOVE_SHEET_MODEL, BEFORE_ANCESTOR_CHANGE, BEFORE_EDITOR_REMOVE | 前置事件 |
| AFTER_ | AFTER_SHEET_CONTENT_CHANGE, AFTER_WORKBOOK_CONTENT_CHANGE, AFTER_ADD_TOPIC, AFTER_REMOVE_TOPIC, AFTER_SHEET_TITLE_CHANGE, AFTER_WORKBOOK_TITLE_CHANGE, AFTER_ADD_NEW_SHEET, AFTER_ADD_EXISTING_SHEET, AFTER_REMOVE_SHEET_MODEL, AFTER_SHEET_ORDER_CHANGE, AFTER_THEME_CHANGED, AFTER_UI_STATUS_ACTIVATE, AFTER_UI_STATUS_DEACTIVATE, AFTER_MODIFY_STATUS_CHANGE, AFTER_ANCESTOR_CHANGE | 后置事件 |
| 通用 | SELECTION_CHANGED, SCALE_CHANGED, VIEW_PORT_MOVING, SHEET_CONTENT_LOADED, UNDO_STATE_CHANGE, ACTION_STATUS_MAY_CHANGED | 通用事件 |
| 其他 | SHOULD_SHOW_NOTE_PANEL, RELATIONSHIP_CONTROL_POINT_DRAG_START/END, FILE_DROP_IN_START/END, EXIT_BRANCH_ONLY_MODE, COMPACT_LAYOUT_MODE_LEVEL_CHANGED, ALIGNMENT_BY_LEVEL_STATUS_CHANGED, HAND_DRAWN_MODE_ACTIVE_CHANGED, ACTIVED_GLOBAL_STYLES_CHANGED | 其他事件 |

---

### 6.15 21 种结构类型 (STRUCTURECLASS)

**源码位置**: `/src/common/constants/structures.ts`

| 类别 | 结构 | 标识符 |
|------|------|--------|
| 逻辑 | Logic Right | `org.xmind.ui.logic.right` |
| 逻辑 | Logic Left | `org.xmind.ui.logic.left` |
| 树形 | Tree Right | `org.xmind.ui.tree.right` |
| 树形 | Tree Left | `org.xmind.ui.tree.left` |
| 组织图 | Org Chart Down | `org.xmind.ui.org-chart.down` |
| 组织图 | Org Chart Up | `org.xmind.ui.org-chart.up` |
| 径向 | Map | `org.xmind.ui.map` |
| 径向 | Map Clockwise | `org.xmind.ui.map.clockwise` |
| 径向 | Map Anticlockwise | `org.xmind.ui.map.anticlockwise` |
| 径向 | Map Unbalanced | `org.xmind.ui.map.unbalanced` |
| 时间线 | Timeline Horizontal | `org.xmind.ui.timeline.horizontal` |
| 时间线 | Timeline Vertical | `org.xmind.ui.timeline.vertical` |
| 时间线 | Timeline Through Vertical | `org.xmind.ui.timeline.through.vertical` |
| 时间线 | Timeline Sided Horizontal | `org.xmind.ui.timeline.sided.horizontal` |
| 时间线 | Timeline Horizontal Up | `org.xmind.ui.timeline.horizontal.up` |
| 时间线 | Timeline Horizontal Down | `org.xmind.ui.timeline.horizontal.down` |
| 鱼骨 | Fishbone Left Headed | `org.xmind.ui.fishbone.leftHeaded` |
| 鱼骨 | Fishbone Right Headed | `org.xmind.ui.fishbone.rightHeaded` |
| 矩阵 | Spreadsheet | `org.xmind.ui.spreadsheet` |
| 矩阵 | Column Spreadsheet | `org.xmind.ui.spreadsheet.column` |
| 树表 | Tree Table | `org.xmind.ui.treetable` |
| 树表 | Top Title Tree Table | `org.xmind.ui.treetable.toptitle` |
| 括号 | Brace Left | `org.xmind.ui.brace.left` |
| 括号 | Brace Right | `org.xmind.ui.brace.right` |

**结构分组**:
- `MAP_LIKE_STRUCTURES` → Map 系列 (7 个)
- `LOGIC_CHART_STRUCTURES` → Logic 系列 (2 个)
- `ORG_CHART_STRUCTURES` → OrgChart 系列 (2 个)
- `EXPOSED_STRUCTURE` → 用户可见的 21 个
- `ATTACHED_EXPOSED_STRUCTURE` → 附着节点可用的 (排除 Map 系列)
- `TABLE_LIKE_STRUCTURE_LIST` → TreeTable + Matrix (4 个)
- `SPECIAL_STRUCTURE_LIST` → Brace (2 个)

**结构切换规则**:
- `LEFT_EXPOSED_STRUCTURE` → 左侧可用 (排除 LogicRight, BraceRight, FishboneRightHeaded, TimelineHorizontal, TimelineSidedHorizontal)
- `RIGHT_EXPOSED_STRUCTURE` → 右侧可用 (排除 LogicLeft, BraceLeft, FishboneLeftHeaded)
- `TOP_EXPOSED_STRUCTURE` → 上方可用 (排除 OrgChartDown, TimelineVertical, TreeLeft/Right, TimelineThroughVertical)
- `DOWN_EXPOSED_STRUCTURE` → 下方可用 (排除 OrgChartUp)
- `SIMILAR_STRUCTURE_MAP` → 镜像映射 (如 LogicRight ↔ LogicLeft)
