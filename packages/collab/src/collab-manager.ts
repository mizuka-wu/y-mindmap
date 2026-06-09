import * as Y from "yjs";
import { TopicData } from "@y-mindmap/core";
import {
  CollabDoc,
  createCollabDoc,
  syncTopicToY,
  syncYToTopic,
} from "./binding";
import { CollabAwareness, CursorState, UserState } from "./awareness";
import {
  WebSocketProvider,
  WebSocketProviderOptions,
} from "./websocket-provider";
import { CollabUndoManager } from "./undo-manager";
import {
  ConflictDetector,
  ConflictEvent,
  ConflictInfo,
} from "./conflict-detector";

export interface CollabOptions {
  url: string;
  room: string;
  user: { name: string; color: string };
  connect?: boolean;
  resyncInterval?: number;
  maxRetries?: number;
}

export interface CollabState {
  connected: boolean;
  synced: boolean;
  users: Map<number, UserState>;
  localUser: UserState["user"] | null;
  canUndo: boolean;
  canRedo: boolean;
  conflicts: ConflictInfo[];
}

export class CollabManager {
  readonly doc: CollabDoc;
  readonly awareness: CollabAwareness;
  readonly provider: WebSocketProvider;
  readonly undoManager: CollabUndoManager;
  readonly conflictDetector: ConflictDetector;

  private onUpdateCallback: ((topic: TopicData) => void) | null = null;
  private onStateChangeCallback: ((state: CollabState) => void) | null = null;
  private onCursorChangeCallback:
    | ((cursors: Map<number, CursorState>) => void)
    | null = null;
  private onSelectionChangeCallback:
    | ((selections: Map<number, string[]>) => void)
    | null = null;
  private onConflictCallback: ((event: ConflictEvent) => void) | null = null;

  constructor(options: CollabOptions) {
    this.doc = createCollabDoc();
    this.awareness = new CollabAwareness(this.doc.doc, options.user);
    this.provider = new WebSocketProvider(this.doc.doc, this.awareness, {
      url: options.url,
      room: options.room,
      user: options.user,
      connect: options.connect,
      resyncInterval: options.resyncInterval,
      maxRetries: options.maxRetries,
    });

    this.undoManager = new CollabUndoManager(this.doc.doc);
    this.conflictDetector = new ConflictDetector(
      this.awareness,
      this.doc.doc.clientID,
    );

    this.setupDocObserver();
    this.setupAwarenessObserver();
    this.setupProviderCallbacks();
    this.setupUndoManagerCallbacks();
    this.setupConflictDetectorCallbacks();
  }

  private setupDocObserver(): void {
    this.doc.doc.on("update", (update: Uint8Array, origin: any) => {
      // Skip local editor changes (already applied); fire for remote WebSocket updates
      if (origin === "editor-dispatch") return;

      const topic = syncYToTopic(this.doc);
      if (topic) {
        this.onUpdateCallback?.(topic);
      }
    });
  }

  private setupAwarenessObserver(): void {
    this.awareness.onStateChange((changes) => {
      this.emitStateChange();
      this.emitCursorChange();
      this.emitSelectionChange();
    });
  }

  private setupProviderCallbacks(): void {
    this.provider.onSync(() => {
      this.emitStateChange();
    });

    this.provider.onConnectionChange((connected) => {
      this.emitStateChange();
    });
  }

  private setupUndoManagerCallbacks(): void {
    this.undoManager.onStateChange((canUndo, canRedo) => {
      this.emitStateChange();
    });
  }

  private setupConflictDetectorCallbacks(): void {
    this.conflictDetector.onConflict((event) => {
      this.onConflictCallback?.(event);
      this.emitStateChange();
    });
  }

  syncTopic(topic: TopicData): void {
    syncTopicToY(this.doc, topic);
  }

  getTopic(): TopicData | null {
    return syncYToTopic(this.doc);
  }

  updateCursor(cursor: CursorState | null): void {
    this.awareness.updateCursor(cursor);
  }

  updateSelection(nodeIds: string[]): void {
    this.awareness.updateSelection(nodeIds);
  }

  undo(): boolean {
    return this.undoManager.undo();
  }

  redo(): boolean {
    return this.undoManager.redo();
  }

  getState(): CollabState {
    return {
      connected: this.provider.isConnected,
      synced: this.provider.isSynced,
      users: this.awareness.getStates(),
      localUser: this.awareness.getLocalState()?.user || null,
      canUndo: this.undoManager.canUndo(),
      canRedo: this.undoManager.canRedo(),
      conflicts: this.conflictDetector.getActiveConflicts(),
    };
  }

  getRemoteCursors(): Map<number, CursorState> {
    return this.awareness.getRemoteCursors();
  }

  getRemoteSelections(): Map<number, string[]> {
    return this.awareness.getRemoteSelections();
  }

  getUser(clientId: number): UserState | null {
    return this.awareness.getUser(clientId);
  }

  getActiveConflicts(): ConflictInfo[] {
    return this.conflictDetector.getActiveConflicts();
  }

  getConflictsForNode(nodeId: string): ConflictInfo[] {
    return this.conflictDetector.getConflictsForNode(nodeId);
  }

  hasConflict(nodeId: string): boolean {
    return this.conflictDetector.hasConflict(nodeId);
  }

  private emitStateChange(): void {
    this.onStateChangeCallback?.(this.getState());
  }

  private emitCursorChange(): void {
    this.onCursorChangeCallback?.(this.getRemoteCursors());
  }

  private emitSelectionChange(): void {
    this.onSelectionChangeCallback?.(this.getRemoteSelections());
  }

  onUpdate(callback: (topic: TopicData) => void): void {
    this.onUpdateCallback = callback;
  }

  onStateChange(callback: (state: CollabState) => void): void {
    this.onStateChangeCallback = callback;
  }

  onCursorChange(callback: (cursors: Map<number, CursorState>) => void): void {
    this.onCursorChangeCallback = callback;
  }

  onSelectionChange(
    callback: (selections: Map<number, string[]>) => void,
  ): void {
    this.onSelectionChangeCallback = callback;
  }

  onConflict(callback: (event: ConflictEvent) => void): void {
    this.onConflictCallback = callback;
  }

  connect(): void {
    this.provider.connect();
  }

  disconnect(): void {
    this.provider.disconnect();
  }

  destroy(): void {
    this.conflictDetector.destroy();
    this.undoManager.destroy();
    this.provider.destroy();
    this.doc.doc.destroy();
  }
}
