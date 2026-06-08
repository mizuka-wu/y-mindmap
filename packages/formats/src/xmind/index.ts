import JSZip from 'jszip'
import { MindMapNode } from '@y-mindmap/state'
import { StyleData, TopicData, StructureType, TopicType } from '@y-mindmap/core'
import { FormatImporter, ExportOptions } from '../index'

export interface XMindParseResult {
  doc: MindMapNode
  relationships: any[]
  metadata: Record<string, any>
}

export class XMindImporter implements FormatImporter<ArrayBuffer> {
  readonly name = 'xmind'
  readonly extensions = ['.xmind']
  readonly mimeTypes = ['application/x-xmind', 'application/octet-stream']

  canHandle(file: File): boolean {
    return file.name.endsWith('.xmind') || 
           this.mimeTypes.includes(file.type) ||
           file.type === ''
  }

  async import(data: ArrayBuffer): Promise<MindMapNode> {
    const zip = await JSZip.loadAsync(data)
    const contentFile = zip.file('content.json')
    
    if (!contentFile) {
      throw new Error('Invalid XMind file: missing content.json')
    }

    const contentStr = await contentFile.async('string')
    const content = JSON.parse(contentStr)
    const sheet = content[0]

    if (!sheet || !sheet.rootTopic) {
      throw new Error('Invalid XMind file: no root topic found')
    }

    return this.convertTopic(sheet.rootTopic)
  }

  private convertTopic(data: any): MindMapNode {
    const children: Record<string, TopicData[]> = {}

    if (data.children) {
      for (const [type, childList] of Object.entries(data.children)) {
        const normalizedType = this.normalizeTopicType(type)
        children[normalizedType] = (childList as any[]).map(child => this.convertTopic(child).toJSON())
      }
    }

    return new MindMapNode({
      id: data.id || this.generateId(),
      title: data.title || '',
      attributeTitle: data.attributeTitle,
      type: this.normalizeTopicType(data.class),
      style: this.convertStyle(data.style),
      children,
      markers: this.convertMarkers(data.markers),
      labels: data.labels || [],
      notes: this.convertNotes(data.notes),
      image: this.convertImage(data.image),
      href: data.href,
      position: data.position,
      structureClass: data.structureClass ? this.normalizeStructureClass(data.structureClass) : undefined,
      branch: data.branch,
      extensions: data.extensions,
    })
  }

  private convertStyle(style: any): StyleData | undefined {
    if (!style) return undefined
    const properties: Record<string, any> = {}
    if (style.properties) {
      for (const [key, value] of Object.entries(style.properties)) {
        properties[this.normalizeStyleKey(key)] = value
      }
    }
    return { id: style.id || this.generateId(), properties }
  }

  private convertMarkers(markers: any[]): any[] {
    if (!markers) return []
    return markers.map(m => ({ markerId: m.markerId, groupId: m.groupId }))
  }

  private convertNotes(notes: any): any {
    if (!notes) return undefined
    return { plain: notes.plain?.content, html: notes.html?.content }
  }

  private convertImage(image: any): any {
    if (!image) return undefined
    return { src: image.src, align: image.align, size: image.size }
  }

  private normalizeTopicType(type: string | undefined): TopicType {
    if (!type) return TopicType.ATTACHED
    const map: Record<string, TopicType> = {
      'attached': TopicType.ATTACHED,
      'detached': TopicType.DETACHED,
      'summary': TopicType.SUMMARY,
      'callout': TopicType.CALLOUT,
      'root': TopicType.ROOT,
    }
    return map[type.toLowerCase()] || TopicType.ATTACHED
  }

  private normalizeStructureClass(structure: string): StructureType | undefined {
    const map: Record<string, StructureType> = {
      'org.xmind.ui.map': StructureType.MAP,
      'org.xmind.ui.logic.right': StructureType.LOGIC_RIGHT,
      'org.xmind.ui.logic.left': StructureType.LOGIC_LEFT,
      'org.xmind.ui.tree.right': StructureType.TREE_RIGHT,
      'org.xmind.ui.tree.left': StructureType.TREE_LEFT,
      'org.xmind.ui.org-chart.down': StructureType.ORG_CHART_DOWN,
      'org.xmind.ui.org-chart.up': StructureType.ORG_CHART_UP,
      'org.xmind.ui.fishbone.leftHeaded': StructureType.FISHBONE_LEFT,
      'org.xmind.ui.fishbone.rightHeaded': StructureType.FISHBONE_RIGHT,
      'org.xmind.ui.timeline.horizontal': StructureType.TIMELINE_HORIZONTAL,
      'org.xmind.ui.timeline.vertical': StructureType.TIMELINE_VERTICAL,
      'org.xmind.ui.spreadsheet': StructureType.SPREADSHEET,
      'org.xmind.ui.brace.left': StructureType.BRACE_LEFT,
      'org.xmind.ui.brace.right': StructureType.BRACE_RIGHT,
      'org.xmind.ui.treetable': StructureType.TREE_TABLE,
    }
    return map[structure]
  }

  private normalizeStyleKey(key: string): string {
    const map: Record<string, string> = {
      'svg:fill': 'fill-color',
      'fo:color': 'text-color',
      'fo:font-size': 'font-size',
      'fo:font-family': 'font-family',
      'fo:font-weight': 'font-weight',
      'svg:stroke': 'border-color',
      'svg:stroke-width': 'border-width',
      'line-color': 'line-color',
      'line-width': 'line-width',
      'shape-class': 'shape-class',
      'border-line-color': 'border-color',
      'border-line-width': 'border-width',
    }
    return map[key] || key
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

export class XMindExporter {
  readonly name = 'xmind'
  readonly extensions = ['.xmind']
  readonly mimeType = 'application/x-xmind'

  async export(doc: MindMapNode): Promise<Blob> {
    const zip = new JSZip()
    const content = this.convertToXMind(doc)
    
    zip.file('content.json', JSON.stringify(content))
    zip.file('metadata.json', JSON.stringify(this.createMetadata()))
    zip.file('manifest.json', JSON.stringify(this.createManifest()))
    
    return zip.generateAsync({ type: 'blob' })
  }

  private convertToXMind(doc: MindMapNode): any[] {
    return [{
      id: this.generateId(),
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

    if (node.isRichTitle && node.attributeTitle) {
      topic.attributeTitle = node.attributeTitle
    }

    if (node.style) {
      topic.style = node.style
    }

    const children: any = {}
    for (const [type, childNodes] of Object.entries(node.children)) {
      if (childNodes.length > 0) {
        children[type] = childNodes.map(child => this.convertTopic(child))
      }
    }
    if (Object.keys(children).length > 0) {
      topic.children = children
    }

    if (node.markers?.length) topic.markers = node.markers
    if (node.labels?.length) topic.labels = node.labels
    if (node.notes) topic.notes = { plain: { content: node.notes.plain }, html: { content: node.notes.html } }
    if (node.image) topic.image = node.image
    if (node.href) topic.href = node.href
    if (node.position) topic.position = node.position
    if (node.structureClass) topic.structureClass = node.structureClass

    return topic
  }

  private createMetadata(): any {
    return { creator: { name: 'Y-MindMap', version: '1.0.0' } }
  }

  private createManifest(): any {
    return { 'file-entries': { 'content.json': {}, 'metadata.json': {} } }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}
