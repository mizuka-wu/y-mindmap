# 性能优化

## 概述

Y-MindMap 提供多种性能优化机制，包括虚拟渲染、布局缓存、增量更新等。

## 虚拟渲染

只渲染视口内可见的节点：

```typescript
import { VirtualRenderer } from '@y-mindmap/view'

const renderer = new VirtualRenderer({
  padding: 100, // 视口外额外渲染区域
})

// 更新视口
renderer.setViewport({
  x: 0,
  y: 0,
  width: 800,
  height: 600,
})

// 注册节点
renderer.registerNode('node-1', { x: 100, y: 100, width: 200, height: 50 })

// 获取可见节点
const visibleNodes = renderer.getVisibleNodes()

// 监听可见性变化
renderer.setOnVisibilityChange((visibleIds, hiddenIds) => {
  // 渲染可见节点
  for (const id of visibleIds) {
    renderNode(id)
  }
  // 隐藏不可见节点
  for (const id of hiddenIds) {
    hideNode(id)
  }
})
```

## 布局缓存

LRU 缓存策略，避免重复计算：

```typescript
import { LayoutCache, generateNodeCacheKey } from '@y-mindmap/view'

const cache = new LayoutCache({
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 分钟
})

// 缓存布局结果
const key = generateNodeCacheKey(node)
cache.set(key, layoutResult)

// 获取缓存
const cached = cache.get(key)
if (cached) {
  return cached
}

// 获取统计
const stats = cache.getStats()
console.log(`Cache hit rate: ${stats.hitRate}`)
```

## 增量更新

只更新变化的节点：

```typescript
import { IncrementalUpdater } from '@y-mindmap/view'

const updater = new IncrementalUpdater()

// 处理变化
const changes = updater.processChanges(newRoot)

// 获取变化
const added = changes.added       // 新增节点
const removed = changes.removed   // 删除节点
const updated = changes.updated   // 修改节点
const moved = changes.moved       // 移动节点

// 只更新变化的节点
for (const id of added) {
  renderNode(id)
}
for (const id of removed) {
  removeNode(id)
}
for (const id of updated) {
  updateNode(id)
}
```

## Diff 系统

比较两个版本之间的差异：

```typescript
import { diffTrees, formatDiffSummary } from '@y-mindmap/state'

const diffResult = diffTrees(oldTree, newTree)

// 获取摘要
console.log(formatDiffSummary(diffResult))
// "+3 新增, -1 删除, ~2 修改, ↕1 移动"

// 获取详细变化
console.log(diffResult.added)    // 新增节点
console.log(diffResult.removed)  // 删除节点
console.log(diffResult.modified) // 修改节点
console.log(diffResult.moved)    // 移动节点
```

### Diff 装饰器

可视化差异：

```typescript
import { createDiffDecorationSet } from '@y-mindmap/view'

const decorationSet = createDiffDecorationSet(diffResult, {
  added: { color: '#4CAF50', opacity: 0.3 },
  removed: { color: '#F44336', opacity: 0.3 },
  modified: { color: '#FF9800', opacity: 0.3 },
  moved: { color: '#2196F3', opacity: 0.3 },
})
```

## 测量优化

### MeasureEngine

统一测量引擎，支持缓存：

```typescript
import { getMeasureEngine } from '@y-mindmap/richtext-editor'

const engine = getMeasureEngine()

// 测量会自动缓存
const size = engine.measureAttributeTitle(attributeTitle, {
  styleContext: { nodeStyle: node.style },
})

// 清除缓存（字体加载后）
engine.clearCache()
```

### FontManager

字体异步加载：

```typescript
import { getFontManager } from '@y-mindmap/richtext-editor'

const fontManager = getFontManager()

// 加载字体
await fontManager.loadFont('CustomFont', '/fonts/custom.woff2')

// 监听字体加载
fontManager.onFontLoaded((event) => {
  // 重新测量
  measureEngine.clearCache()
})

// 确保字体加载
await fontManager.ensureFontsLoaded(['CustomFont'])
```

## 最佳实践

### 1. 使用虚拟渲染

对于大型思维导图（1000+ 节点），启用虚拟渲染：

```typescript
const editor = new MindMapEditor({
  container: document.getElementById('app')!,
  enableVirtualRendering: true,
})
```

### 2. 批量更新

使用 Transaction 批量更新：

```typescript
const tr = state.tr
tr.updateNode('node-1', node => node.withTitle('New Title'))
tr.updateNode('node-2', node => node.withStyle(newStyle))
state.apply(tr) // 只触发一次渲染
```

### 3. 避免不必要的重绘

```typescript
// ❌ 不好
for (const node of nodes) {
  editor.executeCommand('updateTitle', { nodeId: node.id, title: 'New' })
}

// ✅ 好
const tr = state.tr
for (const node of nodes) {
  tr.updateNode(node.id, n => n.withTitle('New'))
}
state.apply(tr)
```
