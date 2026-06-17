import { MODULE_NAME, EVENTS, CONFIG, SERVICE_NAME, UI_STATUS } from '../common/constants/index';

import * as commonUtils from '../common/utils/index';

import jquery from 'jquery';

import backbone from 'backbone';

import * as pointUtils from '../utils/pointutils'; // drag mouse事件

import type { SheetEditor } from '../type.d';
import type { SheetView } from '../view/sheetview';
import type { SvgView } from '../view/svgview';
import type { BranchView } from '../view/branchview';

type DirectionInfo = Partial<{ right: boolean; left: boolean; down: boolean; up: boolean }>;

const dragEvent = '.dragViewPort';
const dragMouseMoveEvent = 'mousemove.dragViewPort';
const dragMouseUpEvent = 'mouseup.dragViewPort';
// 触发drag事件的最小移动距离
const minMoveDistance = 3;
// 可以认为鼠标发生移动的最小距离
const mouseGap = 20;
const branchGap = 20;
// helperFunctions
const helper = {
  /**
   * @description 获取branch超出视口的距离
   * @param {SheetEditor} sheetEditor
   * @param {BranchView} branchView
   * @return {Point}
   * @fixme 逻辑需要整理
   * */
  getBranchOutOfViewPortDistance(sheetEditor: SheetEditor, branchView: any) {
    const svgView = sheetEditor.getSVGView();
    const scale = svgView.getScale() / 100;
    const centerPositionOfBranchInViewport = svgView
      .getCanvasControl()
      .getCoordinateTransfer()
      .mindMapToViewport(branchView.getRealPosition());
    const topicBounds = Object.assign({}, branchView.topicView.bounds);
    const gap = branchGap * scale;
    const rectOfBranchInViewport = {
      x: centerPositionOfBranchInViewport.x + topicBounds.x * scale,
      y: centerPositionOfBranchInViewport.y + topicBounds.y * scale,
      width: topicBounds.width * scale,
      height: topicBounds.height * scale,
    };
    const visibleAreaBounds = svgView.getCanvasControl().getVisibleAreaBounds();
    const doughnutExportInfo = sheetEditor.getDoughnutExportInfo();
    const bottomCoverHeight = doughnutExportInfo.footerHeight + doughnutExportInfo.softKeyboardHeight;
    const gappedVisibleAreaBounds = {
      x: visibleAreaBounds.x + gap,
      y: visibleAreaBounds.y + gap + doughnutExportInfo.toolbarHeight,
      width: visibleAreaBounds.width - gap * 2,
      height: visibleAreaBounds.height - gap * 2 - bottomCoverHeight - doughnutExportInfo.toolbarHeight,
    };
    const result = Object(commonUtils.outBounds)(rectOfBranchInViewport, gappedVisibleAreaBounds);
    return {
      x: -result.width,
      y: -result.height,
    };
  },
  /**
   * @description 获取鼠标向外移动的方向信息
   * @param {SheetEditor} sheetEditor
   * @param {point} mousePosition 鼠标当前位置，client相对坐标
   * @return {MouseMoveDirection}
   * */
  getMouseOutOfViewPortDirection(sheetEditor: SheetEditor, mousePosition: { x: number; y: number }) {
    const svgView = sheetEditor.getSVGView();
    const scrollContainerBounds = svgView.getCanvasControl().getVisibleAreaBounds();
    const minX = scrollContainerBounds.x;
    const minY = scrollContainerBounds.y;
    const maxX = scrollContainerBounds.width + minX;
    const maxY = scrollContainerBounds.height + minY;
    const directionInfo = {
      up: mousePosition.y < minY + mouseGap,
      right: mousePosition.x > maxX - mouseGap,
      down: mousePosition.y > maxY - mouseGap,
      left: mousePosition.x < minX + mouseGap,
    };
    return new MouseMoveDirection(directionInfo);
  },
};
export class MoveViewPort {
  context: SheetEditor;
  isBranchAbleAutoMove: boolean;
  animateHandle: any;
  preMoveDirection: any;
  svgView: SvgView;
  sheetView: SheetView;
  sheetViewElem: any;
  isStop: boolean;
  _isMovingOut: boolean;
  _isInShowMouseProcess: boolean;
  static identifier: string;
  /**
   * @param {SheetEditor} context
   * @private
   * */
  constructor(context: SheetEditor) {
    /** @private */
    this.context = context;
    /** @private */
    this.isBranchAbleAutoMove = false;
    /** @private */
    this.animateHandle = null;
    /** @private */
    this.preMoveDirection = null;
    context.on(EVENTS.SHEET_CONTENT_LOADED, () => {
      /** @private @type {SVGView} */
      this.svgView = context.getSVGView();
      /** @private @type {SheetView} */
      this.sheetView = context.getSheetView() as SheetView;
      /** @private */
      this.sheetViewElem = this.svgView.svg.children()[0];
      // this.storeSVGBoxSize();
      this.setAbleAutoMove(true);
    });
    this.isStop = true;
    this._isMovingOut = false;
    this._isInShowMouseProcess = false;
  }
  /**
   * @description 处理svg上鼠标滚轮操作
   * @param {WheelEvent} e
   * @public 在svgView的onMouseWheel中被调用
   * */
  onMouseWheel(e: JQuery.EventBase) {
    // fix e
    let event: WheelEvent = e as unknown as WheelEvent;
    if ((e as unknown as WheelEvent).deltaX === undefined && e.originalEvent) {
      event = e.originalEvent as WheelEvent;
    }
    this.tryToMoveViewPort(-event.deltaX, -event.deltaY);
  }
  /**
   * @description
   * @param {number} deltaX
   * @param {number} deltaY
   * @param {Object} [options]
   * @param {boolean} [options.animate] 是否需要动画
   * @param {function} [options.finishToRun] 动画结束后运行
   * @return {boolean} 是否移动成功
   * @public
   * */
  tryToMoveViewPort(deltaX: number, deltaY: number, options: { animate?: boolean; finishToRun?: () => void } = {}) {
    if (deltaX === 0 && deltaY === 0) {
      return false;
    }
    if (this.context.config(CONFIG.NO_VIEW_PORT_MOVE)) {
      return false;
    }
    this.svgView.move(deltaX, deltaY, options);
    return true;
  }
  /**
   * @description 左键拖动root topic或右键拖动背景svg
   * @param {MouseEvent} e
   * @param {BaseComponent} view
   * @param {Function} failFn - run when drag view port is canceled
   * @public
   * */
  onDragViewPort(
    e: JQuery.EventBase<MouseEvent>,
    view: SvgView,
    failFn?: (e: JQuery.TriggeredEvent<Document, undefined, Document, Document>) => void
  ) {
    if (this.context.config(CONFIG.NO_VIEW_PORT_MOVE)) {
      return false;
    }
    const $target = jquery(document);
    const mouseDownPoint = {
      x: e.clientX,
      y: e.clientY,
    };
    $target.on(dragMouseMoveEvent, e => {
      if (e && (e.which === 1 || e.which === 3)) {
        const currentMovePoint = {
          x: e.clientX,
          y: e.clientY,
        };
        const moveDistance = pointUtils.distance(mouseDownPoint, currentMovePoint);
        if (moveDistance >= minMoveDistance) {
          cancelDragEventInTarget();
          if (this.context.isBrowniePlatform()) {
            this.startIOSDragProcess(currentMovePoint);
          } else {
            this.startDragProcess(currentMovePoint, view);
          }
        }
      }
    });
    $target.on(dragMouseUpEvent, e => {
      cancelDragEventInTarget();
      if (failFn) {
        failFn(e);
      }
    });
    // cancel drag in $target
    function cancelDragEventInTarget() {
      $target.off(dragMouseMoveEvent);
      $target.off(dragMouseUpEvent);
    }
  }
  /**
   * @param {point} lastDragPoint
   * @param {BaseComponent} view
   * @private
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDragProcess(lastDragPoint: { x: number; y: number }, view: SvgView) {
    this.context.getModule(MODULE_NAME.SEMAPHORE).increase(UI_STATUS.DRAG_VIEWPORT);
    const $doc = jquery(document);
    const $mask = this.context.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    $mask.show();
    let startMouseX = lastDragPoint.x;
    let startMouseY = lastDragPoint.y;
    // const container = view.editDomain().container;
    // const {x, y} = container.transform();  //origin translate
    $doc.on(dragMouseMoveEvent, e => {
      const { clientX, clientY } = e;
      const dmoveX = (clientX || 0) - startMouseX;
      const dmoveY = (clientY || 0) - startMouseY;
      this.svgView.move(dmoveX, dmoveY);
      startMouseX = clientX;
      startMouseY = clientY;
    });
    $doc.on(dragMouseUpEvent, () => {
      $doc.off(dragEvent);
      $mask.hide();
      this.context.getModule(MODULE_NAME.SEMAPHORE).decrease(UI_STATUS.DRAG_VIEWPORT);
    });
  }
  startIOSDragProcess(lastDragPoint: { x: number; y: number }) {
    this.context.getModule(MODULE_NAME.SEMAPHORE).increase(UI_STATUS.DRAG_VIEWPORT);
    const $doc = jquery(document);
    const startPosition = {
      x: lastDragPoint.x,
      y: lastDragPoint.y,
    };

    // TODO: 支持scrollingElement 转为传入的
    const startScroll = {
      left: document.scrollingElement?.scrollLeft || 0,
      top: document.scrollingElement?.scrollTop || 0,
    };

    $doc.on(dragMouseMoveEvent, e => {
      const newScrollLeft = startScroll.left - (e.clientX || 0 - startPosition.x);
      const newScrollTop = startScroll.top - (e.clientY || 0 - startPosition.y);
      // const newScrollLeft = startScroll.left - (window.brownieTouchViewPortPosition.x - startPosition.x);
      // const newScrollTop = startScroll.top - (window.brownieTouchViewPortPosition.y - startPosition.y);
      this.svgView.getCanvasControl().scrollTo(newScrollLeft, newScrollTop);
    });
    $doc.on(dragMouseUpEvent, () => {
      $doc.off(dragEvent);
      this.context.getModule(MODULE_NAME.SEMAPHORE).decrease(UI_STATUS.DRAG_VIEWPORT);
    });
  }
  /**
   * @description 将branch完整显示在view port中
   * @param {BranchView} branchView
   * @param {Function} callback
   * @public
   * */
  showBranchInViewPort(branchView: BranchView, callback: () => void) {
    if (!callback) {
      callback = () => {};
    }
    if (!branchView.editDomain() || !this.isBranchAbleAutoMove) {
      return callback();
    }
    const outViewPortDistance = helper.getBranchOutOfViewPortDistance(this.context, branchView);
    if (!outViewPortDistance.x && !outViewPortDistance.y) {
      return callback();
    }
    //for merge unnecessary function call
    setTimeout(() => {
      this.svgView.move(outViewPortDistance.x, outViewPortDistance.y, {
        animate: true,
      });
    }, 0);
  }
  /**
   * @description 移动view port，保证鼠标一直在其内部
   * @param {position} mouseClientPosition
   * @param [allowDirection] {up,down,left,right}可指定允许viewport移动的上下左右方向，设定为true才可向该方向移动
   * @param {number} [speed] 移动的速度 px/200ms
   * */
  showMouseInViewPort(mouseClientPosition: { x: number; y: number }, allowDirection: DirectionInfo, speed?: number) {
    if (this.context.config(CONFIG.NO_VIEW_PORT_MOVE)) {
      return;
    }
    const mouseMoveDirection = helper.getMouseOutOfViewPortDirection(this.context, {
      x: mouseClientPosition.x,
      y: mouseClientPosition.y,
    });
    if (allowDirection) {
      mouseMoveDirection.setDirectionInfo(allowDirection);
    }
    // 若鼠标位于视口移动自动触发区域之内
    if (mouseMoveDirection.isInMovingOutTriggerArea()) {
      if (!this._isInShowMouseProcess) {
        // 1：鼠标刚由内部往外移动，此时需要触发一次show mouse process
        this.startShowMouseInViewPortProcess(mouseMoveDirection, speed);
      } else if (!mouseMoveDirection.hasSameDirection(this.preMoveDirection)) {
        // 2：show mouse process已经触发了，但是方向不一样了
        // 终止上次的移动，开始新的移动
        this.stopMove();
        this.startShowMouseInViewPortProcess(mouseMoveDirection, speed);
      }
    } else {
      this.stopMove();
    }
    this.preMoveDirection = mouseMoveDirection;
  }
  /**
   * @description 设置是否允许自动移动branch至视口內
   * @param {boolean} bool
   * @public
   * */
  setAbleAutoMove(bool: boolean) {
    this.isBranchAbleAutoMove = bool;
  }
  stopMove() {
    this._isInShowMouseProcess = false;
  }
  /**
   * @param {MouseMoveDirection} mouseMoveDirection
   * @param {number} speed
   * @private
   * @todo 整理逻辑
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startShowMouseInViewPortProcess(mouseMoveDirection: DirectionInfo, speed: number) {
    this._isInShowMouseProcess = true;
    const deviceNativeScale = this.svgView.getDeviceNativeScale();
    const movingFrame = () => {
      let moveX = 0;
      let moveY = 0;
      const moveSpeed = 5 / deviceNativeScale;
      if (mouseMoveDirection.up) {
        moveY += moveSpeed;
      } else if (mouseMoveDirection.down) {
        moveY -= moveSpeed;
      }
      if (mouseMoveDirection.right) {
        moveX -= moveSpeed;
      } else if (mouseMoveDirection.left) {
        moveX += moveSpeed;
      }
      if (moveX || moveY) {
        // 先移动这一帧
        this.svgView.move(moveX, moveY);
        // todo 若已经移动到了边界，也要终止移动
        if (this._isInShowMouseProcess) {
          window.requestAnimationFrame(movingFrame);
        }
      }
    };
    window.requestAnimationFrame(movingFrame);
  }
}
MoveViewPort.identifier = MODULE_NAME.MOVE_VIEW_PORT;
Object.assign(MoveViewPort.prototype, backbone.Events);

export default MoveViewPort;

/**
 * @description 鼠标向边缘移动的方向信息
 * */
class MouseMoveDirection {
  right: any;
  left: any;
  down: any;
  up: any;
  /** @private */
  constructor(directionInfo: DirectionInfo) {
    this.setDirectionInfo(directionInfo);
  }
  /**
   * @description 是否正正处于向外移动响应的区域內
   * @public
   * */
  isInMovingOutTriggerArea() {
    return this.right || this.left || this.down || this.up;
  }
  /**
   * @description 设置移动方向的信息
   * @param directionInfo
   * @public
   * */
  setDirectionInfo(directionInfo: Partial<{ right: boolean; left: boolean; down: boolean; up: boolean }>) {
    /** @public */
    this.right = directionInfo.right;
    /** @public */
    this.left = directionInfo.left;
    /** @public */
    this.down = directionInfo.down;
    /** @public */
    this.up = directionInfo.up;
  }
  /**
   * @description 是否与给定方向信息相同
   * @param direction
   * @return {boolean}
   * */
  hasSameDirection(direction: DirectionInfo) {
    if (!direction) {
      direction = {};
    }
    return (
      this.up === direction.up &&
      this.right === direction.right &&
      this.down === direction.down &&
      this.left === direction.left
    );
  }
}
