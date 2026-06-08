import { MindMapNode } from '@y-mindmap/state'

export interface ChangeSet {
  added: Set<string>
  removed: Set<string>
  updated: Set<string>
  moved: Set<string>
}

export class IncrementalUpdater {
  private previousNodes: Map<string, MindMapNode> = new Map()
  private changeSet: ChangeSet = {
    added: new Set(),
    removed: new Set(),
    updated: new Set(),
    moved: new Set(),
  }

  processChanges(newRoot: MindMapNode): ChangeSet {
    const currentNodes = new Map<string, MindMapNode>()
    this.collectNodes(newRoot, currentNodes)

    this.changeSet = {
      added: new Set(),
      removed: new Set(),
      updated: new Set(),
      moved: new Set(),
    }

    for (const [id, node] of currentNodes) {
      if (!this.previousNodes.has(id)) {
        this.changeSet.added.add(id)
      } else {
        const prevNode = this.previousNodes.get(id)!
        if (this.hasNodeChanged(prevNode, node)) {
          this.changeSet.updated.add(id)
        }
        if (this.hasNodeMoved(prevNode, node)) {
          this.changeSet.moved.add(id)
        }
      }
    }

    for (const [id] of this.previousNodes) {
      if (!currentNodes.has(id)) {
        this.changeSet.removed.add(id)
      }
    }

    this.previousNodes = currentNodes
    return { ...this.changeSet }
  }

  private collectNodes(node: MindMapNode, nodes: Map<string, MindMapNode>): void {
    nodes.set(node.id, node)
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.collectNodes(child, nodes)
      }
    }
  }

  private hasNodeChanged(prev: MindMapNode, current: MindMapNode): boolean {
    return (
      prev.title !== current.title ||
      prev.style?.id !== current.style?.id ||
      prev.markers.length !== current.markers.length ||
      prev.labels.join(',') !== current.labels.join(',') ||
      prev.notes?.plain !== current.notes?.plain ||
      prev.image?.src !== current.image?.src
    )
  }

  private hasNodeMoved(prev: MindMapNode, current: MindMapNode): boolean {
    return (
      prev.position?.x !== current.position?.x ||
      prev.position?.y !== current.position?.y
    )
  }

  getAddedNodes(): string[] {
    return Array.from(this.changeSet.added)
  }

  getRemovedNodes(): string[] {
    return Array.from(this.changeSet.removed)
  }

  getUpdatedNodes(): string[] {
    return Array.from(this.changeSet.updated)
  }

  getMovedNodes(): string[] {
    return Array.from(this.changeSet.moved)
  }

  hasChanges(): boolean {
    return (
      this.changeSet.added.size > 0 ||
      this.changeSet.removed.size > 0 ||
      this.changeSet.updated.size > 0 ||
      this.changeSet.moved.size > 0
    )
  }

  clear(): void {
    this.previousNodes.clear()
    this.changeSet = {
      added: new Set(),
      removed: new Set(),
      updated: new Set(),
      moved: new Set(),
    }
  }
}
