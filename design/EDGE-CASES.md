# EDGE-CASES.md - 边界情况处理

> 思维导图编辑器边界情况处理设计

---

## 一、数据边界

### 1.1 空文档

```typescript
// @y-mindmap/edge-cases/empty-doc.ts

class EmptyDocHandler {
  /**
   * 创建空文档
   */
  createEmptyDoc(): MindMapNode {
    return new MindMapNode({
      id: generateId(),
      title: 'Central Topic',
      type: TopicType.ROOT,
    })
  }
  
  /**
   * 检查是否为空文档
   */
  isEmpty(doc: MindMapNode): boolean {
    return doc.getAllChildren().length === 0
  }
  
  /**
   * 处理空文档的特殊逻辑
   */
  handleEmptyDoc(editor: EditorView): void {
    // 自动选中根节点
    editor.selectNode(editor.getDocument().id)
    
    // 提示用户开始编辑
    editor.showTooltip('点击或按 Enter 开始编辑')
  }
}
```

### 1.2 单节点文档

```typescript
// @y-mindmap/edge-cases/single-node.ts

class SingleNodeHandler {
  /**
   * 处理单节点文档的特殊逻辑
   */
  handleSingleNode(editor: EditorView): void {
    // 禁用删除操作
    editor.disableCommand('deleteNode')
    
    // 禁用移动操作
    editor.disableCommand('moveNode')
    
    // 禁用折叠操作
    editor.disableCommand('toggleFold')
  }
}
```

### 1.3 超深文档

```typescript
// @y-mindmap/edge-cases/deep-doc.ts

class DeepDocHandler {
  private maxDepth: number = 100
  
  /**
   * 检查是否超过最大深度
   */
  isTooDeep(doc: MindMapNode): boolean {
    return this.getMaxDepth(doc) > this.maxDepth
  }
  
  /**
   * 获取最大深度
   */
  private getMaxDepth(node: MindMapNode, currentDepth: number = 0): number {
    const children = node.getAllChildren()
    
    if (children.length === 0) {
      return currentDepth
    }
    
    return Math.max(
      ...children.map(child => this.getMaxDepth(child, currentDepth + 1))
    )
  }
  
  /**
   * 处理超深文档
   */
  handleTooDeep(editor: EditorView): void {
    // 警告用户
    editor.showWarning('文档层级过深，可能影响性能')
    
    // 禁用添加子节点
    editor.disableCommand('addSubTopic')
  }
}
```

### 1.4 超宽文档

```typescript
// @y-mindmap/edge-cases/wide-doc.ts

class WideDocHandler {
  private maxChildren: number = 1000
  
  /**
   * 检查子节点是否过多
   */
  hasTooManyChildren(node: MindMapNode): boolean {
    return node.getAllChildren().length > this.maxChildren
  }
  
  /**
   * 处理子节点过多
   */
  handleTooManyChildren(editor: EditorView, node: MindMapNode): void {
    // 警告用户
    editor.showWarning('子节点过多，可能影响性能')
    
    // 建议分组
    editor.showSuggestion('考虑使用边界或摘要对节点进行分组')
  }
}
```

### 1.5 超长标题

```typescript
// @y-mindmap/edge-cases/long-title.ts

class LongTitleHandler {
  private maxLength: number = 1000
  
  /**
   * 检查标题是否过长
   */
  isTitleTooLong(title: string): boolean {
    return title.length > this.maxLength
  }
  
  /**
   * 处理超长标题
   */
  handleLongTitle(editor: EditorView, nodeId: string, title: string): string {
    if (this.isTitleTooLong(title)) {
      // 截断标题
      const truncated = title.substring(0, this.maxLength)
      
      // 警告用户
      editor.showWarning('标题过长，已自动截断')
      
      return truncated
    }
    
    return title
  }
}
```

---

## 二、交互边界

### 2.1 快速点击

