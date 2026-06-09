# PLUGIN-GUIDE.md - 插件开发指南

> 思维导图编辑器插件开发指南

---

## 一、插件架构

### 1.1 插件接口

```typescript
// @y-mindmap/plugin/plugin.ts

interface Plugin {
  /** 插件名称 */
  name: string
  
  /** 插件版本 */
  version: string
  
  /** 插件描述 */
  description?: string
  
  /** 安装插件 */
  install(editor: EditorView, options?: any): void
  
  /** 卸载插件 */
  uninstall?(): void
}
```

### 1.2 插件注册

```typescript
// @y-mindmap/plugin/registry.ts

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map()
  
  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin already registered: ${plugin.name}`)
    }
    
    this.plugins.set(plugin.name, plugin)
  }
  
  /**
   * 安装插件
   */
  install(name: string, editor: EditorView, options?: any): void {
    const plugin = this.plugins.get(name)
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`)
    }
    
    plugin.install(editor, options)
  }
  
  /**
   * 卸载插件
   */
  uninstall(name: string): void {
    const plugin = this.plugins.get(name)
    if (plugin) {
      plugin.uninstall?.()
      this.plugins.delete(name)
    }
  }
}
```

---

## 二、插件示例

### 2.1 自动保存插件

```typescript
// @y-mindmap/plugin/auto-save.ts

class AutoSavePlugin implements Plugin {
  name = 'auto-save'
  version = '1.0.0'
  description = '自动保存插件'
  
  private editor: EditorView
  private timer: ReturnType<typeof setTimeout> | null = null
  private interval: number = 30000
  
  install(editor: EditorView, options?: { interval?: number }): void {
    this.editor = editor
    this.interval = options?.interval || 30000
    
    editor.on('stateChanged', () => this.scheduleSave())
  }
  
  uninstall(): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  }
  
  private scheduleSave(): void {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    
    this.timer = setTimeout(() => {
      this.save()
    }, this.interval)
  }
  
  private async save(): Promise<void> {
    const doc = this.editor.getDocument()
    const data = doc.toJSON()
    
    localStorage.setItem('mindmap-autosave', JSON.stringify(data))
  }
}
```

### 2.2 小地图插件

```typescript
// @y-mindmap/plugin/minimap.ts

class MiniMapPlugin implements Plugin {
  name = 'minimap'
  version = '1.0.0'
  description = '小地图插件'
  
  private editor: EditorView
  private container: HTMLElement
  private canvas: HTMLCanvasElement
  
  install(editor: EditorView, options?: any): void {
    this.editor = editor
    this.createUI()
    this.render()
    
    editor.on('stateChanged', () => this.render())
    editor.on('viewportChanged', () => this.render())
  }
  
  private createUI(): void {
    this.container = document.createElement('div')
    this.container.className = 'minimap'
    
    this.canvas = document.createElement('canvas')
    this.container.appendChild(this.canvas)
    
    document.body.appendChild(this.container)
  }
  
  private render(): void {
    const doc = this.editor.getDocument()
    const bounds = this.editor.getContentBounds()
    
    // 渲染小地图
    // ...
  }
}
```

### 2.3 键盘快捷键插件

```typescript
// @y-mindmap/plugin/keymap.ts

class KeymapPlugin implements Plugin {
  name = 'keymap'
  version = '1.0.0'
  description = '键盘快捷键插件'
  
  private editor: EditorView
  private bindings: Map<string, string> = new Map()
  
  install(editor: EditorView, options?: { bindings?: Record<string, string> }): void {
    this.editor = editor
    
    if (options?.bindings) {
      Object.entries(options.bindings).forEach(([key, command]) => {
        this.bindings.set(key, command)
      })
    }
    
    document.addEventListener('keydown', (e) => this.handleKeyDown(e))
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    const key = this.buildKeyString(event)
    const command = this.bindings.get(key)
    
    if (command) {
      event.preventDefault()
      this.editor.executeCommand(command)
    }
  }
  
  private buildKeyString(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    
    parts.push(event.key)
    
    return parts.join('+')
  }
}
```

---

## 三、插件开发

### 3.1 创建插件

```typescript
// my-plugin.ts

import { Plugin, EditorView } from 'y-mindmap'

export class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'
  description = '我的自定义插件'
  
  private editor: EditorView
  
  install(editor: EditorView, options?: any): void {
    this.editor = editor
    
    // 初始化插件
    this.init()
  }
  
  uninstall(): void {
    // 清理资源
    this.cleanup()
  }
  
  private init(): void {
    // 添加事件监听
    this.editor.on('nodeClick', (node) => {
      console.log('Node clicked:', node)
    })
    
    // 添加命令
    this.editor.registerCommand('myCommand', () => {
      console.log('My command executed')
    })
  }
  
  private cleanup(): void {
    // 清理事件监听
    // 清理资源
  }
}
```

### 3.2 使用插件

```typescript
import { EditorView } from 'y-mindmap'
import { MyPlugin } from './my-plugin'

const editor = new EditorView({
  container: document.getElementById('app'),
})

// 注册插件
editor.use(MyPlugin, { /* options */ })
```

---

## 四、插件测试

### 4.1 测试工具

```typescript
// @y-mindmap/plugin/test-utils.ts

function createTestEditor(): EditorView {
  const container = document.createElement('div')
  return new EditorView({ container })
}

function createTestPlugin(): Plugin {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    install: vi.fn(),
    uninstall: vi.fn(),
  }
}
```

### 4.2 测试示例

```typescript
describe('MyPlugin', () => {
  let editor: EditorView
  let plugin: MyPlugin
  
  beforeEach(() => {
    editor = createTestEditor()
    plugin = new MyPlugin()
  })
  
  it('should install correctly', () => {
    plugin.install(editor)
    expect(plugin.name).toBe('my-plugin')
  })
  
  it('should handle events', () => {
    const spy = vi.spyOn(console, 'log')
    plugin.install(editor)
    
    editor.emit('nodeClick', { id: 'test' })
    
    expect(spy).toHaveBeenCalledWith('Node clicked:', { id: 'test' })
  })
})
```
