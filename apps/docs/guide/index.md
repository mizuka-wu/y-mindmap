# 简介

Y-MindMap 是一个基于 Leafer.js 的现代化思维导图编辑器，采用 ProseMirror 风格的 state/view 分离架构。

## 特性

- **丰富的形状** - 支持 54 种节点形状、22 种连线样式
- **多种布局** - 21 种布局算法，包括思维导图、逻辑图、组织图等
- **主题系统** - 7 个预置主题，支持自定义主题
- **实时协作** - 基于 Yjs 的协作编辑，支持锁机制
- **AI 集成** - 内置 WebMCP 支持，提供智能建议
- **扩展系统** - 灵活的扩展架构，支持命令注册、事件监听、生命周期管理
- **高性能** - 虚拟渲染、布局缓存、增量更新

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    MindMapEditor                         │
├─────────────────────────────────────────────────────────┤
│  Commands    │  Interaction    │  UI      │  Extensions  │
├─────────────────────────────────────────────────────────┤
│                    State Layer                           │
│  (MindMapDocument, MindMapNode, Selection, Transaction) │
├─────────────────────────────────────────────────────────┤
│                    View Layer                            │
│  (EditorView, TopicView, ConnectionView, Themes)        │
├─────────────────────────────────────────────────────────┤
│                    Layout Layer                          │
│  (21 Layout Algorithms, Incremental Layout)             │
├─────────────────────────────────────────────────────────┤
│                    Core Layer                            │
│  (Types, Constants, Errors, Utils)                      │
└─────────────────────────────────────────────────────────┘
```

## 包结构

| 包名 | 说明 |
|------|------|
| `@y-mindmap/core` | 核心类型、常量、错误处理 |
| `@y-mindmap/state` | 数据模型、状态管理 |
| `@y-mindmap/view` | 视图渲染、主题、装饰器 |
| `@y-mindmap/layout` | 布局算法 |
| `@y-mindmap/commands` | 命令系统 |
| `@y-mindmap/interaction` | 交互处理 |
| `@y-mindmap/ui` | UI 组件 |
| `@y-mindmap/extension` | 扩展框架（createExtension, ExtensionManager） |
| `@y-mindmap/extensions` | 内置扩展实现（17 个扩展） |
| `@y-mindmap/collab` | 协作编辑 |
| `@y-mindmap/ai` | AI 集成 |
| `@y-mindmap/webmcp` | WebMCP 支持 |
| `@y-mindmap/templates` | 预置模板 |
| `@y-mindmap/formats` | 导入导出格式 |
| `@y-mindmap/editor` | 编辑器组装 |

## 技术栈

- **渲染引擎**: Leafer.js (Canvas)
- **包管理**: pnpm + Turborepo
- **语言**: TypeScript
- **协作**: Yjs
- **Schema 验证**: Zod
- **文档**: VitePress
