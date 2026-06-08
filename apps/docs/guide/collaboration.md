# 协作编辑

## 概述

Y-MindMap 基于 Yjs 实现协作编辑，支持多人同时编辑同一份思维导图。

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    MindMapEditor                         │
├─────────────────────────────────────────────────────────┤
│                    YDocBinding                           │
│  (Yjs 文档绑定，同步状态)                                  │
├─────────────────────────────────────────────────────────┤
│                    Y.Doc                                 │
│  (Yjs 文档，数据同步)                                     │
├─────────────────────────────────────────────────────────┤
│                    Provider                              │
│  (WebSocket/WebRTC 连接)                                 │
└─────────────────────────────────────────────────────────┘
```

## 使用方式

### 基础用法

```typescript
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const ydoc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:1234', 'room-id', ydoc)

const editor = new MindMapEditor({
  container: document.getElementById('app')!,
  ydoc,
  user: {
    id: 'user-1',
    name: '张三',
    account: 'zhangsan@example.com',
    color: '#FF6B6B',
  },
})
```

### 获取协作状态

```typescript
const collabManager = editor.getCollaboratorManager()

// 获取所有协作者
const collaborators = collabManager.getCollaborators()
collaborators.forEach((state, clientId) => {
  console.log(`${state.user.name} - ${state.activity}`)
})

// 检查节点锁状态
if (collabManager.isLocked('node-1', 'title')) {
  const holder = collabManager.getLockHolder('node-1', 'title')
  console.log(`${holder.user.name} 正在编辑`)
}

// 检查是否可以操作
if (collabManager.canEditTitle('node-1')) {
  // 可以编辑
}

if (collabManager.canDrag('node-1')) {
  // 可以拖拽
}
```

## 锁机制

### 锁类型

| 操作 | 锁字段 | 互斥行为 |
|------|--------|----------|
| 编辑标题 | `title` | 同一节点只能一人编辑 |
| 拖拽节点 | `drag` | 同一节点只能一人拖拽 |
| 添加/删除节点 | `structure` | 父节点结构修改互斥 |
| 选择节点 | 无锁 | 多人可同时选择 |

### 锁操作

```typescript
const collabManager = editor.getCollaboratorManager()

// 标题编辑互斥
if (collabManager.startEditingTitle('node-1')) {
  // 获得锁，开始编辑
  // ...
  collabManager.stopEditingTitle()
} else {
  // 未获得锁，显示提示
  const holder = collabManager.getLockHolder('node-1', 'title')
  alert(`${holder.user.name} 正在编辑`)
}

// 拖拽互斥
if (collabManager.startDragging('node-1')) {
  // 获得锁，开始拖拽
  // ...
  collabManager.stopDragging()
}

// 结构修改互斥
if (collabManager.startAddingNode('parent-1')) {
  // 获得锁，添加节点
  // ...
  collabManager.stopAddingNode()
}
```

### 冲突检测

```typescript
collabManager.onConflict((conflict) => {
  console.log(`${conflict.requestedBy.name} 想要编辑`)
  console.log(`已被 ${conflict.holder.name} 锁定`)
  alert(`节点正在被 ${conflict.holder.name} 编辑`)
})
```

## Awareness 协议

### 用户状态

```typescript
interface CollaboratorState {
  user: {
    id: string
    name: string
    account: string
    color: string
  }
  activity: ActivityType
  targetNodeId: string | null
  lock: CollaboratorLock | null
  cursor: { x: number; y: number } | null
  selection: string[]
  timestamp: number
}

type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'selecting'
  | 'editing-title'
  | 'dragging'
  | 'resizing'
  | 'adding-node'
  | 'deleting-node'
```

### 更新状态

```typescript
const collabManager = editor.getCollaboratorManager()

// 更新光标位置
collabManager.setCursor({ x: 100, y: 200 })

// 更新选择
collabManager.setSelection(['node-1', 'node-2'])

// 更新活动
collabManager.setActivity('viewing', 'node-1')
```

## Provider 选择

### WebSocket

```typescript
import { WebsocketProvider } from 'y-websocket'

const provider = new WebsocketProvider('ws://localhost:1234', 'room-id', ydoc)
```

### WebRTC

```typescript
import { WebrtcProvider } from 'y-webrtc'

const provider = new WebrtcProvider('room-id', ydoc)
```

### IndexedDB（离线）

```typescript
import { IndexeddbPersistence } from 'y-indexeddb'

const persistence = new IndexeddbPersistence('doc-id', ydoc)
```
