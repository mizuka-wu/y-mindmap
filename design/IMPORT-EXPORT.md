# IMPORT-EXPORT.md - 导入导出设计

> 思维导图格式导入导出设计

---

## 一、导入导出架构

### 1.1 格式注册表

```typescript
// @y-mindmap/io/registry.ts

class FormatRegistry {
  private importers: Map<string, Importer> = new Map()
  private exporters: Map<string, Exporter> = new Map()
  
  /**
   * 注册导入器
   */
  registerImporter(format: string, importer: Importer): void {
    this.importers.set(format, importer)
  }
  
  /**
   * 注册导出器
   */
  registerExporter(format: string, exporter: Exporter): void {
    this.exporters.set(format, exporter)
  }
  
  /**
   * 获取导入器
   */
  getImporter(format: string): Importer | undefined {
    return this.importers.get(format)
  }
  
  /**
   * 获取导出器
   */
  getExporter(format: string): Exporter | undefined {
    return this.exporters.get(format)
  }
  
  /**
   * 获取支持的导入格式
   */
  getSupportedImportFormats(): string[] {
    return Array.from(this.importers.keys())
  }
  
  /**
   * 获取支持的导出格式
   */
  getSupportedExportFormats(): string[] {
    return Array.from(this.exporters.keys())
  }
}

interface Importer {
  /** 格式名称 */
  format: string
  
  /** 文件扩展名 */
  extensions: string[]
  
  /** MIME 类型 */
  mimeTypes: string[]
  
  /** 导入 */
  import(data: ArrayBuffer | string): Promise<MindMapNode>
}

interface Exporter {
  /** 格式名称 */
  format: string
  
  /** 文件扩展名 */
  extensions: string[]
  
  /** MIME 类型 */
  mimeType: string
  
  /** 导出 */
  export(doc: MindMapNode, options?: ExportOptions): Promise<ArrayBuffer | string>
}

interface ExportOptions {
  /** 是否包含样式 */
  includeStyles?: boolean
  
  /** 是否包含图片 */
  includeImages?: boolean
  
  /** 图片质量 */
  imageQuality?: number
  
  /** 自定义选项 */
  [key: string]: any
}
```

---

## 二、XMind 格式

### 2.1 XMind 文件结构

```
.xmind 文件 (ZIP)
├── content.json          # 主要内容
├── metadata.json         # 元数据
├── manifest.json         # 清单
├── Thumbnails/
│   └── thumbnail.png     # 缩略图
└── resources/            # 资源文件
    └── image.png
```

### 2.2 XMind 导入器

