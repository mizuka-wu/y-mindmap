import { App, Leafer } from "leafer-ui";
import {
  EditorState,
  RootTopic,
  MindMapNode,
  Transaction,
  Selection,
} from "@y-mindmap/state";
import type { RelationshipData } from "@y-mindmap/state";
import type { ConnectionLayout } from "@y-mindmap/layout";
import {
  MapLayoutEngine,
  AnimatedLayoutEngine,
  type LayoutEngine,
  type LayoutResult,
} from "@y-mindmap/layout";
import { NodeViewFactory } from "./node-views/node-view-factory";
import { TopicNodeView } from "./node-views/topic-node-view";
import { BranchNodeView } from "./node-views/containers/branch-node-view";
import { ConnectionNodeView } from "./node-views/connection-node-view";
import {
  RelationshipNodeView,
  RelationshipTitleNodeView,
} from "./node-views/relationships/relationship-node-view";
import { DirtyFlag, Bounds } from "./core/node-view";
import { themeManager, type ThemeChangeListener } from "./core/theme-manager";
import type { ThemeData, Point } from "@y-mindmap/core";
import { StyleKey, DEFAULT_TOPIC_STYLE } from "@y-mindmap/core";
import { styleManager } from "./core/style-manager";

export interface EditorViewConfig {
  container: HTMLElement;
  state?: EditorState;
  layoutEngine?: LayoutEngine;
  enableAnimations?: boolean;
  animationDuration?: number;
}

export class EditorView {
  private app: App;
  private nodeViewFactory: NodeViewFactory;
  private layoutEngine: LayoutEngine;
  private animatedLayoutEngine: AnimatedLayoutEngine | null = null;
  private enableAnimations: boolean;
  private animationDuration: number;

  private topicLayer: Leafer;
  private connectionLayer: Leafer;
  private overlayLayer: Leafer;

  private container: HTMLElement;
  private state: EditorState | null = null;
  private _rootView: TopicNodeView | null = null;
  private _rootBranch: BranchNodeView | null = null;
  private _branchMap: Map<string, BranchNodeView> = new Map();
  private _relationshipViews: Map<string, RelationshipNodeView> = new Map();
  private _relationshipTitleViews: Map<string, RelationshipTitleNodeView> =
    new Map();

  private _updateScheduled: boolean = false;
  private _isUpdating: boolean = false;
  private _pendingDirtyNodeIds: Set<string> = new Set();
  private _isAnimating: boolean = false;

  private _themeUnsubscribe: (() => void) | null = null;
  private _hoveredNodeId: string | null = null;
  constructor(config: EditorViewConfig) {
    this.container = config.container;
    this.layoutEngine = config.layoutEngine || new MapLayoutEngine();
    this.enableAnimations = config.enableAnimations ?? true;
    this.animationDuration = config.animationDuration ?? 300;
    this.nodeViewFactory = new NodeViewFactory();

    if (this.enableAnimations) {
      this.animatedLayoutEngine = new AnimatedLayoutEngine(this.layoutEngine, {
        duration: this.animationDuration,
        easing: "ease-out",
        stagger: 30,
      });
    }

    this.app = new App({
      view: config.container,
      type: "viewport",
    });

    this.connectionLayer = this.app.addLeafer({ type: "draw" });
    this.topicLayer = this.app.addLeafer({ type: "draw" });
    this.overlayLayer = this.app.addLeafer({ type: "draw" });

    this._themeUnsubscribe = themeManager.onThemeChange(() => {
      this._refreshAllColorStyles();
    });

    this.container.addEventListener("pointermove", this._onPointerHover);
    this.container.addEventListener("pointerleave", this._onPointerLeave);

    if (config.state) {
      this.setState(config.state);
    }
  }

  setState(state: EditorState): void {
    this.state = state;
    this.scheduleUpdate();
  }

  getState(): EditorState | null {
    return this.state;
  }

  dispatch(tr: Transaction): void {
    if (!this.state) return;

    const oldState = this.state;
    const newState = this.state.apply(tr);
    this.state = newState;

    const source = tr.getMeta("source");
    if (source === "undo" || source === "redo") {
      this._fullRebuild();
    } else {
      this._routeTransactionToBranchViews(tr);
      this.scheduleUpdate();
    }
  }

  private _fullRebuild(): void {
    if (!this.state) return;

    if (this._rootBranch) {
      this._rootBranch.destroy();
      this._rootBranch = null;
    }

    this._rootView = null;
    this._branchMap.clear();
    this.nodeViewFactory.clear();

    this.topicLayer.clear();
    this.connectionLayer.clear();

    this.scheduleUpdate();
  }

