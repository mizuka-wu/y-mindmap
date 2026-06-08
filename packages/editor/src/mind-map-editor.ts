import {
  EditorState,
  MindMapDocument,
  MindMapNode,
  Selection,
  Transaction,
} from "@y-mindmap/state";
import { EditorView } from "@y-mindmap/view";
import { LayoutEngine, MapLayout } from "@y-mindmap/layout";
import {
  Command,
  CommandRegistry,
  addSubTopic,
  addSiblingTopic,
  deleteNode,
  toggleFold,
  selectNode,
  selectAll,
  deselectAll,
  undo,
  redo,
  navigateUp,
  navigateDown,
  navigateLeft,
  navigateRight,
  updateTitle,
  moveNodeUp,
  moveNodeDown,
  setStructureClass,
  updateStyle,
  copy,
  cut,
  paste,
  duplicate,
} from "@y-mindmap/commands";
import {
  InteractionManager,
  createSelectHandler,
  createDragHandler,
  createZoomHandler,
  createMultiSelectHandler,
  createViewportDragHandler,
  createBoxSelectHandler,
  createTextEditHandler,
  InlineEditor,
  RichTextInlineEditor,
  InertialScroll,
  GestureRecognizer,
} from "@y-mindmap/interaction";
import { UIManager, UIContext } from "@y-mindmap/ui";
import { XMindImporter, XMindExporter } from "@y-mindmap/formats/xmind";
import { Bounds, Point, AttributeTitle } from "@y-mindmap/core";
import * as Y from "yjs";
import {
  createYDocBinding,
  syncTopicToY,
  syncYToTopic,
  topicDataToYMap,
  YDocBinding,
  CollaboratorManager,
  CollaboratorState,
  CollaboratorUser,
  LockConflict,
} from "@y-mindmap/collab";
import { PluginManager, Plugin, PluginEvent } from "@y-mindmap/plugins";

export interface MindMapEditorOptions {
  container: HTMLElement;
  doc?: MindMapDocument;
  layoutEngine?: LayoutEngine;
  readOnly?: boolean;
  keymap?: Record<string, string>;
  showToolbar?: boolean;
  showPropertyPanel?: boolean;
  showStatusBar?: boolean;
  showMiniMap?: boolean;
  enableInertialScroll?: boolean;
  enableGestures?: boolean;
  enableRichText?: boolean;
  ydoc?: Y.Doc;
  user?: CollaboratorUser;
  plugins?: Plugin[];
}

export class MindMapEditor {
  private state: EditorState;
  private view: EditorView;
  private commandRegistry: CommandRegistry;
  private interactionManager: InteractionManager;
  private uiManager: UIManager;
  private container: HTMLElement;
  private readOnly: boolean;
  private enableRichText: boolean;

  private inlineEditor: InlineEditor;
  private richTextInlineEditor: RichTextInlineEditor;
  private inertialScroll: InertialScroll | null = null;
  private gestureRecognizer: GestureRecognizer | null = null;
  private xmindImporter: XMindImporter;
  private xmindExporter: XMindExporter;

  private ydoc: Y.Doc | null = null;
  private binding: YDocBinding | null = null;
  private collaborators: CollaboratorManager | null = null;
  private pluginManager: PluginManager;
  private uiContext: UIContext;

