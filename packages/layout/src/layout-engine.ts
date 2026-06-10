import type { Point, Bounds, Size } from "@y-mindmap/core";
import type { MindMapNode } from "@y-mindmap/state";
import type {
  LayoutEngine,
  LayoutResult,
  NodeLayout,
  ConnectionLayout,
  LayoutOptions,
} from "./types";
import { DEFAULT_LAYOUT_OPTIONS } from "./types";

function updateChildrenBounds(
  node: MindMapNode,
  nodes: Map<string, NodeLayout>,
): void {
  const layout = nodes.get(node.id)!;
  if (!node.hasChildren) {
    layout.childrenBounds = {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
    };
    return;
  }

  const children = node.attachedChildren;
  let minX = layout.x;
  let minY = layout.y;
  let maxX = layout.x + layout.width;
  let maxY = layout.y + layout.height;

  for (const child of children) {
    updateChildrenBounds(child, nodes);
    const childLayout = nodes.get(child.id)!;
    const cb = childLayout.childrenBounds;
    minX = Math.min(minX, cb.x);
    minY = Math.min(minY, cb.y);
    maxX = Math.max(maxX, cb.x + cb.width);
    maxY = Math.max(maxY, cb.y + cb.height);
  }

  layout.childrenBounds = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export class MapLayoutEngine implements LayoutEngine {
  private options: LayoutOptions;
  private _cache: Map<string, NodeLayout> = new Map();
  private _connectionCache: Map<string, ConnectionLayout> = new Map();
  private _dirtySubtrees: Set<string> = new Set();

  constructor(options?: Partial<LayoutOptions>) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  clearCache(): void {
    this._cache.clear();
    this._connectionCache.clear();
    this._dirtySubtrees.clear();
  }

  private isSubtreeDirty(nodeId: string, dirtyNodes?: Set<string>): boolean {
    if (!dirtyNodes) return true;
    if (dirtyNodes.has(nodeId)) return true;
    return this._dirtySubtrees.has(nodeId);
  }

  private markSubtreeDirty(nodeId: string): void {
    this._dirtySubtrees.add(nodeId);
  }

  calculate(
    root: MindMapNode,
    options?: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): LayoutResult {
    const opts = { ...this.options, ...options };

    if (dirtyNodes !== undefined && dirtyNodes.size === 0) {
      if (this._cache.size > 0) {
        return {
          nodes: new Map(this._cache),
          connections: new Map(this._connectionCache),
          bounds: this.calculateTotalBounds(this._cache),
        };
      }
    }

    if (dirtyNodes && dirtyNodes.size > 0) {
      for (const dirtyId of dirtyNodes) {
        this.markSubtreeDirty(dirtyId);
      }
    }

    const nodes = new Map<string, NodeLayout>();
    const connections = new Map<string, ConnectionLayout>();

    const rootDirty = this.isSubtreeDirty(root.id, dirtyNodes);
    let rootLayout: NodeLayout;

    if (!rootDirty && this._cache.has(root.id)) {
      rootLayout = { ...this._cache.get(root.id)! };
    } else {
      rootLayout = this.calculateNodeLayout(root, opts);
    }
    nodes.set(root.id, rootLayout);

    const attachedChildren = root.attachedChildren;
    if (attachedChildren.length > 0) {
      const { rightChildren, leftChildren } = this.splitChildren(
        attachedChildren,
        opts,
      );

      const rightBounds = this.calculateSide(
        root,
        rightChildren,
        "right",
        nodes,
        connections,
        opts,
        dirtyNodes,
      );
      const leftBounds = this.calculateSide(
        root,
        leftChildren,
        "left",
        nodes,
        connections,
        opts,
        dirtyNodes,
      );

      this.centerRoot(rootLayout, rightBounds, leftBounds, opts);
    }

    for (const [id, layout] of nodes) {
      this._cache.set(id, layout);
    }
    for (const [id, conn] of connections) {
      this._connectionCache.set(id, conn);
    }

    if (dirtyNodes) {
      for (const id of dirtyNodes) {
        this._dirtySubtrees.delete(id);
      }
    }

    const bounds = this.calculateTotalBounds(this._cache);

    updateChildrenBounds(root, this._cache);

    return { nodes: this._cache, connections: this._connectionCache, bounds };
  }

  calculateNodeSize(node: MindMapNode): Size {
    return {
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
    };
  }

  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const isRight = to.x > from.x;

    const startX = isRight ? from.x + from.width : from.x;
    const startY = from.y + from.height / 2;

    const endX = isRight ? to.x : to.x + to.width;
    const endY = to.y + to.height / 2;

    const controlOffset = this.options.horizontalSpacing * 0.4;

    return `M ${startX} ${startY} C ${startX + (isRight ? controlOffset : -controlOffset)} ${startY}, ${endX + (isRight ? -controlOffset : controlOffset)} ${endY}, ${endX} ${endY}`;
  }

  private calculateNodeLayout(
    node: MindMapNode,
    options: LayoutOptions,
  ): NodeLayout {
    const width = this.estimateNodeWidth(node);
    const height = this.estimateNodeHeight(node);

    return {
      id: node.id,
      x: 0,
      y: 0,
      width,
      height,
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  private estimateNodeWidth(node: MindMapNode): number {
    const titleLength = node.title.length;
    const fontSize = 14;
    const minWidth = 120;
    const maxWidth = 300;

    const estimatedWidth = titleLength * fontSize * 0.6 + 32;
    return Math.max(minWidth, Math.min(maxWidth, estimatedWidth));
  }

  private estimateNodeHeight(node: MindMapNode): number {
    const fontSize = 14;
    const hasImage = !!node.image;
    const hasMarkers = node.markers && node.markers.length > 0;

    let height = fontSize * 1.5 + 24;
    if (hasImage) height += 70;
    if (hasMarkers) height += 24;

    return Math.max(40, height);
  }

  private splitChildren(
    children: MindMapNode[],
    options: LayoutOptions,
  ): { rightChildren: MindMapNode[]; leftChildren: MindMapNode[] } {
    const numRight = this.calcNumRight(children);

    return {
      rightChildren: children.slice(0, numRight),
      leftChildren: children.slice(numRight),
    };
  }

  private calcNumRight(children: MindMapNode[]): number {
    if (children.length <= 1) return children.length;

    const totalWeight = children.reduce(
      (sum, child) => sum + this.getWeight(child),
      0,
    );
    const halfWeight = totalWeight / 2;

    let rightWeight = 0;
    let lastIndex = -1;

    for (let i = 0; i < children.length; i++) {
      const weight = this.getWeight(children[i]!);
      const newRightWeight = rightWeight + weight;

      if (newRightWeight >= halfWeight) {
        if (
          lastIndex >= 0 &&
          newRightWeight - halfWeight > halfWeight - rightWeight
        ) {
          return lastIndex + 1;
        }
        return i + 1;
      }

      rightWeight = newRightWeight;
      lastIndex = i;
    }

    return children.length;
  }

  private getWeight(node: MindMapNode): number {
    const height = this.estimateNodeHeight(node);
    return height + this.options.verticalSpacing * 2;
  }

  private isSubtreeClean(node: MindMapNode, dirtyNodes?: Set<string>): boolean {
    if (!dirtyNodes) return false;
    if (dirtyNodes.has(node.id)) return false;

    const children = node.attachedChildren;
    for (const child of children) {
      if (!this.isSubtreeClean(child, dirtyNodes)) return false;
    }
    return true;
  }

  private calculateSide(
    rootNode: MindMapNode,
    children: MindMapNode[],
    side: "left" | "right",
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): Bounds | null {
    if (children.length === 0) return null;

    const rootLayout = nodes.get(rootNode.id)!;
    const childLayouts: NodeLayout[] = [];
    const needsReposition = dirtyNodes
      ? this.isSubtreeDirty(rootNode.id, dirtyNodes)
      : true;

    for (const child of children) {
      let childLayout: NodeLayout;
      const childDirty = dirtyNodes
        ? this.isSubtreeDirty(child.id, dirtyNodes)
        : true;

      if (!childDirty && this._cache.has(child.id)) {
        childLayout = { ...this._cache.get(child.id)! };
        nodes.set(child.id, childLayout);

        if (child.hasChildren) {
          this.copyCachedDescendants(child, nodes, connections);
        }
      } else {
        childLayout = this.calculateNodeLayout(child, options);
        childLayouts.push(childLayout);
        nodes.set(child.id, childLayout);

        if (child.hasChildren) {
          this.calculateDescendants(
            child,
            childLayout,
            side,
            nodes,
            connections,
            options,
            dirtyNodes,
          );
        }
      }
    }

    if (needsReposition && childLayouts.length > 0) {
      this.positionChildren(
        rootLayout,
        childLayouts,
        side,
        options,
        rootNode.id,
      );
    }

    for (const child of children) {
      const childLayout = nodes.get(child.id)!;
      const connectionId = `${rootNode.id}-${child.id}`;

      if (!connections.has(connectionId) || needsReposition) {
        connections.set(connectionId, {
          id: connectionId,
          fromId: rootNode.id,
          toId: child.id,
          path: this.calculateConnectionPath(rootLayout, childLayout),
          startPoint: {
            x:
              side === "right" ? rootLayout.x + rootLayout.width : rootLayout.x,
            y: rootLayout.y + rootLayout.height / 2,
          },
          endPoint: {
            x:
              side === "right"
                ? childLayout.x
                : childLayout.x + childLayout.width,
            y: childLayout.y + childLayout.height / 2,
          },
          controlPoints: [],
        });
      }
    }

    return this.calculateBoundsFromLayouts(
      childLayouts.length > 0
        ? childLayouts
        : Array.from(nodes.values()).filter((n) =>
            children.some((c) => c.id === n.id),
          ),
    );
  }

  private copyCachedDescendants(
    parentNode: MindMapNode,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
  ): void {
    const children = parentNode.attachedChildren;
    for (const child of children) {
      if (this._cache.has(child.id)) {
        const childLayout = { ...this._cache.get(child.id)! };
        nodes.set(child.id, childLayout);

        const connectionId = `${parentNode.id}-${child.id}`;
        if (this._connectionCache.has(connectionId)) {
          connections.set(
            connectionId,
            this._connectionCache.get(connectionId)!,
          );
        }

        if (child.hasChildren) {
          this.copyCachedDescendants(child, nodes, connections);
        }
      }
    }
  }

  private calculateDescendants(
    parentNode: MindMapNode,
    parentLayout: NodeLayout,
    side: "left" | "right",
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): void {
    const children = parentNode.attachedChildren;
    if (children.length === 0) return;

    const childLayouts: NodeLayout[] = [];

    for (const child of children) {
      let childLayout: NodeLayout;
      const childDirty = dirtyNodes
        ? this.isSubtreeDirty(child.id, dirtyNodes)
        : true;

      if (!childDirty && this._cache.has(child.id)) {
        childLayout = { ...this._cache.get(child.id)! };
        nodes.set(child.id, childLayout);

        if (child.hasChildren) {
          this.copyCachedDescendants(child, nodes, connections);
        }
      } else {
        childLayout = this.calculateNodeLayout(child, options);
        childLayouts.push(childLayout);
        nodes.set(child.id, childLayout);

        if (child.hasChildren) {
          this.calculateDescendants(
            child,
            childLayout,
            side,
            nodes,
            connections,
            options,
            dirtyNodes,
          );
        }
      }
    }

    if (childLayouts.length > 0) {
      this.positionChildren(
        parentLayout,
        childLayouts,
        side,
        options,
        parentNode.id,
      );
    }

    for (const child of children) {
      const childLayout = nodes.get(child.id)!;
      const connectionId = `${parentNode.id}-${child.id}`;

      if (!connections.has(connectionId)) {
        connections.set(connectionId, {
          id: connectionId,
          fromId: parentNode.id,
          toId: child.id,
          path: this.calculateConnectionPath(parentLayout, childLayout),
          startPoint: {
            x:
              side === "right"
                ? parentLayout.x + parentLayout.width
                : parentLayout.x,
            y: parentLayout.y + parentLayout.height / 2,
          },
          endPoint: {
            x:
              side === "right"
                ? childLayout.x
                : childLayout.x + childLayout.width,
            y: childLayout.y + childLayout.height / 2,
          },
          controlPoints: [],
        });
      }
    }
  }

  private positionChildren(
    parentLayout: NodeLayout,
    childLayouts: NodeLayout[],
    side: "left" | "right",
    options: LayoutOptions,
    parentNodeId?: string,
  ): void {
    if (childLayouts.length === 0) return;

    // Resolve per-node spacing override
    let hSpacing = options.horizontalSpacing;
    let vSpacing = options.verticalSpacing;
    if (parentNodeId && options.nodeSpacingResolver) {
      const override = options.nodeSpacingResolver(parentNodeId);
      if (override) {
        hSpacing = override[0];
        vSpacing = override[1];
      }
    }

    const totalHeight =
      childLayouts.reduce((sum, layout) => sum + layout.height, 0) +
      (childLayouts.length - 1) * vSpacing;

    let currentY = parentLayout.y + parentLayout.height / 2 - totalHeight / 2;

    for (const childLayout of childLayouts) {
      childLayout.y = currentY;

      if (side === "right") {
        childLayout.x = parentLayout.x + parentLayout.width + hSpacing;
      } else {
        childLayout.x = parentLayout.x - childLayout.width - hSpacing;
      }

      currentY += childLayout.height + vSpacing;
    }
  }

  private centerRoot(
    rootLayout: NodeLayout,
    rightBounds: Bounds | null,
    leftBounds: Bounds | null,
    options: LayoutOptions,
  ): void {
    if (!rightBounds && !leftBounds) return;

    let centerY = 0;

    if (rightBounds && leftBounds) {
      centerY =
        (rightBounds.y +
          rightBounds.height / 2 +
          leftBounds.y +
          leftBounds.height / 2) /
        2;
    } else if (rightBounds) {
      centerY = rightBounds.y + rightBounds.height / 2;
    } else if (leftBounds) {
      centerY = leftBounds.y + leftBounds.height / 2;
    }

    rootLayout.y = centerY - rootLayout.height / 2;

    if (rightBounds) {
      rootLayout.x =
        rightBounds.x - rootLayout.width - options.horizontalSpacing;
    } else if (leftBounds) {
      rootLayout.x =
        leftBounds.x + leftBounds.width + options.horizontalSpacing;
    }
  }

  private calculateBoundsFromLayouts(layouts: NodeLayout[]): Bounds {
    if (layouts.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layout of layouts) {
      minX = Math.min(minX, layout.x);
      minY = Math.min(minY, layout.y);
      maxX = Math.max(maxX, layout.x + layout.width);
      maxY = Math.max(maxY, layout.y + layout.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private calculateTotalBounds(nodes: Map<string, NodeLayout>): Bounds {
    const layouts = Array.from(nodes.values());
    return this.calculateBoundsFromLayouts(layouts);
  }
}

export class TreeLayoutEngine implements LayoutEngine {
  private options: LayoutOptions;

  constructor(options?: Partial<LayoutOptions>) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  clearCache(): void {}

  calculate(
    root: MindMapNode,
    options?: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): LayoutResult {
    const opts = { ...this.options, ...options };
    const nodes = new Map<string, NodeLayout>();
    const connections = new Map<string, ConnectionLayout>();

    const rootLayout = this.calculateNodeLayout(root, opts);
    nodes.set(root.id, rootLayout);

    this.calculateChildren(root, rootLayout, nodes, connections, opts);

    const bounds = this.calculateTotalBounds(nodes);

    updateChildrenBounds(root, nodes);

    return { nodes, connections, bounds };
  }

  calculateNodeSize(node: MindMapNode): Size {
    return {
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
    };
  }

  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const startX = from.x + from.width / 2;
    const startY = from.y + from.height;

    const endX = to.x + to.width / 2;
    const endY = to.y;

    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  private calculateNodeLayout(
    node: MindMapNode,
    options: LayoutOptions,
  ): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  private estimateNodeWidth(node: MindMapNode): number {
    const titleLength = node.title.length;
    const fontSize = 14;
    return Math.max(100, Math.min(200, titleLength * fontSize * 0.6 + 32));
  }

  private estimateNodeHeight(node: MindMapNode): number {
    return 40;
  }

  private calculateChildren(
    parentNode: MindMapNode,
    parentLayout: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const children = parentNode.attachedChildren;
    if (children.length === 0) return;

    const childLayouts: NodeLayout[] = [];

    for (const child of children) {
      const childLayout = this.calculateNodeLayout(child, options);
      childLayouts.push(childLayout);
      nodes.set(child.id, childLayout);
    }

    const totalWidth =
      childLayouts.reduce((sum, layout) => sum + layout.width, 0) +
      (childLayouts.length - 1) * options.horizontalSpacing;

    let currentX = parentLayout.x + parentLayout.width / 2 - totalWidth / 2;

    for (const childLayout of childLayouts) {
      childLayout.x = currentX;
      childLayout.y =
        parentLayout.y + parentLayout.height + options.verticalSpacing;

      const connectionId = `${parentNode.id}-${childLayout.id}`;
      connections.set(connectionId, {
        id: connectionId,
        fromId: parentNode.id,
        toId: childLayout.id,
        path: this.calculateConnectionPath(parentLayout, childLayout),
        startPoint: {
          x: parentLayout.x + parentLayout.width / 2,
          y: parentLayout.y + parentLayout.height,
        },
        endPoint: {
          x: childLayout.x + childLayout.width / 2,
          y: childLayout.y,
        },
        controlPoints: [],
      });

      currentX += childLayout.width + options.horizontalSpacing;

      const childNode = nodes.get(childLayout.id);
      if (childNode) {
        const child = children.find((c) => c.id === childLayout.id);
        if (child) {
          this.calculateChildren(
            child,
            childLayout,
            nodes,
            connections,
            options,
          );
        }
      }
    }
  }

  private calculateTotalBounds(nodes: Map<string, NodeLayout>): Bounds {
    const layouts = Array.from(nodes.values());
    if (layouts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layout of layouts) {
      minX = Math.min(minX, layout.x);
      minY = Math.min(minY, layout.y);
      maxX = Math.max(maxX, layout.x + layout.width);
      maxY = Math.max(maxY, layout.y + layout.height);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

export class FishboneLayoutEngine implements LayoutEngine {
  private options: LayoutOptions;

  constructor(options?: Partial<LayoutOptions>) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  clearCache(): void {}

  calculate(
    root: MindMapNode,
    options?: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): LayoutResult {
    const opts = { ...this.options, ...options };
    const nodes = new Map<string, NodeLayout>();
    const connections = new Map<string, ConnectionLayout>();

    const rootLayout = this.calculateNodeLayout(root, opts);
    nodes.set(root.id, rootLayout);

    this.calculateChildren(root, rootLayout, nodes, connections, opts);

    const bounds = this.calculateTotalBounds(nodes);

    updateChildrenBounds(root, nodes);

    return { nodes, connections, bounds };
  }

  calculateNodeSize(node: MindMapNode): Size {
    return {
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
    };
  }

  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;

    const endX = to.x;
    const endY = to.y + to.height / 2;

    const midX = (startX + endX) / 2;

    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }

  private calculateNodeLayout(
    node: MindMapNode,
    options: LayoutOptions,
  ): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  private estimateNodeWidth(node: MindMapNode): number {
    const titleLength = node.title.length;
    return Math.max(80, Math.min(150, titleLength * 8 + 32));
  }

  private estimateNodeHeight(node: MindMapNode): number {
    return 30;
  }

  private calculateChildren(
    parentNode: MindMapNode,
    parentLayout: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const children = parentNode.attachedChildren;
    if (children.length === 0) return;

    const mainLineLength = children.length * 60;
    const mainLineY = parentLayout.y + parentLayout.height / 2;

    const currentX = parentLayout.x + parentLayout.width + 20;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const childLayout = this.calculateNodeLayout(child, options);

      const isTop = i % 2 === 0;
      const angle = isTop ? -45 : 45;
      const offset = (i + 1) * 40;

      childLayout.x = currentX + offset * Math.cos((angle * Math.PI) / 180);
      childLayout.y =
        mainLineY +
        offset * Math.sin((angle * Math.PI) / 180) -
        childLayout.height / 2;

      nodes.set(child.id, childLayout);

      const connectionId = `${parentNode.id}-${child.id}`;
      connections.set(connectionId, {
        id: connectionId,
        fromId: parentNode.id,
        toId: child.id,
        path: this.calculateConnectionPath(parentLayout, childLayout),
        startPoint: {
          x: parentLayout.x + parentLayout.width,
          y: mainLineY,
        },
        endPoint: {
          x: childLayout.x,
          y: childLayout.y + childLayout.height / 2,
        },
        controlPoints: [],
      });

      if (child.hasChildren) {
        this.calculateChildren(child, childLayout, nodes, connections, options);
      }
    }
  }

  private calculateTotalBounds(nodes: Map<string, NodeLayout>): Bounds {
    const layouts = Array.from(nodes.values());
    if (layouts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layout of layouts) {
      minX = Math.min(minX, layout.x);
      minY = Math.min(minY, layout.y);
      maxX = Math.max(maxX, layout.x + layout.width);
      maxY = Math.max(maxY, layout.y + layout.height);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

export class TimelineLayoutEngine implements LayoutEngine {
  private options: LayoutOptions;
  private orientation: "horizontal" | "vertical";

  constructor(
    orientation: "horizontal" | "vertical" = "horizontal",
    options?: Partial<LayoutOptions>,
  ) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
    this.orientation = orientation;
  }

  clearCache(): void {}

  calculate(
    root: MindMapNode,
    options?: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): LayoutResult {
    const opts = { ...this.options, ...options };
    const nodes = new Map<string, NodeLayout>();
    const connections = new Map<string, ConnectionLayout>();

    const rootLayout = this.calculateNodeLayout(root, opts);
    nodes.set(root.id, rootLayout);

    this.calculateChildren(root, rootLayout, nodes, connections, opts);

    const bounds = this.calculateTotalBounds(nodes);

    updateChildrenBounds(root, nodes);

    return { nodes, connections, bounds };
  }

  calculateNodeSize(node: MindMapNode): Size {
    return {
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
    };
  }

  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    if (this.orientation === "horizontal") {
      const startX = from.x + from.width;
      const startY = from.y + from.height / 2;
      const endX = to.x;
      const endY = to.y + to.height / 2;
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    } else {
      const startX = from.x + from.width / 2;
      const startY = from.y + from.height;
      const endX = to.x + to.width / 2;
      const endY = to.y;
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }
  }

  private calculateNodeLayout(
    node: MindMapNode,
    options: LayoutOptions,
  ): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estimateNodeWidth(node),
      height: this.estimateNodeHeight(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }

  private estimateNodeWidth(node: MindMapNode): number {
    const titleLength = node.title.length;
    return Math.max(100, Math.min(200, titleLength * 8 + 32));
  }

  private estimateNodeHeight(node: MindMapNode): number {
    return 40;
  }

  private calculateChildren(
    parentNode: MindMapNode,
    parentLayout: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const children = parentNode.attachedChildren;
    if (children.length === 0) return;

    let currentPos =
      this.orientation === "horizontal"
        ? parentLayout.x + parentLayout.width + options.horizontalSpacing
        : parentLayout.y + parentLayout.height + options.verticalSpacing;

    for (const child of children) {
      const childLayout = this.calculateNodeLayout(child, options);

      if (this.orientation === "horizontal") {
        childLayout.x = currentPos;
        childLayout.y = parentLayout.y;
      } else {
        childLayout.x = parentLayout.x;
        childLayout.y = currentPos;
      }

      nodes.set(child.id, childLayout);

      const connectionId = `${parentNode.id}-${child.id}`;
      connections.set(connectionId, {
        id: connectionId,
        fromId: parentNode.id,
        toId: child.id,
        path: this.calculateConnectionPath(parentLayout, childLayout),
        startPoint: {
          x:
            this.orientation === "horizontal"
              ? parentLayout.x + parentLayout.width
              : parentLayout.x + parentLayout.width / 2,
          y:
            this.orientation === "horizontal"
              ? parentLayout.y + parentLayout.height / 2
              : parentLayout.y + parentLayout.height,
        },
        endPoint: {
          x:
            this.orientation === "horizontal"
              ? childLayout.x
              : childLayout.x + childLayout.width / 2,
          y:
            this.orientation === "horizontal"
              ? childLayout.y + childLayout.height / 2
              : childLayout.y,
        },
        controlPoints: [],
      });

      if (child.hasChildren) {
        this.calculateChildren(child, childLayout, nodes, connections, options);
      }

      if (this.orientation === "horizontal") {
        currentPos += childLayout.width + options.horizontalSpacing;
      } else {
        currentPos += childLayout.height + options.verticalSpacing;
      }
    }
  }

  private calculateTotalBounds(nodes: Map<string, NodeLayout>): Bounds {
    const layouts = Array.from(nodes.values());
    if (layouts.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const layout of layouts) {
      minX = Math.min(minX, layout.x);
      minY = Math.min(minY, layout.y);
      maxX = Math.max(maxX, layout.x + layout.width);
      maxY = Math.max(maxY, layout.y + layout.height);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

export { MapLayoutEngine as MapLayout };
export { TreeLayoutEngine as TreeLayout };
export { FishboneLayoutEngine as FishboneLayout };
export { TimelineLayoutEngine as TimelineLayout };
