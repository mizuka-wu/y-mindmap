import {
  EditorState,
  RootTopic,
  MindMapNode,
  Selection,
  Transaction,
  Sheet,
  Workbook,
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
  createRichTextEditHandler,
  InlineEditor,
  RichTextInlineEditor,
} from "@y-mindmap/interaction";
import { UIManager, UIContext } from "@y-mindmap/ui";
import { XMindImporter, XMindExporter } from "@y-mindmap/formats/xmind";
import {
  MarkdownImporter,
  MarkdownExporter,
} from "@y-mindmap/formats/markdown";
import { JSONImporter, JSONExporter } from "@y-mindmap/formats/json";
import { PNGExporter, PNGExportOptions } from "@y-mindmap/formats/png";
import { SVGExporter, SVGExportOptions } from "@y-mindmap/formats/svg";
import { PDFExporter, PDFExportOptions } from "@y-mindmap/formats/pdf";
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
  CollabManager,
  CollabOptions,
  CollabState,
  ConflictEvent,
  CursorState,
} from "@y-mindmap/collab";
import { PluginManager, Plugin, PluginEvent } from "@y-mindmap/plugins";
import { ExtensionManager, ExtensionDefinition } from "@y-mindmap/extension";
import {
  DragDrop,
  ContextMenu,
  BoxSelect,
  RichTextEdit,
  ZoomControls,
  Minimap,
  Keymap,
  Clipboard,
  InertialScroll as InertialScrollExt,
  Gesture,
} from "@y-mindmap/extensions";

export interface MindMapEditorOptions {
  container: HTMLElement;
  doc?: RootTopic;
  layoutEngine?: LayoutEngine;
  readOnly?: boolean;
  keymap?: Record<string, string>;
  showToolbar?: boolean;
  showPropertyPanel?: boolean;
  showStatusBar?: boolean;
  enableRichText?: boolean;
  showMiniMap?: boolean;
  ydoc?: Y.Doc;
  user?: CollaboratorUser;
  collab?: CollabOptions;
  plugins?: Plugin[];
  extensions?: ExtensionDefinition[];
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
  private xmindImporter: XMindImporter;
  private xmindExporter: XMindExporter;
  private markdownImporter: MarkdownImporter;
  private markdownExporter: MarkdownExporter;
  private jsonImporter: JSONImporter;
  private jsonExporter: JSONExporter;
  private pngExporter: PNGExporter;
  private svgExporter: SVGExporter;
  private pdfExporter: PDFExporter;

  private ydoc: Y.Doc | null = null;
  private binding: YDocBinding | null = null;
  private collaborators: CollaboratorManager | null = null;
  private collabManager: CollabManager | null = null;
  private pluginManager: PluginManager;
  private extensionManager: ExtensionManager;
  private uiContext: UIContext;

  constructor(options: MindMapEditorOptions) {
    this.container = options.container;
    this.readOnly = options.readOnly || false;
    this.enableRichText = options.enableRichText || false;

    const doc = options.doc || RootTopic.createEmpty();
    const sheet = new Sheet({ id: crypto.randomUUID(), title: "Sheet 1", doc });
    const workbook = new Workbook({
      id: crypto.randomUUID(),
      title: "Workbook",
      sheets: [sheet],
      activeSheetId: sheet.id,
    });
    this.state = EditorState.create(workbook);

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
      panTo: (x, y) => this.view?.panTo(x, y),
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
      enableAnimations: true,
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
    this.markdownImporter = new MarkdownImporter();
    this.markdownExporter = new MarkdownExporter();
    this.jsonImporter = new JSONImporter();
    this.jsonExporter = new JSONExporter();
    this.pngExporter = new PNGExporter();
    this.svgExporter = new SVGExporter();
    this.pdfExporter = new PDFExporter();

    if (options.ydoc && options.user) {
      this.initCollaboration(options.ydoc, options.user);
    }

    if (options.collab) {
      this.initCollabManager(options.collab);
    }

    this.pluginManager = new PluginManager();
    this.pluginManager.setEditorContext(this.state, (tr) => this.dispatch(tr));
    this.uiManager.setPluginManager(this.pluginManager);

    if (options.plugins) {
      for (const plugin of options.plugins) {
        this.use(plugin);
      }
    }

    this.extensionManager = new ExtensionManager();
    const defaultExts = [
      DragDrop,
      ContextMenu,
      BoxSelect,
      RichTextEdit,
      ZoomControls,
      Minimap,
      Keymap,
      Clipboard,
      InertialScrollExt,
      Gesture,
    ];

    for (const ext of defaultExts) {
      if (!this.extensionManager.has(ext.name)) {
        this.extensionManager.register(ext);
      }
    }
    if (options.extensions) {
      for (const ext of options.extensions) {
        if (!this.extensionManager.has(ext.name)) {
          this.extensionManager.register(ext);
        }
      }
    }
    this.extensionManager.setup(
      this.state,
      (tr) => this.dispatch(tr),
      this.view,
      {
        executeCommand: (name, args) => this.executeCommand(name, args),
        registerCommand: (name, command) => {
          this.commandRegistry.register(name, {
            name,
            description: `Extension command: ${name}`,
            execute: (state, input, dispatch) =>
              command(state, dispatch!, input),
          });
        },
        unregisterCommand: (name) => this.commandRegistry.unregister(name),
      },
    );

    // Bridge extension events to editor
    this.extensionManager.on("document:load", (doc: RootTopic) => {
      this.loadDocument(doc);
    });

    this.bindDOMEvents();
  }

