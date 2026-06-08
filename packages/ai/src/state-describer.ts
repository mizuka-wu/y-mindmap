import { EditorState, MindMapNode } from '@y-mindmap/state'
import { TopicType, StructureType } from '@y-mindmap/core'
import { Locale, LocaleMessages, getLocale, detectLocale } from './i18n'

export class StateDescriber {
  private state: EditorState
  private messages: LocaleMessages

  constructor(state: EditorState, locale?: Locale) {
    this.state = state
    this.messages = getLocale(locale || detectLocale())
  }

  describe(): string {
    const doc = this.state.doc
    const root = doc.root
    const selection = this.state.selection.all

    const parts: string[] = []

    parts.push(this.describeRoot(root))
    parts.push(this.describeStructure(root))
    parts.push(this.describeStatistics(root))

    if (selection.length > 0) {
      parts.push(this.describeSelection(selection))
    }

    return parts.filter(Boolean).join('\n\n')
  }

  describeNode(nodeId: string): string {
    const node = this.state.doc.getNodeById(nodeId)
    if (!node) return this.messages.stateDescriber.nodeNotFound(nodeId)

    const parts: string[] = []
    const m = this.messages.stateDescriber

    parts.push(m.nodeDescription(node.title))
    parts.push(m.nodeType(this.getNodeTypeName(node.type)))
    parts.push(m.nodePosition(this.getNodePosition(node)))

    const children = node.attachedChildren
    if (children.length > 0) {
      parts.push(m.childNodes(children.length, children.map(c => c.title).join(', ')))
    }

    if (node.markers.length > 0) {
      parts.push(m.markers(node.markers.map(marker => marker.markerId).join(', ')))
    }

    if (node.labels.length > 0) {
      parts.push(m.labels(node.labels.join(', ')))
    }

    if (node.notes?.plain) {
      const notes = node.notes.plain
      const truncated = notes.length > 100 ? notes.substring(0, 100) + '...' : notes
      parts.push(m.notes(truncated))
    }

    return parts.join('\n')
  }

  private describeRoot(root: MindMapNode): string {
    return this.messages.stateDescriber.rootTitle(root.title)
  }

  private describeStructure(root: MindMapNode): string {
    const branches = root.attachedChildren
    const structureType = root.structureClass
    const m = this.messages.stateDescriber

    const parts: string[] = []

    if (structureType) {
      parts.push(m.layout(this.getStructureTypeName(structureType)))
    }

    if (branches.length > 0) {
      parts.push(m.mainBranches(branches.length, branches.map(b => b.title).join(', ')))
    }

    return parts.join('\n')
  }

  private describeStatistics(root: MindMapNode): string {
    let totalNodes = 0
    let maxDepth = 0
    let leafCount = 0

    const traverse = (node: MindMapNode, depth: number) => {
      totalNodes++
      maxDepth = Math.max(maxDepth, depth)

      const children = node.attachedChildren
      if (children.length === 0) {
        leafCount++
      } else {
        for (const child of children) {
          traverse(child, depth + 1)
        }
      }
    }

    traverse(root, 0)

    return this.messages.stateDescriber.statistics(totalNodes, maxDepth, leafCount)
  }

  private describeSelection(selection: string[]): string {
    const m = this.messages.stateDescriber

    if (selection.length === 1) {
      const node = this.state.doc.getNodeById(selection[0])
      return m.selectedOne(node?.title || selection[0])
    }

    const titles = selection
      .map(id => this.state.doc.getNodeById(id)?.title)
      .filter(Boolean)

    return m.selectedMultiple(selection.length, titles.join(', '))
  }

  private getNodeTypeName(type: TopicType): string {
    const m = this.messages.stateDescriber.types
    switch (type) {
      case TopicType.ROOT: return m.root
      case TopicType.ATTACHED: return m.attached
      case TopicType.DETACHED: return m.detached
      case TopicType.SUMMARY: return m.summary
      case TopicType.CALLOUT: return m.callout
      default: return m.unknown
    }
  }

  private getStructureTypeName(type: StructureType): string {
    return this.messages.stateDescriber.structures[type] || type
  }

  private getNodePosition(node: MindMapNode): string {
    const parent = this.findParent(node.id)
    if (!parent) return this.messages.stateDescriber.types.root

    const index = parent.attachedChildren.findIndex(c => c.id === node.id)
    return `${parent.title} #${index + 1}`
  }

  private findParent(nodeId: string): MindMapNode | null {
    let result: MindMapNode | null = null

    this.state.doc.root.descendants((node) => {
      for (const children of Object.values(node.children)) {
        if (children.some(c => c.id === nodeId)) {
          result = node
          return false
        }
      }
      return true
    })

    return result
  }
}
