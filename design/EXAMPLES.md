# EXAMPLES.md - 示例代码

> 思维导图编辑器使用示例

---

## 一、基础示例

### 1.1 创建编辑器

```typescript
import { EditorView } from 'y-mindmap'

// 创建编辑器
const editor = new EditorView({
  container: document.getElementById('app'),
  theme: 'classic',
})
```

### 1.2 加载文档

```typescript
import { MindMapNode, TopicType } from 'y-mindmap'

// 创建文档
const doc = new MindMapNode({
  id: 'root',
  title: 'Central Topic',
  type: TopicType.ROOT,
  children: {
    attached: [
      new MindMapNode({
        id: 'branch-1',
        title: 'Branch 1',
        type: TopicType.ATTACHED,
      }),
      new MindMapNode({
        id: 'branch-2',
        title: 'Branch 2',
        type: TopicType.ATTACHED,
      }),
    ],
  },
})

// 加载文档
editor.loadDocument(doc)
```

### 1.3 保存文档

```typescript
// 获取当前文档
const doc = editor.getDocument()

// 序列化为 JSON
const json = doc.toJSON()

// 保存到本地存储
localStorage.setItem('mindmap', JSON.stringify(json))
```

---

## 二、交互示例

### 2.1 自定义快捷键

```typescript
import { EditorView } from 'y-mindmap'

const editor = new EditorView({
  container: document.getElementById('app'),
  keymap: {
    bindings: {
      'Ctrl+s': 'save',
      'Ctrl+Shift+n': 'addSubTopic',
    },
    disabled: ['Space'], // 禁用空格键
  },
})

// 注册自定义命令
editor.registerCommand('save', () => {
  const doc = editor.getDocument()
  localStorage.setItem('mindmap', JSON.stringify(doc.toJSON()))
  editor.showNotification('保存成功')
})
```

### 2.2 监听事件

```typescript
// 监听选择变更
editor.on('selectionChanged', (selection) => {
  console.log('选中的节点:', Array.from(selection.selectedIds))
})

// 监听节点点击
editor.on('nodeClick', (node) => {
  console.log('点击的节点:', node.title)
})

// 监听状态变更
editor.on('stateChanged', (state) => {
  console.log('状态已变更')
})

// 监听缩放变更
editor.on('zoomChanged', (zoom) => {
  console.log('当前缩放:', zoom)
})
```

### 2.3 拖拽操作

```typescript
// 监听拖拽开始
editor.on('nodeDragStart', (node) => {
  console.log('开始拖拽:', node.title)
})

// 监听拖拽结束
editor.on('nodeDragEnd', (node) => {
  console.log('拖拽结束:', node.title)
})

// 禁用拖拽
editor.disableDrag()
```

---

## 三、样式示例

### 3.1 自定义节点样式

```typescript
const doc = new MindMapNode({
  id: 'root',
  title: 'Custom Style Node',
  type: TopicType.ROOT,
  style: {
    properties: {
      'fill-color': '#FF6B6B',
      'border-color': '#FF4444',
      'text-color': '#FFFFFF',
      'font-size': 18,
      'font-weight': 'bold',
      'border-radius': 12,
    },
  },
})
```

### 3.2 动态切换主题

```typescript
// 切换到暗色主题
editor.setTheme('dark')

// 切换到自定义主题
editor.setTheme({
  id: 'custom',
  name: 'Custom Theme',
  colors: {
    primary: '#7B68EE',
    background: '#1E1E1E',
    text: '#FFFFFF',
  },
})
```

---

## 四、布局示例

### 4.1 切换布局

```typescript
// 切换到逻辑图布局
editor.executeCommand('setStructure', {
  structure: 'org.xmind.ui.logic.right',
})

// 切换到组织图布局
editor.executeCommand('setStructure', {
  structure: 'org.xmind.ui.org-chart.down',
})

// 切换到鱼骨图布局
editor.executeCommand('setStructure', {
  structure: 'org.xmind.ui.fishbone.leftHeaded',
})
```

---

## 五、导入导出示例

### 5.1 导入 XMind 文件

```typescript
const fileInput = document.getElementById('file-input')

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  
  if (file) {
    const doc = await editor.importFile(file, 'xmind')
    editor.loadDocument(doc)
  }
})
```

### 5.2 导出为 Markdown

```typescript
const md = await editor.exportDocument('markdown')
console.log(md)
```

### 5.3 导出为 PNG

```typescript
const blob = await editor.exportImage({
  width: 1920,
  height: 1080,
  format: 'png',
})

// 下载图片
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'mindmap.png'
a.click()
```

---

## 六、插件示例

### 6.1 使用插件

```typescript
import { EditorView } from 'y-mindmap'
import { AutoSavePlugin } from 'y-mindmap/plugins'

const editor = new EditorView({
  container: document.getElementById('app'),
  plugins: [
    new AutoSavePlugin({ interval: 30000 }),
  ],
})
```

### 6.2 创建自定义插件

```typescript
import { Plugin, EditorView } from 'y-mindmap'

class MyPlugin implements Plugin {
  name = 'my-plugin'
  version = '1.0.0'
  
  install(editor: EditorView): void {
    editor.on('nodeClick', (node) => {
      console.log('Node clicked:', node.title)
    })
  }
}

// 使用插件
editor.use(MyPlugin)
```

---

## 七、协同编辑示例

### 7.1 使用 Yjs

```typescript
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { EditorView } from 'y-mindmap'

// 创建 Yjs 文档
const yDoc = new Y.Doc()

// 连接到服务器
const provider = new WebsocketProvider(
  'wss://your-server.com',
  'mindmap-room',
  yDoc
)

// 创建编辑器
const editor = new EditorView({
  container: document.getElementById('app'),
  collab: {
    doc: yDoc,
    provider,
  },
})
```
