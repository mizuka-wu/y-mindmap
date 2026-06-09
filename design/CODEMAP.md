# Snowbrush Render 代码地图

## 项目概览

这是从 XMind Snowbrush v2.47.0 反编译的思维导图渲染引擎。原始文件是一个 131,836 行的 webpack bundle，正在被逐步解包为结构化的 TypeScript 源码。

**当前状态**: ~161/183 模块已完成反编译

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 语言 | TypeScript 5.5 (ESNext) |
| 构建 | Vite 5.4 |
| 包管理 | pnpm |
| 状态管理 | Backbone.js 1.6 (Model/View) + MobX 6 |
| 渲染 | **SVG** (自定义 svg.js 分支) |
| 动画 | animejs 3.2 |
| 手绘效果 | roughjs 4.6 |
| 触摸手势 | Hammer.js 2.0 |
| DOM | jQuery 3.7 |
| 数学公式 | MathJax 3.2 |

---

## 架构层次 (4层系统)

```
┌─────────────────────────────────────────────────────────────────┐
│  View Layer (Backbone.View)                                     │
│  SvgView → SheetView → BranchView → TopicView/ConnectionView   │
├─────────────────────────────────────────────────────────────────┤
│  Figure Layer (渲染+布局 Worker)                                │
│  Figure → RenderWorker + LayoutWorker                           │
├─────────────────────────────────────────────────────────────────┤
│  Structure Layer (布局算法)                                     │
│  AbstractStructure → Map, LogicRight, OrgChart, Fishbone...     │
├─────────────────────────────────────────────────────────────────┤
│  Model Layer (Backbone.Model)                                   │
│  WorkbookModel → SheetModel → TopicModel (数据)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 核心模块详解

### 1. 核心引擎 (`/src/core/`)

| 文件 | 职责 |
|------|------|
| `abstracteditor.ts` | 编辑器基类，继承自 Backbone.View |
| `sheeteditor.ts` | **单 Sheet 编辑器** - 模块注册、Action 执行、事件系统、导出 |
| `workbookeditor.ts` | **Workbook 编辑器** - 多 Sheet 管理、Sheet 切换 |
| `services.ts` | 服务容器 (剪贴板、SVG 尺寸等) |

**SheetEditor 是核心协调器**:
- 注册 15 个模块 (SelectionManager, DragManager, Layout, KeyBind 等)
- 管理 150+ Action
- 处理事件分发
- 提供导出功能 (PNG/SVG/Theme)

### 2. 数据模型层 (`/src/models/`)

```
backbone.Model
  └── BaseModel<T>                    # base.ts - toJSON() 深拷贝
        └── BaseComponent<T>          # basecomponent.ts - parent/owner 引用
              └── StyleComponent<T>   # stylecomponent.ts - 样式管理
                    ├── TopicModel    # topic.ts - 核心节点
                    ├── SheetModel    # sheet.ts - Sheet 容器
                    ├── RelationshipModel  # relationship.ts - 关系线
                    ├── BoundaryModel      # boundary.ts - 边界框
                    └── SummaryModel       # summary.ts - 摘要
              ├── ThemeModel          # theme.ts - 主题样式映射
              ├── LegendModel         # legend.ts - 图例
              ├── MarkerModel         # marker.ts - 标记
              ├── NoteModel           # note.ts - 备注
              ├── NumberingModel      # numbering.ts - 编号
              ├── TopicImageModel     # topicimage.ts - 图片
              ├── HrefModel           # href.ts - 超链接
              └── LabelModel          # label.ts - 标签
```

**关键数据结构**:

```typescript
// TopicData - 核心节点数据
type TopicData = {
  id: string;
  title: string;
  style?: StyleData;
  class: string;
  position?: Point;
  structureClass?: STRUCTURECLASS;  // 布局类型
  branch?: string;                  // 'folded' = 折叠
  children?: { [type: string]: TopicData[] };  // 按类型分组
  markers?: MarkerData[];
  boundaries?: BoundaryData[];
  summaries?: SummaryData[];
  // ...
};