```typescript
// @y-mindmap/io/importers/xmind.ts

class XMindImporter implements Importer {
  format = 'xmind'
  extensions = ['.xmind']
  mimeTypes = ['application/x-xmind']
  
  async import(data: ArrayBuffer): Promise<MindMapNode> {
    // 1. 解压 ZIP
    const zip = await JSZip.loadAsync(data)
    
    // 2. 读取 content.json
    const contentFile = zip.file('content.json')
    if (!contentFile) {
      throw new Error('Invalid XMind file: missing content.json')
    }
    
    const content = JSON.parse(await contentFile.async('string'))
    
    // 3. 转换为内部格式
    return this.convertToInternal(content)
  }
  
  private convertToInternal(content: any[]): MindMapNode {
    // XMind content 是一个数组，第一个元素是根节点
    const sheet = content[0]
    
    return this.convertTopic(sheet.rootTopic)
  }
  
  private convertTopic(topic: any): MindMapNode {
    const children: Record<string, MindMapNode[]> = {}
    
    // 处理附着节点
    if (topic.children?.attached) {
      children.attached = topic.children.attached.map((child: any) => 
        this.convertTopic(child)
      )
    }
    
    // 处理浮动节点
    if (topic.children?.detached) {
      children.detached = topic.children.detached.map((child: any) => 
        this.convertTopic(child)
      )
    }
    
    return new MindMapNode({
      id: topic.id || generateId(),
      title: topic.title || '',
      type: this.convertTopicType(topic.class),
      style: this.convertStyle(topic.style),
      children,
      markers: this.convertMarkers(topic.markers),
      labels: topic.labels,
      notes: this.convertNotes(topic.notes),
      image: this.convertImage(topic.image),
      href: topic.href,
      position: topic.position,
      structureClass: topic.structureClass,
    })
  }
  
  private convertTopicType(type: string): TopicType {
    switch (type) {
      case 'attached': return TopicType.ATTACHED
      case 'detached': return TopicType.DETACHED
      case 'summary': return TopicType.SUMMARY
      case 'callout': return TopicType.CALLOUT
      default: return TopicType.ATTACHED
    }
  }
  
  private convertStyle(style: any): StyleData | undefined {
    if (!style) return undefined
    
    return {
      id: style.id || generateId(),
      properties: style.properties || {},
    }
  }
  
  private convertMarkers(markers: any[]): MarkerData[] {
    if (!markers) return []
    
    return markers.map(m => ({
      markerId: m.markerId,
      groupId: m.groupId,
    }))
  }
  
  private convertNotes(notes: any): NotesData | undefined {
    if (!notes) return undefined
    
    return {
      plain: notes.plain?.content,
      html: notes.html?.content,
    }
  }
  
  private convertImage(image: any): ImageData | undefined {
    if (!image) return undefined
    
    return {
      src: image.src,
      align: image.align,
      size: image.size,
    }
  }
}
```

### 2.3 XMind 导出器

```typescript
// @y-mindmap/io/exporters/xmind.ts

class XMindExporter implements Exporter {
  format = 'xmind'
  extensions = ['.xmind']
  mimeType = 'application/x-xmind'
  
  async export(doc: MindMapNode, options?: ExportOptions): Promise<ArrayBuffer> {
    const zip = new JSZip()
    
    // 1. 转换为 XMind 格式
    const content = this.convertToXMind(doc)
    
    // 2. 添加到 ZIP
    zip.file('content.json', JSON.stringify(content))
    zip.file('metadata.json', JSON.stringify(this.createMetadata()))
    zip.file('manifest.json', JSON.stringify(this.createManifest()))
    
    // 3. 添加缩略图
    const thumbnail = await this.createThumbnail(doc)
    zip.file('Thumbnails/thumbnail.png', thumbnail)
    
    // 4. 生成 ZIP
    return zip.generateAsync({ type: 'arraybuffer' })
  }
  
  private convertToXMind(doc: MindMapNode): any[] {
    return [{
      id: generateId(),
      class: 'sheet',
      title: doc.title || 'Sheet 1',
      rootTopic: this.convertTopic(doc),
    }]
  }
  
  private convertTopic(node: MindMapNode): any {
    const topic: any = {
      id: node.id,
      class: node.type,
      title: node.title,
    }
    
    // 样式
    if (node.style) {
      topic.style = node.style
    }
    
    // 子节点
    const children: any = {}
    
    if (node.children.attached?.length) {
      children.attached = node.children.attached.map(child => 
        this.convertTopic(child)
      )
    }
    
    if (node.children.detached?.length) {
      children.detached = node.children.detached.map(child => 
        this.convertTopic(child)
      )
    }
    
    if (Object.keys(children).length > 0) {
      topic.children = children
    }
    
    // 标记
    if (node.markers?.length) {
      topic.markers = node.markers
    }
    
    // 标签
    if (node.labels?.length) {
      topic.labels = node.labels
    }
    
    // 备注
    if (node.notes) {
      topic.notes = {
        plain: { content: node.notes.plain },
        html: { content: node.notes.html },
      }
    }
    
    // 图片
    if (node.image) {
      topic.image = node.image
    }
    
    // 链接
    if (node.href) {
      topic.href = node.href
    }
    
    // 位置
    if (node.position) {
      topic.position = node.position
    }
    
    // 结构
    if (node.structureClass) {
      topic.structureClass = node.structureClass
    }
    
    return topic
  }
  
  private createMetadata(): any {
    return {
      creator: {
        name: 'Y-MindMap',
        version: '1.0.0',
      },
    }
  }
  
  private createManifest(): any {
    return {
      'file-entries': {
        'content.json': {},
        'metadata.json': {},
      },
    }
  }
  
  private async createThumbnail(doc: MindMapNode): Promise<Blob> {
    // 生成缩略图
    // ...
    return new Blob()
  }
}
```

