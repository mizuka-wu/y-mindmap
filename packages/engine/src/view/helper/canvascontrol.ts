// import { debounce } from 'lodash'
import CoordinateTransfer from "./coordinate-transfer";
import * as utils from "../../utils/index";

import {
  CONFIG,
  EVENTS,
  MODULE_NAME,
  VIEW_TYPE,
} from "../../common/constants/index";
import type SvgView from "../svgview";

const REMAINED_SHEET_CONTENT_LENGTH = 100;
/**
 *
 * `Viewport Coordinate`: left top position of `window` as origin position
 * `Visible Area Coordinate`: left top position of `Visible area` as origin position
 * `Mind Map Coordinate`: center position of `Central Topic` as origin position
 *
 */
export class CanvasControl {
  _lastMindMapOriginPositionInVisibleArea: any;
  _scrollCenterVisiblePosition: { x: number; y: number };
  _lastScrollCenterRealPositionInVisibleArea: { x: number; y: number };
  _lastScrollCenterVisiblePositionInMindMap: { x: number; y: number };
  _svgView: any;
  _context: any;
  _paddingFactor: any;
  _sbContainer: any;
  _scrollContainer: Element;
  _coordinateTransfer: CoordinateTransfer;
  _scrollContainerBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  _visibleAreaBounds: { x: number; y: number; width: number; height: number };
  _lastScrollLeft: any;
  _lastScrollTop: any;
  constructor(svgView: SvgView) {
    this._lastMindMapOriginPositionInVisibleArea = null;
    this._scrollCenterVisiblePosition = {
      x: 0,
      y: 0,
    };
    this._lastScrollCenterRealPositionInVisibleArea = {
      x: 0,
      y: 0,
    };
    this._lastScrollCenterVisiblePositionInMindMap = {
      x: 0,
      y: 0,
    };
    this._svgView = svgView;
    this._context = svgView.getContext();
    this._paddingFactor = this._context.config(CONFIG.PADDING_FACTOR);
    this._sbContainer = this._context.getRootDOM();
    if (
      this._context.getScrollContainer() === document.body &&
      document.scrollingElement
    ) {
      this._scrollContainer = document.scrollingElement;
    } else {
      this._scrollContainer = this._context.getScrollContainer();
    }
    this._coordinateTransfer = new CoordinateTransfer(
      (coordinateName) => {
        return this._genMindMapOriginPosition(coordinateName);
      },
      () => {
        return this._getSheetContentScale();
      },
    );
    this._scrollContainerBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this._visibleAreaBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this._lastScrollLeft = this._scrollContainer.scrollLeft;
    this._lastScrollTop = this._scrollContainer.scrollTop;
    this._initEventListener();
  }
  _genMindMapOriginPosition(coordinateName) {
    const positionInEnlargedArea = this.getSheetContentTranslate();
    const positionInVisibleArea = {
      x: positionInEnlargedArea.x - this._lastScrollLeft,
      y: positionInEnlargedArea.y - this._lastScrollTop,
    };
    const positionInViewport = {
      x: positionInVisibleArea.x + this._visibleAreaBounds.x,
      y: positionInVisibleArea.y + this._visibleAreaBounds.y,
    };
    const positionInScrollContainer = {
      x:
        positionInEnlargedArea.x -
        this._lastScrollLeft +
        this._scrollContainerBounds.x,
      y:
        positionInEnlargedArea.y -
        this._lastScrollTop +
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
  _initEventListener() {
    /**
     * Some cases for mouse wheel event to prevent scroll event
     */
    // @ts-ignore
    this._scrollContainer.addEventListener("mousewheel", (e: WheelEvent) => {
      if (Object(utils.isToScaleByWheelEvent)(e)) {
        return e.preventDefault();
      }
      if (
        !Object(utils.browserIsMac)() &&
        e.shiftKey &&
        Math.abs(e.deltaX) === 0
      ) {
        e.preventDefault();
        this._scroll(-e.deltaY, 0);
      }
    });
    this._svgView.on(this._svgView.lifeCycleEvents.contentMount, (options) => {
      let _a;
      const clientRect = this._scrollContainer.getBoundingClientRect();
      const scrollContainerBounds = {
        x: clientRect.left,
        y: clientRect.top,
        width: this._scrollContainer.clientWidth,
        height: this._scrollContainer.clientHeight,
      };
      const nativeScale = this._svgView.getDeviceNativeScale();
      const visibleAreaBounds = {
        x: scrollContainerBounds.x,
        y: scrollContainerBounds.y,
        width: scrollContainerBounds.width / nativeScale,
        height: scrollContainerBounds.height / nativeScale,
      };
      if (this._context.isMobileAppPlatform()) {
        visibleAreaBounds.x = 0;
        visibleAreaBounds.y = 0;
      }
      this.setVisibleAreaBounds(visibleAreaBounds);
      this.setScrollContainerBounds(scrollContainerBounds, options);
      if ((_a = this._svgView.content()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.on("change:bounds", () => {
          this._updateSBContainerSize(options);
        });
      }
    });
    this._context.on(EVENTS.SELECTION_CHANGED, () => {
      this._lastScrollCenterRealPositionInVisibleArea =
        this._getLastScrollCenterRealPositionInVisibleArea();
    });
    this._svgView.on(
      this._svgView.lifeCycleEvents.scaleChanged,
      (scaleValue, isScaleByVisiblePosition) => {
        this._updateSBContainerSizeByScale();
        if (isScaleByVisiblePosition) {
          this._reFocusVisiblePositionScrollCenter();
        } else {
          this._reFocusRealPositionScrollCenter();
        }
      },
    );
    window.addEventListener("mousemove", (e) => {
      this._scrollCenterVisiblePosition =
        this._coordinateTransfer.viewportToVisibleArea({
          x: e.clientX,
          y: e.clientY,
        });
      this._lastScrollCenterVisiblePositionInMindMap =
        this._getLastScrollCenterVisiblePositionInMindMap();
    });
    const noListenResize = this._context.config(CONFIG.NO_LISTEN_RESIZE);
    if (!noListenResize) {
      window.addEventListener("resize", () => {
        const clientRect = this._scrollContainer.getBoundingClientRect();
        const scrollContainerBounds = {
          x: clientRect.left,
          y: clientRect.top,
          width: this._scrollContainer.clientWidth,
          height: this._scrollContainer.clientHeight,
        };
        const nativeScale = this._svgView.getDeviceNativeScale();
        const visibleAreaBounds = {
          x: scrollContainerBounds.x,
          y: scrollContainerBounds.y,
          width: scrollContainerBounds.width / nativeScale,
          height: scrollContainerBounds.height / nativeScale,
        };
        if (this._context.isMobileAppPlatform()) {
          visibleAreaBounds.x = 0;
          visibleAreaBounds.y = 0;
        }
        this.setVisibleAreaBounds(visibleAreaBounds);
        this.setScrollContainerBounds(scrollContainerBounds);
      });
    }
    this._initScrollListener();
  }
  _initScrollListener() {
    const isScrollContainerBody =
      this._context.getScrollContainer().tagName.toLowerCase() === "body";
    const scrollListenerElement = isScrollContainerBody
      ? document
      : this._scrollContainer;
    // native shell handle `reset scroll`
    const scrollListener = () => {
      const currentScrollLeft = this._scrollContainer.scrollLeft;
      const currentScrollTop = this._scrollContainer.scrollTop;
      // if (this._needResetScroll(currentScrollLeft, currentScrollTop)) return
      const deltaX = this._lastScrollLeft - currentScrollLeft;
      const deltaY = this._lastScrollTop - currentScrollTop;
      this._lastScrollLeft = currentScrollLeft;
      this._lastScrollTop = currentScrollTop;
      this._lastMindMapOriginPositionInVisibleArea =
        this._genMindMapOriginPosition("visibleArea");
      this._lastScrollCenterRealPositionInVisibleArea =
        this._getLastScrollCenterRealPositionInVisibleArea();
      this._lastScrollCenterVisiblePositionInMindMap =
        this._getLastScrollCenterVisiblePositionInMindMap();
      this._context.trigger(EVENTS.VIEW_PORT_MOVING, deltaX, deltaY);
    };
    // scrollListener = this._paddingFactor > 1 ? debounce(scrollListener, 200) : scrollListener
    scrollListenerElement.addEventListener("scroll", scrollListener);
  }
  center(position, options = {}) {
    const visibleAreaBounds = this.getVisibleAreaBounds();
    const positionInViewport =
      this._coordinateTransfer.mindMapToViewport(position);
    const deltaX =
      visibleAreaBounds.x + visibleAreaBounds.width / 2 - positionInViewport.x;
    const deltaY =
      visibleAreaBounds.y + visibleAreaBounds.height / 2 - positionInViewport.y;
    this._scroll(deltaX, deltaY, options);
    this._lastScrollLeft = this._lastScrollLeft - deltaX;
    this._lastScrollTop = this._lastScrollTop - deltaY;
    this._lastMindMapOriginPositionInVisibleArea =
      this._genMindMapOriginPosition("visibleArea");
  }
  restorePosition(position: { x: number; y: number }, options = {}) {
    const positionInVisibleArea =
      this._coordinateTransfer.mindMapToEnlargedArea({
        x: 0,
        y: 0,
      });
    const [deltaX, deltaY] = [
      position.x - positionInVisibleArea.x,
      position.y - positionInVisibleArea.y,
    ];
    this._scroll(deltaX, deltaY, options);
    this._lastScrollLeft = this._lastScrollLeft - deltaX;
    this._lastScrollTop = this._lastScrollTop - deltaY;
    this._lastMindMapOriginPositionInVisibleArea =
      this._genMindMapOriginPosition("visibleArea");
  }
  _scroll(x, y, options: any = {}) {
    if (!options.animate) {
      this._scrollContainer.scrollLeft = this._lastScrollLeft - x;
      this._scrollContainer.scrollTop = this._lastScrollTop - y;
      window.requestAnimationFrame(
        () => options.finishToRun && options.finishToRun(),
      );
    } else {
      const startScrollTop = this._lastScrollTop;
      const startScrollLeft = this._lastScrollLeft;
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
  /**
   * Relative to Viewport Coordnates
   */
  move(
    x: number,
    y: number,
    options: Partial<{ animate: boolean; finishToRun: () => void }> = {},
  ) {
    this._scroll(x, y, options);
  }
  scrollTo(scrollLeft: number, scrollTop: number) {
    this._scrollContainer.scrollLeft = scrollLeft;
    this._scrollContainer.scrollTop = scrollTop;
  }
  fitMap() {
    const visibleAreaWidth = this._scrollContainerBounds.width;
    const visibleAreaHeight = this._scrollContainerBounds.height;
    const contentBounds = this._getSheetContentBounds();
    const scale = Math.min(
      (visibleAreaWidth - 20) / contentBounds.width,
      (visibleAreaHeight - 20) / contentBounds.height,
      2,
    );
    this._svgView.setScale(scale * 100);
    this.center({
      x: contentBounds.x + contentBounds.width / 2,
      y: contentBounds.y + contentBounds.height / 2,
    });
    this._lastScrollCenterRealPositionInVisibleArea =
      this._getLastScrollCenterRealPositionInVisibleArea();
  }
  getCoordinateTransfer() {
    return this._coordinateTransfer;
  }
  /**
   * @param {Bounds} newBounds
   */
  setScrollContainerBounds(
    newBounds: { x: number; y: number; width: number; height: number },
    options = {},
  ) {
    const boundsChanged =
      this._scrollContainerBounds.width !== newBounds.width ||
      this._scrollContainerBounds.height !== newBounds.height ||
      this._scrollContainerBounds.x !== newBounds.x ||
      this._scrollContainerBounds.y !== newBounds.y;
    if (boundsChanged) {
      Object.assign(this._scrollContainerBounds, {
        x: newBounds.x,
        y: newBounds.y,
        width: newBounds.width,
        height: newBounds.height,
      });
      this._updateSBContainerSize(options);
    }
  }
  getScrollContainerBounds() {
    return Object.assign({}, this._scrollContainerBounds);
  }
  /**
   *  Relative to viewport
   */
  setVisibleAreaBounds(
    newBounds: Partial<{ x: number; y: number; width: number; height: number }>,
  ) {
    Object.assign(this._visibleAreaBounds, {
      x: newBounds.x,
      y: newBounds.y,
      width: newBounds.width,
      height: newBounds.height,
    });
  }
  getVisibleAreaBounds() {
    return Object.assign({}, this._visibleAreaBounds);
  }
  _needResetScroll(currentScrollLeft: number, currentScrollTop: number) {
    const paddingH = this._getPaddingHorizon();
    const paddingV = this._getPaddingVertical();
    const visibleAreaBounds = this.getVisibleAreaBounds();
    const sheetContentBounds = this._getSheetContentBounds();
    const sheetContentScale = this._getSheetContentScale();
    const sbContainerSize = this._getSBContainerSize();
    let needResetScroll = false;
    const minScrollLeft = Math.max(
      0,
      paddingH - visibleAreaBounds.width + REMAINED_SHEET_CONTENT_LENGTH,
    );
    const maxScrollLeft = Math.min(
      sbContainerSize.width,
      sheetContentBounds.width * sheetContentScale +
        paddingH -
        REMAINED_SHEET_CONTENT_LENGTH,
    );
    const minScrollTop = Math.max(
      0,
      paddingV - visibleAreaBounds.height + REMAINED_SHEET_CONTENT_LENGTH,
    );
    const maxScrollTop = Math.min(
      sbContainerSize.height,
      sheetContentBounds.height * sheetContentScale +
        paddingV -
        REMAINED_SHEET_CONTENT_LENGTH,
    );
    if (currentScrollLeft < minScrollLeft) {
      this._lastScrollLeft = this._scrollContainer.scrollLeft = minScrollLeft;
      needResetScroll = true;
    } else if (currentScrollLeft > maxScrollLeft) {
      this._lastScrollLeft = this._scrollContainer.scrollLeft = maxScrollLeft;
      needResetScroll = true;
    }
    if (currentScrollTop < minScrollTop) {
      this._lastScrollTop = this._scrollContainer.scrollTop = minScrollTop;
      needResetScroll = true;
    } else if (currentScrollTop > maxScrollTop) {
      this._lastScrollTop = this._scrollContainer.scrollTop = maxScrollTop;
      needResetScroll = true;
    }
    return needResetScroll;
  }
  _updateSBContainerSize(
    options: Partial<{ initPosition: { x: number; y: number } }> = {},
  ) {
    // update size
    const sbContainerSize = this._getSBContainerSize();
    this._sbContainer.style.width = sbContainerSize.width + "px";
    this._sbContainer.style.height = sbContainerSize.height + "px";
    // update svgContainer translate
    const svgCenterOffset = this.getSheetContentTranslate();
    this._svgView.container.translate(svgCenterOffset.x, svgCenterOffset.y);
    if (!this._lastMindMapOriginPositionInVisibleArea) {
      if (options.initPosition) {
        // restore
        this.restorePosition(options.initPosition);
      } else {
        this.center({
          x: 0,
          y: 0,
        });
      }
    } else {
      const c = this._genMindMapOriginPosition("visibleArea") as any;
      const deltaX = this._lastMindMapOriginPositionInVisibleArea.x - c.x;
      const deltaY = this._lastMindMapOriginPositionInVisibleArea.y - c.y;
      this._scroll(deltaX, deltaY);
      this._lastScrollLeft = this._lastScrollLeft - deltaX;
      this._lastScrollTop = this._lastScrollTop - deltaY;
      this._lastMindMapOriginPositionInVisibleArea =
        this._genMindMapOriginPosition("visibleArea");
    }
  }
  _updateSBContainerSizeByScale() {
    const sbContainerSize = this._getSBContainerSize();
    this._sbContainer.style.width = sbContainerSize.width + "px";
    this._sbContainer.style.height = sbContainerSize.height + "px";
    // update svgContainer translate
    const svgCenterOffset = this.getSheetContentTranslate();
    this._svgView.container.translate(svgCenterOffset.x, svgCenterOffset.y);
  }
  _reFocusRealPositionScrollCenter() {
    const c = this._getLastScrollCenterRealPositionInVisibleArea();
    const deltaX = this._lastScrollCenterRealPositionInVisibleArea.x - c.x;
    const deltaY = this._lastScrollCenterRealPositionInVisibleArea.y - c.y;
    this._scroll(deltaX, deltaY);
    this._lastScrollLeft = this._lastScrollLeft - deltaX;
    this._lastScrollTop = this._lastScrollTop - deltaY;
    this._lastScrollCenterRealPositionInVisibleArea =
      this._getLastScrollCenterRealPositionInVisibleArea();
  }
  _reFocusVisiblePositionScrollCenter() {
    const c = this._getLastScrollCenterVisiblePositionInMindMap();
    const deltaX =
      (c.x - this._lastScrollCenterVisiblePositionInMindMap.x) *
      this._getSheetContentScale();
    const deltaY =
      (c.y - this._lastScrollCenterVisiblePositionInMindMap.y) *
      this._getSheetContentScale();
    this._scroll(deltaX, deltaY);
    this._lastScrollLeft = this._lastScrollLeft - deltaX;
    this._lastScrollTop = this._lastScrollTop - deltaY;
    this._lastScrollCenterVisiblePositionInMindMap =
      this._getLastScrollCenterVisiblePositionInMindMap();
  }
  _getLastScrollCenterRealPositionInVisibleArea() {
    const selections = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections();
    const sheetView = this._context.getSheetView();
    const currentCenterView =
      sheetView.getActivatedTopBranchView() || sheetView.getCentralBranchView();
    const currentSelection =
      selections.length !== 1 ? currentCenterView : selections[0];
    let selectionViewRealPosition;
    switch (currentSelection.type) {
      case VIEW_TYPE.BOUNDARY: {
        const boundaryFigure = currentSelection.figure;
        selectionViewRealPosition = {
          x: boundaryFigure.position.x + boundaryFigure.size.width / 2,
          y: boundaryFigure.position.y + boundaryFigure.size.height / 2,
        };
        break;
      }
      case VIEW_TYPE.IMAGE: {
        selectionViewRealPosition = currentSelection
          .parent()
          .parent()
          .getRealPosition();
        break;
      }
      case VIEW_TYPE.RELATIONSHIP: {
        selectionViewRealPosition = Object.assign(
          {},
          currentSelection.titleView.figure.textPosition,
        );
        break;
      }
      default: {
        if (currentSelection.getRealPosition) {
          selectionViewRealPosition = currentSelection.getRealPosition();
        } else {
          selectionViewRealPosition = {
            x: 0,
            y: 0,
          };
        }
      }
    }
    return this._coordinateTransfer.mindMapToVisibleArea(
      selectionViewRealPosition,
    );
  }
  _getLastScrollCenterVisiblePositionInMindMap() {
    return this._coordinateTransfer.visibleAreaToMindMap(
      this._scrollCenterVisiblePosition,
    );
  }
  _getSBContainerSize() {
    // padding
    const paddingHorizon = this._getPaddingHorizon();
    const paddingVertical = this._getPaddingVertical();
    // sheet content bounds
    const sheetContentBounds = this._getSheetContentBounds();
    const sheetContentScale = this._getSheetContentScale();
    // get content width and height
    const width =
      sheetContentBounds.width * sheetContentScale + paddingHorizon * 2;
    const height =
      sheetContentBounds.height * sheetContentScale + paddingVertical * 2;
    return {
      width,
      height,
    };
  }
  _getPaddingHorizon() {
    const width = this._context.isMobilePlatform()
      ? Math.max(
          this._scrollContainerBounds.width,
          this._scrollContainerBounds.height,
        )
      : this._scrollContainerBounds.width;
    return width * this._paddingFactor - REMAINED_SHEET_CONTENT_LENGTH;
  }
  _getPaddingVertical() {
    const height = this._context.isMobilePlatform()
      ? Math.max(
          this._scrollContainerBounds.width,
          this._scrollContainerBounds.height,
        )
      : this._scrollContainerBounds.height;
    return height * this._paddingFactor - REMAINED_SHEET_CONTENT_LENGTH;
  }
  _getSheetContentBounds() {
    const bounds = this._context.getSheetView().bounds;
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  _getSheetContentScale() {
    return this._svgView.getScale() / 100;
  }
  getSheetContentTranslate() {
    const sheetContentBounds = this._getSheetContentBounds();
    const sheetContentScale = this._getSheetContentScale();
    const sheetContentTransX =
      this._getPaddingHorizon() - sheetContentBounds.x * sheetContentScale;
    const sheetContentTransY =
      this._getPaddingVertical() - sheetContentBounds.y * sheetContentScale;
    return {
      x: sheetContentTransX,
      y: sheetContentTransY,
    };
  }
}
export default CanvasControl;