// SheetData - Sheet 数据
interface SheetData {
  id: string;
  title: string;
  rootTopic: TopicData;
  theme?: ThemeData;
  relationships?: RelationshipData[];
  legend?: LegendData;
  // ...
}
```

**Topic 类型** (`TOPIC_TYPE`):
- `ATTACHED` - 附着节点 (主分支)
- `DETACHED` - 浮动节点
- `SUMMARY` - 摘要节点
- `CALLOUT` - 标注节点
- `ROOT` - 根节点

### 3. 视图层 (`/src/view/`)

```
SvgView (根 SVG 画布, 缩放/平移)
  └── SheetView (Sheet 背景, 容器管理)
        ├── BranchContainer (分支主容器)
        │     └── BranchView (递归, 每个 topic 一个)
        │           ├── TopicView (标题、形状、标记、图片、标签、图标)
        │           ├── ConnectionView (到父节点的连线)
        │           ├── CollapseExtendView (+/- 折叠按钮)
        │           ├── BoundaryView[] (彩色边界框)
        │           ├── SummaryView[] (摘要括号)
        │           └── BranchView[] (子节点, 递归)
        ├── RelationshipContainer (自由关系线)
        │     └── RelationshipView[]
        ├── BoundaryContainer
        ├── ConnectionContainer
        ├── MatrixContainer
        ├── SelectBoxContainer
        ├── TreeTableContainer
        └── OtherContainer
```

**关键视图文件**:

| 文件 | 职责 |
|------|------|
| `svgview.ts` | 根 SVG 画布, 处理缩放/平移/惯性滚动 |
| `sheetview.ts` | 管理 9 个 SVG 容器组 (z-order) |
| `branchview.ts` | **最复杂** - 递归分支, 管理位置/边界/结构 |
| `topicview.ts` | 单个节点渲染 - 形状、标题、标记、图片等 |
| `connectionview.ts` | 父子连线渲染 |
| `svgcomponentview.ts` | 所有 SVG 组件的基类 |

### 4. Figure 层 (`/src/figures/`) - 渲染管线核心

```
Figure (桥梁类)
  ├── layoutWorker  // 计算尺寸
  └── renderWorker  // 生成 SVG
```

**Figure 生命周期**:
```typescript
class Figure {
  dirtyLayout    // 布局脏标志
  dirtyPaint     // 绘制脏标志
  
