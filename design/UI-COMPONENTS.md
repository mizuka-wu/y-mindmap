# UI-COMPONENTS.md - UI 组件设计

> 思维导图编辑器 UI 组件设计

---

## 一、组件架构

### 1.1 组件层次

```
App (应用根组件)
├── Toolbar (工具栏)
│   ├── FileMenu (文件菜单)
│   ├── EditMenu (编辑菜单)
│   ├── ViewMenu (视图菜单)
│   └── FormatMenu (格式菜单)
├── EditorContainer (编辑器容器)
│   ├── EditorView (编辑器视图)
│   └── PropertyPanel (属性面板)
├── SidePanel (侧面板)
│   ├── OutlinePanel (大纲面板)
│   ├── MarkerPanel (标记面板)
│   └── StylePanel (样式面板)
└── StatusBar (状态栏)
```

---

## 二、工具栏

### 2.1 工具栏组件

```typescript
// @y-mindmap/ui/toolbar/toolbar.ts

interface ToolbarProps {
  editor: EditorView
  disabled?: boolean
}

class Toolbar {
  private container: HTMLElement
  private editor: EditorView
  
  constructor(container: HTMLElement, editor: EditorView) {
    this.container = container
    this.editor = editor
    this.render()
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="toolbar">
        ${this.renderFileGroup()}
        ${this.renderEditGroup()}
        ${this.renderInsertGroup()}
        ${this.renderFormatGroup()}
        ${this.renderViewGroup()}
      </div>
    `
    
    this.bindEvents()
  }
  
  private renderFileGroup(): string {
    return `
      <div class="toolbar-group">
        <button data-action="new" title="新建 (Ctrl+N)">
          <icon name="file" /> 新建
        </button>
        <button data-action="open" title="打开 (Ctrl+O)">
          <icon name="folder-open" /> 打开
        </button>
        <button data-action="save" title="保存 (Ctrl+S)">
          <icon name="save" /> 保存
        </button>
        <button data-action="export" title="导出">
          <icon name="download" /> 导出
        </button>
      </div>
    `
  }
  
  private renderEditGroup(): string {
    return `
      <div class="toolbar-group">
        <button data-action="undo" title="撤销 (Ctrl+Z)" ${this.isUndoDisabled() ? 'disabled' : ''}>
          <icon name="undo" />
        </button>
        <button data-action="redo" title="重做 (Ctrl+Shift+Z)" ${this.isRedoDisabled() ? 'disabled' : ''}>
          <icon name="redo" />
        </button>
        <span class="toolbar-divider"></span>
        <button data-action="cut" title="剪切 (Ctrl+X)">
          <icon name="scissors" />
        </button>
        <button data-action="copy" title="复制 (Ctrl+C)">
          <icon name="copy" />
        </button>
        <button data-action="paste" title="粘贴 (Ctrl+V)">
          <icon name="clipboard" />
        </button>
        <span class="toolbar-divider"></span>
        <button data-action="selectAll" title="全选 (Ctrl+A)">
          <icon name="select-all" />
        </button>
      </div>
    `
  }
  
  private renderInsertGroup(): string {
    return `
      <div class="toolbar-group">
        <button data-action="addSubTopic" title="添加子节点 (Tab)">
          <icon name="add-child" /> 子节点
        </button>
        <button data-action="addSiblingTopic" title="添加兄弟节点 (Enter)">
          <icon name="add-sibling" /> 兄弟节点
        </button>
        <button data-action="addFloatingTopic" title="添加浮动节点">
          <icon name="add-floating" /> 浮动节点
        </button>
        <span class="toolbar-divider"></span>
        <button data-action="addBoundary" title="添加边界">
          <icon name="boundary" />
        </button>
        <button data-action="addSummary" title="添加摘要">
          <icon name="summary" />
        </button>
        <button data-action="addRelationship" title="添加关系线">
          <icon name="relationship" />
        </button>
      </div>
    `
  }
  
  private renderFormatGroup(): string {
    return `
      <div class="toolbar-group">
        <select data-action="structure" title="布局结构">
          <option value="org.xmind.ui.map">思维导图</option>
          <option value="org.xmind.ui.logic.right">逻辑图</option>
          <option value="org.xmind.ui.tree.right">树形图</option>
          <option value="org.xmind.ui.org-chart.down">组织图</option>
          <option value="org.xmind.ui.fishbone.leftHeaded">鱼骨图</option>
          <option value="org.xmind.ui.timeline.horizontal">时间线</option>
        </select>
        <span class="toolbar-divider"></span>
        <input type="color" data-action="fillColor" title="填充颜色" value="#4A90D9" />
        <input type="color" data-action="textColor" title="文字颜色" value="#333333" />
        <select data-action="shape" title="形状">
          <option value="roundedRect">圆角矩形</option>
          <option value="rect">矩形</option>
          <option value="ellipse">椭圆</option>
          <option value="diamond">菱形</option>
        </select>
      </div>
    `
  }
  
  private renderViewGroup(): string {
    return `
      <div class="toolbar-group">
        <button data-action="zoomIn" title="放大 (Ctrl+=)">
          <icon name="zoom-in" />
        </button>
        <span class="zoom-display">${Math.round(this.editor.getZoom() * 100)}%</span>
        <button data-action="zoomOut" title="缩小 (Ctrl+-)">
          <icon name="zoom-out" />
        </button>
        <span class="toolbar-divider"></span>
        <button data-action="fitToContent" title="适应内容 (Ctrl+0)">
          <icon name="fit-content" />
        </button>
        <button data-action="resetZoom" title="重置缩放 (Ctrl+Shift+0)">
          <icon name="reset-zoom" />
        </button>
      </div>
    `
  }
  
  private bindEvents(): void {
    this.container.addEventListener('click', (e) => {
      const button = (e.target as HTMLElement).closest('button')
      if (!button) return
      
      const action = button.dataset.action
      if (action) {
        this.executeAction(action)
      }
    })
  }
  
  private executeAction(action: string): void {
    // 执行命令
    this.editor.executeCommand(action)
  }
  
  private isUndoDisabled(): boolean {
    return !this.editor.canUndo()
  }
  
  private isRedoDisabled(): boolean {
    return !this.editor.canRedo()
  }
  
  /**
   * 更新工具栏状态
   */
  update(): void {
    // 更新按钮状态
    this.updateButtonStates()
    // 更新显示
    this.updateDisplays()
  }
}
```

---

## 三、属性面板

### 3.1 属性面板组件

```typescript
// @y-mindmap/ui/property-panel/property-panel.ts

