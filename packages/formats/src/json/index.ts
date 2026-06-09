import { MindMapNode } from '@y-mindmap/state'
import type { TopicData } from '@y-mindmap/core'
import { FormatImporter, ExportOptions } from '../index'

export class JSONImporter implements FormatImporter<string> {
  readonly name = 'json'
  readonly extensions = ['.json']
  readonly mimeTypes = ['application/json']

  canHandle(file: File): boolean {
    return file.name.endsWith('.json') || this.mimeTypes.includes(file.type)
  }

  async import(data: string): Promise<MindMapNode> {
    const parsed = JSON.parse(data)

    // Handle document wrapper format: { rootTopic: TopicData }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'rootTopic' in parsed) {
      return MindMapNode.fromJSON(parsed.rootTopic as TopicData)
    }

    return MindMapNode.fromJSON(parsed as TopicData)
  }
}

export class JSONExporter {
  readonly name = 'json'
  readonly extensions = ['.json']
  readonly mimeType = 'application/json'

  async export(doc: MindMapNode, options?: ExportOptions): Promise<string> {
    const spaces = options?.spaces ?? 2
    const data = doc.toJSON()
    return JSON.stringify(data, null, spaces)
  }
}