  get isCollaborating(): boolean {
    return this.binding !== null || this.collabManager !== null;
  }

  getCollabManager(): CollabManager | null {
    return this.collabManager;
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
        const doc = RootTopic.fromJSON(remoteTopic);
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

  private initCollabManager(options: CollabOptions): void {
    this.collabManager = new CollabManager(options);

    const topic = this.getDocument().root.toData();
    this.collabManager.syncTopic(topic);

    this.collabManager.onUpdate((remoteTopic) => {
      const doc = RootTopic.fromJSON(remoteTopic);
      this.loadDocument(doc);
    });

    this.collabManager.onCursorChange((cursors) => {
      const mapped = new Map<
        number,
        {
          clientId: number;
          user: { name: string; color: string };
          position: { x: number; y: number };
          nodeId: string | null;
        }
      >();

      cursors.forEach((cursor, clientId) => {
        const userState = this.collabManager!.getUser(clientId);
        mapped.set(clientId, {
          clientId,
          user: userState?.user || { name: "Unknown", color: "#999" },
          position: cursor.position,
          nodeId: cursor.nodeId,
        });
      });

      this.view.updateRemoteCursors(mapped);
    });

    this.collabManager.onSelectionChange((selections) => {
      const mapped = new Map<
        number,
        {
          clientId: number;
          user: { name: string; color: string };
          nodeIds: string[];
        }
      >();

      selections.forEach((nodeIds, clientId) => {
        const userState = this.collabManager!.getUser(clientId);
        mapped.set(clientId, {
          clientId,
          user: userState?.user || { name: "Unknown", color: "#999" },
          nodeIds,
        });
      });

      this.view.updateRemoteSelections(mapped);
    });

    this.collabManager.onConflict((event) => {
      this.emitPluginEvent("collab:conflict", event);
    });

    this.collabManager.onStateChange((state) => {
      this.emitPluginEvent("collab:state-change", state);
    });

    this.registerCollabUndoRedo();
  }

  private registerCollabUndoRedo(): void {
    this.commandRegistry.register("undo", {
      name: "undo",
      description: "Undo last operation",
      execute: (_state, _input, dispatch) => {
        let newState: EditorState;
        if (this.collabManager) {
          const result = this.collabManager.undo();
          newState = typeof result === "object" ? result : this.state.undo();
        } else {
          newState = this.state.undo();
        }
        const tr = new Transaction(newState.workbook, newState.selection);
        tr.setMeta("source", "undo");
        if (dispatch) dispatch(tr);
        return true;
      },
    });

    this.commandRegistry.register("redo", {
      name: "redo",
      description: "Redo last undone operation",
      execute: (_state, _input, dispatch) => {
        let newState: EditorState;
        if (this.collabManager) {
          const result = this.collabManager.redo();
          newState = typeof result === "object" ? result : this.state.redo();
        } else {
          newState = this.state.redo();
        }
        const tr = new Transaction(newState.workbook, newState.selection);
        tr.setMeta("source", "redo");
        if (dispatch) dispatch(tr);
        return true;
      },
    });
  }

  private syncTransactionToYDoc(tr: Transaction): void {
    const doc = this.collabManager?.doc.doc || this.ydoc;
    if (!doc) return;

    doc.transact(() => {
      const nodes = doc.getMap<Y.Map<any>>("nodes");

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
          case "updateNode": {
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
    const source = tr.getMeta("source");
    if (source === "undo") {
      this.state = this.state.undo();
    } else if (source === "redo") {
      this.state = this.state.redo();
    } else {
      this.state = this.state.apply(tr);
    }
    this.uiContext.state = this.state;
    this.view.updateState(this.state);
    this.interactionManager.updateState(this.state);
    this.uiManager.update();
    this.syncTransactionToYDoc(tr);
    this.pluginManager.updateState(this.state);
    this.extensionManager.updateState(this.state);
    this.extensionManager.emit("transaction", tr);
    this.emitTransactionEvents(tr);
  }

  executeCommand(name: string, args?: any): boolean {
    return this.commandRegistry.execute(
      name,
      this.state,
      (tr) => this.dispatch(tr),
      args,
    );
  }

  loadDocument(doc: RootTopic): void {
    const selection = this.state.selection;
    const workbook = this.state.workbook.updateSheet(
      this.state.workbook.activeSheetId,
      (s) => s.withDoc(doc),
    );
    this.state = new EditorState(workbook, selection, this.state.history);
    this.uiContext.state = this.state;
    this.view.updateState(this.state);
    this.interactionManager.updateState(this.state);
    this.uiManager.update();
    this.pluginManager.updateState(this.state);
    this.extensionManager.updateState(this.state);
    this.emitPluginEvent("document:load", doc);
  }

  async loadXMindFile(file: File): Promise<any> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await this.xmindImporter.import(arrayBuffer);
    this.loadDocument(RootTopic.fromJSON(doc.toJSON()));
    return doc;
  }

  async exportXMind(): Promise<Blob> {
    const doc = this.getDocument();
    return this.xmindExporter.export(doc.root);
  }

  async loadMarkdown(text: string): Promise<MindMapNode> {
    const doc = await this.markdownImporter.import(text);
    this.loadDocument(RootTopic.fromJSON(doc.toJSON()));
    return doc;
  }

  async loadMarkdownFile(file: File): Promise<MindMapNode> {
    const text = await file.text();
    return this.loadMarkdown(text);
  }

  async exportMarkdown(): Promise<string> {
    const doc = this.getDocument();
    return this.markdownExporter.export(doc.root);
  }

  async loadJSON(text: string): Promise<MindMapNode> {
    const doc = await this.jsonImporter.import(text);
    this.loadDocument(RootTopic.fromJSON(doc.toJSON()));
    return doc;
  }

  async loadJSONFile(file: File): Promise<MindMapNode> {
    const text = await file.text();
    return this.loadJSON(text);
  }

  async exportJSON(options?: { spaces?: number }): Promise<string> {
    const doc = this.getDocument();
    return this.jsonExporter.export(doc.root, options);
  }

  async exportPNG(options?: PNGExportOptions): Promise<Blob> {
    const canvas = this.view.getCanvas();
    const contentBounds = this.getContentBounds();
    return this.pngExporter.export(canvas, contentBounds, options);
  }

  async exportSVG(options?: SVGExportOptions): Promise<string> {
    const doc = this.getDocument();
    return this.svgExporter.export(doc.root, options);
  }

  async exportPDF(options?: PDFExportOptions): Promise<Blob> {
    const canvas = this.view.getCanvas();
    const contentBounds = this.getContentBounds();
    return this.pdfExporter.export(canvas, contentBounds, options);
  }

  private getContentBounds(): Bounds {
    const allBounds: Bounds[] = [];
    this.state.doc.root.descendants((node) => {
      const bounds = this.view.getNodeBounds(node.id);
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

  getDocument(): RootTopic {
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
    if (this.collabManager) {
      return this.collabManager.getState().canUndo;
    }
    return this.state.canUndo();
  }

  canRedo(): boolean {
    if (this.collabManager) {
      return this.collabManager.getState().canRedo;
    }
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

    // File operations
    this.commandRegistry.register("new", {
      name: "new",
      description: "Create new document",
      execute: (_state, _input, _dispatch) => {
        const doc = new RootTopic(MindMapNode.create("Central Topic"));
        this.loadDocument(doc);
        return true;
      },
    });

    this.commandRegistry.register("open", {
      name: "open",
      description: "Open file (xmind/md/json)",
      execute: (_state, file: File, _dispatch) => {
        if (!file) return false;
        const name = file.name.toLowerCase();
        if (name.endsWith(".xmind")) {
          this.loadXMindFile(file).catch(console.error);
        } else if (name.endsWith(".md")) {
          this.loadMarkdownFile(file).catch(console.error);
        } else if (name.endsWith(".json")) {
          file.text().then((text) => this.loadJSON(text)).catch(console.error);
        }
        return true;
      },
    });
  }

  private registerDefaultHandlers(): void {
    this.interactionManager.addHandler(createSelectHandler());
    this.interactionManager.addHandler(createDragHandler());
    this.interactionManager.addHandler(createZoomHandler());
    this.interactionManager.addHandler(createMultiSelectHandler());
    this.interactionManager.addHandler(createViewportDragHandler());
    this.interactionManager.addHandler(createBoxSelectHandler());
    this.interactionManager.addHandler(
      createRichTextEditHandler({
        isEditing: () => this.isEditing(),
        getEditingNodeId: () =>
          this.inlineEditor.getEditingNodeId() ||
          this.richTextInlineEditor.getEditingNodeId(),
        startEditing: (nodeId) => this.startEditing(nodeId),
        stopEditing: () => this.stopEditing(),
      }),
    );
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

  private _getNodeIdAtClient(clientX: number, clientY: number): string | undefined {
    try {
      const worldPoint = this.view.clientToWorld(clientX, clientY);
      return this.view.getNodeAtPoint(worldPoint) || undefined;
    } catch {
      return undefined;
    }
  }

  private bindDOMEvents(): void {
    this.container.addEventListener("click", (e) => {
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);

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
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);

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
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);
    });

    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom: deltaY > 0 means zoom out
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const currentZoom = this.view.getZoom();
        const newZoom = Math.max(0.1, Math.min(10, currentZoom * factor));
        this.view.zoomTo(newZoom);
      } else {
        // Pan
        this.view.panBy(-e.deltaX, -e.deltaY);
      }
    });

    this.container.addEventListener("pointerdown", (e) => {
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);

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
    });

    this.container.addEventListener("pointermove", (e) => {
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);

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
    });