class PropertyPanel {
  private container: HTMLElement
  private editor: EditorView
  
  constructor(container: HTMLElement, editor: EditorView) {
    this.container = container
    this.editor = editor
    
    // 监听选择变更
    editor.on('selectionChanged', () => this.update())
  }
  
  private render(): void {
    const selection = this.editor.getSelection()
    
    if (selection.length === 0) {
      this.renderEmpty()
    } else if (selection.length === 1) {
      this.renderSingleNode(selection[0])
    } else {
      this.renderMultipleNodes(selection)
    }
  }
  
  private renderEmpty(): void {
    this.container.innerHTML = `
      <div class="property-panel empty">
        <p class="hint">选择一个节点查看属性</p>
      </div>
    `
  }
  
  private renderSingleNode(node: MindMapNode): void {
    this.container.innerHTML = `
      <div class="property-panel">
        ${this.renderTitleSection(node)}
        ${this.renderStyleSection(node)}
        ${this.renderMarkerSection(node)}
        ${this.renderNoteSection(node)}
        ${this.renderLinkSection(node)}
      </div>
    `
    
    this.bindNodeEvents(node)
  }
  
  private renderMultipleNodes(nodes: MindMapNode[]): void {
    this.container.innerHTML = `
      <div class="property-panel">
        <div class="section">
          <h3>已选择 ${nodes.length} 个节点</h3>
        </div>
        ${this.renderCommonStyleSection(nodes)}
      </div>
    `
  }
  
  private renderTitleSection(node: MindMapNode): string {
    return `
      <div class="section">
        <label>标题</label>
        <textarea 
          class="title-input"
          data-property="title"
          rows="3"
        >${this.escapeHtml(node.title)}</textarea>
      </div>
    `
  }
  