  invalidateLayout() → lazyRunner → validatesLayout()
  invalidatePaint()  → lazyRunner → validatesPaint()
  setPosition() → invalidatePaint()
  setSize() → invalidateLayout() + invalidatePaint()
}
```

**Figure Factory** (`figurefactory.ts`): 映射 30+ Figure 类型

**Render Workers** (`/src/figures/renderengine/svg/renderworkers/`): 32 个 Worker
- `SheetRenderWorker` - Sheet 级 SVG 组织
- `BranchRenderWorker` - 分支渲染
- `TopicRenderWorker` - 节点渲染 (形状、填充、边框)
- `ConnectionRenderWorker` - 连线渲染
- `RelationshipRenderWorker` - 关系线渲染
- `BoundaryRenderWorker` - 边界渲染
- `MarkerRenderWorker` - 标记渲染
- 等等...

**Layout Workers** (`/src/figures/layoutengine/`): 13 个 Worker
- `BranchLayoutWorker` - 分支布局
- `TopicLayoutWorker` - 节点尺寸计算
- `ConnectionLayoutWorker` - 连线布局
- `BoundaryLayoutWorker` - 边界布局
- `MatrixLayoutWorker` - 矩阵布局
- 等等...

### 5. 结构层 (`/src/structures/`) - 布局算法

**34 种布局结构**:

| 类别 | 结构 |
|------|------|
| 径向 | Map, MapClockwise, MapAntiClockwise, MapUnbalanced |
| 层级 | LogicRight, LogicLeft, TreeRight, TreeLeft |
| 组织图 | OrgChartDown, OrgChartUp, OrgChartUpAndDown |
| 时间线 | TimelineHorizontal, TimelineVertical, TimelineSidedHorizontal 等 |
| 矩阵 | Spreadsheet, SpreadsheetRow, SpreadsheetColumn |
| 鱼骨图 | FishBoneLeftHead, FishBoneRightHead (及变体) |
| 括号 | BraceLeft, BraceRight, BraceLeftAndRight |
| 树表 | TreeTable, TreeTableTopTitle |

**基类** (`abstractstructure.ts`):
- `calAttachedChildrenPos()` - 计算子节点位置
- `getSourceOrientation()` - 父节点连接方向
- `getRangeGrowthDirection()` - 子节点增长方向
- `drawConnectLine()` - 绘制连线

### 6. 模块系统 (`/src/modules/`)

**15 个核心模块** (在 SheetEditor 启动时注册):

| 模块 | 文件 | 职责 |
|------|------|------|
| SelectionManager | `selectionmanager.ts` | 多选、Shift 选择、框选 |
| Layout | `layout.ts` | 异步布局协调器 |
| DragManager | `dragmanager.ts` | 拖拽重排序 |
| DropManager | `dropmanager.ts` | 文件/图片拖放 |
| MoveViewport | `moveviewport.ts` | 视口拖拽/滚轮平移 |
| KeyBind | `keybind.ts` | 键盘快捷键 |
| MiniMap | `minimap.ts` | 小地图 (SVG `<use>`) |
| CopyPaste | `copypaste/` | 复制粘贴 (IndexedDB) |
| AnimationManager | `animationmanager/` | animejs 动画 |
| OverridedStyle | `overridedstyle/` | 样式覆盖 (紧凑/手绘模式) |
| UiStatusManager | `uistatusmanager.ts` | UI 状态管理 |
| SvgDraggable | `svgdraggable/` | SVG 拖拽组件 |
| EditReceiver | `editreceiver.ts` | 编辑操作接收器 |
| MouseBoxSelect | `mouseboxselect.ts` | 鼠标框选 |
| ModifyCheck | `modifycheck.ts` | 修改检查 |

**拖拽处理器** (`/src/modules/draghandler/`):
- `BranchDragHandler` - 分支拖拽
- `FreeBranchDragHandler` - 浮动分支拖拽
- `CalloutDragHandler` - 标注拖拽
- `ImageDragHandler` - 图片拖拽
- `MatrixLabelDragHandler` - 矩阵标签拖拽

### 7. 渲染技术 (`/src/render/`)

**连线样式** (`brushes.ts`): SVG 路径生成器
- Curve: `curveHorizon()`, `taperedCurveHorizon()`
- Straight: `straightLine()`, `taperedStraight()`
- Elbow: `elbowHorizon()`, `elbowVertical()`
- Rounded Elbow: `roundedElbow*()`
- Horn: `horn*()`
- Sinus: `sinus*()`
- Brace: `brace*()`

**Topic 线条样式** (`/src/render/topiclinestyle/`): 18 种样式

**Topic 形状** (`/src/figures/renderengine/svg/topicshapes/`): 40+ 形状
- 圆角矩形、椭圆、菱形、云朵、六边形、平行四边形等

### 8. 事件系统

**双重事件系统**:

**A. Backbone 事件 (Model → View)**:
- `change:title` → TopicView 更新标题
- `addTopic`/`removeTopic` → BranchView 添加/移除子分支
- `changeStyle` → 样式刷新
- `changeStructureClass` → 触发重新布局

**B. UI 事件处理器** (`/src/uieventhandlers/dom/`): 16 个处理器
- `branchhandler.ts` - 节点点击、双击、悬停、选择
- `connectionhandler.ts` - 连线点击
- `boundaryhandler.ts` - 边界拖拽/调整大小
- `collapseextendhandler.ts` - 折叠/展开按钮
- `relationshiphandler.ts` - 关系线交互
- `imagehandler.ts` - 图片交互
- `labelshandler.ts` - 标签点击
- `matrixcellhandler.ts` - 矩阵单元格选择
- 等等...

### 9. Action 系统 (`/src/actions/`)

**150+ Sheet Action** + **13 Workbook Action**

命名模式:
- `addSubTopic` / `addTopicAfter` / `addParentTopic`
- `changeColor` / `changeFontFamily` / `changeStructure`
- `addBoundary` / `addSummary` / `addRelationship`
- `copy` / `cut` / `paste` / `deleteItem`
- 等等...

**Action 执行流程**:
```
User Action → SheetEditor.execAction(name, args) → Action.doExecute(args) 
  → Model method (e.g., topic.addChildTopic) 
    → Model.set('attr', newValue) [Backbone]
    → topicChanged() / sheetChanged() 
    → EVENTS.AFTER_SHEET_CONTENT_CHANGE
    → UndoManager.add({undo, redo})
    → View re-renders via event listeners
