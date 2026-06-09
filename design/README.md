# Y-MindMap

基于 Leafer.js 的现代化思维导图编辑器，采用 ProseMirror 风格的 state/view 分离架构。

## 文档索引

### 核心设计文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | **核心开发文档** - 架构设计、包结构、子系统分析、功能清单、开发路线图 | ✅ |
| [CODEMAP.md](./CODEMAP.md) | 原始 Snowbrush 源码地图 - 项目结构、技术栈、核心模块、数据流 | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 架构设计文档 - State/View 分离、Leafer.js 集成、代码示例 | ✅ |
| [ALGORITHMS.md](./ALGORITHMS.md) | **算法详解** - 20 个核心子系统的具体算法实现 | ✅ |
| [PROSEMIRROR-ARCH.md](./PROSEMIRROR-ARCH.md) | **ProseMirror 架构** - 完整的 Model/State/Transform/View/Plugin/Command/History/Collab 设计 | ✅ |

### 实现详细设计文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [RENDER.md](./RENDER.md) | **渲染层设计** - Leafer.js 集成、40+ 节点形状、18 种连线样式、文字/图片/标记渲染 | ✅ |
| [LAYOUT-IMPL.md](./LAYOUT-IMPL.md) | **布局实现规范** - 21 种布局结构的详细实现、增量布局、布局缓存 | ✅ |
| [INTERACTION.md](./INTERACTION.md) | **交互层设计** - 选择、编辑、拖拽、导航、视口、手势、右键菜单、快捷键 | ✅ |
| [COORDINATE.md](./COORDINATE.md) | **坐标系统设计** - 四个坐标空间、矩阵变换、碰撞检测、视口计算 | ✅ |
| [DATA-MODEL.md](./DATA-MODEL.md) | **数据模型设计** - 所有数据结构定义、数据约束、验证规则、数据迁移 | ✅ |
| [STYLE-SYSTEM.md](./STYLE-SYSTEM.md) | **样式系统设计** - 样式计算、继承、覆盖规则、样式缓存 | ✅ |
| [PERSISTENCE.md](./PERSISTENCE.md) | **数据持久化设计** - 本地/远程存储、自动保存、崩溃恢复、版本历史 | ✅ |

### 计划和评估文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [IMPLEMENTATION-READINESS.md](./IMPLEMENTATION-READINESS.md) | **实现就绪度评估** - 差距分析、缺失清单、实现优先级、MVP 范围、工期预估 | ✅ |
| [FULL-PLAN.md](./FULL-PLAN.md) | **完整计划** - 12 个待补充文档大纲、17 个实现阶段、时间线、资源需求 | ✅ |
| [GAP-ANALYSIS.md](./GAP-ANALYSIS.md) | **差距分析** - 完整性检查、21 个遗漏内容、29 个待创建文档清单 | ✅ |

### 功能设计文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [THEME.md](./THEME.md) | **主题系统** - 主题结构、预置主题、主题管理、主题切换 | ✅ |
| [SERIALIZATION.md](./SERIALIZATION.md) | **序列化设计** - JSON/二进制序列化、剪贴板格式、版本兼容 | ✅ |
| [IMPORT-EXPORT.md](./IMPORT-EXPORT.md) | **导入导出** - XMind/Markdown/OPML 格式、图片导出 | ✅ |
| [UI-COMPONENTS.md](./UI-COMPONENTS.md) | **UI 组件** - 工具栏、属性面板、右键菜单、小地图、状态栏 | ✅ |
| [CONFIGURATION.md](./CONFIGURATION.md) | **配置系统** - 编辑器配置、功能开关、快捷键配置、配置验证 | ✅ |

