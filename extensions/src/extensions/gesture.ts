import { createExtension } from "@y-mindmap/extension";
import { GestureRecognizer } from "@y-mindmap/interaction";

export interface GestureOptions {
  enablePinch?: boolean;
  enablePan?: boolean;
}

export const Gesture = createExtension<GestureOptions>({
  name: "extension-gesture",
  type: "behavior",

  defaultOptions: {
    enablePinch: true,
    enablePan: true,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return;

    const container = ctx.view!.getDom();
    if (!container) return;

    const recognizer = new GestureRecognizer((event) => {
      const v = ctx.view!;
      switch (event.type) {
        case "pinch":
          if (event.scale && options.enablePinch !== false) {
            v.zoomTo(v.getZoom() * event.scale);
          }
          break;
        case "pan":
          if (
            event.deltaX !== undefined &&
            event.deltaY !== undefined &&
            options.enablePan !== false
          ) {
            v.panBy(event.deltaX, event.deltaY);
          }
          break;
        case "tap":
          if (event.center) {
            const worldPoint = v.clientToWorld(event.center.x, event.center.y);
            const nodeId = v.getNodeAtPoint(worldPoint);
            if (nodeId) ctx.executeCommand("selectNode", { nodeId });
          }
          break;
        case "doubletap":
          if (event.center) {
            const worldPoint = v.clientToWorld(event.center.x, event.center.y);
            const nodeId = v.getNodeAtPoint(worldPoint);
            if (nodeId) ctx.emit("editor:doubletap", { nodeId });
          }
          break;
      }
    });

    const onPointerDown = (e: PointerEvent): boolean | void => {
      recognizer.handlePointerDown(e.pointerId, e.clientX, e.clientY);
      return false;
    };
    const onPointerMove = (e: PointerEvent): boolean | void => {
      recognizer.handlePointerMove(e.pointerId, e.clientX, e.clientY);
      return false;
    };
    const onPointerUp = (e: PointerEvent): boolean | void => {
      recognizer.handlePointerUp(e.pointerId, e.clientX, e.clientY);
      return false;
    };
    const onPointerCancel = (e: PointerEvent): boolean | void => {
      recognizer.handlePointerCancel(e.pointerId);
      return false;
    };

    const unregister = ctx.registerPointerHandler({
      name: "gesture",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      priority: 5,
    });

    return () => {
      recognizer.reset();
      unregister();
    };
  },
});
