import { RootTopic } from "./root-topic";
import { MindMapNode } from "./mind-map-node";
import { Selection } from "./selection";
import { Workbook } from "./workbook";
import { Sheet } from "./sheet";
import { Relationship } from "./relationship";
import { Boundary } from "./boundary";
import { Summary } from "./summary";

export type StepType =
  | "addNode"
  | "removeNode"
  | "updateNode"
  | "moveNode"
  | "setSelection"
  | "setDoc"
  | "addRelationship"
  | "removeRelationship"
  | "addBoundary"
  | "removeBoundary"
  | "addSummary"
  | "removeSummary";

export interface Step {
  type: StepType;
  [key: string]: any;
}

export class Transaction {
  private _workbook: Workbook;
  private _beforeWorkbook: Workbook;
  private _selection: Selection;
  private _beforeSelection: Selection;
  private _steps: Step[] = [];
  private _metadata: Record<string, any> = {};

  constructor(workbook: Workbook, selection?: Selection) {
    this._workbook = workbook;
    this._beforeWorkbook = workbook;
    this._selection = selection || Selection.empty();
    this._beforeSelection = selection || Selection.empty();
  }

  get workbook(): Workbook {
    return this._workbook;
  }

  get beforeWorkbook(): Workbook {
    return this._beforeWorkbook;
  }

  get sheet(): Sheet {
    return this._workbook.activeSheet!;
  }

  get beforeSheet(): Sheet {
    return this._beforeWorkbook.activeSheet!;
  }

  get doc(): RootTopic {
    return this._workbook.activeSheet!.doc;
  }

  get beforeDoc(): RootTopic {
    return this._beforeWorkbook.activeSheet!.doc;
  }

  private _updateActiveSheet(updater: (s: Sheet) => Sheet): void {
    this._workbook = this._workbook.updateSheet(
      this._workbook.activeSheetId,
      updater,
    );
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

  setDoc(doc: RootTopic): Transaction {
    this._updateActiveSheet((s) => s.withDoc(doc));
    this._steps.push({ type: "setDoc", doc: doc.toJSON() });
    return this;
  }

  addNode(
    parentId: string,
    node: MindMapNode,
    nodeType?: string,
    index?: number,
  ): Transaction {
    const sheet = this.sheet;
    const newDoc = sheet.doc.addNode(parentId, node, nodeType, index);
    this._updateActiveSheet((s) => s.withDoc(newDoc));
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
    const newDoc = this.sheet.doc.removeNode(id);
    this._updateActiveSheet((s) => s.withDoc(newDoc));
    this._steps.push({ type: "removeNode", id });
    return this;
  }

  updateNode(
    id: string,
    updater: (node: MindMapNode) => MindMapNode,
  ): Transaction {
    const newDoc = this.sheet.doc.updateNode(id, updater);
    this._updateActiveSheet((s) => s.withDoc(newDoc));
    this._steps.push({ type: "updateNode", id });
    return this;
  }

  moveNode(nodeId: string, newParentId: string, index?: number): Transaction {
    const newDoc = this.sheet.doc.moveNode(nodeId, newParentId, index);
    this._updateActiveSheet((s) => s.withDoc(newDoc));
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

  addRelationship(rel: Relationship): Transaction {
    this._updateActiveSheet((s) => s.addRelationship(rel));
    this._steps.push({ type: "addRelationship", relationship: rel.toJSON() });
    return this;
  }

  removeRelationship(id: string): Transaction {
    this._updateActiveSheet((s) => s.removeRelationship(id));
    this._steps.push({ type: "removeRelationship", id });
    return this;
  }

  addBoundary(boundary: Boundary): Transaction {
    this._updateActiveSheet((s) => s.addBoundary(boundary));
    this._steps.push({ type: "addBoundary", boundary: boundary.toJSON() });
    return this;
  }

  removeBoundary(id: string): Transaction {
    this._updateActiveSheet((s) => s.removeBoundary(id));
    this._steps.push({ type: "removeBoundary", id });
    return this;
  }

  addSummary(summary: Summary): Transaction {
    this._updateActiveSheet((s) => s.addSummary(summary));
    this._steps.push({ type: "addSummary", summary: summary.toJSON() });
    return this;
  }

  removeSummary(id: string): Transaction {
    this._updateActiveSheet((s) => s.removeSummary(id));
    this._steps.push({ type: "removeSummary", id });
    return this;
  }

  apply(state: EditorState): EditorState {
    return new EditorState(
      this._workbook,
      this._selection,
      state.history.push(this, state.workbook, state.selection),
    );
  }
}

export class EditorState {
  readonly workbook: Workbook;
  readonly selection: Selection;
  readonly history: History;

  get sheet(): Sheet {
    return this.workbook.activeSheet!;
  }

  get doc(): RootTopic {
    return this.workbook.activeSheet!.doc;
  }

  constructor(workbook: Workbook, selection?: Selection, history?: History) {
    this.workbook = workbook;
    this.selection = selection || Selection.empty();
    this.history = history || new History();
  }

  apply(tr: Transaction): EditorState {
    const newState = new EditorState(
      tr.workbook,
      tr.selection,
      this.history.push(tr, this.workbook, this.selection),
    );
    return newState;
  }

  get tr(): Transaction {
    return new Transaction(this.workbook, this.selection);
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

  static create(workbook: Workbook): EditorState {
    return new EditorState(workbook);
  }
}

interface HistoryEntry {
  tr: Transaction;
  beforeWorkbook: Workbook;
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
    beforeWorkbook: Workbook,
    beforeSelection: Selection,
  ): History {
    const source = tr.getMeta("source");
    if (source === "undo" || source === "redo") {
      return this; // history 修改由 state.undo()/redo() 处理
    }
    if (!tr.hasChanges) return this;

    const newHistory = new History(this._maxSize);
    newHistory._undoStack = [
      ...this._undoStack,
      { tr, beforeWorkbook, beforeSelection },
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
      entry.beforeWorkbook,
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
      entry.tr.workbook,
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