---

## 三、Markdown 格式

### 3.1 Markdown 导入器

```typescript
// @y-mindmap/io/importers/markdown.ts

class MarkdownImporter implements Importer {
  format = 'markdown'
  extensions = ['.md', '.markdown']
  mimeTypes = ['text/markdown']
  
  async import(data: string): Promise<MindMapNode> {
    const lines = data.split('\n')
    return this.parseLines(lines)
  }
  
  private parseLines(lines: string[]): MindMapNode {
    const root = new MindMapNode({
      id: generateId(),
      title: 'Root',
      type: TopicType.ROOT,
    })
    
    let currentDepth = 0
    let currentNode = root
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // 解析缩进
      const indent = line.search(/\S/)
      const depth = Math.floor(indent / 2)
      
      // 解析标题
      const title = trimmed.replace(/^[-*+]\s*/, '').replace(/^#+\s*/, '')
      
      // 创建节点
      const node = new MindMapNode({
        id: generateId(),
        title,
        type: TopicType.ATTACHED,
      })
      
      // 根据深度添加到父节点
      if (depth > currentDepth) {
        currentNode.addChild(node)
      } else if (depth === currentDepth) {
        currentNode.parent?.addChild(node)
      } else {
        // 回溯到正确的父节点
        let parent = currentNode.parent
        for (let i = 0; i < currentDepth - depth; i++) {
          parent = parent?.parent
        }
        parent?.addChild(node)
      }
      
      currentNode = node
      currentDepth = depth
    }
    
    return root
  }
}
```

### 3.2 Markdown 导出器

```typescript
// @y-mindmap/io/exporters/markdown.ts

class MarkdownExporter implements Exporter {
  format = 'markdown'
  extensions = ['.md']
  mimeType = 'text/markdown'
  
  async export(doc: MindMapNode, options?: ExportOptions): Promise<string> {
    return this.nodeToMarkdown(doc, 0)
  }
  
  private nodeToMarkdown(node: MindMapNode, depth: number): string {
    const indent = '  '.repeat(depth)
    let md = ''
    
    // 标题
    if (depth === 0) {
      md += `# ${node.title}\n\n`
    } else {
      md += `${indent}- ${node.title}\n`
    }
    
    // 备注
    if (node.notes?.plain) {
      md += `${indent}  > ${node.notes.plain}\n\n`
    }
    
    // 子节点
    const children = node.getAllChildren()
    children.forEach(child => {
      md += this.nodeToMarkdown(child, depth + 1)
    })
    
    return md
  }
}
```

---

## 四、OPML 格式

### 4.1 OPML 导入器

```typescript
// @y-mindmap/io/importers/opml.ts

class OPMLImporter implements Importer {
  format = 'opml'
  extensions = ['.opml']
  mimeTypes = ['text/x-opml']
  
  async import(data: string): Promise<MindMapNode> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'text/xml')
    
    return this.parseOPML(doc)
  }
  
  private parseOPML(doc: Document): MindMapNode {
    const body = doc.querySelector('body')
    if (!body) {
      throw new Error('Invalid OPML: missing body')
    }
    
    return this.parseOutline(body)
  }
  
  private parseOutline(element: Element): MindMapNode {
    const title = element.getAttribute('text') || ''
    const children: MindMapNode[] = []
    
    const outlines = element.querySelectorAll(':scope > outline')
    outlines.forEach(outline => {
      children.push(this.parseOutline(outline))
    })
    
    return new MindMapNode({
      id: generateId(),
      title,
      type: TopicType.ATTACHED,
      children: { attached: children },
    })
  }
}
```

### 4.2 OPML 导出器

```typescript
// @y-mindmap/io/exporters/opml.ts

