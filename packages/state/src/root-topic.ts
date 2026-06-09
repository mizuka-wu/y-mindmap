import { TopicData, TopicType } from "@y-mindmap/core";
import { MindMapNode } from "./mind-map-node";

export class RootTopic {
  readonly root: MindMapNode;

  constructor(root: MindMapNode) {
    this.root = root;
  }

  getNodeById(id: string): MindMapNode | null {
    return this.root.findDescendant((node) => node.id === id);
  }

  findParent(childId: string): MindMapNode | null {
    return this.findParentRecursive(this.root, childId);
  }

  private findParentRecursive(
    node: MindMapNode,
    childId: string,
  ): MindMapNode | null {
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        if (child.id === childId) return node;
        const found = this.findParentRecursive(child, childId);
        if (found) return found;
      }
    }
    return null;
  }

  getNodesByType(type: TopicType): MindMapNode[] {
    return this.root.findAllDescendants((node) => node.type === type);
  }

  findNodes(predicate: (node: MindMapNode) => boolean): MindMapNode[] {
    return this.root.findAllDescendants(predicate);
  }

  updateNode(
    id: string,
    updater: (node: MindMapNode) => MindMapNode,
  ): RootTopic {
    const newRoot = this.updateNodeRecursive(this.root, id, updater);
    return new RootTopic(newRoot);
  }

  private updateNodeRecursive(
    node: MindMapNode,
    id: string,
    updater: (node: MindMapNode) => MindMapNode,
  ): MindMapNode {
    if (node.id === id) {
      return updater(node);
    }

    let changed = false;
    const newChildren: Record<string, TopicData[]> = {};

    for (const [type, children] of Object.entries(node.children)) {
      const newChildList: TopicData[] = [];
      for (const child of children) {
        const updated = this.updateNodeRecursive(child, id, updater);
        newChildList.push(updated.toJSON());
        if (updated !== child) {
          changed = true;
        }
      }
      newChildren[type] = newChildList;
    }

    if (!changed) {
      return node;
    }

    return new MindMapNode({
      ...node.toJSON(),
      children: newChildren,
    });
  }

  addNode(
    parentId: string,
    child: MindMapNode,
    type: string = "attached",
    index?: number,
  ): RootTopic {
    return this.updateNode(parentId, (parent) =>
      parent.addChild(child, type, index),
    );
  }

  removeNode(id: string): RootTopic {
    const newRoot = this.removeNodeRecursive(this.root, id);
    return newRoot
      ? new RootTopic(newRoot)
      : RootTopic.createEmpty();
  }

  private removeNodeRecursive(
    node: MindMapNode,
    id: string,
  ): MindMapNode | null {
    for (const [type, children] of Object.entries(node.children)) {
      const index = children.findIndex((child) => child.id === id);
      if (index !== -1) {
        return node.removeChild(id);
      }
    }

    for (const [type, children] of Object.entries(node.children)) {
      for (const child of children) {
        const updated = this.removeNodeRecursive(child, id);
        if (updated) {
          return node.updateChild(child.id, () => updated);
        }
      }
    }

    return null;
  }

  moveNode(
    nodeId: string,
    newParentId: string,
    index?: number,
  ): RootTopic {
    const node = this.getNodeById(nodeId);
    if (!node) return this;

    let tree = this.removeNode(nodeId);
    tree = tree.addNode(newParentId, node, "attached", index);
    return tree;
  }

  toJSON(): TopicData {
    return this.root.toJSON();
  }

  static fromJSON(data: TopicData): RootTopic {
    return new RootTopic(MindMapNode.fromJSON(data));
  }

  static createEmpty(): RootTopic {
    return new RootTopic(
      new MindMapNode({
        id: "root",
        title: "Central Topic",
        type: TopicType.ROOT,
      }),
    );
  }
}