```typescript
// @y-mindmap/edge-cases/rapid-click.ts

class RapidClickHandler {
  private clickTimes: number[] = []
  private maxClicksPerSecond: number = 10
  
  /**
   * 处理快速点击
   */
  handleClick(event: MouseEvent): boolean {
    const now = Date.now()
    
    // 记录点击时间
    this.clickTimes.push(now)
    
    // 清理过期记录
    this.clickTimes = this.clickTimes.filter(t => now - t < 1000)
    
    // 检查是否超过限制
    if (this.clickTimes.length > this.maxClicksPerSecond) {
      // 忽略点击
      return false
    }
    
    return true
  }
}
```

### 2.2 快速拖拽

```typescript
// @y-mindmap/edge-cases/rapid-drag.ts

class RapidDragHandler {
  private lastDragTime: number = 0
  private minDragInterval: number = 16 // 60fps
  
  /**
   * 处理快速拖拽
   */
  handleDrag(event: MouseEvent): boolean {
    const now = Date.now()
    const interval = now - this.lastDragTime
    
    if (interval < this.minDragInterval) {
      // 跳过此帧
      return false
    }
    
    this.lastDragTime = now
    return true
  }
}
```

### 2.3 多点触控

```typescript
// @y-mindmap/edge-cases/multi-touch.ts

class MultiTouchHandler {
  private activeTouches: Map<number, Touch> = new Map()
  
  /**
   * 处理触摸开始
   */
  handleTouchStart(event: TouchEvent): void {
    for (const touch of event.changedTouches) {
      this.activeTouches.set(touch.identifier, touch)
    }
    
    // 如果超过 2 个触控点，忽略
    if (this.activeTouches.size > 2) {
      event.preventDefault()
    }
  }
  
  /**
   * 处理触摸结束
   */
  handleTouchEnd(event: TouchEvent): void {
    for (const touch of event.changedTouches) {
      this.activeTouches.delete(touch.identifier)
    }
  }
}
```

### 2.4 窗口失焦

```typescript
// @y-mindmap/edge-cases/window-blur.ts

class WindowBlurHandler {
  private editor: EditorView
  
  constructor(editor: EditorView) {
    this.editor = editor
    
    window.addEventListener('blur', () => this.handleBlur())
    window.addEventListener('focus', () => this.handleFocus())
  }
  
  /**
   * 处理窗口失焦
   */
  private handleBlur(): void {
    // 暂停动画
    this.editor.pauseAnimations()
    
    // 释放拖拽状态
    this.editor.cancelDrag()
    
    // 保存状态
    this.editor.saveState()
  }
  
  /**
   * 处理窗口获焦
   */
  private handleFocus(): void {
    // 恢复动画
    this.editor.resumeAnimations()
    
    // 刷新视图
    this.editor.refresh()
  }
}
```

---

## 三、渲染边界

### 3.1 超小缩放

```typescript
// @y-mindmap/edge-cases/small-zoom.ts

class SmallZoomHandler {
  private minZoom: number = 0.1
  
  /**
   * 处理超小缩放
   */
  handleSmallZoom(editor: EditorView, zoom: number): number {
    if (zoom < this.minZoom) {
      // 限制最小缩放
      return this.minZoom
    }
    
    // 在极小缩放下，简化渲染
    if (zoom < 0.3) {
      editor.setRenderMode('simplified')
    } else {
      editor.setRenderMode('normal')
    }
    
    return zoom
  }
}
```

### 3.2 超大缩放

```typescript
// @y-mindmap/edge-cases/large-zoom.ts

class LargeZoomHandler {
  private maxZoom: number = 10
  
  /**
   * 处理超大缩放
   */
  handleLargeZoom(editor: EditorView, zoom: number): number {
    if (zoom > this.maxZoom) {
      // 限制最大缩放
      return this.maxZoom
    }
    
    return zoom
  }
}
```

### 3.3 超长连线

```typescript
// @y-mindmap/edge-cases/long-connection.ts

class LongConnectionHandler {
  private maxLength: number = 10000
  
  /**
   * 处理超长连线
   */
  handleLongConnection(
    start: Point,
    end: Point,
    style: ConnectionStyle
  ): ConnectionStyle {
    const length = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    )
    
    if (length > this.maxLength) {
      // 使用直线代替曲线
      return {
        ...style,
        lineClass: 'straight',
      }
    }
    
    return style
  }
}
```

