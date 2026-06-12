export interface PointerHandler {
  name: string;
  onPointerDown?: (e: PointerEvent) => boolean | void;
  onPointerMove?: (e: PointerEvent) => boolean | void;
  onPointerUp?: (e: PointerEvent) => boolean | void;
  onPointerCancel?: (e: PointerEvent) => boolean | void;
  priority?: number;
}

export class PointerEventBus {
  private handlers: PointerHandler[] = [];
  private domListeners: {
    container: HTMLElement;
    down: (e: PointerEvent) => void;
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  } | null = null;

  bindTo(container: HTMLElement): void {
    if (this.domListeners) this.unbind();

    const onDown = (e: PointerEvent) => {
      this.dispatch(e, "onPointerDown");
    };
    const onMove = (e: PointerEvent) => {
      this.dispatch(e, "onPointerMove");
    };
    const onUp = (e: PointerEvent) => {
      this.dispatch(e, "onPointerUp");
    };
    const onCancel = (e: PointerEvent) => {
      this.dispatch(e, "onPointerCancel");
    };

    container.addEventListener("pointerdown", onDown, true);
    container.addEventListener("pointermove", onMove, true);
    container.addEventListener("pointerup", onUp, true);
    container.addEventListener("pointercancel", onCancel, true);

    this.domListeners = {
      container,
      down: onDown,
      move: onMove,
      up: onUp,
      cancel: onCancel,
    };
  }

  unbind(): void {
    if (!this.domListeners) return;
    const { container, down, move, up, cancel } = this.domListeners;
    container.removeEventListener("pointerdown", down, true);
    container.removeEventListener("pointermove", move, true);
    container.removeEventListener("pointerup", up, true);
    container.removeEventListener("pointercancel", cancel, true);
    this.domListeners = null;
  }

  register(handler: PointerHandler): () => void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return () => this.unregister(handler);
  }

  unregister(handler: PointerHandler): void {
    const idx = this.handlers.indexOf(handler);
    if (idx >= 0) this.handlers.splice(idx, 1);
  }

  private dispatch(
    event: PointerEvent,
    method: keyof Pick<
      PointerHandler,
      "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
    >,
  ): boolean {
    for (const h of this.handlers) {
      const fn = h[method];
      if (fn) {
        const result = fn(event);
        if (result === true) return true;
      }
    }
    return false;
  }
}
