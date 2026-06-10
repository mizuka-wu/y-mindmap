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

    const onDown = (e: PointerEvent) =>
      recognizer.handlePointerDown(e.pointerId, e.clientX, e.clientY);
    const onMove = (e: PointerEvent) =>
      recognizer.handlePointerMove(e.pointerId, e.clientX, e.clientY);
    const onUp = (e: PointerEvent) =>
      recognizer.handlePointerUp(e.pointerId, e.clientX, e.clientY);
    const onCancel = (e: PointerEvent) =>
      recognizer.handlePointerCancel(e.pointerId);

    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerup", onUp);
    container.addEventListener("pointercancel", onCancel);

    return () => {
      recognizer.reset();
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerup", onUp);
      container.removeEventListener("pointercancel", onCancel);
    };
  },
});
