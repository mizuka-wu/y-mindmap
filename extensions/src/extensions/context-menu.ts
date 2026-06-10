import { createExtension } from "@y-mindmap/extension";
import { MindMapNode, Transaction, Selection } from "@y-mindmap/state";

export interface ContextMenuOptions {
  items?: Array<{
    id: string;
    label: string;
    icon?: string;
    shortcut?: string;
    action: (nodeId?: string) => void;
  }>;
}

export const ContextMenu = createExtension<ContextMenuOptions>({
  name: "extension-context-menu",
  type: "behavior",

  defaultOptions: {
    items: [],
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return;

    const view = ctx.view;
    const container = view.getDom();

    let contextMenu: HTMLElement | null = null;
    let contextMenuClickHandler: ((e: MouseEvent) => void) | null = null;
    let contextMenuKeyHandler: ((e: KeyboardEvent) => void) | null = null;

    function hideContextMenu() {
      if (contextMenu) {
        contextMenu.remove();
        contextMenu = null;
      }
      if (contextMenuClickHandler) {
        document.removeEventListener("click", contextMenuClickHandler);
        contextMenuClickHandler = null;
      }
      if (contextMenuKeyHandler) {
        document.removeEventListener("keydown", contextMenuKeyHandler);
        contextMenuKeyHandler = null;
      }
    }

    function dispatchCommand(command: string, nodeId: string) {
      if (!ctx.state) return;
      const tr = ctx.state.tr;

      switch (command) {
        case "addSubTopic": {
          const newNode = MindMapNode.create("New Topic");
          tr.addNode(nodeId, newNode);
          tr.setSelection(Selection.single(newNode.id));
          break;
        }
        case "addSiblingTopic": {
          const parent = ctx.state.doc.findParent(nodeId);
          if (parent) {
            const newNode = MindMapNode.create("New Topic");
            tr.addNode(parent.id, newNode);
            tr.setSelection(Selection.single(newNode.id));
          }
          break;
        }
        case "deleteNode": {
          tr.removeNode(nodeId);
          break;
        }
        case "toggleFold": {
          const node = ctx.state.doc.getNodeById(nodeId);
          if (node) {
            tr.updateNode(nodeId, (n) => n.toggleFold());
          }
          break;
        }
      }

      ctx.dispatch(tr);
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (!ctx.state) return;

      const worldPoint = view.clientToWorld(e.clientX, e.clientY);
      const nodeId = view.getNodeAtPoint(worldPoint);

      if (!nodeId) return;

      view.selectNode(nodeId);
      hideContextMenu();

      const menu = document.createElement("div");
      menu.className = "y-mindmap-context-menu";
      menu.style.position = "fixed";
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;
      menu.style.zIndex = "10001";
      menu.style.background = "#fff";
      menu.style.borderRadius = "8px";
      menu.style.boxShadow =
        "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)";
      menu.style.padding = "4px 0";
      menu.style.minWidth = "160px";
      menu.style.fontFamily =
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      menu.style.fontSize = "13px";
      menu.style.color = "#333";
      menu.style.userSelect = "none";

      const items = [
        {
          label: "添加子节点",
          action: () => dispatchCommand("addSubTopic", nodeId),
        },
        {
          label: "添加兄弟节点",
          action: () => dispatchCommand("addSiblingTopic", nodeId),
        },
        {
          label: "删除",
          action: () => dispatchCommand("deleteNode", nodeId),
          danger: true,
        },
        {
          label: "折叠/展开",
          action: () => dispatchCommand("toggleFold", nodeId),
        },
      ];

      if (options?.items && options.items.length > 0) {
        items.push({ label: "", action: () => {}, divider: true } as any);
        for (const pluginItem of options.items) {
          items.push({
            label: pluginItem.label,
            action: () => pluginItem.action(nodeId),
          });
        }
      }

      for (const item of items) {
        if ((item as any).divider) {
          const divider = document.createElement("div");
          divider.style.height = "1px";
          divider.style.background = "#e0e0e0";
          divider.style.margin = "4px 0";
          menu.appendChild(divider);
          continue;
        }

        const menuItem = document.createElement("div");
        menuItem.textContent = item.label;
        menuItem.style.padding = "8px 16px";
        menuItem.style.cursor = "pointer";
        menuItem.style.transition = "background 0.1s";

        if ((item as any).danger) {
          menuItem.style.color = "#e74c3c";
        }

        menuItem.addEventListener("mouseenter", () => {
          menuItem.style.background = "#f5f5f5";
        });
        menuItem.addEventListener("mouseleave", () => {
          menuItem.style.background = "transparent";
        });
        menuItem.addEventListener("mousedown", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        });
        menuItem.addEventListener("click", (ev) => {
          ev.stopPropagation();
          item.action();
          hideContextMenu();
        });

        menu.appendChild(menuItem);
      }

      container.appendChild(menu);
      contextMenu = menu;

      const menuRect = menu.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (menuRect.right > containerRect.right) {
        menu.style.left = `${e.clientX - menuRect.width}px`;
      }
      if (menuRect.bottom > containerRect.bottom) {
        menu.style.top = `${e.clientY - menuRect.height}px`;
      }

      contextMenuClickHandler = (ev: MouseEvent) => {
        if (!menu.contains(ev.target as Node)) {
          hideContextMenu();
        }
      };
      contextMenuKeyHandler = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") {
          hideContextMenu();
        }
      };

      setTimeout(() => {
        if (!contextMenu) return;
        document.addEventListener("click", contextMenuClickHandler!);
        document.addEventListener("keydown", contextMenuKeyHandler!);
      }, 0);
    };

    container.addEventListener("contextmenu", onContextMenu);

    return () => {
      container.removeEventListener("contextmenu", onContextMenu);
      hideContextMenu();
    };
  },
});