### 3.4 重叠节点

```typescript
// @y-mindmap/edge-cases/overlapping.ts

class OverlappingHandler {
  /**
   * 检测节点重叠
   */
  detectOverlaps(nodes: MindMapNode[]): Overlap[] {
    const overlaps: Overlap[] = []
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const bounds1 = this.getNodeBounds(nodes[i])
        const bounds2 = this.getNodeBounds(nodes[j])
        
        if (this.isOverlapping(bounds1, bounds2)) {
          overlaps.push({
            node1: nodes[i],
            node2: nodes[j],
            bounds1,
            bounds2,
          })
        }
      }
    }
    
    return overlaps
  }
  
  /**
   * 处理重叠
   */
  handleOverlaps(editor: EditorView, overlaps: Overlap[]): void {
    overlaps.forEach(overlap => {
      // 调整位置避免重叠
      this.adjustPosition(editor, overlap)
    })
  }
  
  private isOverlapping(bounds1: Bounds, bounds2: Bounds): boolean {
    return !(
      bounds1.x + bounds1.width < bounds2.x ||
      bounds2.x + bounds2.width < bounds1.x ||
      bounds1.y + bounds1.height < bounds2.y ||
      bounds2.y + bounds2.height < bounds1.y
    )
  }
  
  private adjustPosition(editor: EditorView, overlap: Overlap): void {
    // 将第二个节点向右移动
    const offset = overlap.bounds1.x + overlap.bounds1.width - overlap.bounds2.x + 20
    
    editor.moveNode(overlap.node2.id, { x: offset, y: 0 })
  }
}

interface Overlap {
  node1: MindMapNode
  node2: MindMapNode
  bounds1: Bounds
  bounds2: Bounds
}
```

---

## 四、性能边界

### 4.1 大量节点

```typescript
// @y-mindmap/edge-cases/large-doc.ts

class LargeDocHandler {
  private warningThreshold: number = 1000
  private criticalThreshold: number = 10000
  
  /**
   * 处理大型文档
   */
  handleLargeDoc(editor: EditorView, doc: MindMapNode): void {
    const nodeCount = this.countNodes(doc)
    
    if (nodeCount > this.criticalThreshold) {
      // 严重警告
      editor.showError('文档过大，性能可能严重下降')
      
      // 禁用某些功能
      editor.disableFeature('animation')
      editor.disableFeature('minimap')
      
      // 启用虚拟渲染
      editor.enableVirtualRendering()
    } else if (nodeCount > this.warningThreshold) {
      // 警告
      editor.showWarning('文档较大，可能影响性能')
    }
  }
  
  private countNodes(doc: MindMapNode): number {
    let count = 0
    doc.descendants(() => count++)
    return count
  }
}
```

### 4.2 大量连线

```typescript
// @y-mindmap/edge-cases/large-connections.ts

class LargeConnectionHandler {
  private warningThreshold: number = 500
  
  /**
   * 处理大量连线
   */
  handleLargeConnections(editor: EditorView, count: number): void {
    if (count > this.warningThreshold) {
      // 简化连线渲染
      editor.setConnectionRenderMode('simplified')
      
      // 禁用连线动画
      editor.disableConnectionAnimation()
    }
  }
}
```

### 4.3 频繁更新

```typescript
// @y-mindmap/edge-cases/frequent-updates.ts

class FrequentUpdateHandler {
  private updateTimes: number[] = []
  private maxUpdatesPerSecond: number = 60
  
  /**
   * 处理频繁更新
   */
  handleUpdate(): boolean {
    const now = Date.now()
    
    // 记录更新时间
    this.updateTimes.push(now)
    
    // 清理过期记录
    this.updateTimes = this.updateTimes.filter(t => now - t < 1000)
    
    // 检查是否超过限制
    if (this.updateTimes.length > this.maxUpdatesPerSecond) {
      // 跳过更新
      return false
    }
    
    return true
  }
}
```

