import { TopicData, TopicType } from '@y-mindmap/core'
import { MindMapNode } from './mind-map-node'

export class MindMapDocument {
  readonly root: MindMapNode

  constructor(root: MindMapNode) {
    this.root = root
  }

  getNodeById(id: string): MindMapNode | null {
    return this.root.findDescendant(node => node.id === id)
  }

  getNodesByType(type: TopicType): MindMapNode[] {
    return this.root.findAllDescendants(node => node.type === type)
  }

  findNodes(predicate: (node: MindMapNode) => boolean): MindMapNode[] {
    return this.root.findAllDescendants(predicate)
  }

  updateNode(id: string, updater: (node: MindMapNode) => MindMapNode): MindMapDocument {
    const newRoot = this.updateNodeRecursive(this.root, id, updater)
    return new MindMapDocument(newRoot)
  }

  private updateNodeRecursive(node: MindMapNode, id: string, updater: (node: MindMapNode) => MindMapNode): MindMapNode {
    if (node.id === id) {
      return updater(node)
    }

    let changed = false
    const newChildren: Record<string, TopicData[]> = {}

    for (const [type, children] of Object.entries(node.children)) {
      const newChildList: TopicData[] = []
      for (const child of children) {
        const updated = this.updateNodeRecursive(child, id, updater)
        newChildList.push(updated.toJSON())
        if (updated !== child) {
          changed = true
        }
      }
      newChildren[type] = newChildList
    }

    if (!changed) {
      return node
    }

    return new MindMapNode({
      ...node.toJSON(),
      children: newChildren,
    })
  }

  addNode(parentId: string, child: MindMapNode, type: string = 'attached', index?: number): MindMapDocument {
    return this.updateNode(parentId, parent => parent.addChild(child, type, index))
  }

  removeNode(id: string): MindMapDocument {
    const newRoot = this.removeNodeRecursive(this.root, id)
    return newRoot ? new MindMapDocument(newRoot) : MindMapDocument.createEmpty()
  }

  private removeNodeRecursive(node: MindMapNode, id: string): MindMapNode | null {
    for (const [type, children] of Object.entries(node.children)) {
      const index = children.findIndex(child => child.id === id)
      if (index !== -1) {
        return node.removeChild(id)
      }
    }

    for (const [type, children] of Object.entries(node.children)) {
      for (const child of children) {
        const updated = this.removeNodeRecursive(child, id)
        if (updated) {
          return node.updateChild(child.id, () => updated)
        }
      }
    }

    return null
  }

  moveNode(nodeId: string, newParentId: string, index?: number): MindMapDocument {
    const node = this.getNodeById(nodeId)
    if (!node) return this

    let doc = this.removeNode(nodeId)
    doc = doc.addNode(newParentId, node, 'attached', index)
    return doc
  }

  toJSON(): TopicData {
    return this.root.toJSON()
  }

  static fromJSON(data: TopicData): MindMapDocument {
    return new MindMapDocument(MindMapNode.fromJSON(data))
  }

  static createEmpty(): MindMapDocument {
    return new MindMapDocument(
      new MindMapNode({
        id: 'root',
        title: 'Central Topic',
        type: TopicType.ROOT,
      })
    )
  }
}