```

### 10. 格式转换器 (`/src/formatconverter/`)

**导入** (→ internal SheetData):
| 格式 | 文件 |
|------|------|
| XMind `.xmind` | `import/xmind.ts` |
| FreeMind `.mm` | `import/freemind.ts` |
| MindManager | `import/mindmanager.ts` |
| Markdown | `import/markdown.ts` |
| OPML | `import/opml.ts` |
| MindNode | `import/mindnode.ts` |
| Lighten | `import/lighten.ts` |

**导出** (internal SheetData →):
| 格式 | 文件 |
|------|------|
| XMind | `export/xmind.ts` |
| Markdown | `export/markdown.ts` |
| OPML | `export/opml.ts` |

---

## 关键文件路径索引

### 核心入口
| 用途 | 路径 |
|------|------|
| 库导出 | `/src/index.ts` |
| 主组装文件 | `/src/snowbrush.ts` |
| Demo 应用 | `/demo.js` |
| 类型声明 | `/src/type.d.ts` |

### 数据模型
| 用途 | 路径 |
|------|------|
| 基础模型 | `/src/models/base.ts` |
| 组件基类 | `/src/models/basecomponent.ts` |
| 样式组件 | `/src/models/stylecomponent.ts` |
| Topic 模型 | `/src/models/topic.ts` |
| Sheet 模型 | `/src/models/sheet.ts` |
| Workbook 模型 | `/src/models/workbook.ts` |
| 关系模型 | `/src/models/relationship.ts` |
| 边界模型 | `/src/models/boundary.ts` |
| 摘要模型 | `/src/models/summary.ts` |
| 主题模型 | `/src/models/theme.ts` |
| 组件工厂 | `/src/models/sheetcomponentfactory.ts` |

### 核心引擎
| 用途 | 路径 |
|------|------|
| Sheet 编辑器 | `/src/core/sheeteditor.ts` |
| Workbook 编辑器 | `/src/core/workbookeditor.ts` |
| 抽象编辑器 | `/src/core/abstracteditor.ts` |
| 服务容器 | `/src/core/services.ts` |

### 视图层
| 用途 | 路径 |
|------|------|
| 根 SVG 视图 | `/src/view/svgview.ts` |
| Sheet 视图 | `/src/view/sheetview.ts` |
| 分支视图 | `/src/view/branchview.ts` |
| Topic 视图 | `/src/view/topicview.ts` |
| 连线视图 | `/src/view/connectionview.ts` |
| SVG 组件基类 | `/src/view/svgcomponentview.ts` |
| 坐标转换 | `/src/view/helper/coordinate-transfer.ts` |
| 画布控制 | `/src/view/helper/canvascontrol.ts` |

### Figure 层
| 用途 | 路径 |
|------|------|
| Figure 基类 | `/src/figures/figure.ts` |
| Figure 工厂 | `/src/figures/figurefactory.ts` |
| SVG 渲染引擎 | `/src/figures/renderengine/svg/index.ts` |
| 渲染 Workers | `/src/figures/renderengine/svg/renderworkers/` |
| 布局引擎 | `/src/figures/layoutengine/index.ts` |
| Lazy Runner | `/src/figures/lazyrunner/lazyrunner.ts` |
| Topic 形状 | `/src/figures/renderengine/svg/topicshapes/` |

### 结构层
| 用途 | 路径 |
|------|------|
| 结构基类 | `/src/structures/abstractstructure.ts` |
| 所有结构注册 | `/src/structures/helper/allstructures.ts` |
| Map 结构 | `/src/structures/map.ts` |
| Logic Right | `/src/structures/logicright.ts` |
| 其他结构 | `/src/structures/*.ts` |

### 模块系统
| 用途 | 路径 |
|------|------|
| 模块注册 | `/src/modules/index.ts` |
| 选择管理 | `/src/modules/selectionmanager.ts` |
| 布局模块 | `/src/modules/layout.ts` |
| 拖拽管理 | `/src/modules/dragmanager.ts` |
| 视口移动 | `/src/modules/moveviewport.ts` |
| 键盘绑定 | `/src/modules/keybind.ts` |
| 小地图 | `/src/modules/minimap.ts` |
| 复制粘贴 | `/src/modules/copypaste/` |
| 动画管理 | `/src/modules/animationmanager/` |
| 拖拽处理器 | `/src/modules/draghandler/` |

### 渲染技术
| 用途 | 路径 |
|------|------|
| 连线画笔 | `/src/render/brushes.ts` |
| Topic 线条样式 | `/src/render/topiclinestyle/` |
| SVG 库 (自定义) | `/src/lib/svg.source.ts` |
| SVG Polyfill | `/src/lib/svgpolyfill.ts` |
| SVG 转 PNG | `/src/lib/svg2png.ts` |
| Pattern Manager | `/src/utils/patternmanager/` (roughjs 集成) |

### 事件系统
| 用途 | 路径 |
|------|------|
| 事件管理器 | `/src/uievents/events.ts` |
| DOM 事件处理器 | `/src/uieventhandlers/dom/` |
| SVG 处理器 | `/src/uieventhandlers/dom/svghandler.ts` |

### Action 系统
| 用途 | 路径 |
|------|------|
| Action 基类 | `/src/actions/action.ts` |
| Sheet Actions | `/src/actions/sheet/` |
| Workbook Actions | `/src/actions/workbook/` |
| Action 常量 | `/src/common/constants/action.ts` |

### 常量定义
| 用途 | 路径 |
|------|------|
| 事件常量 | `/src/common/constants/events.ts` |
| 结构常量 | `/src/common/constants/structures.ts` |
| 样式常量 | `/src/common/constants/styles.ts` |
| 模型常量 | `/src/common/constants/models.ts` |
| 模块常量 | `/src/common/constants/modules.ts` |
| 渲染引擎常量 | `/src/common/constants/renderengine.ts` |

### 工具函数
| 用途 | 路径 |
|------|------|
| 几何工具 | `/src/utils/geometry.ts` |
| 线条工具 | `/src/utils/line.ts` |
| SVG 路径 | `/src/utils/svgpath.ts` |
| 点工具 | `/src/utils/pointutils.ts` |
| 样式工具 | `/src/utils/style.ts` |
| 布局工具 | `/src/utils/layoututil.ts` |
| 拖拽工具 | `/src/utils/dragutils.ts` |
| Topic 解析 | `/src/utils/business/parsetopic.ts` |
| 文件恢复 | `/src/utils/file.ts` |
| 样式管理器 | `/src/utils/business/stylemanager/` |

### 资源数据
| 用途 | 路径 |
|------|------|
| 颜色主题 | `/src/snowball/lib/colorthemes.json` |
| 骨架主题 | `/src/snowball/lib/skeletonthemes.json` |
| 默认样式 | `/src/snowball/lib/defaultstyles/` |
| 贴纸 | `/src/snowbird/lib/stickers/` |
| 标记 | `/src/snowbird/lib/markers/` |

---

## 数据流

### 1. 加载流程
```
.xmind 文件 → formatconverter/import/xmind.ts → WorkbookData
  → WorkbookModel.addSheet(id, sheetData)
    → new SheetModel(sheetData)
      → restoreFile([sheetData])  // 数据规范化
      → SheetModel.initInnerModel()
        → parseTopic(rootTopic, sheet)  // 递归构建树
          → sheet.createComponent('topic', topicData)
          → topic.addChildTopic(parseTopic(child), ...)
        → addRelationship(relationshipData)
        → addTheme(themeData)
    → SheetEditor.initInnerView()
      → SvgView → SheetView → BranchView 树
```

### 2. 变更流程
```
用户操作 → SheetEditor.execAction(name, args)
  → Action.doExecute(args)
    → Model method (e.g., topic.addChildTopic)
      → Model.set('attr', newValue)
      → topicChanged() / sheetChanged()
      → EVENTS.AFTER_SHEET_CONTENT_CHANGE
      → UndoManager.add({undo, redo})
    → View 通过事件监听重新渲染
```

### 3. 渲染流程
```
Model 变更 → View 事件监听
  → Figure.invalidateLayout() / invalidatePaint()
    → LazyRunner 队列 (优先级: BEFORE_LAYOUT → LAYOUT → RENDER → ...)
      → LayoutWorker.work()  // 计算尺寸
      → RenderWorker.work()  // 生成 SVG
        → SVG 元素更新 (.translate(), .attr(), .show()/.hide())
```

---

## 性能优化机制

### 1. LazyRunner 批处理
- 所有布局和绘制操作都批量进入优先级队列
- 执行顺序: `BEFORE_EACH → BEFORE_LAYOUT → LAYOUT → AFTER_LAYOUT → BEFORE_RENDER → RENDER → AFTER_RENDER → SELECT_SELECTION → AFTER_EACH`
- 使用 `Promise.resolve().then()` 微任务延迟

### 2. 脏标志系统
- 每个属性 (位置、尺寸、颜色等) 都有对应的 `*Dirty` 布尔值
- 变更设置脏标志并调用 `invalidatePaint()` 或 `invalidateLayout()`
- `validatePaint()` 和 `validateLayout()` 在调用 Worker 前检查标志

### 3. requestAnimationFrame
- 缩放变化使用 rAF 实现平滑缩放
- 惯性平移使用 rAF 实现减速动画
- 视口自动滚动使用 rAF

### 4. 防抖更新
- 小地图更新在 Sheet 内容变化时防抖 500ms
- `FingerScaleHandler` 节流 10ms

### 5. SVG `<use>` 复用
- 小地图通过 `<use href="#sheetId">` 复用 Sheet SVG 内容

---

## 重构建议 (Canvas 版本 + Yjs 协同)

### 1. Canvas 渲染层替换

**需要替换的部分**:
- `/src/lib/svg.source.ts` - 自定义 svg.js 分支 (3878 行)
- `/src/lib/svgpolyfill.ts` - SVG Polyfill
- `/src/figures/renderengine/svg/` - 整个 SVG 渲染引擎
- `/src/view/svgview.ts` - 根 SVG 视图
- `/src/view/sheetview.ts` - Sheet 视图 (9 个 SVG 容器)
- 所有 View 文件中的 SVG 操作

**建议架构**:
```
CanvasRenderer
  ├── CanvasLayer (多层 Canvas)
  │     ├── BackgroundLayer
  │     ├── ConnectionLayer (连线)
  │     ├── TopicLayer (节点)
  │     ├── OverlayLayer (选择框、拖拽)
  │     └── InteractionLayer (事件捕获)
  ├── RenderPipeline (渲染管线)
  │     ├── LayoutPass (布局计算)
  │     ├── PaintPass (绘制)
  │     └── CompositePass (合成)
  └── EventBus (事件总线)
```

**关键迁移点**:
- SVG Path → Canvas 2D Path / WebGL
- SVG Transform → Canvas transform / 矩阵运算
- SVG 事件 → Canvas 命中检测 (需要空间索引)
- SVG `<use>` → Canvas 对象缓存 / 离屏 Canvas

### 2. Yjs 协同编辑集成

**需要修改的部分**:
- `/src/models/` - 所有 Model 需要接入 Yjs
- `/src/common/undo.ts` - UndoManager 需要支持协同
- `/src/actions/` - Action 系统需要支持远程操作
- `/src/core/sheeteditor.ts` - 需要集成 Yjs Document

**建议架构**:
```
YjsIntegration
  ├── YDocument (Yjs 文档)
  │     ├── Y.Map<SheetData>  // Sheet 数据
  │     ├── Y.Array<TopicData>  // Topic 列表
  │     └── Y.Map<StyleData>  // 样式数据
  ├── Awareness (在线状态)
  │     ├── 用户光标位置
  │     ├── 选择范围
  │     └── 编辑状态
  ├── ConflictResolver (冲突解决)
  │     ├── OT/CRDT 转换
  │     └── 优先级策略
  └── SyncEngine (同步引擎)
        ├── WebSocketProvider
        ├── IndexedDBProvider (离线)
        └── WebRTCProvider (P2P)
```

**关键集成点**:
- `TopicModel` → `Y.Map` 映射
- `SheetModel` → `Y.Map` 映射
- `UndoManager` → Yjs UndoManager
- `Action` → Yjs Transaction
- 事件系统 → Yjs Observer

### 3. 推荐的重构步骤

**Phase 1: 数据层解耦**
1. 将 Model 层与 Backbone 解耦，使用纯 TypeScript 类
2. 定义清晰的数据接口 (已有 `TopicData`, `SheetData` 等)
3. 实现数据验证层

**Phase 2: Canvas 渲染层**
1. 实现 Canvas 基础渲染器
2. 移植 Topic 形状 (40+ 形状)
3. 移植连线样式 (18 种)
4. 实现命中检测 (空间索引)
5. 实现缩放/平移

**Phase 3: Yjs 协同层**
1. 集成 Yjs Document
2. 实现 Model → Y.Map 映射
3. 实现 Awareness (在线状态)
4. 实现冲突解决策略
5. 添加 WebSocket/WebRTC Provider

**Phase 4: 性能优化**
1. 实现 Canvas 分层渲染
2. 实现视口裁剪
3. 实现对象缓存
4. 实现空间索引 (R-tree)

---

## 附录: 原始 Bundle 信息

- 原始文件: `snowbrush.js` (131,836 行)
- 版本: 2.47.0
- 模块映射: `modueMap.json` (230+ 条目)
- 反编译工具: `unpack.mjs` (使用 webcrack)
- 反编译进度: `PROJECTS.md`