  constructor(options: MindMapEditorOptions) {
    this.container = options.container;
    this.readOnly = options.readOnly || false;
    this.enableRichText = options.enableRichText || false;

    const doc = options.doc || MindMapDocument.createEmpty();
    this.state = EditorState.create(doc);

    this.commandRegistry = new CommandRegistry();
    this.registerDefaultCommands();

    if (options.keymap) {
      this.commandRegistry.setKeymap(options.keymap);
    }

    this.interactionManager = new InteractionManager(this.state, (tr) =>
      this.dispatch(tr),
    );
    this.registerDefaultHandlers();

    this.uiContext = {
      state: this.state,
      dispatch: (tr) => this.dispatch(tr),
      executeCommand: (name, args) => this.executeCommand(name, args),
      getSelection: () => this.getSelection(),
      getDocument: () => this.getDocument().root,
      getZoom: () => (this.view ? this.view.getZoom() : 1),
      setZoom: (zoom) => this.view?.zoomTo(zoom),
      panTo: (x, y) => this.view?.panTo({ x, y }),
      fitToContent: () => this.view?.fitToContent(),
      getNodeBounds: (nodeId) =>
        this.view ? this.getNodeBounds(nodeId) : null,
      getViewportBounds: () =>
        this.view
          ? this.getViewportBounds()
          : { x: 0, y: 0, width: 0, height: 0 },
      canUndo: () => this.canUndo(),
      canRedo: () => this.canRedo(),
    };

    this.uiManager = new UIManager(
      {
        container: options.container,
        showToolbar: options.showToolbar,
        showPropertyPanel: options.showPropertyPanel,
        showStatusBar: options.showStatusBar,
        showMiniMap: options.showMiniMap,
      },
      this.uiContext,
    );

    const layoutEngine = options.layoutEngine || new MapLayout();
    this.view = new EditorView({
      container: this.uiManager.getEditorContainer(),
      state: this.state,
      layoutEngine,
      enableAnimation: true,
    });

    this.inlineEditor = new InlineEditor({
      container: this.container,
      onSubmit: (nodeId, title) => {
        this.executeCommand("updateTitle", { nodeId, title });
      },
      onCancel: () => {},
      getViewportTransform: () => ({
        zoom: this.view.getZoom(),
        pan: this.view.getViewportController().getPan(),
      }),
    });

    this.richTextInlineEditor = new RichTextInlineEditor({
      container: this.container,
      onSubmit: (nodeId, title) => {
        this.handleRichTextUpdate(nodeId, title);
      },
      onCancel: () => {},
      getViewportTransform: () => ({
        zoom: this.view.getZoom(),
        pan: this.view.getViewportController().getPan(),
      }),
    });

    this.xmindImporter = new XMindImporter();
    this.xmindExporter = new XMindExporter();

    if (options.enableInertialScroll !== false) {
      this.initInertialScroll();
    }

    if (options.enableGestures !== false) {
      this.initGestures();
    }

    if (options.ydoc && options.user) {
      this.initCollaboration(options.ydoc, options.user);
    }

    this.pluginManager = new PluginManager();
    this.pluginManager.setEditorContext(this.state, (tr) => this.dispatch(tr));

    if (options.plugins) {
      for (const plugin of options.plugins) {
        this.use(plugin);
      }
    }

    this.bindDOMEvents();
  }

  get isCollaborating(): boolean {
    return this.binding !== null;
  }

  getCollaboratorManager(): CollaboratorManager | null {
    return this.collaborators;
  }

  getCollaborators(): Map<number, CollaboratorState> {
    return this.collaborators?.getCollaborators() || new Map();
  }

  isNodeLocked(nodeId: string, field?: string): boolean {
    return this.collaborators?.isLocked(nodeId, field) || false;
  }

  canEditTitle(nodeId: string): boolean {
    return this.collaborators?.canEditTitle(nodeId) ?? true;
  }

  canDrag(nodeId: string): boolean {
    return this.collaborators?.canDrag(nodeId) ?? true;
  }

  canModifyStructure(nodeId: string): boolean {
    return this.collaborators?.canModifyStructure(nodeId) ?? true;
  }

  private initCollaboration(ydoc: Y.Doc, user: CollaboratorUser): void {
    this.ydoc = ydoc;
    this.binding = createYDocBinding(ydoc, user);
    this.collaborators = this.binding.collaborators;

    const topic = this.getDocument().root.toData();
    syncTopicToY(ydoc, topic);

    ydoc.on("update", (_update, origin) => {
      if (origin === "editor-dispatch") return;

      const remoteTopic = syncYToTopic(ydoc);
      if (remoteTopic) {
        const doc = MindMapDocument.fromJSON(remoteTopic);
        this.loadDocument(doc);
      }
    });

    this.collaborators.onConflict((conflict) => {
      console.warn("Lock conflict:", conflict);
    });

    this.collaborators.onStateChange(() => {
      if (this.collaborators) {
        const cursors = new Map<
          number,
          {
            clientId: number;
            user: { name: string; color: string };
            position: { x: number; y: number };
            nodeId: string | null;
          }
        >();
        const selections = new Map<
          number,
          {
            clientId: number;
            user: { name: string; color: string };
            nodeIds: string[];
          }
        >();

        this.collaborators.getCollaborators().forEach((state, clientId) => {
          if (state.cursor) {
            cursors.set(clientId, {
              clientId,
              user: state.user,
              position: state.cursor,
              nodeId: state.targetNodeId,
            });
          }
          if (state.selection.length > 0) {
            selections.set(clientId, {
              clientId,
              user: state.user,
              nodeIds: state.selection,
            });
          }
        });

        this.view.updateRemoteCursors(cursors);
        this.view.updateRemoteSelections(selections);
      }
    });
  }

