import {
  EditorState,
  Transaction,
  Selection,
  MindMapNode,
} from "@y-mindmap/state";

export interface InlineEditorConfig {
  container: HTMLElement;
  onSubmit: (nodeId: string, title: string) => void;
  onCancel: () => void;
  getViewportTransform?: () => { zoom: number; pan: { x: number; y: number } };
}

export class InlineEditor {
  private container: HTMLElement;
  private editorElement: HTMLTextAreaElement | null = null;
  private nodeId: string | null = null;
  private originalTitle: string = "";
  private config: InlineEditorConfig;

  constructor(config: InlineEditorConfig) {
    this.container = config.container;
    this.config = config;
  }

  startEditing(
    nodeId: string,
    title: string,
    bounds: { x: number; y: number; width: number; height: number },
  ): void {
    this.nodeId = nodeId;
    this.originalTitle = title;

    let x = bounds.x;
    let y = bounds.y;
    let w = bounds.width;
    let h = bounds.height;

    if (this.config.getViewportTransform) {
      const { zoom, pan } = this.config.getViewportTransform();
      x = bounds.x * zoom + pan.x;
      y = bounds.y * zoom + pan.y;
      w = bounds.width * zoom;
      h = bounds.height * zoom;
    }

    this.editorElement = document.createElement("textarea");
    this.editorElement.className = "y-mindmap-inline-editor";
    this.editorElement.value = title;
    this.editorElement.style.position = "absolute";
    this.editorElement.style.left = `${x}px`;
    this.editorElement.style.top = `${y}px`;
    this.editorElement.style.width = `${w}px`;
    this.editorElement.style.height = `${h}px`;
    this.editorElement.style.fontSize = "14px";
    this.editorElement.style.fontFamily = "Arial";
    this.editorElement.style.padding = "8px";
    this.editorElement.style.border = "2px solid #4A90D9";
    this.editorElement.style.borderRadius = "4px";
    this.editorElement.style.outline = "none";
    this.editorElement.style.resize = "none";
    this.editorElement.style.zIndex = "10000";
    this.editorElement.style.boxSizing = "border-box";

    this.container.appendChild(this.editorElement);
    this.editorElement.focus();
    this.editorElement.select();

    this.editorElement.addEventListener("keydown", this.handleKeyDown);
    this.editorElement.addEventListener("blur", this.handleBlur);
  }

  stopEditing(): void {
    if (!this.editorElement) return;

    const newTitle = this.editorElement.value;

    this.editorElement.removeEventListener("keydown", this.handleKeyDown);
    this.editorElement.removeEventListener("blur", this.handleBlur);

    this.container.removeChild(this.editorElement);
    this.editorElement = null;

    if (this.nodeId && newTitle !== this.originalTitle) {
      this.config.onSubmit(this.nodeId, newTitle);
    }

    this.nodeId = null;
    this.originalTitle = "";
  }

  cancelEditing(): void {
    if (!this.editorElement) return;

    this.editorElement.removeEventListener("keydown", this.handleKeyDown);
    this.editorElement.removeEventListener("blur", this.handleBlur);

    this.container.removeChild(this.editorElement);
    this.editorElement = null;

    this.nodeId = null;
    this.originalTitle = "";

    this.config.onCancel();
  }

  isEditing(): boolean {
    return this.editorElement !== null;
  }

  getEditingNodeId(): string | null {
    return this.nodeId;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.stopEditing();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      this.cancelEditing();
    }

    if (e.key === "Tab") {
      e.preventDefault();
      this.stopEditing();
    }
  };

  private handleBlur = (): void => {
    this.stopEditing();
  };

  dispose(): void {
    if (this.isEditing()) {
      this.cancelEditing();
    }
  }
}
