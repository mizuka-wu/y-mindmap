import { MindMapDocument } from "./mind-map-document";
import { MindMapNode } from "./mind-map-node";
import { Selection } from "./selection";

export type StepType =
  | "addNode"
  | "removeNode"
  | "updateNode"
  | "moveNode"
  | "setSelection"
  | "updateTitle"
  | "updateStyle"
  | "toggleFold"
  | "setStructureClass";

export interface Step {
  type: StepType;
  [key: string]: any;
}

export class Transaction {
  private _doc: MindMapDocument;
  private _beforeDoc: MindMapDocument;
  private _selection: Selection;
  private _beforeSelection: Selection;
  private _steps: Step[] = [];
  private _metadata: Record<string, any> = {};

  constructor(doc: MindMapDocument, selection?: Selection) {
    this._doc = doc;
    this._beforeDoc = doc;
    this._selection = selection || Selection.empty();
    this._beforeSelection = selection || Selection.empty();
  }

  get doc(): MindMapDocument {
    return this._doc;
  }

  get beforeDoc(): MindMapDocument {
    return this._beforeDoc;
  }

  get selection(): Selection {
    return this._selection;
  }

  get beforeSelection(): Selection {
    return this._beforeSelection;
  }

  get steps(): Step[] {
    return [...this._steps];
  }

  get metadata(): Record<string, any> {
    return { ...this._metadata };
  }

  getMeta(key: string): any {
    return this._metadata[key];
  }

  get hasChanges(): boolean {
    return this._steps.length > 0;
  }

  setSelection(selection: Selection): Transaction {
    this._selection = selection;
    this._steps.push({ type: "setSelection", selection: selection.toJSON() });
    return this;
  }

  setMeta(key: string, value: any): Transaction {
    this._metadata[key] = value;
    return this;
  }

  addNode(
    parentId: string,
    node: MindMapNode,
    nodeType?: string,
    index?: number,
  ): Transaction {
    this._doc = this._doc.addNode(parentId, node, nodeType, index);
    this._steps.push({
      type: "addNode",
      parentId,
      node: node.toJSON(),
      nodeType,
      index,
    });
    return this;
  }

  removeNode(id: string): Transaction {
    this._doc = this._doc.removeNode(id);
    this._steps.push({ type: "removeNode", id });
    return this;
  }

  updateNode(
    id: string,
    updater: (node: MindMapNode) => MindMapNode,
  ): Transaction {
    this._doc = this._doc.updateNode(id, updater);
    this._steps.push({ type: "updateNode", id });
    return this;
  }

  moveNode(nodeId: string, newParentId: string, index?: number): Transaction {
    this._doc = this._doc.moveNode(nodeId, newParentId, index);
    this._steps.push({
      type: "moveNode",
      nodeId,
      newParentId,
      index,
    });
    return this;
  }

  updateTitle(id: string, title: string): Transaction {
    return this.updateNode(id, (node) => node.withTitle(title));
  }

  updateStyle(id: string, style: any): Transaction {
    return this.updateNode(id, (node) => node.withStyle(style));
  }

  toggleFold(id: string): Transaction {
    return this.updateNode(id, (node) => node.toggleFold());
  }

  setStructureClass(id: string, structureClass: any): Transaction {
    return this.updateNode(id, (node) =>
      node.withStructureClass(structureClass),
    );
  }

  apply(state: EditorState): EditorState {
    return new EditorState(
      this._doc,
      this._selection,
      state.history.push(this, state.doc, state.selection),
    );
  }
}

export class EditorState {
  readonly doc: MindMapDocument;
  readonly selection: Selection;
  readonly history: History;

  constructor(doc: MindMapDocument, selection?: Selection, history?: History) {
    this.doc = doc;
    this.selection = selection || Selection.empty();
    this.history = history || new History();
  }

  apply(tr: Transaction): EditorState {
    const newState = new EditorState(
      tr.doc,
      tr.selection,
      this.history.push(tr, this.doc, this.selection),
    );
    return newState;
  }

  get tr(): Transaction {
    return new Transaction(this.doc, this.selection);
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  undo(): EditorState {
    const { state } = this.history.undo(this);
    return state;
  }

  redo(): EditorState {
    const { state } = this.history.redo(this);
    return state;
  }

  static create(doc: MindMapDocument): EditorState {
    return new EditorState(doc);
  }
}

interface HistoryEntry {
  tr: Transaction;
  beforeDoc: MindMapDocument;
  beforeSelection: Selection;
}

export class History {
  private _undoStack: HistoryEntry[] = [];
  private _redoStack: HistoryEntry[] = [];
  private _maxSize: number = 100;

  constructor(maxSize: number = 100) {
    this._maxSize = maxSize;
  }

  push(
    tr: Transaction,
    beforeDoc: MindMapDocument,
    beforeSelection: Selection,
  ): History {
    const source = tr.getMeta("source");
    if (source === "undo") {
      return this._undo();
    }
    if (source === "redo") {
      return this._redo();
    }
    if (!tr.hasChanges) return this;

    const newHistory = new History(this._maxSize);
    newHistory._undoStack = [
      ...this._undoStack,
      { tr, beforeDoc, beforeSelection },
    ];
    newHistory._redoStack = [];

    if (newHistory._undoStack.length > this._maxSize) {
      newHistory._undoStack = newHistory._undoStack.slice(-this._maxSize);
    }

    return newHistory;
  }

  private _undo(): History {
    if (!this.canUndo()) return this;
    const newUndoStack = [...this._undoStack];
    const entry = newUndoStack.pop()!;
    const newHistory = new History(this._maxSize);
    newHistory._undoStack = newUndoStack;
    newHistory._redoStack = [...this._redoStack, entry];
    return newHistory;
  }

  private _redo(): History {
    if (!this.canRedo()) return this;
    const newRedoStack = [...this._redoStack];
    const entry = newRedoStack.pop()!;
    const newHistory = new History(this._maxSize);
    newHistory._undoStack = [...this._undoStack, entry];
    newHistory._redoStack = newRedoStack;
    return newHistory;
  }

  canUndo(): boolean {
    return this._undoStack.length > 0;
  }

  canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  undo(currentState: EditorState): {
    state: EditorState;
    transaction: Transaction | null;
  } {
    if (!this.canUndo()) {
      return { state: currentState, transaction: null };
    }

    const newUndoStack = [...this._undoStack];
    const entry = newUndoStack.pop()!;

    const newHistory = new History(this._maxSize);
    newHistory._undoStack = newUndoStack;
    newHistory._redoStack = [...this._redoStack, entry];

    const newState = new EditorState(
      entry.beforeDoc,
      entry.beforeSelection,
      newHistory,
    );

    return { state: newState, transaction: entry.tr };
  }

  redo(currentState: EditorState): {
    state: EditorState;
    transaction: Transaction | null;
  } {
    if (!this.canRedo()) {
      return { state: currentState, transaction: null };
    }

    const newRedoStack = [...this._redoStack];
    const entry = newRedoStack.pop()!;

    const newHistory = new History(this._maxSize);
    newHistory._undoStack = [...this._undoStack, entry];
    newHistory._redoStack = newRedoStack;

    const newState = new EditorState(
      entry.tr.doc,
      entry.tr.selection,
      newHistory,
    );

    return { state: newState, transaction: entry.tr };
  }

  clear(): History {
    return new History(this._maxSize);
  }

  get undoCount(): number {
    return this._undoStack.length;
  }

  get redoCount(): number {
    return this._redoStack.length;
  }
}
