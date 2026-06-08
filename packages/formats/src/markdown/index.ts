import { MindMapNode } from '@y-mindmap/state'
import { TopicType, AttributeTitle, isRichAttributeTitle, getPlainTextFromAttributeTitle } from '@y-mindmap/core'
import { FormatImporter, ExportOptions } from '../index'

export class MarkdownImporter implements FormatImporter<string> {
  readonly name = 'markdown'
  readonly extensions = ['.md', '.markdown']
  readonly mimeTypes = ['text/markdown', 'text/x-markdown']

  canHandle(file: File): boolean {
    return file.name.endsWith('.md') || 
           file.name.endsWith('.markdown') ||
           this.mimeTypes.includes(file.type)
  }

  async import(data: string): Promise<MindMapNode> {
    const lines = data.split('\n').filter(line => line.trim().length > 0)
    
    if (lines.length === 0) {
      return this.createEmptyRoot()
    }

    return this.parseLines(lines)
  }

  private parseLines(lines: string[]): MindMapNode {
    const root = new MindMapNode({
      id: this.generateId(),
      title: 'Root',
      type: TopicType.ROOT,
    })

    const stack: { node: MindMapNode; indent: number }[] = [{ node: root, indent: -1 }]

    for (const line of lines) {
      const { indent, title } = this.parseLine(line)
      
      const node = new MindMapNode({
        id: this.generateId(),
        title,
        type: TopicType.ATTACHED,
      })

      while (stack.length > 1 && (stack[stack.length - 1]?.indent ?? 0) >= indent) {
        stack.pop()
      }

      const parent = stack[stack.length - 1]
      if (parent) {
        const updatedParent = parent.node.addChild(node)
        stack[stack.length - 1] = { node: updatedParent, indent: parent.indent }
        stack.push({ node, indent })
      }
    }

    const first = stack[0]
    return first ? first.node : this.createEmptyRoot()
  }

  private parseLine(line: string): { indent: number; title: string } {
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/)
    if (match) {
      return { indent: match[1]?.length ?? 0, title: (match[3] ?? '').trim() }
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      return { indent: 0, title: (headingMatch[2] ?? '').trim() }
    }

    return { indent: 0, title: line.trim() }
  }

  private createEmptyRoot(): MindMapNode {
    return new MindMapNode({
      id: this.generateId(),
      title: 'Central Topic',
      type: TopicType.ROOT,
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }
}

export class MarkdownExporter {
  readonly name = 'markdown'
  readonly extensions = ['.md']
  readonly mimeType = 'text/markdown'

  async export(doc: MindMapNode, options?: ExportOptions): Promise<string> {
    const lines: string[] = []
    this.exportNode(doc, 0, lines)
    return lines.join('\n')
  }

  private exportNode(node: MindMapNode, depth: number, lines: string[]): void {
    const title = this.getDisplayTitle(node)

    if (depth === 0) {
      lines.push(`# ${title}`)
      lines.push('')
    } else {
      const indent = '  '.repeat(depth - 1)
      lines.push(`${indent}- ${title}`)
    }

    if (node.notes?.plain) {
      const indent = '  '.repeat(depth)
      lines.push(`${indent}> ${node.notes.plain}`)
      lines.push('')
    }

    const children = node.getAllChildren()
    for (const child of children) {
      this.exportNode(child, depth + 1, lines)
    }
  }

  private getDisplayTitle(node: MindMapNode): string {
    if (node.isRichTitle && node.attributeTitle) {
      return this.attributeTitleToMarkdown(node.attributeTitle)
    }
    return node.title
  }

  private attributeTitleToMarkdown(attributeTitle: AttributeTitle): string {
    return attributeTitle.map(unit => {
      let text = unit.text

      if (unit.formula) {
        return `$${unit.formula}$`
      }

      if (unit.href) {
        return `[${text}](${unit.href})`
      }

      const hasBold = unit['fo:font-weight'] === 'bold' || unit['fo:font-weight'] === '700'
      const hasItalic = unit['fo:font-style'] === 'italic'
      const hasUnderline = unit['fo:text-decoration']?.includes('underline')
      const hasStrikethrough = unit['fo:text-decoration']?.includes('line-through')

      if (hasBold) text = `**${text}**`
      if (hasItalic) text = `*${text}*`
      if (hasUnderline) text = `<u>${text}</u>`
      if (hasStrikethrough) text = `~~${text}~~`

      return text
    }).join('')
  }
}
