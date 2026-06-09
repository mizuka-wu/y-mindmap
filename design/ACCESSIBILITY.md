# ACCESSIBILITY.md - 无障碍访问设计

> 思维导图编辑器无障碍访问支持设计

---

## 一、键盘导航

### 1.1 Tab 顺序

```typescript
// @y-mindmap/a11y/tab-order.ts

class TabOrderManager {
  private focusableElements: HTMLElement[] = []
  
  /**
   * 初始化 Tab 顺序
   */
  init(container: HTMLElement): void {
    this.focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    )
  }
  
  /**
   * 获取下一个焦点元素
   */
  getNext(reverse: boolean = false): HTMLElement | null {
    const current = document.activeElement
    const index = this.focusableElements.indexOf(current as HTMLElement)
    
    if (reverse) {
      return this.focusableElements[index - 1] || this.focusableElements[this.focusableElements.length - 1]
    }
    
    return this.focusableElements[index + 1] || this.focusableElements[0]
  }
}
```

### 1.2 焦点管理

```typescript
// @y-mindmap/a11y/focus.ts

class FocusManager {
  private focusRing: HTMLElement
  
  constructor() {
    this.focusRing = this.createFocusRing()
  }
  
  /**
   * 显示焦点指示器
   */
  showFocus(element: HTMLElement): void {
    const rect = element.getBoundingClientRect()
    
    this.focusRing.style.display = 'block'
    this.focusRing.style.left = `${rect.left - 2}px`
    this.focusRing.style.top = `${rect.top - 2}px`
    this.focusRing.style.width = `${rect.width + 4}px`
    this.focusRing.style.height = `${rect.height + 4}px`
  }
  
  /**
   * 隐藏焦点指示器
   */
  hideFocus(): void {
    this.focusRing.style.display = 'none'
  }
  
  private createFocusRing(): HTMLElement {
    const ring = document.createElement('div')
    ring.className = 'focus-ring'
    ring.setAttribute('aria-hidden', 'true')
    document.body.appendChild(ring)
    return ring
  }
}
```

---

## 二、ARIA 支持

### 2.1 ARIA 属性

```typescript
// @y-mindmap/a11y/aria.ts

class AriaManager {
  /**
   * 更新节点 ARIA 属性
   */
  updateNodeAria(element: HTMLElement, node: MindMapNode): void {
    element.setAttribute('role', 'treeitem')
    element.setAttribute('aria-label', this.getNodeLabel(node))
    element.setAttribute('aria-level', String(node.depth + 1))
    
    if (node.children.length > 0) {
      element.setAttribute('aria-expanded', String(!node.isFolded))
    }
    
    if (node.isSelected) {
      element.setAttribute('aria-selected', 'true')
    }
  }
  
  /**
   * 更新树容器 ARIA 属性
   */
  updateTreeAria(container: HTMLElement): void {
    container.setAttribute('role', 'tree')
    container.setAttribute('aria-label', '思维导图')
  }
  
  /**
   * 获取节点标签
   */
  private getNodeLabel(node: MindMapNode): string {
    const parts = [node.title]
    
    if (node.type !== TopicType.ATTACHED) {
      parts.push(`(${node.type})`)
    }
    
    if (node.children.length > 0) {
      parts.push(`${node.children.length} 个子节点`)
    }
    
    return parts.join(' ')
  }
}
```

---

## 三、高对比度

### 3.1 高对比度模式

```typescript
// @y-mindmap/a11y/high-contrast.ts

class HighContrastMode {
  /**
   * 检测高对比度模式
   */
  isHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  }
  
  /**
   * 应用高对比度样式
   */
  applyHighContrast(element: HTMLElement): void {
    element.classList.add('high-contrast')
  }
  
  /**
   * 监听高对比度变更
   */
  onHighContrastChange(callback: (isHighContrast: boolean) => void): void {
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      callback(e.matches)
    })
  }
}
```

---

## 四、屏幕阅读器

### 4.1 屏幕阅读器支持

```typescript
// @y-mindmap/a11y/screen-reader.ts

class ScreenReaderSupport {
  private liveRegion: HTMLElement
  
  constructor() {
    this.liveRegion = this.createLiveRegion()
  }
  
  /**
   * 宣布消息
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.liveRegion.setAttribute('aria-live', priority)
    this.liveRegion.textContent = message
  }
  
  /**
   * 宣布节点变更
   */
  announceNodeChange(node: MindMapNode, action: string): void {
    this.announce(`${action} ${node.title}`)
  }
  
  /**
   * 创建实时区域
   */
  private createLiveRegion(): HTMLElement {
    const region = document.createElement('div')
    region.setAttribute('aria-live', 'polite')
    region.setAttribute('aria-atomic', 'true')
    region.className = 'sr-only'
    document.body.appendChild(region)
    return region
  }
}
```

---

## 五、减少动画

### 5.1 动画控制

```typescript
// @y-mindmap/a11y/motion.ts

class MotionControl {
  /**
   * 检查是否偏好减少动画
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
  
  /**
   * 获取动画时长
   */
  getAnimationDuration(defaultDuration: number): number {
    return this.prefersReducedMotion() ? 0 : defaultDuration
  }
  
  /**
   * 监听偏好变更
   */
  onMotionPreferenceChange(callback: (reduce: boolean) => void): void {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      callback(e.matches)
    })
  }
}
```
