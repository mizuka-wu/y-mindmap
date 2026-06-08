# 交互系统

## 概述

Y-MindMap 提供完整的交互系统，包括选择、拖拽、键盘导航、手势识别等。

## 交互处理器

### 选择处理器

```typescript
import { createSelectHandler, createMultiSelectHandler } from '@y-mindmap/interaction'

// 单选
const selectHandler = createSelectHandler()

// 多选（Ctrl/Shift + 点击）
const multiSelectHandler = createMultiSelectHandler()
```

### 拖拽处理器

```typescript
import { createDragHandler, createViewportDragHandler } from '@y-mindmap/interaction'

// 节点拖拽
const dragHandler = createDragHandler()

// 视口拖拽（平移）
const viewportDragHandler = createViewportDragHandler()
```

### 键盘处理器

```typescript
import { createKeyboardHandler } from '@y-mindmap/interaction'

const keyboardHandler = createKeyboardHandler()
```

### 框选处理器

```typescript
import { createBoxSelectHandler } from '@y-mindmap/interaction'

const boxSelectHandler = createBoxSelectHandler()
```

## 手势识别

```typescript
import { GestureRecognizer } from '@y-mindmap/interaction'

const gestureRecognizer = new GestureRecognizer((event) => {
  switch (event.type) {
    case 'pinch':
      // 双指缩放
      break
    case 'pan':
      // 拖拽平移
      break
    case 'tap':
      // 点击
      break
    case 'doubletap':
      // 双击
      break
  }
})
```

## 惯性滚动

```typescript
import { InertialScroll } from '@y-mindmap/interaction'

const inertialScroll = new InertialScroll((dx, dy) => {
  view.panBy(dx, dy)
})

// 开始记录
inertialScroll.record(x, y)

// 开始惯性滚动
inertialScroll.start()

// 停止
inertialScroll.stop()
```

## 文本编辑

```typescript
import { InlineEditor } from '@y-mindmap/interaction'

const inlineEditor = new InlineEditor({
  container: document.body,
  onSubmit: (nodeId, title) => {
    editor.executeCommand('updateTitle', { nodeId, title })
  },
  onCancel: () => {},
})

// 开始编辑
inlineEditor.startEditing(nodeId, title, bounds)

// 停止编辑
inlineEditor.stopEditing()
```

## 搜索引擎

```typescript
import { SearchEngine } from '@y-mindmap/interaction'

const searchEngine = new SearchEngine()

// 搜索
const results = searchEngine.search(doc, '关键词', {
  caseSensitive: false,
  wholeWord: false,
  searchIn: ['title', 'notes', 'labels'],
})

// 导航
const next = searchEngine.getNext()
const prev = searchEngine.getPrevious()
```

## 过滤引擎

```typescript
import { FilterEngine } from '@y-mindmap/interaction'

const filterEngine = new FilterEngine()

// 过滤
const filtered = filterEngine.filter(doc, {
  predicate: (node) => node.labels.includes('important'),
})
```

## 自定义交互

```typescript
import { InteractionHandler, InteractionEvent } from '@y-mindmap/interaction'

const customHandler: InteractionHandler = {
  handleEvent(event: InteractionEvent): boolean {
    if (event.type === 'click' && event.target === 'my-button') {
      // 自定义处理
      return true
    }
    return false
  },
}

interactionManager.addHandler(customHandler)
```