  private syncTransactionToYDoc(tr: Transaction): void {
    if (!this.ydoc) return;

    this.ydoc.transact(() => {
      const nodes = this.ydoc!.getMap<Y.Map<any>>("nodes");

      for (const step of tr.steps) {
        switch (step.type) {
          case "addNode": {
            const node = tr.doc.getNodeById(step.node.id);
            if (node) {
              nodes.set(node.id, topicDataToYMap(node.toData()));
            }
            break;
          }
          case "removeNode": {
            nodes.delete(step.id);
            break;
          }
          case "updateNode":
          case "updateTitle":
          case "updateStyle":
          case "toggleFold":
          case "setStructureClass": {
            const node = tr.doc.getNodeById(step.id);
            if (node) {
              nodes.set(node.id, topicDataToYMap(node.toData()));
            }
            break;
          }
          case "moveNode": {
            const movedNode = tr.doc.getNodeById(step.nodeId);
            if (movedNode) {
              nodes.set(step.nodeId, topicDataToYMap(movedNode.toData()));
            }
            const oldParent = tr.beforeDoc.findParent(step.nodeId);
            if (oldParent) {
              nodes.set(oldParent.id, topicDataToYMap(oldParent.toData()));
            }
            const newParent = tr.doc.findParent(step.nodeId);
            if (newParent && newParent.id !== oldParent?.id) {
              nodes.set(newParent.id, topicDataToYMap(newParent.toData()));
            }
            break;
          }
          case "setSelection":
            break;
        }
      }
    }, "editor-dispatch");
  }

  getState(): EditorState {
    return this.state;
  }

  getView(): EditorView {
    return this.view;
  }

  getCommandRegistry(): CommandRegistry {
    return this.commandRegistry;
  }

  getUIManager(): UIManager {
    return this.uiManager;
  }

  dispatch(tr: Transaction): void {
    if (this.readOnly) return;
    this.state = this.state.apply(tr);
    this.uiContext.state = this.state;
    this.view.updateState(this.state);
    this.interactionManager.updateState(this.state);
    this.uiManager.update();
    this.syncTransactionToYDoc(tr);
  }

  executeCommand(name: string, args?: any): boolean {
    return this.commandRegistry.execute(
      name,
      this.state,
      (tr) => this.dispatch(tr),
      args,
    );
  }

  loadDocument(doc: MindMapDocument): void {
    const selection = this.state.selection;
    this.state = new EditorState(doc, selection, this.state.history);
    this.uiContext.state = this.state;
    this.view.updateState(this.state);
    this.interactionManager.updateState(this.state);
    this.uiManager.update();
  }