  private renderStyleSection(node: MindMapNode): string {
    return `
      <div class="section">
        <h3>样式</h3>
        
        <div class="field">
          <label>形状</label>
          <select data-property="shapeClass">
            <option value="roundedRect" ${node.style?.shapeClass === 'roundedRect' ? 'selected' : ''}>圆角矩形</option>
            <option value="rect" ${node.style?.shapeClass === 'rect' ? 'selected' : ''}>矩形</option>
            <option value="ellipse" ${node.style?.shapeClass === 'ellipse' ? 'selected' : ''}>椭圆</option>
            <option value="diamond" ${node.style?.shapeClass === 'diamond' ? 'selected' : ''}>菱形</option>
          </select>
        </div>
        
        <div class="field">
          <label>填充颜色</label>
          <input type="color" data-property="fillColor" value="${node.style?.fillColor || '#4A90D9'}" />
        </div>
        
        <div class="field">
          <label>边框颜色</label>
          <input type="color" data-property="borderColor" value="${node.style?.borderColor || '#2E6DB4'}" />
        </div>
        
        <div class="field">
          <label>文字颜色</label>
          <input type="color" data-property="textColor" value="${node.style?.textColor || '#333333'}" />
        </div>
        
        <div class="field">
          <label>字号</label>
          <input type="number" data-property="fontSize" value="${node.style?.fontSize || 14}" min="8" max="72" />
        </div>
      </div>
    `
  }
  
  private renderMarkerSection(node: MindMapNode): string {
    return `
      <div class="section">
        <h3>标记</h3>
        <div class="marker-grid">
          ${this.renderMarkerIcons(node.markers || [])}
        </div>
        <button class="add-marker-btn">+ 添加标记</button>
      </div>
    `
  }
  
  private renderNoteSection(node: MindMapNode): string {
    return `
      <div class="section">
        <h3>备注</h3>
        <textarea 
          class="note-input"
          data-property="notes"
          rows="4"
          placeholder="添加备注..."
        >${this.escapeHtml(node.notes?.plain || '')}</textarea>
      </div>
    `
  }
  
  private renderLinkSection(node: MindMapNode): string {
    return `
      <div class="section">
        <h3>链接</h3>
        <input 
          type="url"
          class="link-input"
          data-property="href"
          value="${this.escapeHtml(node.href || '')}"
          placeholder="https://..."
        />
      </div>
    `
  }
  
  private bindNodeEvents(node: MindMapNode): void {
    // 标题变更
    const titleInput = this.container.querySelector('.title-input')
    titleInput?.addEventListener('change', (e) => {
      const value = (e.target as HTMLTextAreaElement).value
      this.editor.executeCommand('updateTitle', { nodeId: node.id, title: value })
    })
    
    // 样式变更
    this.container.querySelectorAll('[data-property]').forEach(el => {
      el.addEventListener('change', (e) => {
        const property = (el as HTMLElement).dataset.property
        const value = (e.target as HTMLInputElement).value
        this.editor.executeCommand('updateStyle', { nodeId: node.id, property, value })
      })
    })
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  /**
   * 更新面板
   */
  update(): void {
    this.render()
  }
}
```

---

## 四、右键菜单

### 4.1 右键菜单组件

```typescript
// @y-mindmap/ui/context-menu/context-menu.ts

class ContextMenu {
  private container: HTMLElement | null = null
  private editor: EditorView
  
  constructor(editor: EditorView) {
    this.editor = editor
    
    // 监听右键事件
    editor.on('contextmenu', (e) => this.show(e))
    
    // 点击其他地方关闭
    document.addEventListener('click', () => this.hide())
  }
  
  show(event: MouseEvent): void {
    event.preventDefault()
    
    const target = this.editor.hitTest(event.clientX, event.clientY)
    const items = this.getItems(target)
    
    this.container = document.createElement('div')
    this.container.className = 'context-menu'
    this.container.style.left = `${event.clientX}px`
    this.container.style.top = `${event.clientY}px`
    
    this.container.innerHTML = items.map(item => {
      if (item.divider) {
        return '<div class="divider"></div>'
      }
      
      return `
        <div class="menu-item ${item.disabled ? 'disabled' : ''}" data-action="${item.action}">
          ${item.icon ? `<span class="icon">${item.icon}</span>` : ''}
          <span class="label">${item.label}</span>
          ${item.shortcut ? `<span class="shortcut">${item.shortcut}</span>` : ''}
        </div>
      `
    }).join('')
    
    document.body.appendChild(this.container)
    
    this.bindEvents()
  }
  
