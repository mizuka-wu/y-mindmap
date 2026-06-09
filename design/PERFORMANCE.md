# PERFORMANCE.md - 性能优化

> 思维导图编辑器性能优化设计

---

## 一、性能指标

### 1.1 关键指标

| 指标 | 目标 | 说明 |
|------|------|------|
| FPS | >= 60 | 流畅渲染 |
| 首次渲染 | < 100ms | 快速加载 |
| 交互响应 | < 16ms | 即时反馈 |
| 内存占用 | < 100MB | 合理内存 |

---

## 二、渲染优化

### 2.1 虚拟渲染

```typescript
// @y-mindmap/performance/virtual-render.ts

class VirtualRenderer {
  private visibleNodes: Set<string> = new Set()
  
  /**
   * 更新可见节点
   */
  updateVisibleNodes(viewport: Bounds): void {
    this.visibleNodes.clear()
    
    this.doc.descendants((node) => {
      const bounds = this.getNodeBounds(node.id)
      
      if (this.isInViewport(bounds, viewport)) {
        this.visibleNodes.add(node.id)
      }
    })
  }
  
  /**
   * 渲染可见节点
   */
  render(): void {
    this.visibleNodes.forEach(nodeId => {
      const node = this.doc.getNodeById(nodeId)
      if (node) {
        this.renderNode(node)
      }
    })
  }
  
  private isInViewport(bounds: Bounds, viewport: Bounds): boolean {
    return !(
      bounds.x + bounds.width < viewport.x ||
      bounds.x > viewport.x + viewport.width ||
      bounds.y + bounds.height < viewport.y ||
      bounds.y > viewport.y + viewport.height
    )
  }
}
```

### 2.2 分层渲染

```typescript
// @y-mindmap/performance/layered-render.ts

class LayeredRenderer {
  private layers: Map<string, CanvasRenderingContext2D> = new Map()
  
  constructor() {
    this.layers.set('background', this.createLayer())
    this.layers.set('connection', this.createLayer())
    this.layers.set('topic', this.createLayer())
    this.layers.set('overlay', this.createLayer())
  }
  
  /**
   * 渲染指定层
   */
  renderLayer(layerName: string): void {
    const ctx = this.layers.get(layerName)
    if (!ctx) return
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    
    switch (layerName) {
      case 'background':
        this.renderBackground(ctx)
        break
      case 'connection':
        this.renderConnections(ctx)
        break
      case 'topic':
        this.renderTopics(ctx)
        break
      case 'overlay':
        this.renderOverlay(ctx)
        break
    }
  }
}
```

### 2.3 局部渲染

```typescript
// @y-mindmap/performance/partial-render.ts

class PartialRenderer {
  private dirtyRegions: Set<string> = new Set()
  
  /**
   * 标记脏区域
   */
  markDirty(nodeId: string): void {
    this.dirtyRegions.add(nodeId)
  }
  
  /**
   * 渲染脏区域
   */
  renderDirty(): void {
    this.dirtyRegions.forEach(nodeId => {
      const node = this.doc.getNodeById(nodeId)
      if (node) {
        this.renderNode(node)
      }
    })
    
    this.dirtyRegions.clear()
  }
}
```

---

## 三、布局优化

### 3.1 增量布局

```typescript
// @y-mindmap/performance/incremental-layout.ts

class IncrementalLayout {
  /**
   * 增量计算布局
   */
  calculateIncremental(
    doc: MindMapNode,
    changedNodes: Set<string>
  ): LayoutResult {
    // 只重新计算变化的节点
    const affectedNodes = this.getAffectedNodes(doc, changedNodes)
    
    affectedNodes.forEach(nodeId => {
      const node = doc.getNodeById(nodeId)
      if (node) {
        this.calculateNodeLayout(node)
      }
    })
    
    return this.getLayoutResult()
  }
  
  private getAffectedNodes(
    doc: MindMapNode,
    changedNodes: Set<string>
  ): Set<string> {
    const affected = new Set<string>()
    
    changedNodes.forEach(nodeId => {
      affected.add(nodeId)
      
      // 添加祖先节点
      const node = doc.getNodeById(nodeId)
      if (node) {
        let parent = node.parent
        while (parent) {
          affected.add(parent.id)
          parent = parent.parent
        }
      }
    })
    
    return affected
  }
}
```

### 3.2 布局缓存

```typescript
// @y-mindmap/performance/layout-cache.ts

class LayoutCache {
  private cache: Map<string, LayoutResult> = new Map()
  private maxSize: number = 100
  
  /**
   * 获取缓存
   */
  get(key: string): LayoutResult | null {
    return this.cache.get(key) || null
  }
  
  /**
   * 设置缓存
   */
  set(key: string, result: LayoutResult): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, result)
  }
  
  /**
   * 失效缓存
   */
  invalidate(nodeId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(nodeId)) {
        this.cache.delete(key)
      }
    }
  }
}
```

---

## 四、内存优化

### 4.1 对象池

```typescript
// @y-mindmap/performance/object-pool.ts

class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  
  constructor(factory: () => T, reset: (obj: T) => void) {
    this.factory = factory
    this.reset = reset
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }
  
  release(obj: T): void {
    this.reset(obj)
    this.pool.push(obj)
  }
}
```

### 4.2 弱引用

```typescript
// @y-mindmap/performance/weak-cache.ts

class WeakCache<K extends object, V> {
  private cache: WeakMap<K, V> = new WeakMap()
  
  get(key: K): V | undefined {
    return this.cache.get(key)
  }
  
  set(key: K, value: V): void {
    this.cache.set(key, value)
  }
  
  has(key: K): boolean {
    return this.cache.has(key)
  }
}
```

---

## 五、网络优化

### 5.1 资源懒加载

```typescript
// @y-mindmap/performance/lazy-load.ts

class LazyLoader {
  private loaded: Map<string, any> = new Map()
  
  async load<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.loaded.has(key)) {
      return this.loaded.get(key)
    }
    
    const data = await loader()
    this.loaded.set(key, data)
    return data
  }
}
```

### 5.2 预加载

```typescript
// @y-mindmap/performance/preload.ts

class Preloader {
  /**
   * 预加载资源
   */
  async preload(urls: string[]): Promise<void[]> {
    return Promise.all(urls.map(url => this.preloadResource(url)))
  }
  
  private async preloadResource(url: string): Promise<void> {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    document.head.appendChild(link)
  }
}
```
