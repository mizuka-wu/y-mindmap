# 实现就绪度评估

## 一、当前设计覆盖度

### ✅ 已覆盖 (可以开始实现)

| 层级 | 文档 | 覆盖度 | 可实现性 |
|------|------|--------|----------|
| **架构设计** | ARCHITECTURE.md | 90% | ✅ 可以开始 |
| **包结构** | DEVELOPMENT.md | 95% | ✅ 可以开始 |
| **Model 层** | PROSEMIRROR-ARCH.md | 85% | ✅ 可以开始 |
| **State 层** | PROSEMIRROR-ARCH.md | 80% | ✅ 可以开始 |
| **Transform 层** | PROSEMIRROR-ARCH.md | 75% | ⚠️ 需要补充 Step 实现 |
| **Command 系统** | PROSEMIRROR-ARCH.md | 70% | ⚠️ 需要补充具体命令 |
| **算法** | ALGORITHMS.md | 90% | ✅ 可以开始 |
| **Snowbrush 参考** | CODEMAP.md | 95% | ✅ 完整参考 |

### ⚠️ 部分覆盖 (需要补充)

| 层级 | 当前状态 | 缺失内容 |
|------|----------|----------|
| **View 层** | 有架构设计，无具体实现 | Leafer.js 渲染细节、节点形状、连线样式 |
| **Layout 层** | 有算法描述，无接口定义 | LayoutEngine 接口、各布局实现规范 |
| **Interaction 层** | 有概念，无详细设计 | 交互状态机、事件处理流程 |
| **Plugin 系统** | 有接口定义，无实现示例 | 具体 Plugin 实现模式 |

### ❌ 未覆盖 (需要新增)

| 层级 | 重要性 | 说明 |
|------|--------|------|
| **渲染层详细设计** | 🔴 必须 | Leafer.js 具体 API 使用、节点形状绘制、连线路径生成 |
| **布局层详细设计** | 🔴 必须 | 21 种布局的具体实现规范 |
| **交互层详细设计** | 🔴 必须 | 拖拽、选择、编辑、导航的完整实现 |
| **主题系统** | 🟡 重要 | 样式计算、主题切换、样式继承 |
| **导入导出** | 🟡 重要 | XMind/Markdown/OPML 格式转换 |
| **测试策略** | 🟡 重要 | 单元测试、集成测试、E2E 测试 |
| **性能优化** | 🟢 可选 | 虚拟渲染、增量更新、缓存策略 |

---

## 二、缺失文档清单

### 🔴 必须补充 (无法开始实现)

#### 1. RENDER.md - 渲染层详细设计

需要包含：
- [ ] Leafer.js API 使用规范
- [ ] 节点形状渲染 (40+ 种形状的 Canvas 绘制)
- [ ] 连线样式渲染 (18 种连线的路径生成)
- [ ] 文字渲染 (自动换行、对齐、溢出处理)
- [ ] 图片渲染 (缩放、裁剪、占位符)
- [ ] 标记/图标渲染 (位置、大小、排列)
- [ ] 选择框渲染 (多选框、拖拽框)
- [ ] 装饰器渲染 (高亮、动画、过渡)
- [ ] 坐标系统 (本地/世界/屏幕坐标转换)
- [ ] 视口管理 (缩放、平移、边界约束)

#### 2. LAYOUT-IMPL.md - 布局实现详细设计

需要包含：
- [ ] LayoutEngine 接口定义
- [ ] 布局结果数据结构
- [ ] 21 种布局的具体实现规范：
  - Map 布局 (平衡/非平衡/顺时针/逆时针)
  - Tree 布局 (左/右/双侧)
  - Logic 布局 (左/右/双侧)
  - OrgChart 布局 (上/下/双侧)
  - Fishbone 布局 (左头/右头)
  - Timeline 布局 (水平/垂直/侧向/穿越)
  - Spreadsheet 布局 (行/列)
  - Brace 布局 (左/右/双侧)
  - TreeTable 布局
- [ ] 布局切换动画
- [ ] 布局缓存策略
- [ ] 增量布局算法

#### 3. INTERACTION.md - 交互层详细设计

需要包含：
- [ ] 交互状态机定义
- [ ] 事件处理流程
- [ ] 选择交互：
  - 单选、多选、范围选、框选
  - 键盘选择 (方向键、Shift+方向键)
- [ ] 编辑交互：
  - 双击进入编辑
  - 文本输入处理
  - 编辑完成/取消
- [ ] 拖拽交互：
  - 拖拽识别 (阈值、方向)
  - 拖拽预览 (阴影、占位符)
  - 放置目标检测 (碰撞检测)
  - 放置位置计算 (索引、方向)
- [ ] 导航交互：
  - 键盘导航 (Tab/Enter/Delete/方向键)
  - 焦点管理
