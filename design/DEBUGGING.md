# DEBUGGING.md - 调试工具设计

> 思维导图编辑器调试工具设计

---

## 一、调试工具架构

### 1.1 调试管理器

```typescript
// @y-mindmap/debug/debug-manager.ts

class DebugManager {
  private editor: EditorView
  private enabled: boolean = false
  private panels: Map<string, DebugPanel> = new Map()
  
  constructor(editor: EditorView) {
    this.editor = editor
  }
  
  /**
   * 启用调试
   */
  enable(): void {
    this.enabled = true
    this.createPanels()
    this.attachToWindow()
  }
  
  /**
   * 禁用调试
   */
  disable(): void {
    this.enabled = false
    this.destroyPanels()
  }
  
  /**
   * 创建调试面板
   */
  private createPanels(): void {
    this.panels.set('state', new StatePanel(this.editor))
    this.panels.set('tree', new TreePanel(this.editor))
    this.panels.set('performance', new PerformancePanel(this.editor))
    this.panels.set('events', new EventsPanel(this.editor))
  }
  
  /**
   * 附加到全局
   */
  private attachToWindow(): void {
    (window as any).__mindmap = {
      editor: this.editor,
      debug: this,
      getState: () => this.editor.getState(),
      getDocument: () => this.editor.getDocument(),
      getSelection: () => this.editor.getSelection(),
    }
  }
}
```

---

## 二、状态检查器

### 2.1 状态面板

```typescript
// @y-mindmap/debug/panels/state-panel.ts

class StatePanel {
  private editor: EditorView
  private container: HTMLElement
  
  constructor(editor: EditorView) {
    this.editor = editor
    this.container = this.createContainer()
    this.render()
    
    editor.on('stateChanged', () => this.render())
  }
  
  private render(): void {
    const state = this.editor.getState()
    
    this.container.innerHTML = `
      <h3>State</h3>
      <div class="state-info">
        <div class="section">
          <h4>Document</h4>
          <pre>${JSON.stringify(this.summarizeDoc(state.doc), null, 2)}</pre>
        </div>
        
        <div class="section">
          <h4>Selection</h4>
          <pre>${JSON.stringify(this.summarizeSelection(state.selection), null, 2)}</pre>
        </div>
        
        <div class="section">
          <h4>History</h4>
          <pre>Undo: ${state.canUndo ? 'Yes' : 'No'} | Redo: ${state.canRedo ? 'Yes' : 'No'}</pre>
        </div>
      </div>
    `
  }
  
  private summarizeDoc(doc: MindMapNode): any {
    let nodeCount = 0
    doc.descendants(() => nodeCount++)
    
    return {
      id: doc.id,
      title: doc.title,
      nodeCount,
      maxDepth: this.getMaxDepth(doc),
    }
  }
  
  private summarizeSelection(selection: Selection): any {
    return {
      type: selection.type,
      count: selection.selectedIds.size,
      ids: Array.from(selection.selectedIds),
    }
  }
  
  private getMaxDepth(node: MindMapNode, depth: number = 0): number {
    const children = node.getAllChildren()
    if (children.length === 0) return depth
    return Math.max(...children.map(c => this.getMaxDepth(c, depth + 1)))
  }
}
```

---

## 三、文档树检查器

### 3.1 树面板

```typescript
// @y-mindmap/debug/panels/tree-panel.ts

class TreePanel {
  private editor: EditorView
  private container: HTMLElement
  
  constructor(editor: EditorView) {
    this.editor = editor
    this.container = this.createContainer()
    this.render()
    
    editor.on('stateChanged', () => this.render())
  }
  
  private render(): void {
    const doc = this.editor.getDocument()
    
    this.container.innerHTML = `
      <h3>Document Tree</h3>
      <div class="tree">
        ${this.renderNode(doc)}
      </div>
    `
  }
  
  private renderNode(node: MindMapNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    const children = node.getAllChildren()
    const isSelected = this.editor.getSelection().has(node.id)
    
    let html = `
      <div class="tree-node ${isSelected ? 'selected' : ''}" 
           data-node-id="${node.id}"
           style="padding-left: ${depth * 20}px">
        <span class="expand">${children.length > 0 ? '▼' : '•'}</span>
        <span class="title">${node.title}</span>
        <span class="type">${node.type}</span>
        <span class="id">${node.id}</span>
      </div>
    `
    
    children.forEach(child => {
      html += this.renderNode(child, depth + 1)
    })
    
    return html
  }
}
```

---

## 四、性能检查器

### 4.1 性能面板

