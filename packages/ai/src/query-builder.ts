import { EditorState, MindMapNode } from '@y-mindmap/state'
import { TopicType } from '@y-mindmap/core'

export interface QueryCondition {
  type?: TopicType | TopicType[]
  title?: string | { $contains?: string; $startsWith?: string; $endsWith?: string; $regex?: string }
  depth?: number | { $gt?: number; $lt?: number; $gte?: number; $lte?: number; $eq?: number }
  hasChildren?: boolean
  hasMarkers?: boolean
  hasLabels?: boolean
  hasNotes?: boolean
  hasImage?: boolean
  isFolded?: boolean
  markerId?: string
  label?: string
  tagId?: string
}

export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: 'title' | 'depth' | 'childCount'
  sortOrder?: 'asc' | 'desc'
}

export interface QueryResult {
  nodes: MindMapNode[]
  count: number
  hasMore: boolean
}

export class QueryBuilder {
  private state: EditorState
  private conditions: QueryCondition[] = []
  private options: QueryOptions = {}

  constructor(state: EditorState) {
    this.state = state
  }

  where(condition: QueryCondition): this {
    this.conditions.push(condition)
    return this
  }

  limit(n: number): this {
    this.options.limit = n
    return this
  }

  offset(n: number): this {
    this.options.offset = n
    return this
  }

  sortBy(field: 'title' | 'depth' | 'childCount', order: 'asc' | 'desc' = 'asc'): this {
    this.options.sortBy = field
    this.options.sortOrder = order
    return this
  }

  find(): QueryResult {
    const allNodes: MindMapNode[] = []

    this.state.doc.root.descendants((node) => {
      if (this.matchesAllConditions(node)) {
        allNodes.push(node)
      }
    })

    if (this.options.sortBy) {
      allNodes.sort((a, b) => {
        let cmp = 0
        switch (this.options.sortBy) {
          case 'title':
            cmp = a.title.localeCompare(b.title)
            break
          case 'depth':
            cmp = this.getNodeDepth(a.id) - this.getNodeDepth(b.id)
            break
          case 'childCount':
            cmp = a.attachedChildren.length - b.attachedChildren.length
            break
        }
        return this.options.sortOrder === 'desc' ? -cmp : cmp
      })
    }

    const offset = this.options.offset || 0
    const limit = this.options.limit || allNodes.length
    const paginatedNodes = allNodes.slice(offset, offset + limit)

    return {
      nodes: paginatedNodes,
      count: allNodes.length,
      hasMore: offset + limit < allNodes.length,
    }
  }

  findOne(): MindMapNode | null {
    const result = this.limit(1).find()
    return result.nodes[0] || null
  }

  count(): number {
    return this.find().count
  }

  exists(): boolean {
    return this.count() > 0
  }

  findById(nodeId: string): MindMapNode | null {
    return this.state.doc.getNodeById(nodeId)
  }

  findByTitle(title: string): MindMapNode[] {
    return this.where({ title }).find().nodes
  }

  findByType(type: TopicType): MindMapNode[] {
    return this.where({ type }).find().nodes
  }

  findChildren(nodeId: string): MindMapNode[] {
    const node = this.state.doc.getNodeById(nodeId)
    return node?.attachedChildren || []
  }

  findDescendants(nodeId: string): MindMapNode[] {
    const node = this.state.doc.getNodeById(nodeId)
    if (!node) return []

    const descendants: MindMapNode[] = []
    node.descendants((n) => {
      if (n.id !== nodeId) {
        descendants.push(n)
      }
    })
    return descendants
  }

  findAncestors(nodeId: string): MindMapNode[] {
    const ancestors: MindMapNode[] = []
    let current = this.findParent(nodeId)

    while (current) {
      ancestors.push(current)
      current = this.findParent(current.id)
    }

    return ancestors
  }

  findPath(fromId: string, toId: string): MindMapNode[] | null {
    const fromNode = this.state.doc.getNodeById(fromId)
    const toNode = this.state.doc.getNodeById(toId)
    if (!fromNode || !toNode) return null

    const ancestors = this.findAncestors(toId)
    const path = [toNode, ...ancestors.reverse()]

    const fromIndex = path.findIndex(n => n.id === fromId)
    if (fromIndex === -1) return null

    return path.slice(fromIndex)
  }

  findSiblings(nodeId: string): MindMapNode[] {
    const parent = this.findParent(nodeId)
    if (!parent) return []

    return parent.attachedChildren.filter(c => c.id !== nodeId)
  }

  private matchesAllConditions(node: MindMapNode): boolean {
    return this.conditions.every(condition => this.matchesCondition(node, condition))
  }

  private matchesCondition(node: MindMapNode, condition: QueryCondition): boolean {
    if (condition.type !== undefined) {
      const types = Array.isArray(condition.type) ? condition.type : [condition.type]
      if (!types.includes(node.type as TopicType)) return false
    }

    if (condition.title !== undefined) {
      if (typeof condition.title === 'string') {
        if (node.title !== condition.title) return false
      } else {
        const titleCond = condition.title
        if (titleCond.$contains && !node.title.includes(titleCond.$contains)) return false
        if (titleCond.$startsWith && !node.title.startsWith(titleCond.$startsWith)) return false
        if (titleCond.$endsWith && !node.title.endsWith(titleCond.$endsWith)) return false
        if (titleCond.$regex && !new RegExp(titleCond.$regex).test(node.title)) return false
      }
    }

    if (condition.depth !== undefined) {
      const depth = this.getNodeDepth(node.id)
      if (typeof condition.depth === 'number') {
        if (depth !== condition.depth) return false
      } else {
        const depthCond = condition.depth
        if (depthCond.$gt !== undefined && depth <= depthCond.$gt) return false
        if (depthCond.$lt !== undefined && depth >= depthCond.$lt) return false
        if (depthCond.$gte !== undefined && depth < depthCond.$gte) return false
        if (depthCond.$lte !== undefined && depth > depthCond.$lte) return false
        if (depthCond.$eq !== undefined && depth !== depthCond.$eq) return false
      }
    }

    if (condition.hasChildren !== undefined) {
      if (condition.hasChildren !== node.hasChildren) return false
    }

    if (condition.hasMarkers !== undefined) {
      if (condition.hasMarkers !== (node.markers.length > 0)) return false
    }

    if (condition.hasLabels !== undefined) {
      if (condition.hasLabels !== (node.labels.length > 0)) return false
    }

    if (condition.hasNotes !== undefined) {
      if (condition.hasNotes !== !!node.notes?.plain) return false
    }

    if (condition.hasImage !== undefined) {
      if (condition.hasImage !== !!node.image) return false
    }

    if (condition.isFolded !== undefined) {
      if (condition.isFolded !== node.isFolded) return false
    }

    if (condition.markerId !== undefined) {
      if (!node.markers.some(m => m.markerId === condition.markerId)) return false
    }

    if (condition.label !== undefined) {
      if (!node.labels.includes(condition.label)) return false
    }

    return true
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
}