  hide(): void {
    if (this.container) {
      document.body.removeChild(this.container)
      this.container = null
    }
  }
  
  private getItems(target: any): MenuItem[] {
    if (!target) {
      return this.getEmptyMenuItems()
    }
    
    if (target.type === 'topic') {
      return this.getTopicMenuItems(target)
    }
    
    return []
  }
  
  private getTopicMenuItems(node: MindMapNode): MenuItem[] {
    return [
      { action: 'edit', label: '编辑', icon: '✏️', shortcut: 'Enter' },
      { divider: true },
      { action: 'addSubTopic', label: '添加子节点', icon: '➕', shortcut: 'Tab' },
      { action: 'addSiblingTopic', label: '添加兄弟节点', icon: '➕', shortcut: 'Enter' },
      { divider: true },
      { action: 'delete', label: '删除', icon: '🗑️', shortcut: 'Delete' },
      { divider: true },
      { action: 'fold', label: '折叠/展开', icon: '📁', shortcut: 'Space' },
      { divider: true },
      { action: 'copy', label: '复制', icon: '📋', shortcut: 'Ctrl+C' },
      { action: 'cut', label: '剪切', icon: '✂️', shortcut: 'Ctrl+X' },
      { action: 'paste', label: '粘贴', icon: '📋', shortcut: 'Ctrl+V' },
    ]
  }
  
  private getEmptyMenuItems(): MenuItem[] {
    return [
      { action: 'paste', label: '粘贴', icon: '📋', shortcut: 'Ctrl+V' },
      { divider: true },
      { action: 'selectAll', label: '全选', icon: '📋', shortcut: 'Ctrl+A' },
      { divider: true },
      { action: 'fitToContent', label: '适应内容', icon: '🔍' },
    ]
  }
  
  private bindEvents(): void {
    if (!this.container) return
    
    this.container.querySelectorAll('.menu-item:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => {
        const action = (el as HTMLElement).dataset.action
        if (action) {
          this.editor.executeCommand(action)
          this.hide()
        }
      })
    })
  }
}
```

---

## 五、小地图

### 5.1 小地图组件

```typescript
// @y-mindmap/ui/minimap/minimap.ts

class MiniMap {
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  private editor: EditorView
  private scale: number = 0.1
  
  constructor(container: HTMLElement, editor: EditorView) {
    this.container = container
    this.editor = editor
    
    this.canvas = document.createElement('canvas')
    this.container.appendChild(this.canvas)
    
    this.render()
    this.bindEvents()
  }
  
  private render(): void {
    const bounds = this.editor.getContentBounds()
    const width = bounds.width * this.scale
    const height = bounds.height * this.scale
    
    this.canvas.width = width
    this.canvas.height = height
    
    const ctx = this.canvas.getContext('2d')!
    ctx.clearRect(0, 0, width, height)
    
    // 渲染节点
    this.renderNodes(ctx, bounds)
    
    // 渲染视口指示器
    this.renderViewport(ctx, bounds)
  }
  
  private renderNodes(ctx: CanvasRenderingContext2D, offset: Bounds): void {
    const doc = this.editor.getDocument()
    
    doc.descendants((node) => {
      const bounds = this.editor.getNodeBounds(node.id)
      
      const x = (bounds.x - offset.x) * this.scale
      const y = (bounds.y - offset.y) * this.scale
      const width = bounds.width * this.scale
      const height = bounds.height * this.scale
      
      ctx.fillStyle = '#4A90D9'
      ctx.fillRect(x, y, width, height)
    })
  }
  
  private renderViewport(ctx: CanvasRenderingContext2D, offset: Bounds): void {
    const viewport = this.editor.getViewportBounds()
    
    const x = (viewport.x - offset.x) * this.scale
    const y = (viewport.y - offset.y) * this.scale
    const width = viewport.width * this.scale
    const height = viewport.height * this.scale
    
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)
  }
  
  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      const bounds = this.editor.getContentBounds()
      const targetX = bounds.x + x / this.scale
      const targetY = bounds.y + y / this.scale
      
      this.editor.panTo({ x: targetX, y: targetY })
    })
  }
  
  /**
   * 更新小地图
   */
  update(): void {
    this.render()
  }
}
```

---

## 六、状态栏

### 6.1 状态栏组件

```typescript
// @y-mindmap/ui/status-bar/status-bar.ts

