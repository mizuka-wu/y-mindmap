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
    let boxSelectWorldBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;

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

    const cleanupBoxSelect = () => {
      restoreAllNodesVisibility();
      if (boxSelectRect) {
        boxSelectRect.remove();
        boxSelectRect = null;
      }
      boxSelectStartPoint = null;
      boxSelectWorldBounds = null;
      isBoxSelecting = false;
    };

    const onPointerDown = (e: PointerEvent): boolean | void => {
      if (e.button !== 0) return false;
      if (!ctx.state) return false;

      const worldPoint = view.clientToWorld(e.clientX, e.clientY);
      const nodeId = view.getNodeAtPoint(worldPoint);

      if (nodeId) return false;

      // 阻止 click 事件合成，防止框选结果被 click 覆盖
      e.preventDefault();

      ctx.emit("boxselect:start");

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

      return false;
    };

    const onPointerMove = (e: PointerEvent): boolean | void => {
      if (!boxSelectStartPoint || !boxSelectRect) return false;

      const currentPoint = view.clientToWorld(e.clientX, e.clientY);
      const start = boxSelectStartPoint;

      const x = Math.min(start.x, currentPoint.x);
      const y = Math.min(start.y, currentPoint.y);
      const width = Math.abs(currentPoint.x - start.x);
      const height = Math.abs(currentPoint.y - start.y);

      boxSelectRect.set({ x, y, width, height });
      boxSelectWorldBounds = { x, y, width, height };

      if (width > 2 || height > 2) {
        isBoxSelecting = true;
        return true;
      }

      return false;
    };

    const onPointerUp = (e: PointerEvent): boolean | void => {
      const wasBoxSelecting = isBoxSelecting;

      if (isBoxSelecting && boxSelectWorldBounds && ctx.state) {
        const selectedNodeIds: string[] = [];
        for (const [, topicView] of view.getAllTopicViews()) {
          if (!topicView.isVisible() || topicView.isForcedInvisible()) continue;

          const bounds = topicView.getAbsoluteBounds();
          if (bounds && rectsIntersect(boxSelectWorldBounds, bounds as any)) {
            selectedNodeIds.push(topicView.nodeId);
          }
        }

        if (selectedNodeIds.length > 0) {
          const tr = new Transaction(ctx.state.workbook, ctx.state.selection);
          tr.setSelection(Selection.multiple(selectedNodeIds));
          ctx.dispatch(tr);
        }
      } else if (!wasBoxSelecting && ctx.state) {
        // 空白处点击（未形成框选），手动取消选择
        const tr = new Transaction(ctx.state.workbook, ctx.state.selection);
        tr.setSelection(Selection.empty());
        ctx.dispatch(tr);
      }

      cleanupBoxSelect();
      ctx.emit("boxselect:end");

      return wasBoxSelecting || false;
    };

    const onPointerCancel = (): boolean | void => {
      cleanupBoxSelect();
      ctx.emit("boxselect:end");
      return isBoxSelecting || false;
    };

    const unregister = ctx.registerPointerHandler({
      name: "box-select",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      priority: 10,
    });

    return () => {
      unregister();
      cleanupBoxSelect();
    };
  },
});
