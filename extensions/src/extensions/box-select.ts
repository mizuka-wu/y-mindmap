import { createExtension } from "@y-mindmap/extension";
import { Rect } from "leafer-ui";
import { Transaction, Selection } from "@y-mindmap/state";

export const BoxSelect = createExtension({
  name: "extension-box-select",
  type: "behavior",

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    if (!ctx.view) return;

    const view = ctx.view;
    const container = view.getDom();
    const overlayLayer = view.getOverlayLayer();

    let boxSelectStartPoint: { x: number; y: number } | null = null;
    let boxSelectRect: Rect | null = null;
    let isBoxSelecting = false;

    function rectsIntersect(a: any, b: any): boolean {
      return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      );
    }

    function restoreAllNodesVisibility() {
      for (const [, topicView] of view.getAllTopicViews()) {
        topicView.setForcedInvisible(false);
      }
    }

    function setOutsideBoxSelectNodesForcedInvisible(boxBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) {
      const expandedBox = {
        x: boxBounds.x - 100,
        y: boxBounds.y - 100,
        width: boxBounds.width + 200,
        height: boxBounds.height + 200,
      };

      for (const [, topicView] of view.getAllTopicViews()) {
        const bounds = topicView.getAbsoluteBounds();
        const isInside = rectsIntersect(expandedBox, bounds);
        topicView.setForcedInvisible(!isInside);
      }
    }

    const onBoxSelectMove = (e: PointerEvent) => {
      if (!boxSelectStartPoint || !boxSelectRect) return;

      const currentPoint = view.clientToWorld(e.clientX, e.clientY);
      const start = boxSelectStartPoint;

      const x = Math.min(start.x, currentPoint.x);
      const y = Math.min(start.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - start.x);
      const height = Math.abs(currentPoint.y - start.y);

      boxSelectRect.set({ x, y, width, height });

      if (width > 2 || height > 2) {
        isBoxSelecting = true;
        setOutsideBoxSelectNodesForcedInvisible({ x, y, width, height });
      }
    };

    const onBoxSelectUp = (e: PointerEvent) => {
      document.removeEventListener("pointermove", onBoxSelectMove);
      document.removeEventListener("pointerup", onBoxSelectUp);

      restoreAllNodesVisibility();

      if (isBoxSelecting && boxSelectRect && ctx.state) {
        const rect = boxSelectRect;
        const rectBounds = {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };

        const selectedNodeIds: string[] = [];
        for (const [, topicView] of view.getAllTopicViews()) {
          if (!topicView.isVisible() || topicView.isForcedInvisible()) continue;

          const bounds = topicView.getAbsoluteBounds();
          if (bounds && rectsIntersect(rectBounds, bounds as any)) {
            selectedNodeIds.push(topicView.nodeId);
          }
        }

        if (selectedNodeIds.length > 0) {
          const tr = new Transaction(ctx.state.workbook, ctx.state.selection);
          tr.setSelection(Selection.multiple(selectedNodeIds));
          ctx.dispatch(tr);
        }
      }

      if (boxSelectRect) {
        boxSelectRect.remove();
        boxSelectRect = null;
      }
      boxSelectStartPoint = null;
      isBoxSelecting = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (!ctx.state) return;

      const worldPoint = view.clientToWorld(e.clientX, e.clientY);
      const nodeId = view.getNodeAtPoint(worldPoint);

      if (nodeId) return;

      boxSelectStartPoint = { ...worldPoint };
      isBoxSelecting = false;

      const selectionRect = new Rect({
        x: worldPoint.x,
        y: worldPoint.y,
        width: 0,
        height: 0,
        stroke: "#4A90D9",
        strokeWidth: 1,
        dashPattern: [4, 4],
        fill: "rgba(74, 144, 217, 0.1)",
      });
      overlayLayer.add(selectionRect);
      boxSelectRect = selectionRect;

      document.addEventListener("pointermove", onBoxSelectMove);
      document.addEventListener("pointerup", onBoxSelectUp);
    };

    container.addEventListener("pointerdown", onPointerDown);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onBoxSelectMove);
      document.removeEventListener("pointerup", onBoxSelectUp);
      restoreAllNodesVisibility();
      if (boxSelectRect) {
        boxSelectRect.remove();
        boxSelectRect = null;
      }
    };
  },
});