  private _routeTransactionToBranchViews(tr: Transaction): void {
    for (const step of tr.steps) {
      switch (step.type) {
        case "addNode": {
          const parentBranch = this._branchMap.get(step.parentId);
          if (parentBranch) {
            parentBranch.onNodeChanged("addTopic", {
              topic: step.node,
              type: step.nodeType || "attached",
            });
          }
          break;
        }
        case "removeNode": {
          const branch = this._branchMap.get(step.id);
          if (branch) {
            branch.destroy();
          }

          const parentId = this._findParentId(step.id);
          if (parentId) {
            const parentBranch = this._branchMap.get(parentId);
            if (parentBranch) {
              parentBranch.onNodeChanged("removeTopic", {
                topicId: step.id,
                type: "attached",
              });
            }
          }

          this._branchMap.delete(step.id);
          this.nodeViewFactory.removeViewsByNodeId(step.id);
          break;
        }
        case "updateNode": {
          const branch = this._branchMap.get(step.id);
          if (branch) {
            branch.refreshColorStyles();
            branch.getTopicView()?.invalidatePaint();
            branch.invalidateLayout();
          }
          break;
        }
        case "moveNode": {
          const branch = this._branchMap.get(step.id);
          if (branch) {
            branch.invalidateLayout();
          }
          break;
        }
      }
    }
  }

  private _findParentId(childId: string): string | null {
    if (!this.state) return null;
    const parent = this.state.doc.findParent(childId);
    return parent ? parent.id : null;
  }

  private scheduleUpdate(): void {
    if (this._updateScheduled) return;

    this._updateScheduled = true;
    Promise.resolve().then(() => {
      this._updateScheduled = false;
      this.performUpdate();
    });
  }

  private performUpdate(): void {
    if (!this.state || this._isUpdating) return;

    this._isUpdating = true;

    try {
      const root = this.state.doc.root;

      this.ensureRootView(root);

      const dirtyNodeIds = this._rootView!.collectDirtyNodeIds();

      if (dirtyNodeIds.size > 0) {
        if (this.animatedLayoutEngine && this.enableAnimations) {
          const layoutResult = this.animatedLayoutEngine.calculateAnimated(
            root,
            (nodeId, position) => {
              const view = this.nodeViewFactory.getTopicView(nodeId);
              if (view) {
                view.setPosition(position);
              }
            },
            () => {
              this._isAnimating = false;
              this.updateConnectionViews();
            },
          );
          this._isAnimating = true;
          this.applyLayoutToViews(root, layoutResult);
        } else {
          const layoutResult = this.layoutEngine.calculate(
            root,
            this._getLayoutOptions(),
            dirtyNodeIds,
          );
          this.applyLayoutToViews(root, layoutResult);
        }
      }

      this.validateViews(root);
      if (!this._isAnimating) {
        this.updateConnectionViews();
      }
      this.updateRelationshipViews();
      this.updateSelection();

      this._pendingDirtyNodeIds.clear();
    } finally {
      this._isUpdating = false;
    }

  }

