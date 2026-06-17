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
  let minX = layout.x,
    minY = layout.y,
    maxX = layout.x + layout.width,
    maxY = layout.y + layout.height;
  for (const child of children) {
    updateChildrenBounds(child, nodes);
    const cl = nodes.get(child.id)!;
    const cb = cl.childrenBounds;
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

// ---------- NEW bottom-up MapLayoutEngine ----------
export class MapLayoutEngine implements LayoutEngine {
  private options: LayoutOptions;
  private _cache = new Map<string, NodeLayout>();
  private _connCache = new Map<string, ConnectionLayout>();
  private _dirty = new Set<string>();

  constructor(options?: Partial<LayoutOptions>) {
    this.options = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  }

  clearCache(): void {
    this._cache.clear();
    this._connCache.clear();
    this._dirty.clear();
  }

  private isDirty(id: string, dirty?: Set<string>) {
    return !dirty || dirty.has(id) || this._dirty.has(id);
  }
  private markDirty(id: string) {
    this._dirty.add(id);
  }

  private getNodeSize(node: MindMapNode): Size {
    if (this.options.nodeSizeProvider) {
      const s = this.options.nodeSizeProvider(node.id);
      if (s) return s;
    }
    return { width: this.estW(node), height: this.estH(node) };
  }

  private estW(node: MindMapNode): number {
    const l = node.title.length,
      fs = 14;
    return Math.max(120, Math.min(300, l * fs * 0.6 + 32));
  }
  private estH(node: MindMapNode): number {
    let h = 14 * 1.5 + 24;
    if (node.image) h += 70;
    if (node.markers?.length) h += 24;
    return Math.max(36, h);
  }

  private splitW(children: MindMapNode[]): number {
    if (children.length <= 1) return children.length;
    const tw = children.reduce((s, c) => s + this.getWeight(c), 0);
    const hw = tw / 2;
    let rw = 0,
      li = -1;
    for (let i = 0; i < children.length; i++) {
      const w = this.getWeight(children[i]!);
      const nrw = rw + w;
      if (nrw >= hw) {
        if (li >= 0 && nrw - hw > hw - rw) return li + 1;
        return i + 1;
      }
      rw = nrw;
      li = i;
    }
    return children.length;
  }
  private getWeight(n: MindMapNode) {
    return (
      this.getNodeSize(n).height + (this.options.verticalSpacing ?? 20) * 2
    );
  }

  calculate(
    root: MindMapNode,
    options?: LayoutOptions,
    dirtyNodes?: Set<string>,
  ): LayoutResult {
    const opts = { ...this.options, ...options };
    if (dirtyNodes?.size) for (const d of dirtyNodes) this.markDirty(d);
    const nodes = new Map<string, NodeLayout>();
    const connections = new Map<string, ConnectionLayout>();

    // 1. bottom-up subtree sizes
    const subtreeSizes = new Map<string, Size>();
    this.calcSubBounds(root, opts, subtreeSizes);

    // 2. top-down positions
    this.assignPos(root, 0, 0, opts, subtreeSizes, nodes, connections);

    // 3. center root relative to left/right children
    this.centerRoot(root, nodes, connections, opts);

    // 4. cache
    for (const [k, v] of nodes) this._cache.set(k, v);
    for (const [k, v] of connections) this._connCache.set(k, v);
    if (dirtyNodes) for (const d of dirtyNodes) this._dirty.delete(d);

    const bounds = this.calcBounds(nodes);
    updateChildrenBounds(root, nodes);
    return { nodes, connections, bounds };
  }

  private calcSubBounds(
    node: MindMapNode,
    opts: LayoutOptions,
    out: Map<string, Size>,
  ): Size {
    const sz = this.getNodeSize(node);
    const kids = node.attachedChildren;
    if (!kids.length) {
      out.set(node.id, sz);
      return sz;
    }
    const childSubs = kids.map((c) => this.calcSubBounds(c, opts, out));
    const totalH =
      childSubs.reduce((s, c) => s + c.height, 0) +
      (kids.length - 1) * opts.verticalSpacing;
    const maxW = Math.max(...childSubs.map((c) => c.width), 0);
    const subW = sz.width + opts.horizontalSpacing + maxW;
    const subH = Math.max(sz.height, totalH);
    const res = { width: subW, height: subH };
    out.set(node.id, res);
    return res;
  }

  private assignPos(
    node: MindMapNode,
    x: number,
    y: number,
    opts: LayoutOptions,
    subs: Map<string, Size>,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
  ): void {
    const sz = this.getNodeSize(node);
    const nl: NodeLayout = {
      id: node.id,
      x,
      y,
      width: sz.width,
      height: sz.height,
      childrenBounds: { x, y, width: sz.width, height: sz.height },
    };
    nodes.set(node.id, nl);
    const kids = node.attachedChildren;
    if (!kids.length) return;
    const { rightChildren, leftChildren } = this.splitKids(kids, opts);
    if (rightChildren.length)
      this.layoutSide(
        nl,
        rightChildren,
        "right",
        opts,
        subs,
        nodes,
        connections,
      );
    if (leftChildren.length)
      this.layoutSide(nl, leftChildren, "left", opts, subs, nodes, connections);
  }

  private splitKids(children: MindMapNode[], opts: LayoutOptions) {
    const n = this.splitW(children);
    return {
      rightChildren: children.slice(0, n),
      leftChildren: children.slice(n),
    };
  }

  private layoutSide(
    parent: NodeLayout,
    kids: MindMapNode[],
    side: "left" | "right",
    opts: LayoutOptions,
    subs: Map<string, Size>,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
  ): void {
    const h = opts.horizontalSpacing,
      v = opts.verticalSpacing;
    const childSubs = kids.map((c) => subs.get(c.id)!);
    const totalH =
      childSubs.reduce((s, c) => s + c.height, 0) + (kids.length - 1) * v;
    const startY = parent.y + parent.height / 2 - totalH / 2;
    const baseX = side === "right" ? parent.x + parent.width + h : parent.x - h;
    let curY = startY;
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i]!,
        sub = childSubs[i]!;
      const cSz = this.getNodeSize(child);
      const cx = side === "right" ? baseX : baseX - sub.width;
      const cy = curY + (sub.height - cSz.height) / 2;
      this.assignPos(child, cx, cy, opts, subs, nodes, connections);
      const cl = nodes.get(child.id)!;
      const cid = `${parent.id}-${child.id}`;
      connections.set(cid, {
        id: cid,
        fromId: parent.id,
        toId: child.id,
        path: this.connPath(parent, cl, side),
        startPoint: {
          x: side === "right" ? parent.x + parent.width : parent.x,
          y: parent.y + parent.height / 2,
        },
        endPoint: {
          x: side === "right" ? cl.x : cl.x + cl.width,
          y: cl.y + cl.height / 2,
        },
        controlPoints: [],
      });
      curY += sub.height + v;
    }
  }

  private connPath(
    from: NodeLayout,
    to: NodeLayout,
    side?: "left" | "right",
  ): string {
    const isR = side === "right" || (!side && to.x > from.x);
    const sx = isR ? from.x + from.width : from.x;
    const sy = from.y + from.height / 2;
    const ex = isR ? to.x : to.x + to.width;
    const ey = to.y + to.height / 2;
    const co = (this.options.horizontalSpacing ?? 40) * 0.4;
    return `M ${sx} ${sy} C ${sx + (isR ? co : -co)} ${sy}, ${ex + (isR ? -co : co)} ${ey}, ${ex} ${ey}`;
  }

  private centerRoot(
    root: MindMapNode,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    opts: LayoutOptions,
  ): void {
    const rl = nodes.get(root.id);
    if (!rl) return;
    const kids = root.attachedChildren;
    if (!kids.length) return;
    const { rightChildren, leftChildren } = this.splitKids(kids, opts);
    let rMinY = Infinity,
      rMaxY = -Infinity,
      rMaxX = -Infinity;
    let lMinY = Infinity,
      lMaxY = -Infinity,
      lMaxX = -Infinity;
    for (const c of rightChildren) {
      const l = nodes.get(c.id);
      if (l) {
        rMinY = Math.min(rMinY, l.y);
        rMaxY = Math.max(rMaxY, l.y + l.height);
        rMaxX = Math.max(rMaxX, l.x + l.width);
      }
    }
    for (const c of leftChildren) {
      const l = nodes.get(c.id);
      if (l) {
        lMinY = Math.min(lMinY, l.y);
        lMaxY = Math.max(lMaxY, l.y + l.height);
        lMaxX = Math.max(lMaxX, l.x + l.width);
      }
    }
    let cy = 0;
    if (rightChildren.length && leftChildren.length)
      cy = (rMinY + rMaxY + lMinY + lMaxY) / 4;
    else if (rightChildren.length) cy = (rMinY + rMaxY) / 2;
    else if (leftChildren.length) cy = (lMinY + lMaxY) / 2;
    rl.y = cy - rl.height / 2;
    rl.x = leftChildren.length ? lMaxX + opts.horizontalSpacing : 0;
    const shiftX = rl.x + rl.width + opts.horizontalSpacing;
    for (const c of rightChildren)
      this.shiftTree(
        c,
        shiftX - (nodes.get(c.id)?.x ?? 0),
        0,
        nodes,
        connections,
      );
  }

  private shiftTree(
    node: MindMapNode,
    dx: number,
    dy: number,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
  ): void {
    const l = nodes.get(node.id);
    if (!l) return;
    l.x += dx;
    l.y += dy;
    l.childrenBounds.x += dx;
    l.childrenBounds.y += dy;
    for (const [, c] of connections) {
      if (c.fromId === node.id) {
        c.startPoint.x += dx;
        c.startPoint.y += dy;
        c.path = this.rebuild(c);
      }
      if (c.toId === node.id) {
        c.endPoint.x += dx;
        c.endPoint.y += dy;
        c.path = this.rebuild(c);
      }
    }
    for (const c of node.attachedChildren)
      this.shiftTree(c, dx, dy, nodes, connections);
  }

  private rebuild(c: ConnectionLayout): string {
    const dx = c.endPoint.x - c.startPoint.x;
    const co = Math.max(40, Math.abs(dx) * 0.4);
    const c1x = c.startPoint.x + (dx >= 0 ? co : -co);
    const c2x = c.endPoint.x - (dx >= 0 ? co : -co);
    return `M ${c.startPoint.x} ${c.startPoint.y} C ${c1x} ${c.startPoint.y}, ${c2x} ${c.endPoint.y}, ${c.endPoint.x} ${c.endPoint.y}`;
  }

  calculateNodeSize(node: MindMapNode): Size {
    return this.getNodeSize(node);
  }
  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    return this.connPath(from, to);
  }

  private calcBounds(nodes: Map<string, NodeLayout>): Bounds {
    const ls = Array.from(nodes.values());
    if (!ls.length) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const l of ls) {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + l.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  private calcTotalBounds(nodes: Map<string, NodeLayout>): Bounds {
    return this.calcBounds(nodes);
  }
}