### 质量和运维文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [TESTING.md](./TESTING.md) | **测试策略** - 测试金字塔、单元测试、集成测试、E2E 测试 | ✅ |
| [EDGE-CASES.md](./EDGE-CASES.md) | **边界情况** - 数据边界、交互边界、渲染边界、性能边界 | ✅ |
| [DEBUGGING.md](./DEBUGGING.md) | **调试工具** - 状态检查器、文档树检查器、性能检查器、日志系统 | ✅ |
| [SECURITY.md](./SECURITY.md) | **安全设计** - XSS 防护、输入验证、权限控制、审计日志 | ✅ |
| [PERFORMANCE.md](./PERFORMANCE.md) | **性能优化** - 虚拟渲染、分层渲染、增量布局、内存优化 | ✅ |

### 扩展和集成文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [PLUGIN-GUIDE.md](./PLUGIN-GUIDE.md) | **插件指南** - 插件架构、插件接口、插件示例、插件测试 | ✅ |
| [I18N.md](./I18N.md) | **国际化** - 语言包、日期时间、数字格式、RTL 支持 | ✅ |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | **无障碍** - 键盘导航、ARIA 支持、高对比度、屏幕阅读器 | ✅ |
| [MIGRATION.md](./MIGRATION.md) | **迁移指南** - 从 Snowbrush/XMind 迁移、格式转换 | ✅ |

### 项目管理文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | **部署设计** - 构建配置、npm 发布、CDN 部署、监控 | ✅ |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | **贡献指南** - 开发环境、代码规范、Git 规范、测试规范 | ✅ |
| [CHANGELOG.md](./CHANGELOG.md) | **变更日志** - 版本变更记录 | ✅ |
| [ROADMAP.md](./ROADMAP.md) | **路线图** - 短期/中期/长期目标、功能优先级 | ✅ |

### 参考文档

| 文档 | 说明 | 状态 |
|------|------|------|
| [API-REFERENCE.md](./API-REFERENCE.md) | **API 参考** - EditorView、MindMapNode、Selection、Transaction、Command | ✅ |
| [GLOSSARY.md](./GLOSSARY.md) | **术语表** - 项目术语定义 | ✅ |
| [EXAMPLES.md](./EXAMPLES.md) | **示例代码** - 基础/交互/样式/布局/导入导出/插件示例 | ✅ |
| [FAQ.md](./FAQ.md) | **常见问题** - 安装/使用/交互/导入导出/兼容性问题 | ✅ |

## 技术栈

- **包管理**: pnpm workspace + turborepo
- **渲染引擎**: Leafer.js (Canvas)
- **语言**: TypeScript
- **构建**: Vite

## 架构设计

```
State (纯数据)              View (Leafer.js Canvas)
     │                            │
     │    ┌───────────────────┐   │
     └───►│   Transaction     │───┘
          │   (不可变更新)     │
          └───────────────────┘
```

## 包结构

```
y-mindmap/
├── packages/
│   ├── core/           # @y-mindmap/core - 类型定义
│   ├── state/          # @y-mindmap/state - 纯数据模型
│   ├── interaction/    # @y-mindmap/interaction - 交互抽象层
│   ├── view/           # @y-mindmap/view - Leafer.js 渲染
│   ├── layout/         # @y-mindmap/layout - 布局引擎
│   ├── commands/       # @y-mindmap/commands - 命令系统
│   └── editor/         # @y-mindmap/editor - 编辑器组装
├── apps/
│   └── demo/           # 演示应用
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 源码参考

本项目参考 XMind Snowbrush v2.47.0 反编译源码进行设计，原始源码位于:
`/Users/mizuka/Projects/fe/snowbrush-render/src/`

## 开发阶段

1. **Phase 1**: 基础架构 (monorepo + core + state)
2. **Phase 2**: 核心渲染 (view + layout)
3. **Phase 3**: 核心交互 (interaction + commands)
4. **Phase 4**: 增强功能 (拖拽、多选、折叠)
5. **Phase 5**: 进阶功能 (图片、备注、标记、关系线)
6. **Phase 6**: 导入导出 (XMind、Markdown、OPML)
7. **Phase 7**: 高级功能 (Yjs 协同、插件系统)
