# @y-mindmap/ai

AI 友好接口，提供状态描述、上下文查询、智能建议等功能。

## StateDescriber

用自然语言描述当前状态。

```typescript
import { StateDescriber } from '@y-mindmap/ai'

const describer = new StateDescriber(state, 'zh-CN')

// 描述整个思维导图
describer.describe()
// "思维导图「项目计划」
//  布局: 思维导图
//  主要分支 (3): 需求分析, 时间线, 资源分配
//  共 15 个节点，最大深度 3，8 个叶子节点
//  当前选中: 「需求分析」"

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

## ContextProvider

提供结构化上下文信息。

```typescript
import { ContextProvider } from '@y-mindmap/ai'

const context = new ContextProvider(state)

// 获取完整上下文
context.getFullContext()
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

查询思维导图结构。

```typescript
import { QueryBuilder } from '@y-mindmap/ai'

const query = new QueryBuilder(state)

// 条件查询
query.where({ type: 'attached' }).find()
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
query.findByType(TopicType.ATTACHED)
query.findChildren('parent-id')
query.findDescendants('node-id')
query.findAncestors('node-id')
query.findPath('from-id', 'to-id')
query.findSiblings('node-id')

// 聚合
query.count()
query.exists()
```

### 查询条件

```typescript
interface QueryCondition {
  type?: TopicType | TopicType[]
  title?: string | { $contains, $startsWith, $endsWith, $regex }
  depth?: number | { $gt, $lt, $gte, $lte, $eq }
  hasChildren?: boolean
  hasMarkers?: boolean
  hasLabels?: boolean
  hasNotes?: boolean
  hasImage?: boolean
  isFolded?: boolean
  markerId?: string
  label?: string
}
```

## SuggestionEngine

基于当前状态建议下一步操作。

```typescript
import { SuggestionEngine } from '@y-mindmap/ai'

const suggestions = new SuggestionEngine(state, 'zh-CN')

suggestions.getSuggestions()
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
| structure | 结构优化建议 |
| content | 内容完善建议 |
| organization | 组织管理建议 |
| style | 样式美化建议 |

### 优先级

| 优先级 | 说明 |
|--------|------|
| high | 高优先级，建议立即执行 |
| medium | 中优先级，建议适时执行 |
| low | 低优先级，可选执行 |

## 注册为命令

```typescript
import { defineCommand } from '@y-mindmap/commands'
import { StateDescriber, SuggestionEngine, QueryBuilder } from '@y-mindmap/ai'
import { z } from 'zod'

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
    limit: z.number().optional(),
    offset: z.number().optional(),
  }),
  execute: (state, input) => {
    const query = new QueryBuilder(state)
    
    for (const [key, value] of Object.entries(input.conditions)) {
      query.where({ [key]: value })
    }
    
    if (input.limit) query.limit(input.limit)
    if (input.offset) query.offset(input.offset)
    
    return query.find()
  },
})
```