### 4.4 内存溢出

```typescript
// @y-mindmap/edge-cases/memory.ts

class MemoryHandler {
  private memoryWarningThreshold: number = 100 * 1024 * 1024 // 100MB
  
  /**
   * 检查内存使用
   */
  checkMemory(): MemoryStatus {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize
      
      if (used > this.memoryWarningThreshold) {
        return {
          status: 'warning',
          used,
          message: '内存使用过高',
        }
      }
    }
    
    return { status: 'normal' }
  }
  
  /**
   * 处理内存警告
   */
  handleMemoryWarning(editor: EditorView): void {
    // 清理缓存
    editor.clearCache()
    
    // 强制垃圾回收
    if (global.gc) {
      global.gc()
    }
    
    // 警告用户
    editor.showWarning('内存使用过高，已清理缓存')
  }
}

interface MemoryStatus {
  status: 'normal' | 'warning' | 'critical'
  used?: number
  message?: string
}
```

---

## 五、兼容性边界

### 5.1 浏览器兼容

```typescript
// @y-mindmap/edge-cases/browser-compat.ts

class BrowserCompatHandler {
  /**
   * 检查浏览器兼容性
   */
  checkCompatibility(): CompatResult {
    const issues: string[] = []
    
    // 检查 Canvas 支持
    if (!this.isCanvasSupported()) {
      issues.push('浏览器不支持 Canvas')
    }
    
    // 检查 ES6 支持
    if (!this.isES6Supported()) {
      issues.push('浏览器不支持 ES6')
    }
    
    // 检查 WebGL 支持 (可选)
    if (!this.isWebGLSupported()) {
      issues.push('浏览器不支持 WebGL，某些功能可能不可用')
    }
    
    return {
      compatible: issues.length === 0,
      issues,
    }
  }
  
  private isCanvasSupported(): boolean {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext
  }
  
  private isES6Supported(): boolean {
    try {
      eval('class Foo {}')
      return true
    } catch {
      return false
    }
  }
  
  private isWebGLSupported(): boolean {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl')
  }
}

interface CompatResult {
  compatible: boolean
  issues: string[]
}
```

### 5.2 移动端适配

```typescript
// @y-mindmap/edge-cases/mobile.ts

class MobileHandler {
  /**
   * 检查是否为移动设备
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  }
  
  /**
   * 处理移动端适配
   */
  handleMobile(editor: EditorView): void {
    if (this.isMobile()) {
      // 调整触摸区域大小
      editor.setTouchTargetSize(44) // 44px 最小触摸目标
      
      // 禁用 hover 效果
      editor.disableHoverEffects()
      
      // 调整缩放行为
      editor.setZoomBehavior('pinch-only')
      
      // 启用触摸手势
      editor.enableTouchGestures()
    }
  }
}
```

### 5.3 高 DPI 屏幕

```typescript
// @y-mindmap/edge-cases/retina.ts

class RetinaHandler {
  /**
   * 获取设备像素比
   */
  getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1
  }
  
  /**
   * 处理高 DPI 屏幕
   */
  handleRetina(canvas: HTMLCanvasElement): void {
    const dpr = this.getDevicePixelRatio()
    
    if (dpr > 1) {
      // 调整画布尺寸
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      
      // 缩放上下文
      const ctx = canvas.getContext('2d')!
      ctx.scale(dpr, dpr)
      
      // 调整 CSS 尺寸
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
  }
}
```

### 5.4 暗色模式

```typescript
// @y-mindmap/edge-cases/dark-mode.ts

class DarkModeHandler {
  /**
   * 检查是否为暗色模式
   */
  isDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  /**
   * 处理暗色模式
   */
  handleDarkMode(editor: EditorView): void {
    // 监听暗色模式变更
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        editor.setTheme('dark')
      } else {
        editor.setTheme('light')
      }
    })
    
    // 初始化
    if (this.isDarkMode()) {
      editor.setTheme('dark')
    }
  }
}
```
