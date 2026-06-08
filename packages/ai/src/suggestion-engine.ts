import { EditorState, MindMapNode } from '@y-mindmap/state'
import { TopicType } from '@y-mindmap/core'
import { Locale, LocaleMessages, getLocale, detectLocale } from './i18n'

export interface Suggestion {
  action: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category: 'structure' | 'content' | 'organization' | 'style'
  params?: Record<string, any>
}

export class SuggestionEngine {
  private state: EditorState
  private messages: LocaleMessages

  constructor(state: EditorState, locale?: Locale) {
    this.state = state
    this.messages = getLocale(locale || detectLocale())
  }

  getSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = []

    suggestions.push(...this.getStructureSuggestions())
    suggestions.push(...this.getContentSuggestions())
    suggestions.push(...this.getOrganizationSuggestions())
    suggestions.push(...this.getSelectionSuggestions())

    return this.prioritizeSuggestions(suggestions)
  }

  private getStructureSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = []
    const root = this.state.doc.root
    const m = this.messages.suggestionEngine

    if (root.attachedChildren.length === 0) {
      suggestions.push({
        action: 'addSubTopic',
        reason: m.reasons.noChildren,
        priority: 'high',
        category: 'structure',
      })
    }

    if (root.attachedChildren.length === 1) {
      suggestions.push({
        action: 'addSubTopic',
        reason: m.reasons.singleBranch,
        priority: 'medium',
        category: 'structure',
      })
    }

    root.descendants((node) => {
      if (node.type === TopicType.ATTACHED && node.attachedChildren.length === 0 && node.title.length > 20) {
        suggestions.push({
          action: 'addSubTopic',
          reason: m.reasons.longContentNoChildren(this.truncate(node.title, 10)),
          priority: 'medium',
          category: 'structure',
          params: { parentId: node.id },
        })
      }
    })

    return suggestions
  }

  private getContentSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = []
    const m = this.messages.suggestionEngine

    this.state.doc.root.descendants((node) => {
      if (node.title.trim() === '' && node.type !== TopicType.ROOT) {
        suggestions.push({
          action: 'updateTitle',
          reason: m.reasons.emptyNode,
          priority: 'high',
          category: 'content',
          params: { nodeId: node.id },
        })
      }

      if (node.type === TopicType.ROOT && !node.notes?.plain) {
        suggestions.push({
          action: 'addNotes',
          reason: m.reasons.noNotesOnRoot,
          priority: 'low',
          category: 'content',
          params: { nodeId: node.id },
        })
      }
    })

    return suggestions
  }

  private getOrganizationSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = []
    const root = this.state.doc.root
    const m = this.messages.suggestionEngine

    let nodesWithMarkers = 0
    let nodesWithLabels = 0
    let totalNodes = 0

    root.descendants((node) => {
      totalNodes++
      if (node.markers.length > 0) nodesWithMarkers++
      if (node.labels.length > 0) nodesWithLabels++
    })

    if (totalNodes > 5 && nodesWithMarkers === 0) {
      suggestions.push({
        action: 'addMarker',
        reason: m.reasons.noMarkers,
        priority: 'low',
        category: 'organization',
      })
    }

    if (totalNodes > 10 && nodesWithLabels === 0) {
      suggestions.push({
        action: 'addLabel',
        reason: m.reasons.noLabels,
        priority: 'low',
        category: 'organization',
      })
    }

    const deepNodes: MindMapNode[] = []
    root.descendants((node) => {
      const depth = this.getNodeDepth(node.id)
      if (depth > 4) {
        deepNodes.push(node)
      }
    })

    if (deepNodes.length > 0) {
      suggestions.push({
        action: 'restructure',
        reason: m.reasons.deepNodes(deepNodes.length),
        priority: 'medium',
        category: 'organization',
      })
    }

    return suggestions
  }

  private getSelectionSuggestions(): Suggestion[] {
    const suggestions: Suggestion[] = []
    const selectedIds = this.state.selection.all
    const m = this.messages.suggestionEngine

    if (selectedIds.length === 0) return suggestions

    if (selectedIds.length === 1) {
      const node = this.state.doc.getNodeById(selectedIds[0])
      if (node) {
        if (node.attachedChildren.length > 0 && !node.isFolded) {
          suggestions.push({
            action: 'toggleFold',
            reason: m.reasons.foldNode,
            priority: 'low',
            category: 'structure',
            params: { nodeId: node.id },
          })
        }

        if (node.type === TopicType.ATTACHED) {
          suggestions.push({
            action: 'addSiblingTopic',
            reason: m.reasons.addSibling,
            priority: 'medium',
            category: 'structure',
            params: { nodeId: node.id },
          })
        }
      }
    }

    if (selectedIds.length > 1) {
      suggestions.push({
        action: 'groupSelection',
        reason: m.reasons.groupSelection,
        priority: 'medium',
        category: 'structure',
      })
    }

    return suggestions
  }

  private prioritizeSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const categoryOrder = { structure: 0, content: 1, organization: 2, style: 3 }

    return suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return categoryOrder[a.category] - categoryOrder[b.category]
    })
  }

  private getNodeDepth(nodeId: string): number {
    let depth = 0
    let current = this.findParent(nodeId)

    while (current) {
      depth++
      current = this.findParent(current.id)
    }

    return depth
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

  private truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength) + '...'
  }
}
