# 创建思维导图

## 基础示例

```typescript
import { createMindMap } from '@y-mindmap/vanilla'

// 创建编辑器
const editor = createMindMap(document.getElementById('app')!)

// 添加根节点的子节点
editor.executeCommand('addSubTopic')

// 添加兄弟节点
editor.executeCommand('addSiblingTopic')

// 删除节点
editor.executeCommand('deleteNode')

// 撤销/重做
editor.executeCommand('undo')
editor.executeCommand('redo')
```

## 使用模板

```typescript
import { createMindMap } from '@y-mindmap/vanilla'
import { MindMapDocument } from '@y-mindmap/state'
import { getTemplateById, ALL_TEMPLATES } from '@y-mindmap/templates'

// 获取所有模板
console.log(ALL_TEMPLATES)

// 使用 SWOT 分析模板
const template = getTemplateById('business-swot')
const doc = MindMapDocument.fromJSON(template.root)

const editor = createMindMap(document.getElementById('app')!, { doc })
```

## 自定义布局

```typescript
import { createMindMap } from '@y-mindmap/vanilla'
import { StructureType } from '@y-mindmap/core'

const editor = createMindMap(document.getElementById('app')!)

// 切换到逻辑图布局
editor.executeCommand('setStructureClass', {
  structureClass: StructureType.LOGIC_RIGHT
})

// 切换到组织图
editor.executeCommand('setStructureClass', {
  structureClass: StructureType.ORG_CHART_DOWN
})
```

## 自定义样式

```typescript
import { createMindMap } from '@y-mindmap/vanilla'

const editor = createMindMap(document.getElementById('app')!)

// 更新节点样式
editor.executeCommand('updateStyle', {
  properties: {
    'fill-color': '#4CAF50',
    'text-color': '#FFFFFF',
    'border-color': '#388E3C',
  }
})
```

## 导入导出

```typescript
import { createMindMap } from '@y-mindmap/vanilla'

const editor = createMindMap(document.getElementById('app')!)

// 导入 XMind 文件
const fileInput = document.getElementById('file-input')
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  await editor.loadXMindFile(file)
})

// 导出为 XMind
const blob = await editor.exportXMind()
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'mindmap.xmind'
a.click()
```

## 使用扩展

### 使用 StarterKit

```typescript
import { createMindMap, StarterKit } from '@y-mindmap/vanilla'

// 使用默认配置（包含所有内置扩展）
const editor = createMindMap(document.getElementById('app')!)

// 自定义 StarterKit 配置
const editor = createMindMap(document.getElementById('app')!, {
  extensions: StarterKit({
    minimap: { width: 300, height: 200 },
    keymap: false,  // 禁用默认快捷键
    exportPNG: { pixelRatio: 3 },
  }),
})
```

### 自定义扩展

```typescript
import { createMindMap } from '@y-mindmap/vanilla'
import { createExtension } from '@y-mindmap/extension'

// 创建自动保存扩展
const AutoSave = createExtension({
  name: 'auto-save',
  type: 'behavior',
  defaultOptions: {
    interval: 30000,
    enabled: true,
  },
  setup(ctx, options) {
    const interval = setInterval(() => {
      const doc = ctx.state.doc
      localStorage.setItem('mindmap', JSON.stringify(doc.toJSON()))
      console.log('Auto saved!')
    }, options.interval)

    return () => clearInterval(interval)
  },
})

const editor = createMindMap(document.getElementById('app')!, {
  extensions: [AutoSave],
})
```

### 配置扩展

```typescript
import { createMindMap } from '@y-mindmap/vanilla'
import { Minimap, Keymap } from '@y-mindmap/extensions'

const editor = createMindMap(document.getElementById('app')!, {
  extensions: [
    Minimap.configure({
      width: 300,
      height: 200,
      backgroundColor: '#f5f5f5',
    }),
    Keymap.configure({
      keymap: {
        'Ctrl+s': 'save',
        'Ctrl+Shift+n': 'newNode',
      },
    }),
  ],
})
```

### 纯净模式

```typescript
import { createMindMap, PureStarterKit } from '@y-mindmap/pure'
import { Keymap, Clipboard } from '@y-mindmap/extensions'

// 只使用需要的扩展
const editor = createMindMap(document.getElementById('app')!, {
  extensions: [
    Keymap,
    Clipboard,
  ],
})
```