    this.container.addEventListener("pointerup", (e) => {
      const nodeId = this._getNodeIdAtClient(e.clientX, e.clientY);

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
    });

    this.container.addEventListener("pointercancel", (e) => {
      this.interactionManager.handleEvent({ type: "pointercancel" });
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

  private emitTransactionEvents(tr: Transaction): void {
    for (const step of tr.steps) {
      switch (step.type) {
        case "addNode":
          this.emitPluginEvent("node:create", step.node);
          break;
        case "removeNode":
          this.emitPluginEvent("node:delete", step.id);
          break;
        case "updateNode": {
          const oldNode = tr.beforeDoc.getNodeById(step.id);
          const newNode = tr.doc.getNodeById(step.id);
          if (oldNode && newNode) {
            if (oldNode.isFolded !== newNode.isFolded) {
              this.emitPluginEvent(
                newNode.isFolded ? "node:fold" : "node:unfold",
                newNode,
              );
            } else {
              this.emitPluginEvent("node:update", step.id);
            }
          }
          break;
        }
        case "moveNode":
          this.emitPluginEvent("node:move", step.nodeId);
          break;
        case "setSelection": {
          const all = this.state.selection.all;
          if (all.length > 0) {
            this.emitPluginEvent("node:select", all);
          } else {
            this.emitPluginEvent("node:deselect");
          }
          break;
        }
      }
    }
    this.emitPluginEvent("document:change", tr);
  }

  destroy(): void {
    this.extensionManager.destroy();
    this.pluginManager.destroy();
    this.collabManager?.destroy();
    this.binding?.destroy();
    this.richTextInlineEditor.dispose();
    this.inlineEditor.dispose();
    this.view.destroy();
    this.uiManager.destroy();
  }
}