class OPMLExporter implements Exporter {
  format = 'opml'
  extensions = ['.opml']
  mimeType = 'text/x-opml'
  
  async export(doc: MindMapNode, options?: ExportOptions): Promise<string> {
    let opml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    opml += '<opml version="2.0">\n'
    opml += '  <head>\n'
    opml += `    <title>${this.escapeXml(doc.title)}</title>\n`
    opml += '  </head>\n'
    opml += '  <body>\n'
    opml += this.nodeToOPML(doc, 2)
    opml += '  </body>\n'
    opml += '</opml>'
    
    return opml
  }
  
  private nodeToOPML(node: MindMapNode, depth: number): string {
    const indent = '  '.repeat(depth)
    let opml = `${indent}<outline text="${this.escapeXml(node.title)}"`
    
    const children = node.getAllChildren()
    
    if (children.length === 0) {
      opml += ' />\n'
    } else {
      opml += '>\n'
      children.forEach(child => {
        opml += this.nodeToOPML(child, depth + 1)
      })
      opml += `${indent}</outline>\n`
    }
    
    return opml
  }
  
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
```

---

## 五、图片导出

### 5.1 PNG 导出

```typescript
// @y-mindmap/io/exporters/png.ts

class PNGExporter {
  async export(
    editor: EditorView,
    options?: PNGExportOptions
  ): Promise<Blob> {
    const {
      width = 1920,
      height = 1080,
      quality = 1,
      background = '#FFFFFF',
    } = options || {}
    
    // 1. 获取画布
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')!
    
    // 2. 绘制背景
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)
    
    // 3. 渲染内容
    await this.renderToCanvas(editor, ctx, { width, height })
    
    // 4. 导出为 Blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/png',
        quality
      )
    })
  }
  
  private async renderToCanvas(
    editor: EditorView,
    ctx: CanvasRenderingContext2D,
    size: { width: number; height: number }
  ): Promise<void> {
    // 使用 html2canvas 或类似库
    // ...
  }
}
```

### 5.2 SVG 导出

```typescript
// @y-mindmap/io/exporters/svg.ts

class SVGExporter {
  async export(
    editor: EditorView,
    options?: SVGExportOptions
  ): Promise<string> {
    // 1. 获取 SVG 元素
    const svgElement = editor.getSVGElement()
    
    // 2. 克隆 SVG
    const clone = svgElement.cloneNode(true) as SVGElement
    
    // 3. 添加样式
    this.addStyles(clone)
    
    // 4. 序列化
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clone)
  }
  
  private addStyles(svg: SVGElement): void {
    // 内联样式
    // ...
  }
}
```

---

## 六、Snowbrush 导入导出参考

### 6.1 支持的格式

```typescript
// 来源: /src/formatconverter/index.ts

const supportedFormats = {
  import: [
    'xmind',
    'freemind',
    'mindmanager',
    'mindnode',
    'opml',
    'markdown',
    'lighten',
  ],
  export: [
    'xmind',
    'markdown',
    'opml',
  ],
}
```

### 6.2 XMind 导入

```typescript
// 来源: /src/formatconverter/import/xmind.ts

async function importXMind(file: File): Promise<SheetData[]> {
  const zip = await JSZip.loadAsync(file)
  const content = await zip.file('content.json')?.async('string')
  
  if (!content) {
    throw new Error('Invalid XMind file')
  }
  
  const data = JSON.parse(content)
  return data.map((sheet: any) => convertSheet(sheet))
}
```
