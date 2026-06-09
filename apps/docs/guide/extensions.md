# Extension 系统

y-mindmap 采用 Tiptap 风格的 Extension 系统，取代了旧的 Plugin 系统。扩展可以注册命令、监听事件、绑定键盘快捷键、创建 UI 组件，以及与编辑器的各个层面交互。

## 核心概念

### createExtension()

创建扩展的工厂函数，返回不可变的 `ExtensionDefinition` 对象：

```typescript
import { createExtension } from '@y-mindmap/extension'

export const MyExtension = createExtension<MyOptions>({
  name: 'my-extension',
  type: 'behavior',        // 'block' | 'mark' | 'node' | 'behavior' | 'collaboration'
  defaultOptions: {
    enabled: true,
    // 自定义选项...
  },

  setup(ctx, options) {
    // 初始化逻辑
    // ctx 提供 state、dispatch、view、事件系统等

    return () => {
      // 清理函数（类似 React useEffect）
    }
  },
})
```

### configure()

不可变配置，返回新的扩展实例：

```typescript
// 使用默认选项
MyExtension

// 自定义选项
MyExtension.configure({ myOption: 'value' })

// 禁用扩展
MyExtension.configure({ enabled: false })
```

### ExtensionContext

扩展在 `setup(ctx, options)` 中接收的上下文对象：

| 属性/方法 | 类型 | 说明 |
|-----------|------|------|
| `state` | `EditorState` | 当前编辑器状态 |
| `dispatch` | `(tr: Transaction) => void` | 派发事务 |
| `view` | `EditorView \| null` | 视图层（DOM 操作） |
| `executeCommand` | `(name: string, args?: any) => boolean` | 执行命令 |
| `registerCommand` | `(name: string, command) => void` | 注册命令 |
| `unregisterCommand` | `(name: string) => void` | 注销命令 |
| `on` | `(event: string, handler) => void` | 监听事件 |
| `off` | `(event: string, handler) => void` | 取消监听 |
| `emit` | `(event: string, ...args) => void` | 触发事件 |

## 内置扩展

### 交互类

| 扩展 | 说明 | 默认选项 |
|------|------|----------|
| `DragDrop` | 拖拽移动节点 | `indicatorColor`, `previewOpacity` |
| `BoxSelect` | 框选多个节点 | — |
| `ContextMenu` | 右键菜单 | `items` |
| `RichTextEdit` | 双击富文本编辑 | `showFormatToolbar` |
| `Collab` | Y.Doc 协作绑定 | `ydoc`, `field` |

### 输入类

| 扩展 | 说明 | 默认选项 |
|------|------|----------|
| `Keymap` | 键盘快捷键映射 | `keymap`（自定义映射） |
| `Clipboard` | 剪贴板操作 (Ctrl+C/X/V/D) | — |
| `Gesture` | 手势识别（捏合/平移/点击） | `enablePinch`, `enablePan` |

### 效果类

| 扩展 | 说明 | 默认选项 |
|------|------|----------|
| `Minimap` | 缩略地图 | `width`, `height` |
| `ZoomControls` | 缩放控件 | `showPercentage`, `showFit` |
| `InertialScroll` | 惯性滚动 | `friction`, `threshold` |

### 导入导出类

| 扩展 | 说明 | 命令 |
|------|------|------|
| `ExportXMind` | XMind 格式 | `importXMind`, `exportXMind` |
| `ExportMarkdown` | Markdown 格式 | `importMarkdown`, `exportMarkdown` |
| `ExportJSON` | JSON 格式 | `importJSON`, `exportJSON` |
| `ExportPNG` | PNG 图片 | `exportPNG` |
| `ExportSVG` | SVG 矢量图 | `exportSVG` |
| `ExportPDF` | PDF 文档 | `exportPDF` |

## StarterKit

### 完整版 (vanilla)

```typescript
import { StarterKit } from '@y-mindmap/vanilla'

const extensions = StarterKit()
// 包含所有交互+输入+效果+导入导出扩展
```

禁用特定扩展：

```typescript
const extensions = StarterKit({
  contextMenu: false,           // 禁用右键菜单
  exportPDF: false,             // 禁用 PDF 导出
  keymap: { keymap: { ... } },  // 自定义快捷键
})
```

### 纯净版 (pure)

```typescript
import { PureStarterKit } from '@y-mindmap/pure'

const extensions = PureStarterKit()
// 返回空数组，只有基础渲染 + 展开收起 + 移动
```

## 自定义扩展示例

```typescript
import { createExtension } from '@y-mindmap/extension'

export const AutoSave = createExtension<{ interval: number }>({
  name: 'auto-save',
  type: 'behavior',
  defaultOptions: { interval: 30000, enabled: true },

  setup(ctx, options) {
    const timer = setInterval(() => {
      const data = ctx.state.doc.root.toData()
      localStorage.setItem('mindmap-autosave', JSON.stringify(data))
    }, options.interval)

    return () => clearInterval(timer)
  },
})

// 使用
const editor = new MindMapEditor({
  container: el,
  extensions: [
    ...StarterKit(),
    AutoSave.configure({ interval: 60000 }),
  ],
})
```

## 注册命令

扩展可以通过 `ctx.registerCommand` 注册命令，其他扩展或外部代码可以通过 `ctx.executeCommand` 调用：

```typescript
setup(ctx) {
  ctx.registerCommand('myCommand', (state, dispatch, args) => {
    const tr = state.tr
    // 修改文档...
    dispatch(tr)
    return true
  })

  return () => {
    ctx.unregisterCommand('myCommand')
  }
}
```

## 事件系统

扩展可以监听和触发事件：

```typescript
setup(ctx) {
  const handler = (tr: Transaction) => {
    // 响应事务变更
  }
  ctx.on('transaction', handler)

  return () => {
    ctx.off('transaction', handler)
  }
}
```

内置事件：

| 事件 | 参数 | 说明 |
|------|------|------|
| `transaction` | `Transaction` | 每次 dispatch 后触发 |
| `document:load` | `MindMapDocument` | 文档加载 |
| `document:change` | `Transaction` | 文档变更 |

## 包结构

| 包 | 说明 |
|---|------|
| `@y-mindmap/extension` | 框架（createExtension, ExtensionManager, 类型） |
| `@y-mindmap/extensions` | 17 个内置扩展实现 |
| `@y-mindmap/vanilla` | StarterKit（完整版） |
| `@y-mindmap/pure` | PureStarterKit（纯净版） |
