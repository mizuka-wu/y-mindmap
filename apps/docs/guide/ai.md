# AI 集成

## 概述

Y-MindMap 提供 AI 友好的接口，包括状态描述、上下文查询、智能建议等功能。

## StateDescriber

用自然语言描述当前状态：

```typescript
import { StateDescriber } from '@y-mindmap/ai'

const describer = new StateDescriber(state, 'zh-CN')

// 描述整个思维导图
describer.describe()
// "思维导图「项目计划」
//  布局: 思维导图
//  主要分支 (3): 需求分析, 时间线, 资源分配
//  共 15 个节点，最大深度 3，8 个叶子节点"

// 描述单个节点
describer.describeNode('node-id')
// "「需求分析」
//  类型: 子节点
//  位置: 根节点 #1
//  子节点 (3): 功能需求, 非功能需求, 约束条件"
```

### 支持语言

- `zh-CN` - 中文
- `en-US` - 英文
- `ja-JP` - 日文
- `ko-KR` - 韩文

## ContextProvider

提供结构化上下文信息：

```typescript
import { ContextProvider } from '@y-mindmap/ai'

const context = new ContextProvider(state)

// 获取完整上下文
const fullContext = context.getFullContext()
// {
//   document: { title, nodeCount, maxDepth, ... },
//   selection: { nodeIds, titles, count, ... },
//   selectedNodes: [{ id, title, type, depth, ... }],
//   statistics: { totalNodes, nodesByType, ... }
// }

// 获取文档上下文
context.getDocumentContext()

// 获取选择上下文
context.getSelectionContext()

// 获取统计信息
context.getStatistics()
```

## QueryBuilder

查询思维导图结构：

```typescript
import { QueryBuilder } from '@y-mindmap/ai'

const query = new QueryBuilder(state)

// 条件查询
query.where({ type: TopicType.ATTACHED }).find()
query.where({ title: { $contains: '需求' } }).find()
query.where({ depth: { $gt: 3 } }).find()
query.where({ hasChildren: false }).find()

// 排序
query.sortBy('title', 'asc').find()
query.sortBy('depth', 'desc').find()

// 分页
query.limit(10).offset(20).find()

// 快捷方法
query.findById('node-id')
query.findByTitle('需求分析')
query.findChildren('parent-id')
query.findDescendants('node-id')
query.findAncestors('node-id')
query.findPath('from-id', 'to-id')
query.findSiblings('node-id')

// 聚合
query.count()
query.exists()
```

## SuggestionEngine

基于当前状态建议下一步操作：

```typescript
import { SuggestionEngine } from '@y-mindmap/ai'

const suggestions = new SuggestionEngine(state, 'zh-CN')

const result = suggestions.getSuggestions()
// [
//   {
//     action: 'addSubTopic',
//     reason: '根节点没有子节点，添加主要分支以开始构建思维导图',
//     priority: 'high',
//     category: 'structure'
//   },
//   ...
// ]
```

### 建议类型

| 类别 | 说明 |
|------|------|
| `structure` | 结构优化建议 |
| `content` | 内容完善建议 |
| `organization` | 组织管理建议 |
| `style` | 样式美化建议 |

### 优先级

| 优先级 | 说明 |
|--------|------|
| `high` | 高优先级，建议立即执行 |
| `medium` | 中优先级，建议适时执行 |
| `low` | 低优先级，可选执行 |

## WebMCP

注册工具到 WebMCP：

```typescript
import { createMCPServer } from '@y-mindmap/webmcp'
import { defineCommand } from '@y-mindmap/commands'

const server = createMCPServer('y-mindmap', '1.0.0', 'Mind map editor')
server.setEditorContext(state, dispatch)

// 注册命令
server.registerCommand({
  name: 'addTag',
  description: 'Add a tag to selected nodes',
  inputSchema: z.object({
    name: z.string(),
    color: z.string(),
  }),
  execute: (state, input, dispatch) => {
    // 添加标签
    return { success: true }
  },
})

// 处理 MCP 请求
const response = await server.handleRequest({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'addTag',
    arguments: { name: 'important', color: '#FF0000' },
  },
})

// 获取所有工具
const tools = server.getTools()
```

## 注册为命令

```typescript
import { defineCommand } from '@y-mindmap/commands'
import { StateDescriber, SuggestionEngine, QueryBuilder } from '@y-mindmap/ai'

const describeStateCommand = defineCommand({
  name: 'ai.describeState',
  description: 'Get natural language description of current state',
  category: 'ai',
  execute: (state) => {
    const describer = new StateDescriber(state)
    return describer.describe()
  },
})

const getSuggestionsCommand = defineCommand({
  name: 'ai.getSuggestions',
  description: 'Get AI suggestions for next actions',
  category: 'ai',
  execute: (state) => {
    const engine = new SuggestionEngine(state)
    return engine.getSuggestions()
  },
})

const queryNodesCommand = defineCommand({
  name: 'ai.queryNodes',
  description: 'Query nodes by conditions',
  category: 'ai',
  inputSchema: z.object({
    conditions: z.record(z.any()),
  }),
  execute: (state, input) => {
    const query = new QueryBuilder(state)
    return query.where(input.conditions).find()
  },
})
```
