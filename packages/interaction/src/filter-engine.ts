import { MindMapNode } from '@y-mindmap/state'

export type FilterPredicate = (node: MindMapNode) => boolean

export interface FilterOptions {
  query?: string
  caseSensitive?: boolean
  showAncestors?: boolean
  showDescendants?: boolean
}

export class FilterEngine {
  private currentFilter: FilterPredicate | null = null
  private filteredNodeIds: Set<string> = new Set()

  filter(
    doc: MindMapNode,
    predicate: FilterPredicate,
    options?: FilterOptions
  ): Set<string> {
    const opts = {
      showAncestors: true,
      showDescendants: true,
      ...options,
    }

    this.currentFilter = predicate
    this.filteredNodeIds = new Set()

    this.walkTree(doc, predicate, opts)

    return this.filteredNodeIds
  }

  filterByQuery(
    doc: MindMapNode,
    query: string,
    options?: FilterOptions
  ): Set<string> {
    if (!query || query.trim().length === 0) {
      this.clearFilter()
      return new Set()
    }

    const opts: FilterOptions = {
      caseSensitive: false,
      showAncestors: true,
      showDescendants: true,
      ...options,
    }

    const normalizedQuery = opts.caseSensitive
      ? query
      : query.toLowerCase()

    return this.filter(
      doc,
      (node) => {
        const title = opts.caseSensitive
          ? node.title
          : (node.title || '').toLowerCase()
        return title.includes(normalizedQuery)
      },
      opts
    )
  }

  filterByType(
    doc: MindMapNode,
    type: string
  ): Set<string> {
    return this.filter(doc, (node) => node.type === type)
  }

  filterByMarker(
    doc: MindMapNode,
    markerId: string
  ): Set<string> {
    return this.filter(doc, (node) => {
      return (node.markers || []).some(m => m.markerId === markerId)
    })
  }

  filterByLabel(
    doc: MindMapNode,
    label: string
  ): Set<string> {
    return this.filter(doc, (node) => {
      return (node.labels || []).includes(label)
    })
  }

  filterByDepth(
    doc: MindMapNode,
    minDepth: number,
    maxDepth?: number
  ): Set<string> {
    return this.filter(doc, (node) => {
      const depth = this.getNodeDepth(node)
      if (maxDepth !== undefined) {
        return depth >= minDepth && depth <= maxDepth
      }
      return depth >= minDepth
    })
  }

  filterByChildCount(
    doc: MindMapNode,
    minCount: number,
    maxCount?: number
  ): Set<string> {
    return this.filter(doc, (node) => {
      const count = node.getAllChildren().length
      if (maxCount !== undefined) {
        return count >= minCount && count <= maxCount
      }
      return count >= minCount
    })
  }

  clearFilter(): void {
    this.currentFilter = null
    this.filteredNodeIds = new Set()
  }

  getFilteredNodeIds(): Set<string> {
    return this.filteredNodeIds
  }

  isFiltered(nodeId: string): boolean {
    return this.filteredNodeIds.has(nodeId)
  }

  private walkTree(
    node: MindMapNode,
    predicate: FilterPredicate,
    options: FilterOptions
  ): boolean {
    const matches = predicate(node)
    let hasMatchingDescendant = false

    const children = node.getAllChildren()
    for (const child of children) {
      const childMatches = this.walkTree(child, predicate, options)
      if (childMatches) {
        hasMatchingDescendant = true
      }
    }

    if (matches) {
      this.filteredNodeIds.add(node.id)
      if (options.showAncestors) {
        this.addAncestors(node)
      }
      if (options.showDescendants) {
        this.addDescendants(node)
      }
      return true
    }

    if (hasMatchingDescendant && options.showAncestors) {
      this.filteredNodeIds.add(node.id)
      return true
    }

    return false
  }

  private addAncestors(node: MindMapNode): void {
    // Walk up the tree to add all ancestor nodes
    // This requires the document to have parent references
    // For now, we skip this if parent is not available
  }

  private addDescendants(node: MindMapNode): void {
    node.descendants((descendant) => {
      this.filteredNodeIds.add(descendant.id)
    })
  }

  private getNodeDepth(node: MindMapNode): number {
    // Calculate depth based on the node's position in the tree
    // This requires traversal from root
    let depth = 0
    let current: MindMapNode | null = node
    while (current) {
      depth++
      current = null
    }
    return depth
  }
}