- [ ] 视口交互：
  - 缩放 (滚轮、手势、键盘)
  - 平移 (拖拽、边缘滚动、惯性)
- [ ] 手势交互：
  - 双指缩放
  - 双指旋转 (可选)

### 🟡 重要补充 (影响功能完整性)

#### 4. THEME.md - 主题系统设计

需要包含：
- [ ] 主题数据结构
- [ ] 样式计算规则：
  - 默认样式
  - 主题样式覆盖
  - 用户自定义样式
  - 样式继承链
- [ ] 主题切换流程
- [ ] 预置主题定义
- [ ] 自定义主题接口

#### 5. IMPORT-EXPORT.md - 导入导出设计

需要包含：
- [ ] 内部数据格式定义
- [ ] XMind 格式：
  - .xmind 文件结构 (ZIP + JSON)
  - 解析流程
  - 生成流程
- [ ] Markdown 格式：
  - 缩进表示层级
  - 解析流程
  - 生成流程
- [ ] OPML 格式：
  - XML 结构
  - 解析流程
  - 生成流程
- [ ] 图片导出：
  - PNG 导出
  - SVG 导出

#### 6. TESTING.md - 测试策略

需要包含：
- [ ] 测试层级：
  - 单元测试 (Model、Transform、算法)
  - 集成测试 (State + View)
  - E2E 测试 (完整用户流程)
- [ ] 测试工具选择
- [ ] 测试覆盖率目标
- [ ] 性能测试基准
- [ ] 回归测试策略

### 🟢 可选补充 (提升质量)

#### 7. PERFORMANCE.md - 性能优化设计

需要包含：
- [ ] 虚拟渲染策略
- [ ] 增量更新算法
- [ ] 缓存策略：
  - 布局缓存
  - 渲染缓存
  - 度量缓存
- [ ] 内存优化：
  - 对象池
  - 弱引用
  - 懒卸载
- [ ] Web Worker 使用

#### 8. PLUGIN-GUIDE.md - 插件开发指南

需要包含：
- [ ] 插件接口规范
- [ ] 插件生命周期
- [ ] 插件示例：
  - 自动保存插件
  - 协同编辑插件
  - 小地图插件
  - 导出插件
- [ ] 插件测试方法

---

## 三、实现优先级建议

### Phase 0: 基础设施 (1-2 天)

```
1. 初始化 monorepo 项目结构
2. 配置 pnpm workspace + turborepo
3. 配置 TypeScript + Vite
4. 配置 ESLint + Prettier
5. 创建各包的 package.json
6. 创建共享的 tsconfig.json
```

### Phase 1: 核心 Model (3-5 天)

```
1. 实现 Schema 系统
   - NodeType, MarkType
   - ContentMatch
   - Schema 编译

2. 实现 Node 模型
   - MindMapNode (不可变)
   - Fragment
   - Slice
   - Mark

3. 实现位置系统
   - ResolvedPos
   - NodeRange

4. 单元测试
```

### Phase 2: 核心 State (3-5 天)

```
1. 实现 Selection
   - NodeSelection
   - TextSelection (用于标题编辑)

2. 实现 Step 系统
   - Step 基类
   - ReplaceStep
   - AddMarkStep / RemoveMarkStep
   - MoveNodeStep
   - ChangeAttrStep
   - ToggleFoldStep

3. 实现 Transform
   - Mapping
   - Transform 基类

4. 实现 Transaction
   - 继承 Transform
   - 添加选择、元数据

5. 实现 EditorState
   - 状态快照
   - 插件状态管理

6. 单元测试
```

### Phase 3: 核心 View (5-7 天)

```
1. 实现 Leafer.js 集成
   - EditorView 基类
   - 视口管理
   - 坐标转换

2. 实现节点渲染
   - 基础形状 (Rect, Ellipse, RoundedRect)
   - 文字渲染
   - 图片渲染
   - 标记渲染

3. 实现连线渲染
   - 基础连线 (Curve, Elbow, Straight)
   - 路径生成算法

4. 实现选择渲染
   - 选择框
   - 焦点指示器

5. 实现装饰器
   - Decoration
   - DecorationSet

6. 集成测试
```

### Phase 4: 核心 Command (2-3 天)

```
1. 实现基础命令
   - deleteSelection
   - selectAll
   - addSubTopic
   - addSiblingTopic
   - deleteTopic

2. 实现命令链
   - chainCommands
   - 条件命令

3. 实现快捷键映射
   - keymap 插件
   - 默认快捷键

4. 集成测试
```

### Phase 5: 核心 Layout (5-7 天)

