import { createExtension } from "@y-mindmap/extension";
import type { TopicNodeView } from "@y-mindmap/view";

export interface RichTextEditOptions {
  showFormatToolbar?: boolean;
}

export const RichTextEdit = createExtension<RichTextEditOptions>({
  name: "extension-rich-text-edit",
  type: "behavior",

  defaultOptions: {
    showFormatToolbar: true,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return;

    const view = ctx.view;
    const container = view.getDom();

    let editingNodeId: string | null = null;
    let editOverlay: HTMLElement | null = null;
    let editToolbar: HTMLElement | null = null;
    let editKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
    let editBlurHandler: ((e: FocusEvent) => void) | null = null;

    function setNonEditingNodesForcedInvisible(
      activeNodeId: string,
      forcedInvisible: boolean,
    ) {
      for (const [, topicView] of view.getAllTopicViews()) {
        if (topicView.nodeId !== activeNodeId) {
          topicView.setForcedInvisible(forcedInvisible);
        }
      }
    }

    function removeEditOverlay() {
      if (editToolbar) {
        editToolbar.remove();
        editToolbar = null;
      }

      if (!editOverlay) return;

      if (editKeyDownHandler) {
        editOverlay.removeEventListener("keydown", editKeyDownHandler);
        editKeyDownHandler = null;
      }
      if (editBlurHandler) {
        editOverlay.removeEventListener("blur", editBlurHandler);
        editBlurHandler = null;
      }

      editOverlay.remove();
      editOverlay = null;
    }

    function stopEditing(save: boolean) {
      if (!editingNodeId || !editOverlay) return;

      if (save) {
        const newText = editOverlay.innerText;
        const originalTitle =
          ctx.state?.doc.getNodeById(editingNodeId)?.title ?? "";
        if (newText !== originalTitle) {
          ctx.executeCommand("updateTitle", {
            nodeId: editingNodeId,
            title: newText,
          });
        }
      }

      setNonEditingNodesForcedInvisible(editingNodeId, false);
      removeEditOverlay();
      editingNodeId = null;
    }

    function createFormatToolbar(x: number, y: number): HTMLElement {
      const toolbar = document.createElement("div");
      toolbar.className = "y-mindmap-format-toolbar";
      toolbar.style.position = "absolute";
      toolbar.style.left = `${x}px`;
      toolbar.style.top = `${y}px`;
      toolbar.style.zIndex = "10001";
      toolbar.style.display = "flex";
      toolbar.style.gap = "2px";
      toolbar.style.padding = "4px 6px";
      toolbar.style.background = "#fff";
      toolbar.style.borderRadius = "6px";
      toolbar.style.boxShadow =
        "0 2px 8px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)";
      toolbar.style.userSelect = "none";

      const buttons = [
        { label: "B", command: "bold", style: "font-weight:bold" },
        { label: "I", command: "italic", style: "font-style:italic" },
        {
          label: "U",
          command: "underline",
          style: "text-decoration:underline",
        },
      ];

      for (const btn of buttons) {
        const button = document.createElement("button");
        button.textContent = btn.label;
        button.setAttribute("data-command", btn.command);
        button.style.cssText = `
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          ${btn.style};
        `;
        button.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          document.execCommand(btn.command, false);
          editOverlay?.focus();
        });
        button.addEventListener("mouseenter", () => {
          button.style.background = "#f0f0f0";
        });
        button.addEventListener("mouseleave", () => {
          button.style.background = "transparent";
        });
        toolbar.appendChild(button);
      }

      const separator = document.createElement("div");
      separator.style.cssText =
        "width:1px;height:20px;background:#e0e0e0;margin:4px 2px";
      toolbar.appendChild(separator);

      const colorContainer = document.createElement("div");
      colorContainer.style.position = "relative";

      const colorButton = document.createElement("button");
      colorButton.textContent = "A";
      colorButton.style.cssText = `
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        color: #333;
        display: flex;
        align-items: center;
        justify-content: center;
        border-bottom: 3px solid #e74c3c;
      `;
      colorButton.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      const colorPalette = document.createElement("div");
      colorPalette.style.cssText = `
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        padding: 6px;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10002;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
      `;

      const colors = [
        "#000000",
        "#333333",
        "#666666",
        "#999999",
        "#cccccc",
        "#e74c3c",
        "#e67e22",
        "#f1c40f",
        "#2ecc71",
        "#3498db",
        "#9b59b6",
        "#1abc9c",
        "#d35400",
        "#2c3e50",
        "#7f8c8d",
      ];

      for (const color of colors) {
        const swatch = document.createElement("div");
        swatch.style.cssText = `
          width: 20px;
          height: 20px;
          background: ${color};
          border-radius: 3px;
          cursor: pointer;
          border: 1px solid rgba(0,0,0,0.1);
        `;
        swatch.addEventListener("mousedown", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
        swatch.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          document.execCommand("foreColor", false, color);
          colorPalette.style.display = "none";
          editOverlay?.focus();
        });
        swatch.addEventListener("mouseenter", () => {
          swatch.style.transform = "scale(1.2)";
        });
        swatch.addEventListener("mouseleave", () => {
          swatch.style.transform = "scale(1)";
        });
        colorPalette.appendChild(swatch);
      }

      colorButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        colorPalette.style.display =
          colorPalette.style.display === "none" ? "grid" : "none";
      });
      colorButton.addEventListener("mouseenter", () => {
        colorButton.style.background = "#f0f0f0";
      });
      colorButton.addEventListener("mouseleave", () => {
        colorButton.style.background = "transparent";
      });

      colorContainer.appendChild(colorButton);
      colorContainer.appendChild(colorPalette);
      toolbar.appendChild(colorContainer);

      return toolbar;
    }

    function createEditOverlay(nodeId: string, topicView: TopicNodeView) {
      const titleBounds = topicView.getTitleBounds();
      const titleStyle = topicView.getTitleStyle();
      const worldBounds = topicView.getBounds();

      const pan = view.getViewportController().getPan();
      const absX = worldBounds.x + titleBounds.x;
      const absY = worldBounds.y + titleBounds.y;
      const screenX = absX * view.getZoom() + pan.x;
      const screenY = absY * view.getZoom() + pan.y;
      const screenWidth = titleBounds.width * view.getZoom();
      const screenHeight = titleBounds.height * view.getZoom();

      if (options?.showFormatToolbar) {
        const toolbar = createFormatToolbar(screenX, screenY - 36);
        container.appendChild(toolbar);
        editToolbar = toolbar;
      }

      const overlay = document.createElement("div");
      overlay.className = "y-mindmap-edit-overlay";
      overlay.contentEditable = "true";
      overlay.setAttribute("spellcheck", "false");

      const node = ctx.state?.doc.getNodeById(nodeId);
      overlay.textContent = node?.title ?? "";

      overlay.style.position = "absolute";
      overlay.style.left = `${screenX}px`;
      overlay.style.top = `${screenY}px`;
      overlay.style.width = `${screenWidth}px`;
      overlay.style.minHeight = `${screenHeight}px`;
      overlay.style.fontSize = `${titleStyle.fontSize * view.getZoom()}px`;
      overlay.style.fontFamily = titleStyle.fontFamily;
      overlay.style.color = titleStyle.color;
      overlay.style.fontWeight = String(titleStyle.fontWeight);
      overlay.style.fontStyle = titleStyle.fontStyle;
      overlay.style.textAlign = titleStyle.textAlign;
      overlay.style.lineHeight = "1.4";
      overlay.style.padding = "2px 4px";
      overlay.style.outline = "none";
      overlay.style.border = "2px solid #4A90D9";
      overlay.style.borderRadius = "4px";
      overlay.style.background = "#fff";
      overlay.style.zIndex = "10000";
      overlay.style.boxSizing = "border-box";
      overlay.style.overflow = "hidden";
      overlay.style.whiteSpace = "pre-wrap";
      overlay.style.wordBreak = "break-word";

      editKeyDownHandler = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          stopEditing(true);
        } else if (e.key === "Escape") {
          e.preventDefault();
          stopEditing(false);
        }
      };
      editBlurHandler = () => {
        setTimeout(() => stopEditing(true), 0);
      };

      overlay.addEventListener("keydown", editKeyDownHandler);
      overlay.addEventListener("blur", editBlurHandler);

      container.appendChild(overlay);
      editOverlay = overlay;

      requestAnimationFrame(() => {
        overlay.focus();
        const range = document.createRange();
        range.selectNodeContents(overlay);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
    }

    function startEditingNode(nodeId: string) {
      if (editingNodeId === nodeId) return;
      if (editingNodeId) {
        stopEditing(true);
      }

      const topicView = view.getTopicView(nodeId);
      if (!topicView) return;

      editingNodeId = nodeId;
      setNonEditingNodesForcedInvisible(nodeId, true);
      createEditOverlay(nodeId, topicView);
    }

    const onDblClick = (e: MouseEvent) => {
      if (!ctx.state) return;

      const worldPoint = view.clientToWorld(e.clientX, e.clientY);
      const nodeId = view.getNodeAtPoint(worldPoint);
      if (!nodeId) return;

      startEditingNode(nodeId);
    };

    const onDoubleTap = ({ nodeId }: { nodeId: string }) => {
      startEditingNode(nodeId);
    };

    container.addEventListener("dblclick", onDblClick);
    ctx.on("editor:doubletap", onDoubleTap);

    return () => {
      container.removeEventListener("dblclick", onDblClick);
      ctx.off("editor:doubletap", onDoubleTap);
      stopEditing(false);
      removeEditOverlay();
    };
  },
});