class StatusBar {
  private container: HTMLElement
  private editor: EditorView
  
  constructor(container: HTMLElement, editor: EditorView) {
    this.container = container
    this.editor = editor
    
    this.render()
    
    // 监听变更
    editor.on('selectionChanged', () => this.update())
    editor.on('zoomChanged', () => this.update())
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="status-bar">
        <div class="status-left">
          <span class="node-count">节点数: ${this.getNodeCount()}</span>
          <span class="selection-info">${this.getSelectionInfo()}</span>
        </div>
        <div class="status-right">
          <span class="zoom-level">${Math.round(this.editor.getZoom() * 100)}%</span>
          <span class="layout-type">${this.getLayoutType()}</span>
        </div>
      </div>
    `
  }
  
  private getNodeCount(): number {
    const doc = this.editor.getDocument()
    let count = 0
    doc.descendants(() => count++)
    return count
  }
  
  private getSelectionInfo(): string {
    const selection = this.editor.getSelection()
    
    if (selection.length === 0) {
      return '未选择'
    }
    
    if (selection.length === 1) {
      return `已选择: ${selection[0].title}`
    }
    
    return `已选择 ${selection.length} 个节点`
  }
  
  private getLayoutType(): string {
    const doc = this.editor.getDocument()
    const structure = doc.structureClass
    
    const names: Record<string, string> = {
      'org.xmind.ui.map': '思维导图',
      'org.xmind.ui.logic.right': '逻辑图',
      'org.xmind.ui.tree.right': '树形图',
      'org.xmind.ui.org-chart.down': '组织图',
      'org.xmind.ui.fishbone.leftHeaded': '鱼骨图',
      'org.xmind.ui.timeline.horizontal': '时间线',
    }
    
    return names[structure] || structure
  }
  
  /**
   * 更新状态栏
   */
  update(): void {
    this.render()
  }
}
```

---

## 七、对话框

### 7.1 确认对话框

```typescript
// @y-mindmap/ui/dialogs/confirm.ts

class ConfirmDialog {
  static show(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'dialog-overlay'
      
      dialog.innerHTML = `
        <div class="dialog confirm-dialog">
          <div class="dialog-header">
            <h3>${options.title || '确认'}</h3>
          </div>
          <div class="dialog-body">
            <p>${options.message}</p>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" data-action="cancel">
              ${options.cancelText || '取消'}
            </button>
            <button class="btn btn-primary" data-action="confirm">
              ${options.confirmText || '确定'}
            </button>
          </div>
        </div>
      `
      
      document.body.appendChild(dialog)
      
      dialog.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
        document.body.removeChild(dialog)
        resolve(false)
      })
      
      dialog.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
        document.body.removeChild(dialog)
        resolve(true)
      })
    })
  }
}

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}
```

### 7.2 输入对话框

```typescript
// @y-mindmap/ui/dialogs/prompt.ts

class PromptDialog {
  static show(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'dialog-overlay'
      
      dialog.innerHTML = `
        <div class="dialog prompt-dialog">
          <div class="dialog-header">
            <h3>${options.title || '输入'}</h3>
          </div>
          <div class="dialog-body">
            ${options.message ? `<p>${options.message}</p>` : ''}
            <input 
              type="text" 
              class="prompt-input"
              value="${options.defaultValue || ''}"
              placeholder="${options.placeholder || ''}"
            />
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" data-action="cancel">取消</button>
            <button class="btn btn-primary" data-action="confirm">确定</button>
          </div>
        </div>
      `
      
      document.body.appendChild(dialog)
      
      const input = dialog.querySelector('.prompt-input') as HTMLInputElement
      input.focus()
      input.select()
      
      dialog.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
        document.body.removeChild(dialog)
        resolve(null)
      })
      
      dialog.querySelector('[data-action="confirm"]')?.addEventListener('click', () => {
        document.body.removeChild(dialog)
        resolve(input.value)
      })
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          document.body.removeChild(dialog)
          resolve(input.value)
        }
        if (e.key === 'Escape') {
          document.body.removeChild(dialog)
          resolve(null)
        }
      })
    })
  }
}

interface PromptOptions {
  title?: string
  message?: string
  defaultValue?: string
  placeholder?: string
}
```
