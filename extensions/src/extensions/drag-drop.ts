import { createExtension } from "@y-mindmap/extension";
import {
  DragPreviewView,
  DropIndicatorView,
  DropPosition,
  type DropTarget,
} from "@y-mindmap/view";
import { MindMapNode, Transaction, Selection } from "@y-mindmap/state";

export interface DragDropOptions {
  indicatorColor?: string;
  previewOpacity?: number;
}

export const DragDrop = createExtension<DragDropOptions>({
  name: "extension-drag-drop",
  type: "behavior",

  defaultOptions: {
    indicatorColor: "#2196F3",
    previewOpacity: 0.5,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return;

    const view = ctx.view;
    const container = view.getDom();
    const overlayLayer = view.getOverlayLayer();

    let isDragging = false;
    let dragSourceId: string | null = null;
    let dragStartPosition: { x: number; y: number } | null = null;
    let dragPreviewView: DragPreviewView | null = null;
    let dropIndicatorView: DropIndicatorView | null = null;

    function cleanupDragVisuals() {
      if (dragPreviewView) {
        dragPreviewView.group.remove();
        dragPreviewView = null;
      }
      if (dropIndicatorView) {
        dropIndicatorView.group.remove();
        dropIndicatorView = null;
      }
    }

    function hitTest(
      worldPoint: { x: number; y: number },
      sourceId: string,
    ): DropTarget | null {
      for (const [, topicView] of view.getAllTopicViews()) {
        if (topicView.nodeId === sourceId) continue;
        if (!topicView.isVisible() || topicView.isForcedInvisible()) continue;

        const bounds = topicView.getBounds();
        if (
          worldPoint.x >= bounds.x &&
          worldPoint.x <= bounds.x + bounds.width &&
          worldPoint.y >= bounds.y &&
          worldPoint.y <= bounds.y + bounds.height
        ) {
          const relativeY = worldPoint.y - bounds.y;
          const heightRatio = relativeY / bounds.height;

          let position: DropPosition;
          if (heightRatio < 0.25) {
            position = DropPosition.BEFORE;
          } else if (heightRatio > 0.75) {
            position = DropPosition.AFTER;
          } else {
            position = DropPosition.INSIDE;
          }

          return {
            nodeId: topicView.nodeId,
            position,
            bounds: { ...bounds },
          };
        }
      }
      return null;
    }

    const onPointerDown = (e: PointerEvent): boolean | void => {
      if (e.button !== 0) return false;
      if (!ctx.state) return false;
      if (isDragging || dragSourceId) return false;

      const worldPoint = view.clientToWorld(e.clientX, e.clientY);
      const nodeId = view.getNodeAtPoint(worldPoint);

      if (!nodeId) return false;

      const node = ctx.state.doc.getNodeById(nodeId);
      if (!node || node.isRoot) return false;

      const sourceView = view.getTopicView(nodeId);
      if (!sourceView) return false;

      isDragging = false;
      dragSourceId = nodeId;
      dragStartPosition = { ...worldPoint };

      const sourceBounds = sourceView.getBounds();

      const srcNode = ctx.state.doc.getNodeById(nodeId)!;
      dragPreviewView = new DragPreviewView(srcNode);
      dropIndicatorView = new DropIndicatorView(srcNode);

      dragPreviewView.show(sourceBounds.width, sourceBounds.height);

      overlayLayer.add(dragPreviewView.group);
      overlayLayer.add(dropIndicatorView.group);

      return true;
    };

    const onPointerMove = (e: PointerEvent): boolean | void => {
      if (!dragSourceId || !dragPreviewView || !dragStartPosition) return false;

      const currentWorldPoint = view.clientToWorld(e.clientX, e.clientY);
      const sourceId = dragSourceId;

      const dx = currentWorldPoint.x - dragStartPosition.x;
      const dy = currentWorldPoint.y - dragStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const DRAG_THRESHOLD = 5;

      if (!isDragging && distance >= DRAG_THRESHOLD) {
        isDragging = true;
        const srcView = view.getTopicView(sourceId);
        if (srcView) {
          srcView.setForcedInvisible(true);
        }
      }

      if (isDragging) {
        const previewBounds = dragPreviewView.getBounds();
        dragPreviewView.setPosition({
          x: currentWorldPoint.x - previewBounds.width / 2,
          y: currentWorldPoint.y - previewBounds.height / 2,
        });

        const target = hitTest(currentWorldPoint, sourceId);
        if (target && dropIndicatorView) {
          dropIndicatorView.showDropTarget(target);
        } else if (dropIndicatorView) {
          dropIndicatorView.hide();
        }
        return true;
      }

      return false;
    };

    const onPointerUp = (e: PointerEvent): boolean | void => {
      const wasDragging = isDragging;

      if (isDragging && dragSourceId && ctx.state) {
        const currentWorldPoint = view.clientToWorld(e.clientX, e.clientY);
        const sourceId = dragSourceId;
        const target = hitTest(currentWorldPoint, sourceId);

        if (target && target.position !== DropPosition.NONE) {
          const targetId = target.nodeId;
          const dropPos = target.position;

          const sourceNode = ctx.state.doc.getNodeById(sourceId);
          const targetNode = ctx.state.doc.getNodeById(targetId);

          let isValid = true;
          if (sourceNode && targetNode && sourceId !== targetId) {
            let isDescendant = false;
            targetNode.descendants((n: MindMapNode) => {
              if (n.id === sourceId) isDescendant = true;
            });
            isValid = !isDescendant;
          } else if (sourceId === targetId) {
            isValid = false;
          }

          if (isValid) {
            const tr = ctx.state.tr;

            if (dropPos === DropPosition.INSIDE) {
              tr.moveNode(sourceId, targetId);
            } else {
              const parent = ctx.state.doc.findParent(targetId);
              if (parent) {
                const siblings = parent.attachedChildren;
                const targetIndex = siblings.findIndex(
                  (n) => n.id === targetId,
                );
                const insertIndex =
                  dropPos === DropPosition.BEFORE
                    ? targetIndex
                    : targetIndex + 1;
                tr.moveNode(sourceId, parent.id, insertIndex);
              }
            }

            tr.setSelection(Selection.single(sourceId));
            ctx.dispatch(tr);
          }
        }
      }

      cleanupDragVisuals();

      if (dragSourceId) {
        const srcView = view.getTopicView(dragSourceId);
        if (srcView) {
          srcView.setForcedInvisible(false);
        }
      }

      isDragging = false;
      dragSourceId = null;
      dragStartPosition = null;

      return wasDragging || false;
    };

    const unregister = ctx.registerPointerHandler({
      name: "drag-drop",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      priority: 20,
    });

    return () => {
      unregister();
      cleanupDragVisuals();
      if (dragSourceId) {
        const srcView = view.getTopicView(dragSourceId);
        if (srcView) srcView.setForcedInvisible(false);
      }
    };
  },
});
