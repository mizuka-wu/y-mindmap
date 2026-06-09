# SERIALIZATION.md - 序列化设计

> 思维导图数据序列化/反序列化设计

---

## 一、序列化架构

### 1.1 序列化接口

```typescript
// @y-mindmap/serialization/serializer.ts

interface Serializer<T> {
  /** 序列化 */
  serialize(data: T): string | Uint8Array
  
  /** 反序列化 */
  deserialize(raw: string | Uint8Array): T
}

interface JsonSerializer<T> extends Serializer<T> {
  serialize(data: T): string
  deserialize(json: string): T
}

interface BinarySerializer<T> extends Serializer<T> {
  serialize(data: T): Uint8Array
  deserialize(bytes: Uint8Array): T
}
```

---

## 二、JSON 序列化

### 2.1 Node 序列化

```typescript
// @y-mindmap/serialization/json/node.ts

class NodeSerializer implements JsonSerializer<MindMapNode> {
  /**
   * 序列化节点
   */
  serialize(node: MindMapNode): string {
    const data = this.nodeToPlain(node)
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * 反序列化节点
   */
  deserialize(json: string): MindMapNode {
    const data = JSON.parse(json)
    return this.plainToNode(data)
  }
  
  /**
   * 节点转普通对象
   */
  private nodeToPlain(node: MindMapNode): any {
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      style: node.style,
      children: this.childrenToPlain(node),
      markers: node.markers,
      labels: node.labels,
      notes: node.notes,
      image: node.image,
      href: node.href,
      extensions: node.extensions,
      position: node.position,
      structureClass: node.structureClass,
      branch: node.branch,
    }
  }
  
  /**
   * 子节点序列化
   */
  private childrenToPlain(node: MindMapNode): Record<string, any[]> {
    const result: Record<string, any[]> = {}
    
    Object.entries(node.children).forEach(([type, children]) => {
      result[type] = children.map(child => this.nodeToPlain(child))
    })
    
    return result
  }
  
  /**
   * 普通对象转节点
   */
  private plainToNode(data: any): MindMapNode {
    const children = this.plainToChildren(data.children || {})
    
    return new MindMapNode({
      id: data.id,
      title: data.title,
      type: data.type,
      style: data.style,
      children,
      markers: data.markers,
      labels: data.labels,
      notes: data.notes,
      image: data.image,
      href: data.href,
      extensions: data.extensions,
      position: data.position,
      structureClass: data.structureClass,
      branch: data.branch,
    })
  }
  
  /**
   * 子节点反序列化
   */
  private plainToChildren(data: Record<string, any[]>): Record<string, MindMapNode[]> {
    const result: Record<string, MindMapNode[]> = {}
    
    Object.entries(data).forEach(([type, children]) => {
      result[type] = children.map(child => this.plainToNode(child))
    })
    
    return result
  }
}
```

### 2.2 Fragment 序列化

```typescript
// @y-mindmap/serialization/json/fragment.ts

class FragmentSerializer implements JsonSerializer<Fragment> {
  private nodeSerializer: NodeSerializer
  
  constructor() {
    this.nodeSerializer = new NodeSerializer()
  }
  
  serialize(fragment: Fragment): string {
    const data = fragment.content.map(node => 
      this.nodeSerializer['nodeToPlain'](node)
    )
    return JSON.stringify(data)
  }
  
  deserialize(json: string): Fragment {
    const data = JSON.parse(json)
    const nodes = data.map((item: any) => 
      this.nodeSerializer['plainToNode'](item)
    )
    return Fragment.from(nodes)
  }
}
```

### 2.3 Selection 序列化

```typescript
// @y-mindmap/serialization/json/selection.ts

class SelectionSerializer implements JsonSerializer<Selection> {
  serialize(selection: Selection): string {
    const data = {
      type: selection.type,
      selectedIds: Array.from(selection.selectedIds),
      anchorId: selection.anchorId,
      focusId: selection.focusId,
    }
    return JSON.stringify(data)
  }
  
  deserialize(json: string): Selection {
    const data = JSON.parse(json)
    
    return new Selection({
      type: data.type,
      selectedIds: new Set(data.selectedIds),
      anchorId: data.anchorId,
      focusId: data.focusId,
    })
  }
}
```

