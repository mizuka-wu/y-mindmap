import { TopicData, StyleData } from '@y-mindmap/core'

export type DiffType = 'added' | 'removed' | 'modified' | 'moved' | 'unchanged'

export interface NodeDiff {
  nodeId: string
  type: DiffType
  oldNode?: TopicData
  newNode?: TopicData
  changes?: FieldChange[]
  parentId?: { old?: string; new?: string }
}

export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
}

export interface DiffResult {
  added: NodeDiff[]
  removed: NodeDiff[]
  modified: NodeDiff[]
  moved: NodeDiff[]
  unchanged: number
  summary: {
    totalChanges: number
    addedCount: number
    removedCount: number
    modifiedCount: number
    movedCount: number
  }
}

export function diffTrees(oldTree: TopicData, newTree: TopicData): DiffResult {
  const oldNodes = new Map<string, { node: TopicData; parentId?: string }>()
  const newNodes = new Map<string, { node: TopicData; parentId?: string }>()

  collectNodes(oldTree, oldNodes)
  collectNodes(newTree, newNodes)

  const added: NodeDiff[] = []
  const removed: NodeDiff[] = []
  const modified: NodeDiff[] = []
  const moved: NodeDiff[] = []
  let unchanged = 0

  for (const [id, { node: newNode, parentId: newParentId }] of newNodes) {
    if (!oldNodes.has(id)) {
      added.push({
        nodeId: id,
        type: 'added',
        newNode,
        parentId: { new: newParentId },
      })
    }
  }

  for (const [id, { node: oldNode, parentId: oldParentId }] of oldNodes) {
    if (!newNodes.has(id)) {
      removed.push({
        nodeId: id,
        type: 'removed',
        oldNode,
        parentId: { old: oldParentId },
      })
    }
  }

  for (const [id, { node: newNode, parentId: newParentId }] of newNodes) {
    const oldEntry = oldNodes.get(id)
    if (!oldEntry) continue

    const { node: oldNode, parentId: oldParentId } = oldEntry
    const changes = diffNodes(oldNode, newNode)

    if (oldParentId !== newParentId) {
      moved.push({
        nodeId: id,
        type: 'moved',
        oldNode,
        newNode,
        changes: changes.length > 0 ? changes : undefined,
        parentId: { old: oldParentId, new: newParentId },
      })
    } else if (changes.length > 0) {
      modified.push({
        nodeId: id,
        type: 'modified',
        oldNode,
        newNode,
        changes,
        parentId: { old: oldParentId, new: newParentId },
      })
    } else {
      unchanged++
    }
  }

  return {
    added,
    removed,
    modified,
    moved,
    unchanged,
    summary: {
      totalChanges: added.length + removed.length + modified.length + moved.length,
      addedCount: added.length,
      removedCount: removed.length,
      modifiedCount: modified.length,
      movedCount: moved.length,
    },
  }
}

function collectNodes(
  node: TopicData,
  nodes: Map<string, { node: TopicData; parentId?: string }>,
  parentId?: string
): void {
  nodes.set(node.id, { node, parentId })

  if (node.children) {
    for (const [type, children] of Object.entries(node.children)) {
      for (const child of children) {
        collectNodes(child, nodes, node.id)
      }
    }
  }
}

function diffNodes(oldNode: TopicData, newNode: TopicData): FieldChange[] {
  const changes: FieldChange[] = []

  if (oldNode.title !== newNode.title) {
    changes.push({ field: 'title', oldValue: oldNode.title, newValue: newNode.title })
  }

  if (oldNode.type !== newNode.type) {
    changes.push({ field: 'type', oldValue: oldNode.type, newValue: newNode.type })
  }

  if (JSON.stringify(oldNode.style) !== JSON.stringify(newNode.style)) {
    changes.push({ field: 'style', oldValue: oldNode.style, newValue: newNode.style })
  }

  if (JSON.stringify(oldNode.markers) !== JSON.stringify(newNode.markers)) {
    changes.push({ field: 'markers', oldValue: oldNode.markers, newValue: newNode.markers })
  }

  if (JSON.stringify(oldNode.labels) !== JSON.stringify(newNode.labels)) {
    changes.push({ field: 'labels', oldValue: oldNode.labels, newValue: newNode.labels })
  }

  if (oldNode.notes?.plain !== newNode.notes?.plain) {
    changes.push({ field: 'notes', oldValue: oldNode.notes, newValue: newNode.notes })
  }

  if (oldNode.image?.src !== newNode.image?.src) {
    changes.push({ field: 'image', oldValue: oldNode.image, newValue: newNode.image })
  }

  if (oldNode.href !== newNode.href) {
    changes.push({ field: 'href', oldValue: oldNode.href, newValue: newNode.href })
  }

  if (oldNode.branch !== newNode.branch) {
    changes.push({ field: 'branch', oldValue: oldNode.branch, newValue: newNode.branch })
  }

  return changes
}

export function getNodeDiffType(diffResult: DiffResult, nodeId: string): DiffType {
  if (diffResult.added.some(d => d.nodeId === nodeId)) return 'added'
  if (diffResult.removed.some(d => d.nodeId === nodeId)) return 'removed'
  if (diffResult.modified.some(d => d.nodeId === nodeId)) return 'modified'
  if (diffResult.moved.some(d => d.nodeId === nodeId)) return 'moved'
  return 'unchanged'
}

export function getNodeChanges(diffResult: DiffResult, nodeId: string): FieldChange[] | undefined {
  const diff = diffResult.modified.find(d => d.nodeId === nodeId) ||
               diffResult.moved.find(d => d.nodeId === nodeId)
  return diff?.changes
}

export function formatDiffSummary(diffResult: DiffResult): string {
  const { summary } = diffResult
  const parts: string[] = []

  if (summary.addedCount > 0) parts.push(`+${summary.addedCount} 新增`)
  if (summary.removedCount > 0) parts.push(`-${summary.removedCount} 删除`)
  if (summary.modifiedCount > 0) parts.push(`~${summary.modifiedCount} 修改`)
  if (summary.movedCount > 0) parts.push(`↕${summary.movedCount} 移动`)

  if (parts.length === 0) return '无变更'
  return parts.join(', ')
}
