# 富文本系统

## 概述

Y-MindMap 支持富文本标题，允许对标题中的不同部分应用不同的样式。富文本基于 `AttributeTitle` 数据结构，支持字体、颜色、粗细、斜体等样式。

## 核心概念

### AttributeTitle

`AttributeTitle` 是一个由多个 `AttributeTitleUnit` 组成的数组，每个 unit 代表一段带有样式的文本：

```typescript
type AttributeTitle = AttributeTitleUnit[]

interface AttributeTitleUnit {
  text: string                    // 必填，文本内容
  href?: string                   // 可选，超链接
  formula?: string                // 可选，LaTeX 公式
  'fo:font-family'?: string       // 字体
  'fo:font-weight'?: string | number  // 粗细
  'fo:font-style'?: string        // 斜体
  'fo:font-size'?: string | number    // 字号
  'fo:color'?: string             // 文字颜色
  'fo:text-decoration'?: string   // 下划线/删除线
  'fo:background-color'?: string  // 背景色
}
```

### 样式继承

样式按以下优先级继承：

1. **富文本显式样式** - 最高优先级
2. **节点样式** - 从 `node.style.properties` 继承
3. **主题默认样式** - 最低优先级

## API

### 工具函数

```typescript
import {
  isAttributeTitleEmpty,
  isRichAttributeTitle,
  getPlainTextFromAttributeTitle,
  createAttributeTitleFromPlainText,
  createAttributeTitleUnit,
  normalizeAttributeTitle,
  isEqualAttributeTitle,
  extractGlobalStyle,
  removeGlobalStyleFromAttributeTitle,
} from '@y-mindmap/core'
```

#### isAttributeTitleEmpty

检查 `AttributeTitle` 是否为空：

```typescript
isAttributeTitleEmpty(undefined)  // true
isAttributeTitleEmpty([])         // true
isAttributeTitleEmpty([{ text: 'Hello' }])  // false
```

#### isRichAttributeTitle

检查是否为富文本（除 text 外还有其他属性）：

```typescript
isRichAttributeTitle([{ text: 'Hello' }])  // false
isRichAttributeTitle([{ text: 'Hello', 'fo:font-weight': 'bold' }])  // true
```

#### getPlainTextFromAttributeTitle

提取纯文本：

```typescript
getPlainTextFromAttributeTitle([
  { text: 'Hello ', 'fo:font-weight': 'bold' },
  { text: 'World' },
])  // "Hello World"
```

#### createAttributeTitleFromPlainText

从纯文本创建：

```typescript
createAttributeTitleFromPlainText('Hello World')
// [{ text: 'Hello World' }]
```

#### createAttributeTitleUnit

创建带样式的 unit：

```typescript
createAttributeTitleUnit('Hello', {
  'fo:font-weight': 'bold',
  'fo:color': '#ff0000',
})
// { text: 'Hello', 'fo:font-weight': 'bold', 'fo:color': '#ff0000' }
```

#### normalizeAttributeTitle

标准化（同步 title 和 attributeTitle）：

```typescript
normalizeAttributeTitle(
  [{ text: 'Hello ', 'fo:font-weight': 'bold' }, { text: 'World' }],
  'Old Title'
)
// { title: 'Hello World', attributeTitle: [...] }
```

#### isEqualAttributeTitle

比较两个富文本是否相等：

```typescript
isEqualAttributeTitle(
  [{ text: 'Hello', 'fo:font-weight': 'bold' }],
  [{ text: 'Hello', 'fo:font-weight': 'bold' }],
)  // true
```

#### extractGlobalStyle

提取全局样式（所有 unit 共享的样式）：

```typescript
extractGlobalStyle([
  { text: 'Hello', 'fo:font-weight': 'bold' },
  { text: 'World', 'fo:font-weight': 'bold' },
])
// { 'fo:font-weight': 'bold' }
```

### MindMapNode 方法

```typescript
node.isRichTitle              // 是否富文本
node.displayTitle             // 显示标题（纯文本）
node.attributeTitle           // 富文本数据
node.withAttributeTitle(title)  // 设置富文本标题
node.withTitle(title)         // 设置标题（字符串或富文本）
```

### RichTextLayer

统一的富文本入口：

```typescript
import { getRichTextLayer } from '@y-mindmap/richtext-editor'

const layer = getRichTextLayer({
  padding: { top: 4, right: 8, bottom: 4, left: 8 },
  themeDefaults: {
    'fo:font-family': 'PingFang SC',
    'fo:font-size': 14,
  },
})

// 测量
const size = layer.measure(attributeTitle, {
  styleContext: { nodeStyle: node.style },
})

// 显示
layer.display(container, attributeTitle, {
  styleContext: { nodeStyle: node.style },
})

// 编辑
const result = await layer.edit(container, attributeTitle)
```

### StyleResolver

样式解析器：

```typescript
import { getStyleResolver } from '@y-mindmap/richtext-editor'

const resolver = getStyleResolver({
  'fo:font-family': 'Arial',
  'fo:font-size': 14,
})

// 解析样式（合并主题、节点、显式样式）
const resolved = resolver.resolveUnit(
  { text: 'Hello', 'fo:font-weight': 'bold' },
  { nodeStyle: node.style }
)
```

### MeasureEngine

测量引擎：

```typescript
import { getMeasureEngine } from '@y-mindmap/richtext-editor'

const engine = getMeasureEngine()

// 测量文本
const size = engine.measureText('Hello', { fontSize: 14 })

// 测量 AttributeTitle
const size = engine.measureAttributeTitle(attributeTitle, {
  styleContext: { nodeStyle: node.style },
})
```

### FontManager

字体管理：

```typescript
import { getFontManager } from '@y-mindmap/richtext-editor'

const fontManager = getFontManager()

// 加载字体
await fontManager.loadFont('CustomFont', '/fonts/custom.woff2')

// 监听字体加载
fontManager.onFontLoaded((event) => {
  console.log(`${event.family} loaded`)
})

// 确保字体加载
await fontManager.ensureFontsLoaded(['CustomFont'])
```

## 编辑器集成

### 启用富文本编辑

```typescript
const editor = new MindMapEditor({
  container: document.getElementById('app')!,
  enableRichText: true,
})
```

### 编辑流程

1. 双击节点触发 `startEditing(nodeId)`
2. 如果 `enableRichText && node.isRichTitle`，使用 `RichTextInlineEditor`
3. 否则使用普通 `InlineEditor`（textarea）
4. 提交时调用 `handleRichTextUpdate(nodeId, attributeTitle)`

### 导出

XMind 和 Markdown 导出自动支持富文本：

```typescript
// XMind - 保留 attributeTitle
const blob = await editor.exportXMind()

// Markdown - 转换为 Markdown 格式
const md = await markdownExporter.export(doc)
// **加粗** *斜体* <u>下划线</u> ~~删除线~~
```

## 数据示例

```typescript
// 纯文本
{ "title": "Hello World" }

// 富文本
{
  "title": "Hello World",
  "attributeTitle": [
    { "text": "Hello ", "fo:font-weight": "bold" },
    { "text": "World", "fo:color": "#ff0000" }
  ]
}

// 含公式
{
  "title": "E=mc²",
  "attributeTitle": [
    { "text": "E=", "fo:font-family": "Arial" },
    { "text": "mc²", "formula": "mc^2" }
  ]
}

// 含链接
{
  "title": "Click here",
  "attributeTitle": [
    { "text": "Click ", "fo:font-weight": "bold" },
    { "text": "here", "href": "https://example.com" }
  ]
}
```
