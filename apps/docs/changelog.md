# 更新日志

## v0.2.0 (2024-06-09)

### 新增

- **Extension 系统**
  - 全新的扩展系统，取代旧的 Plugin 系统
  - `createExtension()` 工厂函数
  - 不可变的 `configure()` 配置方法
  - 类型安全的选项系统
  - 17 个内置扩展
  - StarterKit 和 PureStarterKit

### 变更

- 移除旧的 Plugin 系统
- `MindMapEditorOptions.plugins` 改为 `extensions`

## v0.1.0 (2024-06-08)

### 新增

- **核心功能**
  - 54 种节点形状
  - 22 种连线样式
  - 7 个预置主题
  - 21 种布局算法
  - 26 个命令

- **交互系统**
  - 选择、拖拽、键盘导航
  - 手势识别、惯性滚动
  - 框选、多选

- **格式支持**
  - XMind 导入导出
  - Markdown 导入导出
  - PNG/PDF 导出

- **协作编辑**
  - 基于 Yjs 的实时协作
  - 锁机制和冲突检测
  - 用户状态同步

- **AI 集成**
  - 状态描述 (StateDescriber)
  - 上下文提供 (ContextProvider)
  - 结构查询 (QueryBuilder)
  - 智能建议 (SuggestionEngine)
  - WebMCP 支持

- **插件系统**
  - 命令注册
  - 事件钩子
  - UI 扩展

- **模板系统**
  - 18 个预置模板
  - 商务、教育、项目、个人、创意、分析等类别

- **性能优化**
  - 虚拟渲染
  - 布局缓存
  - 增量更新

- **Diff 系统**
  - 树对比算法
  - 变更可视化

- **错误处理**
  - 自定义错误类
  - Zod Schema 验证
