# 快速开始

## 安装

```bash
pnpm add @y-mindmap/vanilla
```

## 基础使用

```typescript
import { createMindMap } from '@y-mindmap/vanilla'

const container = document.getElementById('app')
const editor = createMindMap(container)

// 添加节点
editor.executeCommand('addSubTopic')

// 撤销
editor.executeCommand('undo')
```

## 使用模板

```typescript
import { createMindMap } from '@y-mindmap/vanilla'
import { getTemplateById } from '@y-mindmap/templates'

const template = getTemplateById('business-swot')
const editor = createMindMap(container, {
  doc: MindMapDocument.fromJSON(template.root),
})
```

## 协作编辑

```typescript
import { createMindMap, Collab } from '@y-mindmap/vanilla'
import * as Y from 'yjs'

const ydoc = new Y.Doc()
const editor = createMindMap(container, {
  extensions: [
    ...StarterKit(),
    Collab.configure({ ydoc }),
  ],
})
```

## 使用扩展

```typescript
import { createMindMap, StarterKit, Collab } from '@y-mindmap/vanilla'

// 默认使用 StarterKit（包含所有扩展）
const editor = createMindMap(container)

// 自定义扩展配置
const editor = createMindMap(container, {
  extensions: [
    ...StarterKit({ contextMenu: false }),
    Collab.configure({ ydoc }),
  ],
})
```

## AI 集成

```typescript
import { StateDescriber, SuggestionEngine, QueryBuilder } from '@y-mindmap/ai'

const describer = new StateDescriber(editor.getState())
console.log(describer.describe())

const suggestions = new SuggestionEngine(editor.getState())
console.log(suggestions.getSuggestions())

const query = new QueryBuilder(editor.getState())
const importantNodes = query.where({ hasLabels: true }).find()
```