```
1. 实现 LayoutEngine 接口
2. 实现 Map 布局 (最常用)
3. 实现 Tree 布局
4. 实现 Logic 布局
5. 实现 OrgChart 布局
6. 实现连线路径生成
7. 集成测试
```

### Phase 6: 核心交互 (5-7 天)

```
1. 实现选择交互
   - 点击选择
   - 多选
   - 框选

2. 实现编辑交互
   - 双击编辑
   - 文本输入

3. 实现拖拽交互
   - 拖拽识别
   - 拖拽预览
   - 放置检测

4. 实现导航交互
   - 键盘导航
   - 焦点管理

5. 实现视口交互
   - 缩放
   - 平移
   - 惯性滚动

6. E2E 测试
```

### Phase 7: History (2-3 天)

```
1. 实现 History 插件
2. 实现 undo/redo 命令
3. 实现事务分组
4. 集成测试
```

### Phase 8: 基础功能完成 (3-5 天)

```
1. 实现折叠/展开
2. 实现标记系统
3. 实现标签系统
4. 实现备注系统
5. 实现图片系统
6. 集成测试
```

---

## 四、最小可用版本 (MVP) 范围

### 功能范围

```
✅ 支持的布局:
   - Map (左右平衡)
   - Tree (向右)
   - Logic (向右)

✅ 支持的交互:
   - 点击选择节点
   - 双击编辑标题
   - Tab 添加子节点
   - Enter 添加兄弟节点
   - Delete 删除节点
   - 方向键导航
   - 滚轮缩放
   - 拖拽平移

✅ 支持的功能:
   - 折叠/展开
   - 撤销/重做
   - 复制/粘贴

❌ 暂不支持:
   - 多选
   - 拖拽移动节点
   - 关系线
   - 边界
   - 摘要
   - 图片
   - 备注
   - 标记
   - 主题切换
   - 导入导出
   - 协同编辑
```

### 预估工期

| 阶段 | 工期 | 累计 |
|------|------|------|
| Phase 0: 基础设施 | 1-2 天 | 2 天 |
| Phase 1: 核心 Model | 3-5 天 | 7 天 |
| Phase 2: 核心 State | 3-5 天 | 12 天 |
| Phase 3: 核心 View | 5-7 天 | 19 天 |
| Phase 4: 核心 Command | 2-3 天 | 22 天 |
| Phase 5: 核心 Layout | 5-7 天 | 29 天 |
| Phase 6: 核心交互 | 5-7 天 | 36 天 |
| Phase 7: History | 2-3 天 | 39 天 |
| Phase 8: 基础功能 | 3-5 天 | 44 天 |

**MVP 预估工期: 6-8 周**

---

## 五、建议的下一步行动

### 立即行动 (今天)

1. **补充 RENDER.md** - 渲染层详细设计
   - Leafer.js API 使用规范
   - 节点形状渲染规范
   - 连线样式渲染规范

2. **补充 LAYOUT-IMPL.md** - 布局实现规范
   - LayoutEngine 接口
   - Map 布局实现 (MVP 必须)

3. **补充 INTERACTION.md** - 交互层设计
   - 交互状态机
   - 核心交互流程

### 本周行动

4. **初始化项目结构**
   - 创建 monorepo
   - 配置构建工具
   - 创建包结构

5. **开始 Phase 1 实现**
   - 实现 Schema 系统
   - 实现 Node 模型

### 本月行动

6. **完成 MVP 核心功能**
   - 完成 Phase 1-4
   - 基础渲染可用
   - 基础交互可用

---

## 六、风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| Leafer.js API 不熟悉 | 🔴 高 | 中 | 先写 Demo 验证关键 API |
| 布局算法复杂度高 | 🔴 高 | 高 | 参考 Snowbrush 实现，逐步实现 |
| 交互状态机复杂 | 🟡 中 | 中 | 使用状态机库 (XState) |
| 性能问题 | 🟡 中 | 中 | 早期进行性能测试 |
| 不可变数据性能 | 🟡 中 | 低 | 使用 Structural Sharing |
| 浏览器兼容性 | 🟢 低 | 低 | 使用现代浏览器 |

---

## 七、技术决策待确认

| 决策点 | 选项 | 建议 | 理由 |
|--------|------|------|------|
| 状态管理 | 自研 vs Immer | 自研 | ProseMirror 风格，完全控制 |
| 不可变更新 | Object.freeze vs Structural Sharing | Structural Sharing | 性能更好 |
| 测试框架 | Vitest vs Jest | Vitest | 与 Vite 集成更好 |
| E2E 测试 | Playwright vs Cypress | Playwright | 更现代，支持多浏览器 |
| 状态机 | 自研 vs XState | 自研 | 简单场景不需要额外依赖 |
| 动画库 | Leafer.js 内置 vs animejs | Leafer.js 内置 | 减少依赖 |