// ---------- TreeLayoutEngine (keep existing) ----------
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
    const rootLayout = this.calcNode(root, opts);
    nodes.set(root.id, rootLayout);
    this.calcChildren(root, rootLayout, nodes, connections, opts);
    const bounds = this.calcBounds(nodes);
    updateChildrenBounds(root, nodes);
    return { nodes, connections, bounds };
  }
  calculateNodeSize(node: MindMapNode): Size {
    return { width: this.estW(node), height: this.estH(node) };
  }
  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    return `M ${from.x + from.width / 2} ${from.y + from.height} L ${to.x + to.width / 2} ${to.y}`;
  }
  private calcNode(node: MindMapNode, options: LayoutOptions): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estW(node),
      height: this.estH(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }
  private estW(node: MindMapNode) {
    const l = node.title.length;
    return Math.max(100, Math.min(200, l * 14 * 0.6 + 32));
  }
  private estH(node: MindMapNode) {
    return 40;
  }
  private calcChildren(
    parent: MindMapNode,
    pl: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const kids = parent.attachedChildren;
    if (!kids.length) return;
    const cls: NodeLayout[] = [];
    for (const c of kids) {
      const cl = this.calcNode(c, options);
      cls.push(cl);
      nodes.set(c.id, cl);
    }
    const totalW =
      cls.reduce((s, l) => s + l.width, 0) +
      (cls.length - 1) * options.horizontalSpacing;
    let cx = pl.x + pl.width / 2 - totalW / 2;
    for (const cl of cls) {
      cl.x = cx;
      cl.y = pl.y + pl.height + options.verticalSpacing;
      const id = `${parent.id}-${cl.id}`;
      connections.set(id, {
        id,
        fromId: parent.id,
        toId: cl.id,
        path: this.calculateConnectionPath(pl, cl),
        startPoint: { x: pl.x + pl.width / 2, y: pl.y + pl.height },
        endPoint: { x: cl.x + cl.width / 2, y: cl.y },
        controlPoints: [],
      });
      cx += cl.width + options.horizontalSpacing;
      const child = kids.find((k) => k.id === cl.id);
      if (child) this.calcChildren(child, cl, nodes, connections, options);
    }
  }
  private calcBounds(nodes: Map<string, NodeLayout>): Bounds {
    const ls = Array.from(nodes.values());
    if (!ls.length) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const l of ls) {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + l.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

// ---------- FishboneLayoutEngine (keep existing) ----------
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
    const rootLayout = this.calcNode(root, opts);
    nodes.set(root.id, rootLayout);
    this.calcChildren(root, rootLayout, nodes, connections, opts);
    const bounds = this.calcBounds(nodes);
    updateChildrenBounds(root, nodes);
    return { nodes, connections, bounds };
  }
  calculateNodeSize(node: MindMapNode): Size {
    return { width: this.estW(node), height: this.estH(node) };
  }
  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    const sx = from.x + from.width,
      sy = from.y + from.height / 2;
    const ex = to.x,
      ey = to.y + to.height / 2;
    const mx = (sx + ex) / 2;
    return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ey} L ${ex} ${ey}`;
  }
  private calcNode(node: MindMapNode, options: LayoutOptions): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estW(node),
      height: this.estH(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }
  private estW(node: MindMapNode) {
    return Math.max(80, Math.min(150, node.title.length * 8 + 32));
  }
  private estH(node: MindMapNode) {
    return 30;
  }
  private calcChildren(
    parent: MindMapNode,
    pl: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const kids = parent.attachedChildren;
    if (!kids.length) return;
    const mly = pl.y + pl.height / 2;
    const baseX = pl.x + pl.width + 20;
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i];
      if (!child) continue;
      const cl = this.calcNode(child, options);
      const top = i % 2 === 0,
        angle = top ? -45 : 45;
      const off = (i + 1) * 40;
      cl.x = baseX + off * Math.cos((angle * Math.PI) / 180);
      cl.y = mly + off * Math.sin((angle * Math.PI) / 180) - cl.height / 2;
      nodes.set(child.id, cl);
      const id = `${parent.id}-${child.id}`;
      connections.set(id, {
        id,
        fromId: parent.id,
        toId: child.id,
        path: this.calculateConnectionPath(pl, cl),
        startPoint: { x: pl.x + pl.width, y: mly },
        endPoint: { x: cl.x, y: cl.y + cl.height / 2 },
        controlPoints: [],
      });
      if (child.hasChildren)
        this.calcChildren(child, cl, nodes, connections, options);
    }
  }
  private calcBounds(nodes: Map<string, NodeLayout>): Bounds {
    const ls = Array.from(nodes.values());
    if (!ls.length) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const l of ls) {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + l.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

// ---------- TimelineLayoutEngine (keep existing) ----------
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
    const rootLayout = this.calcNode(root, opts);
    nodes.set(root.id, rootLayout);
    this.calcChildren(root, rootLayout, nodes, connections, opts);
    const bounds = this.calcBounds(nodes);
    updateChildrenBounds(root, nodes);
    return { nodes, connections, bounds };
  }
  calculateNodeSize(node: MindMapNode): Size {
    return { width: this.estW(node), height: this.estH(node) };
  }
  calculateConnectionPath(from: NodeLayout, to: NodeLayout): string {
    if (this.orientation === "horizontal") {
      return `M ${from.x + from.width} ${from.y + from.height / 2} L ${to.x} ${to.y + to.height / 2}`;
    }
    return `M ${from.x + from.width / 2} ${from.y + from.height} L ${to.x + to.width / 2} ${to.y}`;
  }
  private calcNode(node: MindMapNode, options: LayoutOptions): NodeLayout {
    return {
      id: node.id,
      x: 0,
      y: 0,
      width: this.estW(node),
      height: this.estH(node),
      childrenBounds: { x: 0, y: 0, width: 0, height: 0 },
    };
  }
  private estW(node: MindMapNode) {
    return Math.max(100, Math.min(200, node.title.length * 8 + 32));
  }
  private estH(node: MindMapNode) {
    return 40;
  }
  private calcChildren(
    parent: MindMapNode,
    pl: NodeLayout,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>,
    options: LayoutOptions,
  ): void {
    const kids = parent.attachedChildren;
    if (!kids.length) return;
    let cp =
      this.orientation === "horizontal"
        ? pl.x + pl.width + options.horizontalSpacing
        : pl.y + pl.height + options.verticalSpacing;
    for (const child of kids) {
      const cl = this.calcNode(child, options);
      if (this.orientation === "horizontal") {
        cl.x = cp;
        cl.y = pl.y;
      } else {
        cl.x = pl.x;
        cl.y = cp;
      }
      nodes.set(child.id, cl);
      const id = `${parent.id}-${child.id}`;
      connections.set(id, {
        id,
        fromId: parent.id,
        toId: child.id,
        path: this.calculateConnectionPath(pl, cl),
        startPoint: {
          x:
            this.orientation === "horizontal"
              ? pl.x + pl.width
              : pl.x + pl.width / 2,
          y:
            this.orientation === "horizontal"
              ? pl.y + pl.height / 2
              : pl.y + pl.height,
        },
        endPoint: {
          x: this.orientation === "horizontal" ? cl.x : cl.x + cl.width / 2,
          y: this.orientation === "horizontal" ? cl.y + cl.height / 2 : cl.y,
        },
        controlPoints: [],
      });
      if (child.hasChildren)
        this.calcChildren(child, cl, nodes, connections, options);
      cp +=
        this.orientation === "horizontal"
          ? cl.width + options.horizontalSpacing
          : cl.height + options.verticalSpacing;
    }
  }
  private calcBounds(nodes: Map<string, NodeLayout>): Bounds {
    const ls = Array.from(nodes.values());
    if (!ls.length) return { x: 0, y: 0, width: 0, height: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const l of ls) {
      minX = Math.min(minX, l.x);
      minY = Math.min(minY, l.y);
      maxX = Math.max(maxX, l.x + l.width);
      maxY = Math.max(maxY, l.y + l.height);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
}

export { MapLayoutEngine as MapLayout };
export { TreeLayoutEngine as TreeLayout };
export { FishboneLayoutEngine as FishboneLayout };
export { TimelineLayoutEngine as TimelineLayout };
