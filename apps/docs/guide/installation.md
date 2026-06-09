# 安装

## 使用包管理器

```bash
# pnpm (推荐)
pnpm add @y-mindmap/vanilla

# npm
npm install @y-mindmap/vanilla

# yarn
yarn add @y-mindmap/vanilla
```

## 包结构

```bash
# 核心包
@y-mindmap/core          # 类型定义、常量、错误处理
@y-mindmap/state         # 数据模型、状态管理
@y-mindmap/view          # 视图渲染、主题、装饰器
@y-mindmap/layout        # 布局算法
@y-mindmap/commands      # 命令系统
@y-mindmap/interaction   # 交互处理
@y-mindmap/ui            # UI 组件

# 扩展包
@y-mindmap/extension     # 扩展框架（createExtension, ExtensionManager, ExtensionContext）
@y-mindmap/extensions    # 内置扩展实现（17 个扩展）
@y-mindmap/collab        # 协作编辑
@y-mindmap/ai            # AI 集成
@y-mindmap/webmcp        # WebMCP 支持
@y-mindmap/templates     # 预置模板
@y-mindmap/formats       # 导入导出格式
@y-mindmap/richtext-editor # 富文本编辑器

# 入口包
@y-mindmap/vanilla       # Vanilla JS 入口
@y-mindmap/editor        # 编辑器组装
```

## 按需引入

```typescript
// 只引入核心功能
import { MindMapEditor } from '@y-mindmap/editor'
import { MindMapDocument } from '@y-mindmap/state'

// 引入特定布局
import { MapLayout, TreeLayout } from '@y-mindmap/layout'

// 引入特定主题
import { DARK_THEME, CLASSIC_THEME } from '@y-mindmap/view'

// 引入扩展框架
import { createExtension, ExtensionManager } from '@y-mindmap/extension'

// 引入内置扩展
import { StarterKit, Collab } from '@y-mindmap/extensions'

// 引入特定格式
import { XMindImporter } from '@y-mindmap/formats/xmind'
import { MarkdownExporter } from '@y-mindmap/formats/markdown'
```

## 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## TypeScript 支持

项目完全使用 TypeScript 编写，自带类型定义。

```typescript
import type { 
  TopicData, 
  AttributeTitle, 
  MindMapNode,
  EditorState 
} from '@y-mindmap/core'
```