```typescript
// @y-mindmap/debug/panels/performance-panel.ts

class PerformancePanel {
  private editor: EditorView
  private container: HTMLElement
  private metrics: PerformanceMetrics
  
  constructor(editor: EditorView) {
    this.editor = editor
    this.container = this.createContainer()
    this.metrics = new PerformanceMetrics()
    
    this.startMonitoring()
  }
  
  private startMonitoring(): void {
    setInterval(() => this.update(), 1000)
  }
  
  private update(): void {
    this.metrics.record({
      timestamp: Date.now(),
      memory: this.getMemoryUsage(),
      fps: this.getFPS(),
      renderTime: this.getRenderTime(),
    })
    
    this.render()
  }
  
  private render(): void {
    const latest = this.metrics.getLatest()
    
    this.container.innerHTML = `
      <h3>Performance</h3>
      <div class="metrics">
        <div class="metric">
          <label>FPS</label>
          <value>${latest.fps}</value>
        </div>
        <div class="metric">
          <label>Memory</label>
          <value>${this.formatBytes(latest.memory)}</value>
        </div>
        <div class="metric">
          <label>Render Time</label>
          <value>${latest.renderTime}ms</value>
        </div>
        <div class="metric">
          <label>Node Count</label>
          <value>${this.getNodeCount()}</value>
        </div>
      </div>
      <div class="chart">
        ${this.renderChart()}
      </div>
    `
  }
  
  private getMemoryUsage(): number {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    return 0
  }
  
  private getFPS(): number {
    return this.metrics.getAverageFPS()
  }
  
  private getRenderTime(): number {
    return this.metrics.getAverageRenderTime()
  }
  
  private getNodeCount(): number {
    let count = 0
    this.editor.getDocument().descendants(() => count++)
    return count
  }
  
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
```

---

## 五、事件检查器

### 5.1 事件面板

```typescript
// @y-mindmap/debug/panels/events-panel.ts

class EventsPanel {
  private editor: EditorView
  private container: HTMLElement
  private events: EventLog[] = []
  private maxEvents: number = 100
  
  constructor(editor: EditorView) {
    this.editor = editor
    this.container = this.createContainer()
    
    this.attachListeners()
  }
  
  private attachListeners(): void {
    const events = [
      'stateChanged',
      'selectionChanged',
      'zoomChanged',
      'nodeAdded',
      'nodeRemoved',
      'nodeMoved',
      'editStart',
      'editEnd',
    ]
    
    events.forEach(event => {
      this.editor.on(event, (data) => this.logEvent(event, data))
    })
  }
  
  private logEvent(type: string, data: any): void {
    this.events.push({
      type,
      data,
      timestamp: Date.now(),
    })
    
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
    
    this.render()
  }
  
  private render(): void {
    this.container.innerHTML = `
      <h3>Events</h3>
      <div class="events-list">
        ${this.events.slice(-20).reverse().map(event => `
          <div class="event">
            <span class="time">${new Date(event.timestamp).toLocaleTimeString()}</span>
            <span class="type">${event.type}</span>
            <span class="data">${JSON.stringify(event.data).substring(0, 50)}</span>
          </div>
        `).join('')}
      </div>
    `
  }
}

interface EventLog {
  type: string
  data: any
  timestamp: number
}
```

---

## 六、日志系统

### 6.1 日志管理器

```typescript
// @y-mindmap/debug/logger.ts

class Logger {
  private static instance: Logger
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data)
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }
  
  error(message: string, data?: any): void {
    this.log('error', message, data)
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: Date.now(),
    }
    
    this.logs.push(entry)
    
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
    
    // 输出到控制台
    console[level](`[MindMap] ${message}`, data)
  }
  
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }
  
  clearLogs(): void {
    this.logs = []
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: number
}
```

---

## 七、错误处理

### 7.1 错误处理器

```typescript
// @y-mindmap/debug/error-handler.ts

class ErrorHandler {
  private editor: EditorView
  
  constructor(editor: EditorView) {
    this.editor = editor
    this.setupGlobalHandlers()
  }
  
  private setupGlobalHandlers(): void {
    // 捕获未处理的错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error)
    })
    
    // 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason)
    })
  }
  
  handleError(error: Error): void {
    // 记录错误
    Logger.getInstance().error('Unhandled error', {
      message: error.message,
      stack: error.stack,
    })
    
    // 显示错误提示
    this.editor.showError(`发生错误: ${error.message}`)
    
    // 尝试恢复
    this.tryRecover()
  }
  
  private tryRecover(): void {
    try {
      // 尝试保存当前状态
      this.editor.saveState()
      
      // 尝试重新渲染
      this.editor.refresh()
    } catch (recoveryError) {
      Logger.getInstance().error('Recovery failed', recoveryError)
    }
  }
}
```
