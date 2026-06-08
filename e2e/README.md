# E2E 测试（Playwright）

本目录包含 Y-MindMap 的端到端测试，使用 [Playwright](https://playwright.dev/) 在真实浏览器中驱动 `apps/demos` 应用。

## 设计说明

思维导图的节点由 **Leafer-UI 渲染在 `<canvas>` 上**，并非 DOM 元素，因此无法用常规选择器点击具体节点。
工具栏、状态栏、小地图等外围 UI 则是真实 DOM。

据此，e2e 采用两种互补的断言手段：

1. **DOM 断言**：工具栏按钮（`button[data-action="..."]`）、状态栏（`.y-mindmap-status-bar`）、canvas 是否渲染等。
2. **真实 editor 实例驱动**：`apps/demos/src/main.ts` 将 `editor` 实例及关键类挂在 `window.__ymindmap` 上（仅 demo 应用，对库本身无影响）。测试通过它执行命令、读取文档/选区/缩放等状态。这是 canvas 类应用做 e2e 的通行做法。

测试目标是端口 `3001` 的 `demos` 应用，Playwright 会自动启动其 Vite dev server。

## 运行

```bash
# 首次需安装浏览器内核
pnpm exec playwright install chromium

# 运行全部 e2e
pnpm test:e2e

# UI 模式（调试）
pnpm test:e2e:ui

# 查看上次报告
pnpm test:e2e:report
```

## 用例覆盖

| 文件 | 覆盖的开发文档能力 |
|------|------|
| `loading.spec.ts` | 应用加载、核心 UI 渲染、默认文档节点数、无致命错误 |
| `toolbar.spec.ts` | 工具栏命令按钮/布局选择器渲染、按钮启用/禁用随选区变化 |
| `commands.spec.ts` | 命令系统：`addSubTopic`/`deleteNode`/`undo`/`redo`/`selectAll`/`duplicate` |
| `viewport.spec.ts` | 视口：`zoomIn`/`zoomOut`/`fitToContent` |
| `navigation.spec.ts` | 多页面演示（富文本/协作/模板/主题/布局/AI）均可加载 |

## 维护提示

- 默认演示文档为 21 个节点（`DEMO_NODE_COUNT`，见 `helpers.ts`），改动 `apps/demos/src/main.ts` 的演示数据时需同步更新。
- 新增测试钩子能力时优先扩展 `window.__ymindmap`，并在 `helpers.ts` 中封装。
