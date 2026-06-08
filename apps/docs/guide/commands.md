# 命令系统

## 概述

Y-MindMap 使用命令模式处理所有操作，支持撤销/重做、快捷键绑定。

## 内置命令

| 命令 | 快捷键 | 说明 |
|------|--------|------|
| `addSubTopic` | Tab | 添加子节点 |
| `addSiblingTopic` | Enter | 添加兄弟节点 |
| `deleteNode` | Delete | 删除节点 |
| `toggleFold` | Space | 折叠/展开 |
| `undo` | Ctrl+Z | 撤销 |
| `redo` | Ctrl+Shift+Z | 重做 |
| `selectAll` | Ctrl+A | 全选 |
| `deselectAll` | Escape | 取消选择 |
| `navigateUp` | ↑ | 向上导航 |
| `navigateDown` | ↓ | 向下导航 |
| `navigateLeft` | ← | 向左导航 |
| `navigateRight` | → | 向右导航 |
| `copy` | Ctrl+C | 复制 |
| `cut` | Ctrl+X | 剪切 |
| `paste` | Ctrl+V | 粘贴 |
| `duplicate` | Ctrl+D | 复制节点 |

## 执行命令

```typescript
// 执行命令
editor.executeCommand('addSubTopic')
editor.executeCommand('updateTitle', { nodeId: 'node-1', title: 'New Title' })

// 带参数的命令
editor.executeCommand('setStructureClass', {
  structureClass: 'org.xmind.ui.logic.right',
})
```

## 自定义命令

```typescript
import { defineCommand } from '@y-mindmap/commands'
import { z } from 'zod'

const myCommand = defineCommand({
  name: 'myCommand',
  description: 'My custom command',
  category: 'custom',
  inputSchema: z.object({
    nodeId: z.string(),
    value: z.string(),
  }),
  execute: (state, input, dispatch) => {
    const tr = state.tr
    tr.updateNode(input.nodeId, node => node.withTitle(input.value))
    dispatch?.(tr)
    return true
  },
})

// 注册命令
commandRegistry.register('myCommand', myCommand)
```

## 命令注册表

```typescript
import { CommandRegistry } from '@y-mindmap/commands'

const registry = new CommandRegistry()

// 注册命令
registry.register('myCommand', myCommand)

// 执行命令
registry.execute('myCommand', state, dispatch)

// 自定义快捷键
registry.setKeymap({
  'Ctrl+Shift+N': 'myCommand',
})

// 获取命令列表
const commands = registry.getCommandDefinitions()
```

## 命令链

```typescript
import { chainCommands } from '@y-mindmap/commands'

const chainedCommand = chainCommands(
  deleteNode(),
  selectAll(),
)
```
