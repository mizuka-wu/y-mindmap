# 插件系统

## 概述

Y-MindMap 提供灵活的插件系统，支持命令、菜单、工具栏、面板等扩展。

## 插件接口

```typescript
interface Plugin {
  id: string
  name: string
  version: string
  description?: string
  author?: string
  dependencies?: string[]
  
  init?: (api: PluginAPI) => void
  activate?: () => void
  deactivate?: () => void
  destroy?: () => void
}
```

## PluginAPI

```typescript
interface PluginAPI {
  // 命令注册
  registerCommand(name: string, command: Command): void
  unregisterCommand(name: string): void
  
  // UI 注册
  registerMenuItem(item: MenuItem): void
  registerToolbarButton(button: ToolbarButton): void
  registerPanel(options: PanelOptions): void
  
  // 事件
  on(event: PluginEvent, handler: Function): void
  off(event: PluginEvent, handler: Function): void
  emit(event: PluginEvent, ...args: any[]): void
  
  // 状态访问
  getState(): EditorState
  dispatch(tr: Transaction): void
  getDocument(): MindMapDocument
  getSelection(): string[]
  
  // UI
  showNotification(options: NotificationOptions): void
  showDialog(options: DialogOptions): Promise<void>
  
  // 配置
  getConfig<T>(key: string): T | undefined
  setConfig(key: string, value: any): void
}
```

## 创建插件

```typescript
const myPlugin: Plugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A sample plugin',
  
  init(api) {
    // 注册命令
    api.registerCommand('myCommand', {
      name: 'myCommand',
      description: 'My custom command',
      execute: (state, input, dispatch) => {
        api.showNotification({ message: 'Hello!', type: 'success' })
        return true
      },
    })
    
    // 注册菜单项
    api.registerMenuItem({
      id: 'my-menu-item',
      label: 'My Action',
      icon: '🎯',
      action: () => api.executeCommand('myCommand'),
    })
    
    // 注册工具栏按钮
    api.registerToolbarButton({
      id: 'my-toolbar-button',
      label: 'My Action',
      icon: '🎯',
      tooltip: 'Click me',
      action: () => api.executeCommand('myCommand'),
    })
    
    // 监听事件
    api.on('node:select', (nodeId) => {
      console.log('Node selected:', nodeId)
    })
  },
  
  activate() {
    console.log('Plugin activated')
  },
  
  deactivate() {
    console.log('Plugin deactivated')
  },
}
```

## 使用插件

```typescript
const editor = new MindMapEditor({
  container: document.getElementById('app')!,
  plugins: [myPlugin],
})

// 动态加载
editor.use(anotherPlugin)

// 卸载
editor.unuse('my-plugin')

// 获取插件管理器
const pluginManager = editor.getPluginManager()
const activePlugins = pluginManager.getActivePlugins()
```

## 事件类型

```typescript
type PluginEvent = 
  | 'document:load'
  | 'document:save'
  | 'document:change'
  | 'node:select'
  | 'node:deselect'
  | 'node:create'
  | 'node:delete'
  | 'node:update'
  | 'node:move'
  | 'node:fold'
  | 'node:unfold'
  | 'layout:change'
  | 'theme:change'
  | 'command:before'
  | 'command:after'
  | 'view:zoom'
  | 'view:pan'
  | 'collab:join'
  | 'collab:leave'
  | 'collab:conflict'
```

## 内置插件示例

### 富文本插件

```typescript
const richTextPlugin: Plugin = {
  id: 'richtext',
  name: 'Rich Text',
  version: '1.0.0',
  
  init(api) {
    api.registerCommand('toggleBold', {
      name: 'toggleBold',
      description: 'Toggle bold',
      execute: (state) => {
        // 切换加粗
        return true
      },
    })
  },
}
```

### 导出插件

```typescript
const exportPlugin: Plugin = {
  id: 'export',
  name: 'Export',
  version: '1.0.0',
  
  init(api) {
    api.registerToolbarButton({
      id: 'export-png',
      label: 'Export PNG',
      icon: '🖼️',
      action: () => {
        // 导出 PNG
      },
    })
  },
}
```
