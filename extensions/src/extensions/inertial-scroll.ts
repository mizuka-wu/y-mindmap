import { createExtension } from "@y-mindmap/extension";
import { InertialScroll as InertialScrollHandler } from "@y-mindmap/interaction";

export interface InertialScrollOptions {
  /**
   * 摩擦系数，控制减速速度 (0-1)
   * @default 0.95
   */
  friction?: number;

  /**
   * 触发惯性滚动的速度阈值
   * @default 0.5
   */
  threshold?: number;
}

export const InertialScroll = createExtension<InertialScrollOptions>({
  name: "extension-inertial-scroll",
  type: "behavior",

  defaultOptions: {
    friction: 0.95,
    threshold: 0.5,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return;

    const container = ctx.view!.getDom();
    if (!container) return;

    const inertialScroll = new InertialScrollHandler(
      (dx, dy) => {
        ctx.view!.panBy(dx, dy);
      },
      {
        friction: options.friction,
        minVelocity: options.threshold,
      },
    );

    const onPointerDown = (e: PointerEvent): boolean | void => {
      inertialScroll.stop();
      inertialScroll.record(e.clientX, e.clientY);
      return false;
    };

    const onPointerMove = (e: PointerEvent): boolean | void => {
      inertialScroll.record(e.clientX, e.clientY);
      return false;
    };

    const onPointerUp = (): boolean | void => {
      inertialScroll.start();
      return false;
    };

    const onBoxSelectStart = () => {
      inertialScroll.pause();
    };

    const onBoxSelectEnd = () => {
      inertialScroll.resume();
    };

    const unregister = ctx.registerPointerHandler({
      name: "inertial-scroll",
      onPointerDown,
      onPointerMove,
      onPointerUp,
      priority: 1,
    });

    ctx.on("boxselect:start", onBoxSelectStart);
    ctx.on("boxselect:end", onBoxSelectEnd);

    return () => {
      inertialScroll.stop();
      unregister();
      ctx.off("boxselect:start", onBoxSelectStart);
      ctx.off("boxselect:end", onBoxSelectEnd);
    };
  },
});