---

## 三、二进制序列化

### 3.1 Protocol Buffers

```typescript
// @y-mindmap/serialization/protobuf/serializer.ts

class ProtobufSerializer implements BinarySerializer<MindMapNode> {
  private schema: protobuf.Type
  
  constructor() {
    // 加载 .proto 定义
    this.schema = protobuf.load('mindmap.proto').lookupType('MindMapNode')
  }
  
  serialize(node: MindMapNode): Uint8Array {
    const message = this.schema.create(this.nodeToMessage(node))
    return this.schema.encode(message).finish()
  }
  
  deserialize(bytes: Uint8Array): MindMapNode {
    const message = this.schema.decode(bytes)
    return this.messageToNode(this.schema.toObject(message))
  }
  
  private nodeToMessage(node: MindMapNode): any {
    // 转换为 protobuf 消息格式
    return {
      id: node.id,
      title: node.title,
      type: node.type,
      // ...
    }
  }
  
  private messageToNode(message: any): MindMapNode {
    // 从 protobuf 消息转换
    return new MindMapNode({
      id: message.id,
      title: message.title,
      type: message.type,
      // ...
    })
  }
}
```

### 3.2 MessagePack

```typescript
// @y-mindmap/serialization/msgpack/serializer.ts

import { encode, decode } from '@msgpack/msgpack'

class MsgPackSerializer implements BinarySerializer<MindMapNode> {
  private jsonSerializer: NodeSerializer
  
  constructor() {
    this.jsonSerializer = new NodeSerializer()
  }
  
  serialize(node: MindMapNode): Uint8Array {
    const data = this.jsonSerializer['nodeToPlain'](node)
    return encode(data) as Uint8Array
  }
  
  deserialize(bytes: Uint8Array): MindMapNode {
    const data = decode(bytes) as any
    return this.jsonSerializer['plainToNode'](data)
  }
}
```

---

## 四、剪贴板序列化

### 4.1 HTML 格式

```typescript
// @y-mindmap/serialization/clipboard/html.ts

class HtmlClipboardSerializer {
  /**
   * 序列化为 HTML
   */
  serialize(node: MindMapNode): string {
    return this.nodeToHtml(node)
  }
  
  /**
   * 从 HTML 反序列化
   */
  deserialize(html: string): MindMapNode | null {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    return this.htmlToNode(doc.body)
  }
  
  private nodeToHtml(node: MindMapNode, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    let html = `${indent}<div data-node-id="${node.id}" data-type="${node.type}">\n`
    html += `${indent}  <h${Math.min(depth + 1, 6)}>${this.escapeHtml(node.title)}</h${Math.min(depth + 1, 6)}>\n`
    
    // 子节点
    const children = node.getAllChildren()
    if (children.length > 0) {
      html += `${indent}  <ul>\n`
      children.forEach(child => {
        html += `${indent}    <li>\n`
        html += this.nodeToHtml(child, depth + 2)
        html += `${indent}    </li>\n`
      })
      html += `${indent}  </ul>\n`
    }
    
    html += `${indent}</div>\n`
    return html
  }
  
  private htmlToNode(element: HTMLElement): MindMapNode | null {
    const nodeId = element.dataset.nodeId
    const nodeType = element.dataset.type
    
    if (!nodeId || !nodeType) return null
    
    // 获取标题
    const titleElement = element.querySelector('h1, h2, h3, h4, h5, h6')
    const title = titleElement?.textContent || ''
    
    // 获取子节点
    const children: MindMapNode[] = []
    const listItems = element.querySelectorAll(':scope > ul > li')
    listItems.forEach(item => {
      const childDiv = item.querySelector(':scope > div')
      if (childDiv) {
        const child = this.htmlToNode(childDiv as HTMLElement)
        if (child) children.push(child)
      }
    })
    
    return new MindMapNode({
      id: nodeId,
      title,
      type: nodeType as TopicType,
      children: { attached: children },
    })
  }
  
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
```

### 4.2 纯文本格式

