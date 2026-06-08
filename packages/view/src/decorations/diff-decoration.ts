import { DiffResult, DiffType } from '@y-mindmap/state'
import { Decoration, DecorationSet, NodeDecorationSpec } from './decoration'

export interface DiffDecorationOptions {
  added?: { color: string; opacity: number }
  removed?: { color: string; opacity: number }
  modified?: { color: string; opacity: number }
  moved?: { color: string; opacity: number }
}

const DEFAULT_OPTIONS: DiffDecorationOptions = {
  added: { color: '#4CAF50', opacity: 0.3 },
  removed: { color: '#F44336', opacity: 0.3 },
  modified: { color: '#FF9800', opacity: 0.3 },
  moved: { color: '#2196F3', opacity: 0.3 },
}

export class DiffDecorationManager {
  private options: DiffDecorationOptions
  private decorations: Map<string, Decoration> = new Map()

  constructor(options?: DiffDecorationOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  createDecorations(diffResult: DiffResult): DecorationSet {
    this.decorations.clear()
    const decorationList: Decoration[] = []

    for (const diff of diffResult.added) {
      const decoration = this.createAddedDecoration(diff.nodeId)
      this.decorations.set(diff.nodeId, decoration)
      decorationList.push(decoration)
    }

    for (const diff of diffResult.removed) {
      const decoration = this.createRemovedDecoration(diff.nodeId)
      this.decorations.set(diff.nodeId, decoration)
      decorationList.push(decoration)
    }

    for (const diff of diffResult.modified) {
      const decoration = this.createModifiedDecoration(diff.nodeId)
      this.decorations.set(diff.nodeId, decoration)
      decorationList.push(decoration)
    }

    for (const diff of diffResult.moved) {
      const decoration = this.createMovedDecoration(diff.nodeId)
      this.decorations.set(diff.nodeId, decoration)
      decorationList.push(decoration)
    }

    return DecorationSet.create(decorationList)
  }

  private createAddedDecoration(nodeId: string): Decoration {
    return Decoration.node(nodeId, {
      class: 'diff-added',
      style: {
        backgroundColor: this.options.added?.color || '#4CAF50',
        opacity: String(this.options.added?.opacity || 0.3),
        border: `2px solid ${this.options.added?.color || '#4CAF50'}`,
      },
    })
  }

  private createRemovedDecoration(nodeId: string): Decoration {
    return Decoration.node(nodeId, {
      class: 'diff-removed',
      style: {
        backgroundColor: this.options.removed?.color || '#F44336',
        opacity: String(this.options.removed?.opacity || 0.3),
        border: `2px solid ${this.options.removed?.color || '#F44336'}`,
        textDecoration: 'line-through',
      },
    })
  }

  private createModifiedDecoration(nodeId: string): Decoration {
    return Decoration.node(nodeId, {
      class: 'diff-modified',
      style: {
        backgroundColor: this.options.modified?.color || '#FF9800',
        opacity: String(this.options.modified?.opacity || 0.3),
        border: `2px solid ${this.options.modified?.color || '#FF9800'}`,
      },
    })
  }

  private createMovedDecoration(nodeId: string): Decoration {
    return Decoration.node(nodeId, {
      class: 'diff-moved',
      style: {
        backgroundColor: this.options.moved?.color || '#2196F3',
        opacity: String(this.options.moved?.opacity || 0.3),
        border: `2px dashed ${this.options.moved?.color || '#2196F3'}`,
      },
    })
  }

  getDecoration(nodeId: string): Decoration | undefined {
    return this.decorations.get(nodeId)
  }

  getDiffType(nodeId: string): DiffType | undefined {
    const decoration = this.decorations.get(nodeId)
    if (!decoration) return undefined

    const spec = decoration.spec as NodeDecorationSpec
    if (spec.class?.includes('diff-added')) return 'added'
    if (spec.class?.includes('diff-removed')) return 'removed'
    if (spec.class?.includes('diff-modified')) return 'modified'
    if (spec.class?.includes('diff-moved')) return 'moved'
    return 'unchanged'
  }

  clear(): void {
    this.decorations.clear()
  }
}

export function createDiffDecorationSet(
  diffResult: DiffResult,
  options?: DiffDecorationOptions
): DecorationSet {
  const manager = new DiffDecorationManager(options)
  return manager.createDecorations(diffResult)
}

export function getDiffColor(type: DiffType): string {
  switch (type) {
    case 'added': return '#4CAF50'
    case 'removed': return '#F44336'
    case 'modified': return '#FF9800'
    case 'moved': return '#2196F3'
    case 'unchanged': return 'transparent'
  }
}

export function getDiffLabel(type: DiffType): string {
  switch (type) {
    case 'added': return '新增'
    case 'removed': return '删除'
    case 'modified': return '修改'
    case 'moved': return '移动'
    case 'unchanged': return '未变更'
  }
}