  private validateViews(node: MindMapNode): void {
    const view = this.nodeViewFactory.getTopicView(node.id);
    if (view) {
      view.validate();
    }

    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.validateViews(child);
      }
    }
  }

  private ensureRootView(root: MindMapNode): void {
    if (!this._rootView) {
      this._rootView = this.nodeViewFactory.createTopicView(root);
      this.topicLayer.add(this._rootView.group);
    }

    if (!this._rootBranch) {
      this._rootBranch = new BranchNodeView(root);
      this._rootBranch.setTopicView(this._rootView);
      this._branchMap.set(root.id, this._rootBranch);
    }

    this.syncNodeViews(root, this._rootView, this._rootBranch);
  }

  private syncNodeViews(
    node: MindMapNode,
    parentView: TopicNodeView,
    parentBranch: BranchNodeView,
  ): void {
    for (const children of Object.values(node.children)) {
      for (const child of children) {
        let childView = this.nodeViewFactory.getTopicView(child.id);
        if (!childView) {
          childView = this.nodeViewFactory.createTopicView(child);
          parentView.addChild(childView);
        } else {
          childView.updateNode(child);
        }

        const existingBranch = this._branchMap.get(child.id);
        if (!existingBranch || existingBranch.isDisposed()) {
          if (existingBranch) {
            this._branchMap.delete(child.id);
          }
          const childBranch = new BranchNodeView(child);
          childBranch.setTopicView(childView);
          parentBranch.addChildBranch(childBranch, "attached");
          this._branchMap.set(child.id, childBranch);
          childBranch.refreshColorStyles();
        }

        this.syncNodeViews(child, childView, this._branchMap.get(child.id)!);
      }
    }
  }

  private applyLayoutToViews(
    node: MindMapNode,
    layoutResult: LayoutResult,
  ): void {
    const nodeLayout = layoutResult.nodes.get(node.id);
    if (!nodeLayout) return;

    const view = this.nodeViewFactory.getTopicView(node.id);
    if (view) {
      view.setPosition({ x: nodeLayout.x, y: nodeLayout.y });
      view.setSize({ width: nodeLayout.width, height: nodeLayout.height });
    }

    for (const children of Object.values(node.children)) {
      for (const child of children) {
        this.applyLayoutToViews(child, layoutResult);
      }
    }
  }

  private updateConnectionViews(): void {
    if (!this.state) return;

    const root = this.state.doc.root;
    const layoutResult = this.layoutEngine.calculate(
      root,
      this._getLayoutOptions(),
    );

    const existingConnectionIds = new Set<string>();
    for (const [connectionId, connectionLayout] of layoutResult.connections) {
      existingConnectionIds.add(connectionId);
      const view = this.nodeViewFactory.createConnectionView(
        connectionId,
        connectionLayout as any,
      );
      if (!view.group.parent) {
        this.connectionLayer.add(view.group);
      }
      view.validate();
    }
  }

  private updateRelationshipViews(): void {
    for (const [relId, relView] of this._relationshipViews) {
      relView.updateEndpoints();
      relView.validate();
    }
  }

  setRelationships(relationships: RelationshipData[]): void {
    for (const [relId, relView] of this._relationshipViews) {
      relView.destroy();
    }
    this._relationshipViews.clear();
    this._relationshipTitleViews.clear();

    for (const relData of relationships) {
      const relNode = {
        id: relData.id,
        title: relData.title || "",
        type: "relationship",
        children: {},
        markers: [],
        labels: [],
        attachments: [],
        mathFormulas: [],
        codeBlocks: [],
      } as unknown as MindMapNode;

      const relView = this.nodeViewFactory.createRelationshipView(
        relNode,
        relData,
      );
      const titleView = this.nodeViewFactory.createRelationshipTitleView(
        relNode,
        relData.title || "",
      );

      const end1View = this.nodeViewFactory.getTopicView(relData.end1Id);
      const end2View = this.nodeViewFactory.getTopicView(relData.end2Id);

      relView.setEnd1View(end1View || null);
      relView.setEnd2View(end2View || null);
      relView.setTitleView(titleView);

      this.overlayLayer.add(relView.group);
      this.overlayLayer.add(titleView.group);

      this._relationshipViews.set(relData.id, relView);
      this._relationshipTitleViews.set(relData.id, titleView);
    }
  }

  getRelationshipView(relId: string): RelationshipNodeView | undefined {
    return this._relationshipViews.get(relId);
  }

  getRelationshipTitleView(
    relId: string,
  ): RelationshipTitleNodeView | undefined {
    return this._relationshipTitleViews.get(relId);
  }

  private updateSelection(): void {
    if (!this.state) return;

    const selectedIds = new Set(this.state.selection.selectedIds);

    // Clear deselected nodes
    for (const [, view] of this.nodeViewFactory.getAllTopicViews()) {
      if (!selectedIds.has(view.nodeId)) {
        view.setSelected(false);
      }
    }

    // Set selected nodes
    for (const nodeId of selectedIds) {
      const view = this.nodeViewFactory.getTopicView(nodeId);
      if (view) {
        view.setSelected(true);
      }
    }
  }

  selectNode(nodeId: string): void {
    if (!this.state) return;

    const tr = new Transaction(this.state.workbook, this.state.selection);
    tr.setSelection(Selection.single(nodeId));
    this.dispatch(tr);
  }

  selectNodes(nodeIds: string[]): void {
    if (!this.state) return;

    const tr = new Transaction(this.state.workbook, this.state.selection);
    tr.setSelection(Selection.multiple(nodeIds));
    this.dispatch(tr);
  }

  clearSelection(): void {
    if (!this.state) return;

    const tr = new Transaction(this.state.workbook, this.state.selection);
    tr.setSelection(Selection.empty());
    this.dispatch(tr);
  }

  getSelection(): string[] {
    if (!this.state) return [];
    return Array.from(this.state.selection.selectedIds);
  }

  getZoom(): number {
    const layer = this.topicLayer;
    return layer.scaleX ?? 1;
  }

  zoomTo(level: number): void {
    this._applyCameraTransform(level, undefined, undefined);
  }

  zoomIn(): void {
    this.zoomTo(Math.min(this.getZoom() * 1.2, 10));
  }

  zoomOut(): void {
    this.zoomTo(Math.max(this.getZoom() * 0.8, 0.1));
  }

  panTo(x: number, y: number): void {
    this._applyCameraTransform(undefined, x, y);
  }

  panBy(dx: number, dy: number): void {
    const layer = this.topicLayer;
    this._applyCameraTransform(undefined, (layer.x ?? 0) + dx, (layer.y ?? 0) + dy);
  }

  fitToContent(): void {
    const content = this.getContentBounds();
    if (content.width === 0 || content.height === 0) return;

    const container = this.container.getBoundingClientRect();
    const padding = 40;
    const availW = container.width - padding * 2;
    const availH = container.height - padding * 2;

    const scale = Math.min(availW / content.width, availH / content.height, 2);
    const centerX = (container.width - content.width * scale) / 2 - content.x * scale;
    const centerY = (container.height - content.height * scale) / 2 - content.y * scale;

    this._applyCameraTransform(scale, centerX, centerY);
  }

  private _applyCameraTransform(scale?: number, x?: number, y?: number): void {
    for (const layer of [this.connectionLayer, this.topicLayer, this.overlayLayer]) {
      if (scale !== undefined) {
        layer.scaleX = scale;
        layer.scaleY = scale;
      }
      if (x !== undefined) layer.x = x;
      if (y !== undefined) layer.y = y;
    }
  }

  setTheme(theme: ThemeData): void {
    themeManager.setTheme(theme);
    this._refreshAllColorStyles();
  }

  setThemeById(themeId: string): void {
    themeManager.setThemeById(themeId);
    this._refreshAllColorStyles();
  }

  getTheme(): ThemeData {
    return themeManager.getTheme();
  }

  registerTheme(theme: ThemeData): void {
    themeManager.registerTheme(theme);
  }

  getAvailableThemes(): Array<{ id: string; title: string }> {
    return themeManager.getAvailableThemes();
  }

  exportTheme(themeId?: string): ThemeData | null {
    return themeManager.exportTheme(themeId);
  }

  importTheme(data: ThemeData): void {
    themeManager.importTheme(data);
  }

  getBackgroundColor(): string | undefined {
    return themeManager.getBackgroundColor();
  }

  private _getLayoutOptions(): any {
    return {
      nodeSpacingResolver: (nodeId: string): [number, number] | null => {
        const view = this.nodeViewFactory.getTopicView(nodeId);
        if (!view) return null;
        const majorSpacing = styleManager.getStyleValue(
          view,
          StyleKey.MAJOR_SPACING,
        );
        const minorSpacing = styleManager.getStyleValue(
          view,
          StyleKey.MINOR_SPACING,
        );
        if (majorSpacing === undefined && minorSpacing === undefined)
          return null;
        return [majorSpacing ?? 40, minorSpacing ?? 20];
      },
    };
  }

  private _refreshAllColorStyles(): void {
    styleManager.invalidateAllCache();
    if (this._rootBranch) {
      this._rootBranch.refreshColorStyles();
    }
    for (const relView of this._relationshipViews.values()) {
      relView.refreshColorStyles();
    }
  }

  getTopicView(nodeId: string): TopicNodeView | undefined {
    return this.nodeViewFactory.getTopicView(nodeId);
  }

  getConnectionView(connectionId: string): ConnectionNodeView | undefined {
    return this.nodeViewFactory.getConnectionView(connectionId);
  }

  getAllTopicViews(): Map<string, TopicNodeView> {
    return this.nodeViewFactory.getAllTopicViews();
  }

  getOverlayLayer(): Leafer {
    return this.overlayLayer;
  }

  getTopicLayer(): Leafer {
    return this.topicLayer;
  }

  getConnectionLayer(): Leafer {
    return this.connectionLayer;
  }

  // ── Coordinate Conversion ──

  clientToWorld(clientX: number, clientY: number): Point {
    const layer = this.topicLayer;
    const scale = layer.scaleX ?? 1;
    const layerX = layer.x ?? 0;
    const layerY = layer.y ?? 0;
    const rect = this.container.getBoundingClientRect();
    return {
      x: (clientX - rect.left - layerX) / scale,
      y: (clientY - rect.top - layerY) / scale,
    };
  }

  // ── Hit Testing ──

  getNodeBounds(nodeId: string): Bounds | null {
    const view = this.nodeViewFactory.getTopicView(nodeId);
    if (!view) return null;

    return view.getBounds();
  }

  getNodeAtPoint(worldPoint: Point): string | null {
    for (const [, view] of this.nodeViewFactory.getAllTopicViews()) {
      if (!view.isVisible() || view.isForcedInvisible()) continue;

      const bounds = view.getAbsoluteBounds();
      if (
        worldPoint.x >= bounds.x &&
        worldPoint.x <= bounds.x + bounds.width &&
        worldPoint.y >= bounds.y &&
        worldPoint.y <= bounds.y + bounds.height
      ) {
        return view.nodeId;
      }
    }

    return null;
  }

  // ── Viewport ──

  updateState(state: EditorState): void {
    this.setState(state);
  }

  getViewportController(): { getPan: () => { x: number; y: number } } {
    return {
      getPan: () => ({ x: this.topicLayer.x ?? 0, y: this.topicLayer.y ?? 0 }),
    };
  }

  getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const rect = this.container.getBoundingClientRect();
    return {
      x: -(this.app.x ?? 0) / ((this.app as any).zoom ?? 1),
      y: -(this.app.y ?? 0) / ((this.app as any).zoom ?? 1),
      width: rect.width / ((this.app as any).zoom ?? 1),
      height: rect.height / ((this.app as any).zoom ?? 1),
    };
  }

  // ── Collaboration Stubs ──

  updateRemoteCursors(_cursors: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  updateRemoteSelections(_selections: Map<number, any>): void {
    // Stub - collaboration not implemented yet
  }

  // ── Export ──

  getDom(): HTMLElement {
    return this.container;
  }

  getCanvas(): HTMLCanvasElement {
    return this.app.canvas as unknown as HTMLCanvasElement;
  }

  getContentBounds(): Bounds {
    const allBounds: Bounds[] = [];
    const root = this.state?.doc.root;
    if (root == null) return { x: 0, y: 0, width: 0, height: 0 };
    root.descendants((node) => {
      const bounds = this.getNodeBounds(node.id);
      if (bounds) allBounds.push(bounds);
    });

    if (allBounds.length === 0) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    const minX = Math.min(...allBounds.map((b) => b.x));
    const minY = Math.min(...allBounds.map((b) => b.y));
    const maxX = Math.max(...allBounds.map((b) => b.x + b.width));
    const maxY = Math.max(...allBounds.map((b) => b.y + b.height));

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // ── Lifecycle ──

  destroy(): void {
    this.container.removeEventListener("pointermove", this._onPointerHover);
    this.container.removeEventListener("pointerleave", this._onPointerLeave);

    if (this._themeUnsubscribe) {
      this._themeUnsubscribe();
      this._themeUnsubscribe = null;
    }
    for (const relView of this._relationshipViews.values()) {
      relView.destroy();
    }
    this._relationshipViews.clear();
    this._relationshipTitleViews.clear();
    this._rootBranch?.destroy();
    this._rootBranch = null;
    this._branchMap.clear();
    this.nodeViewFactory.clear();
    this.app.destroy();
  }

  private _onPointerHover = (e: PointerEvent): void => {
    const worldPoint = this.clientToWorld(e.clientX, e.clientY);
    const nodeId = this.getNodeAtPoint(worldPoint);

    if (nodeId !== this._hoveredNodeId) {
      if (this._hoveredNodeId) {
        const prevView = this.nodeViewFactory.getTopicView(this._hoveredNodeId);
        if (prevView && !prevView.isSelected()) {
          prevView.setHovered(false);
        }
      }
      this._hoveredNodeId = nodeId;
      if (nodeId) {
        const view = this.nodeViewFactory.getTopicView(nodeId);
        if (view && !view.isSelected()) {
          view.setHovered(true);
        }
        this.container.style.cursor = "pointer";
      } else {
        this.container.style.cursor = "default";
      }
    }
  };

  private _onPointerLeave = (): void => {
    if (this._hoveredNodeId) {
      const prevView = this.nodeViewFactory.getTopicView(this._hoveredNodeId);
      if (prevView) {
        prevView.setHovered(false);
      }
      this._hoveredNodeId = null;
    }
    this.container.style.cursor = "default";
  };
}

export default EditorView;
