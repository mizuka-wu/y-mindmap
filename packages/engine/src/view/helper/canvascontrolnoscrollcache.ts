import { EVENTS } from "../../common/constants/index";
import CanvasControl from "./canvascontrol";

/**
 *
 * `Viewport Coordinate`: left top position of `window` as origin position
 * `Visible Area Coordinate`: left top position of `Visible area` as origin position
 * `Mind Map Coordinate`: center position of `Central Topic` as origin position
 *
 */
export class CanvasConstrolNoScrollCache extends CanvasControl {
  _currentScrollLeft: number | null;
  _currentScrollTop: number | null;
  constructor(svgView) {
    super(svgView);
    this._currentScrollLeft = null;
    this._currentScrollTop = null;
  }
  _genMindMapOriginPosition(coordinateName) {
    const positionInEnlargedArea = this.getSheetContentTranslate();
    const positionInVisibleArea = {
      x: positionInEnlargedArea.x - this.getCurrentScrollLeft(),
      y: positionInEnlargedArea.y - this.getCurrentScrollTop(),
    };
    const positionInViewport = {
      x: positionInVisibleArea.x + this._visibleAreaBounds.x,
      y: positionInVisibleArea.y + this._visibleAreaBounds.y,
    };
    const positionInScrollContainer = {
      x:
        positionInEnlargedArea.x -
        this.getCurrentScrollLeft() +
        this._scrollContainerBounds.x,
      y:
        positionInEnlargedArea.y -
        this.getCurrentScrollTop() +
        this._scrollContainerBounds.y,
    };
    switch (coordinateName) {
      case "viewport":
        return positionInViewport;
      case "visibleArea":
        return positionInVisibleArea;
      case "enlargedArea":
        return positionInEnlargedArea;
      case "scrollContainer":
        return positionInScrollContainer;
    }
  }
  _initScrollListener() {
    let preScrollLeft = this._context.isDoughnutPlatform()
      ? (window as any).DonutExportInfo.scrollLeft
      : this._scrollContainer.scrollLeft;
    let preScrollTop = this._context.isDoughnutPlatform()
      ? (window as any).DonutExportInfo.scrollTop
      : this._scrollContainer.scrollTop;
    this._currentScrollLeft = preScrollLeft;
    this._currentScrollTop = preScrollTop;
    const isScrollContainerBody =
      this._scrollContainer.tagName.toLowerCase() === "html";
    const scrollListenerElement = isScrollContainerBody
      ? document
      : this._scrollContainer;
    // native shell handle `reset scroll`
    const scrollListener = () => {
      const currentScrollLeft = this._scrollContainer.scrollLeft;
      const currentScrollTop = this._scrollContainer.scrollTop;
      const deltaX = preScrollLeft - currentScrollLeft;
      const deltaY = preScrollTop - currentScrollTop;
      preScrollLeft = currentScrollLeft;
      preScrollTop = currentScrollTop;
      this._lastMindMapOriginPositionInVisibleArea =
        this._genMindMapOriginPosition("visibleArea");
      this._context.trigger(EVENTS.VIEW_PORT_MOVING, deltaX, deltaY);
      this._currentScrollLeft = currentScrollLeft;
      this._currentScrollTop = currentScrollTop;
    };
    if (this._context.isDoughnutPlatform()) {
      // fix bug: android's scroll event can't fire as expect, donutscroll is a custom event
      // fired by donut native code
      window.addEventListener("donutscroll", scrollListener);
    } else {
      scrollListenerElement.addEventListener("scroll", scrollListener);
    }
  }
  _scroll(x, y, options: any = {}) {
    if (!options.animate) {
      this._scrollContainer.scrollLeft -= x;
      this._scrollContainer.scrollTop -= y;
      window.requestAnimationFrame(
        () => options.finishToRun && options.finishToRun(),
      );
    } else {
      const startScrollTop = this._scrollContainer.scrollTop;
      const startScrollLeft = this._scrollContainer.scrollLeft;
      let ratio = 0;
      let isEnd = false;
      const frame = () => {
        ratio += 1 / 20;
        if (ratio >= 1) {
          ratio = 1;
          isEnd = true;
        }
        const r = Math.sqrt(ratio * 2 - ratio * ratio);
        const cx = x * r;
        const cy = y * r;
        this._scrollContainer.scrollTop = startScrollTop - cy;
        this._scrollContainer.scrollLeft = startScrollLeft - cx;
        window.requestAnimationFrame(
          !isEnd ? frame : () => options.finishToRun && options.finishToRun(),
        );
      };
      window.requestAnimationFrame(frame);
    }
  }
  getCurrentScrollLeft() {
    return (
      this._context.getDoughnutExportInfo().scrollLeft ||
      this._scrollContainer.scrollLeft
    );
  }
  getCurrentScrollTop() {
    return (
      this._context.getDoughnutExportInfo().scrollTop ||
      this._scrollContainer.scrollTop
    );
  }
}

export default CanvasConstrolNoScrollCache;