```typescript
// @y-mindmap/serialization/clipboard/text.ts

class TextClipboardSerializer {
  /**
   * 序列化为纯文本 (缩进表示层级)
   */
  serialize(node: MindMapNode): string {
    return this.nodeToText(node, 0)
  }
  
  /**
   * 从纯文本反序列化
   */
  deserialize(text: string): MindMapNode | null {
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) return null
    
    return this.linesToNode(lines, 0)?.node || null
  }
  
  private nodeToText(node: MindMapNode, depth: number): string {
    const indent = '  '.repeat(depth)
    let text = `${indent}${node.title}\n`
    
    const children = node.getAllChildren()
    children.forEach(child => {
      text += this.nodeToText(child, depth + 1)
    })
    
    return text
  }
  
  private linesToNode(
    lines: string[],
    startIndex: number
  ): { node: MindMapNode; nextIndex: number } | null {
    if (startIndex >= lines.length) return null
    
    const line = lines[startIndex]
    const indent = line.search(/\S/)
    const title = line.trim()
    
    const children: MindMapNode[] = []
    let currentIndex = startIndex + 1
    
    while (currentIndex < lines.length) {
      const nextLine = lines[currentIndex]
      const nextIndent = nextLine.search(/\S/)
      
      if (nextIndent <= indent) break
      
      const childResult = this.linesToNode(lines, currentIndex)
      if (childResult) {
        children.push(childResult.node)
        currentIndex = childResult.nextIndex
      } else {
        break
      }
    }
    
    const node = new MindMapNode({
      id: generateId(),
      title,
      type: TopicType.ATTACHED,
      children: { attached: children },
    })
    
    return { node, nextIndex: currentIndex }
  }
}
```

---

## 五、版本兼容

### 5.1 版本管理

```typescript
// @y-mindmap/serialization/version.ts

class SerializationVersion {
  private static CURRENT_VERSION = '1.0.0'
  
  /**
   * 获取当前版本
   */
  static getCurrentVersion(): string {
    return this.CURRENT_VERSION
  }
  
  /**
   * 检查是否兼容
   */
  static isCompatible(dataVersion: string): boolean {
    const current = this.parseVersion(this.CURRENT_VERSION)
    const data = this.parseVersion(dataVersion)
    
    // 主版本号必须相同
    return current.major === data.major
  }
  
  /**
   * 解析版本号
   */
  private static parseVersion(version: string): Version {
    const [major, minor, patch] = version.split('.').map(Number)
    return { major, minor, patch }
  }
}

interface Version {
  major: number
  minor: number
  patch: number
}
```

### 5.2 数据迁移

```typescript
// @y-mindmap/serialization/migration.ts

class SerializationMigrator {
  private migrations: Migration[] = [
    { from: '0.9.0', to: '1.0.0', migrate: this.migrate_0_9_to_1_0 },
    // 更多迁移...
  ]
  
  /**
   * 执行迁移
   */
  migrate(data: any, fromVersion: string): any {
    let current = { ...data }
    let version = fromVersion
    
    for (const migration of this.migrations) {
      if (this.shouldApply(version, migration)) {
        current = migration.migrate(current)
        version = migration.to
      }
    }
    
    return current
  }
  
  private shouldApply(currentVersion: string, migration: Migration): boolean {
    return currentVersion >= migration.from && currentVersion < migration.to
  }
  
  private migrate_0_9_to_1_0(data: any): any {
    // 迁移逻辑
    return data
  }
}

interface Migration {
  from: string
  to: string
  migrate: (data: any) => any
}
```

---

## 六、Snowbrush 序列化参考

### 6.1 toJSON 实现

```typescript
// 来源: /src/models/base.ts

class BaseModel extends Backbone.Model {
  toJSON(): any {
    return JSON.parse(JSON.stringify(this.attributes))
  }
}
```

### 6.2 复制粘贴序列化

```typescript
// 来源: /src/modules/copypaste/copytopicprocessor.ts

class CopyTopicProcessor {
  generateData(): { topic: any[]; relationship: any[]; boundary: any[]; summary: any[] } {
    // 序列化选中的节点
    const topic = this.selections.map(branch => branch.model.toJSON())
    
    // 序列化相关的关系线
    const relationship = this.collectRelationships()
    
    // 序列化相关的边界
    const boundary = this.collectBoundaries()
    
    // 序列化相关的摘要
    const summary = this.collectSummaries()
    
    return { topic, relationship, boundary, summary }
  }
}
```
