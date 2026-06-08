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
import { createMindMap } from '@y-mindmap/vanilla'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'room-id', ydoc)

const editor = createMindMap(container, {
  ydoc,
  user: {
    id: 'user-1',
    name: '张三',
    account: 'zhangsan@example.com',
    color: '#FF6B6B',
  },
})
```

## 使用插件

```typescript
import { createMindMap } from '@y-mindmap/vanilla'

const myPlugin = {
  id: 'my-plugin',
  name: '我的插件',
  version: '1.0.0',
  
  init(api) {
    api.registerCommand('my-command', {
      name: 'my-command',
      description: '自定义命令',
      execute: (state, input, dispatch) => {
        api.showNotification({ message: '执行成功', type: 'success' })
        return true
      },
    })
  },
}

const editor = createMindMap(container, {
  plugins: [myPlugin],
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