  async loadXMindFile(file: File): Promise<any> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await this.xmindImporter.import(arrayBuffer);
    this.loadDocument(MindMapDocument.fromJSON(doc.toJSON()));
    return doc;
  }

  async exportXMind(): Promise<Blob> {
    const doc = this.getDocument();
    return this.xmindExporter.export(doc.root);
  }

  getDocument(): MindMapDocument {
    return this.state.doc;
  }

  getSelection(): string[] {
    return this.state.selection.all;
  }

  selectNode(nodeId: string): void {
    this.executeCommand("selectNode", { nodeId });
  }

  zoomIn(): void {
    this.view.zoomIn();
  }

  zoomOut(): void {
    this.view.zoomOut();
  }

  fitToContent(): void {
    this.view.fitToContent();
  }

  canUndo(): boolean {
    return this.state.canUndo();
  }

  canRedo(): boolean {
    return this.state.canRedo();
  }

  isEditing(): boolean {
    return (
      this.inlineEditor.isEditing() || this.richTextInlineEditor.isEditing()
    );
  }

  startEditing(nodeId: string): void {
    const bounds = this.getNodeBounds(nodeId);
    const node = this.state.doc.getNodeById(nodeId);

    if (bounds && node) {
      if (this.enableRichText && node.isRichTitle) {
        this.richTextInlineEditor.startEditing(
          nodeId,
          node.attributeTitle || node.title,
          bounds,
        );
      } else {
        this.inlineEditor.startEditing(nodeId, node.title, bounds);
      }
    }
  }

  stopEditing(): void {
    if (this.inlineEditor.isEditing()) {
      this.inlineEditor.stopEditing();
    }
    if (this.richTextInlineEditor.isEditing()) {
      this.richTextInlineEditor.stopEditing();
    }
  }

  private handleRichTextUpdate(
    nodeId: string,
    attributeTitle: AttributeTitle,
  ): void {
    const node = this.state.doc.getNodeById(nodeId);
    if (!node) return;

    const updatedNode = node.withAttributeTitle(attributeTitle);
    const tr = this.state.tr;
    tr.updateNode(nodeId, () => updatedNode);
    this.dispatch(tr);
  }

  getNodeBounds(nodeId: string): Bounds | null {
    return this.view.getNodeBounds(nodeId);
  }

  getViewportBounds(): Bounds {
    return this.view.getViewportBounds();
  }

  private initInertialScroll(): void {
    this.inertialScroll = new InertialScroll((dx, dy) => {
      this.view.panBy(dx, dy);
    });
  }

  private initGestures(): void {
    this.gestureRecognizer = new GestureRecognizer((event) => {
      switch (event.type) {
        case "pinch":
          if (event.scale) {
            const currentZoom = this.view.getZoom();
            this.view.zoomTo(currentZoom * event.scale);
          }
          break;

        case "pan":
          if (event.deltaX !== undefined && event.deltaY !== undefined) {
            this.view.panBy(event.deltaX, event.deltaY);
          }
          break;

        case "tap":
          if (event.center) {
            const worldPoint = this.view
              .getViewportController()
              .screenToCanvas(event.center.x, event.center.y);
            const nodeId = this.view.getNodeAtPoint(worldPoint);
            if (nodeId) {
              this.selectNode(nodeId);
            }
          }
          break;

        case "doubletap":
          if (event.center) {
            const worldPoint = this.view
              .getViewportController()
              .screenToCanvas(event.center.x, event.center.y);
            const nodeId = this.view.getNodeAtPoint(worldPoint);
            if (nodeId) {
              this.startEditing(nodeId);
            }
          }
          break;
      }
    });
  }

  private registerDefaultCommands(): void {
    this.commandRegistry.register("addSubTopic", addSubTopic());
    this.commandRegistry.register("addSiblingTopic", addSiblingTopic());
    this.commandRegistry.register("deleteNode", deleteNode());
    this.commandRegistry.register("moveNodeUp", moveNodeUp());
    this.commandRegistry.register("moveNodeDown", moveNodeDown());
    this.commandRegistry.register("updateTitle", updateTitle);
    this.commandRegistry.register("toggleFold", toggleFold());
    this.commandRegistry.register("selectNode", selectNode);
    this.commandRegistry.register("selectAll", selectAll());
    this.commandRegistry.register("deselectAll", deselectAll());
    this.commandRegistry.register("undo", undo());
    this.commandRegistry.register("redo", redo());
    this.commandRegistry.register("navigateUp", navigateUp());
    this.commandRegistry.register("navigateDown", navigateDown());
    this.commandRegistry.register("navigateLeft", navigateLeft());
    this.commandRegistry.register("navigateRight", navigateRight());
    this.commandRegistry.register("setStructureClass", setStructureClass);
    this.commandRegistry.register("updateStyle", updateStyle);

    this.commandRegistry.register("copy", copy());
    this.commandRegistry.register("cut", cut());
    this.commandRegistry.register("paste", paste());
    this.commandRegistry.register("duplicate", duplicate());
  }

  private registerDefaultHandlers(): void {
    this.interactionManager.addHandler(createSelectHandler());
    this.interactionManager.addHandler(createDragHandler());
    this.interactionManager.addHandler(createZoomHandler());
    this.interactionManager.addHandler(createMultiSelectHandler());
    this.interactionManager.addHandler(createViewportDragHandler());
    this.interactionManager.addHandler(createBoxSelectHandler());
    this.interactionManager.addHandler(
      createTextEditHandler({
        editor: this.inlineEditor,
        getNodeBounds: (nodeId) => this.getNodeBounds(nodeId),
        getNodeTitle: (nodeId) => {
          const node = this.state.doc.getNodeById(nodeId);
          return node?.title || "";
        },
      }),
    );
  }

  private bindDOMEvents(): void {
    this.container.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      this.interactionManager.handleEvent({
        type: "click",
        target: nodeId,
        position: { x: e.clientX, y: e.clientY },
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
        button: e.button,
      });
    });

    this.container.addEventListener("dblclick", (e) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      if (nodeId) {
        this.interactionManager.handleEvent({
          type: "dblclick",
          target: nodeId,
          position: { x: e.clientX, y: e.clientY },
        });
      }
    });

    this.container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      this.uiManager.showContextMenu({ x: e.clientX, y: e.clientY }, nodeId);
    });

    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.interactionManager.handleEvent({
        type: "wheel",
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
      });
    });

    this.container.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      this.interactionManager.handleEvent({
        type: "pointerdown",
        target: nodeId,
        position: { x: e.clientX, y: e.clientY },
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
        button: e.button,
      });

      this.gestureRecognizer?.handlePointerDown(
        e.pointerId,
        e.clientX,
        e.clientY,
      );

      if (this.inertialScroll) {
        this.inertialScroll.stop();
        this.inertialScroll.record(e.clientX, e.clientY);
      }
    });

    this.container.addEventListener("pointermove", (e) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      this.interactionManager.handleEvent({
        type: "pointermove",
        target: nodeId,
        position: { x: e.clientX, y: e.clientY },
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
      });

      this.gestureRecognizer?.handlePointerMove(
        e.pointerId,
        e.clientX,
        e.clientY,
      );

      if (this.inertialScroll) {
        this.inertialScroll.record(e.clientX, e.clientY);
      }
    });

    this.container.addEventListener("pointerup", (e) => {
      const target = e.target as HTMLElement;
      const nodeEl = target.closest("[data-node-id]");
      const nodeId = nodeEl?.getAttribute("data-node-id") || undefined;

      this.interactionManager.handleEvent({
        type: "pointerup",
        target: nodeId,
        position: { x: e.clientX, y: e.clientY },
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        },
      });

      this.gestureRecognizer?.handlePointerUp(
        e.pointerId,
        e.clientX,
        e.clientY,
      );

      if (this.inertialScroll) {
        this.inertialScroll.start();
      }
    });

    this.container.addEventListener("pointercancel", (e) => {
      this.interactionManager.handleEvent({ type: "pointercancel" });
      this.gestureRecognizer?.handlePointerCancel(e.pointerId);
    });

    document.addEventListener("keydown", (e) => {
      if (
        this.container.contains(document.activeElement) ||
        document.activeElement === this.container
      ) {
        const key = e.key;
        const modifiers = {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey,
          meta: e.metaKey,
        };

        let keyStr = "";
        if (modifiers.ctrl || modifiers.meta) keyStr += "Ctrl+";
        if (modifiers.shift) keyStr += "Shift+";
        if (modifiers.alt) keyStr += "Alt+";
        keyStr +=
          key === " " ? "Space" : key.length === 1 ? key.toLowerCase() : key;

        const commandName = this.commandRegistry.getCommandForKey(keyStr);
        if (commandName) {
          e.preventDefault();
          this.executeCommand(commandName);
        } else {
          this.interactionManager.handleEvent({
            type: "keydown",
            key,
            modifiers,
          });
        }
      }
    });
  }

  use(plugin: Plugin): void {
    this.pluginManager.register(plugin);
    this.pluginManager.activate(plugin.id);
  }

  unuse(pluginId: string): void {
    this.pluginManager.deactivate(pluginId);
    this.pluginManager.unregister(pluginId);
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }

  emitPluginEvent(event: PluginEvent, ...args: any[]): void {
    this.pluginManager.emit(event, ...args);
  }

  destroy(): void {
    this.pluginManager.destroy();
    this.binding?.destroy();
    this.richTextInlineEditor.dispose();
    this.inlineEditor.dispose();
    this.view.destroy();
    this.uiManager.destroy();
    this.inertialScroll?.stop();
    this.gestureRecognizer?.reset();
  }
}
