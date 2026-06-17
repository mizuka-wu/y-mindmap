import backbone from "backbone";

import {
  SERVICE_NAME,
  MODULE_NAME,
  VIEW_TYPE,
  EVENTS,
} from "../../../common/constants/index";
import * as utils from "../../../utils/index";
import mommonFuncs from "../../../mommonfuncs";
import jquery from "jquery";

function preventTouchMoveDefault(e) {
  e.stopPropagation();
  e.preventDefault();
}
const dragEvent = ".drag";
/**
 * The View who use DragView should implement method: createDragView
 * DragView will tirgger event: 'dragViewMoving', 'dragViewFinish'
 */
/* harmony default export */
export const DragShadowView = backbone.View.extend({
  viewEvents: {
    dragViewMoving: "dragViewMoving",
    dragViewFinish: "dragViewFinish",
  },
  /**
   * @todo startClientPosition 命名不严谨，需要对Android情况考虑
   * */
  initialize(
    currentDragView,
    preSelectViewList,
    startClientPosition,
    isUseTouch,
  ) {
    /** @private */
    this._dragViewContainer = null;
    /** @private  */
    this._currentDragView = currentDragView;
    /** @private */
    this._preSelectViewList = preSelectViewList;
    /** @private */
    this._context = currentDragView.getContext();
    /** @private */
    this._svgView = this._context.getSVGView();
    /** @private */
    this._lastDragRealPosition = this._context
      .getSVGView()
      .getCoordinateTransfer()
      .viewportToMindMap(startClientPosition);
    this._lastDragClientPosition = startClientPosition;
    /**
     * @description 记录这个是为了确认拖动是由touch开始的还是由mouse开始的
     * @private
     * */
    this._isUseTouch = isUseTouch;
    /**
     * @private
     * @type {jQuery}
     * */
    this._$dragCover = this._context.callService(
      SERVICE_NAME.GET_VIEW_PORT_COVER,
    );
    /**
     * @description drag的监听事件必须要在document上，不然移动端会出问题
     * @private
     * */
    this._$dragEventEl = jquery(document);
    /**
     * @private
     * @type {MoveViewPortModule}
     * */
    this._moveViewPortModule = this._context.getModule(
      MODULE_NAME.MOVE_VIEW_PORT,
    );
    this._$dragCover.show();
    this._initCloneG();
    this._initEventListeners();
  },
  /**
   * @description 初始化cloneG的信息，其实就是指向的sheet上的cloneG
   * @private
   * */
  _initCloneG() {
    const currentDragViewType = this._currentDragView.type;
    const isDragViewBranch = currentDragViewType === VIEW_TYPE.BRANCH;
    // 对于branchView，使用branchUtil的方法来复制structure
    if (isDragViewBranch) {
      let branchListToCopy: any[] = [];
      if (this._preSelectViewList.indexOf(this._currentDragView) === -1) {
        branchListToCopy = [this._currentDragView];
      } else {
        branchListToCopy = this._preSelectViewList;
      }
      const s$cloneG = this._context.getSheetView().getDragViewContainer();
      branchListToCopy.forEach((branchView) => {
        // 获取每个branchView的realPosition
        const realPosition = branchView.getRealPosition();
        const topicStructureCopy = Object(utils.getTopicSVGStructureCopy)(
          branchView,
        );
        topicStructureCopy.x(realPosition.x);
        topicStructureCopy.y(realPosition.y);
        s$cloneG.add(topicStructureCopy);
      });
      this._dragViewContainer = s$cloneG;
    } else {
      // 其他对象，使用对应view的createDragView方法来复制
      this._dragViewContainer = this._currentDragView.createDragView();
    }
    this.setElement(this._dragViewContainer.get(0).node);
  },
  /** @private */
  _initEventListeners() {
    const svgView = this._context.getSVGView();
    let isDragEnd = false;
    const dragMoveEvent = this._isUseTouch
      ? "touchmove.drag"
      : "mousemove.drag";
    const dragEndEvent = this._isUseTouch ? "touchend.drag" : "mouseup.drag";
    if (this._currentDragView.$el) {
      this._currentDragView.$el.on(dragMoveEvent, (e) => {
        e.preventDefault();
      });
    }
    document.addEventListener("touchstart", preventTouchMoveDefault);
    document.addEventListener("touchmove", preventTouchMoveDefault, {
      passive: false,
    });
    // 注册拖拽移动的事件
    // todo 在android端，不应该用jQuery的clientX与clientY，应该使用touches里面的screenX与screenY来计算
    this._$dragEventEl.on(
      dragMoveEvent,
      mommonFuncs.frameStabilize((e) => {
        if (isDragEnd) {
          return;
        }
        if (this._isUseTouch) {
          this._context.setScrollDisable();
        } // brownie platform bug: touchPoint's clientX and clientY would be unreliable while sbContainer's size
        // and scroll position was changing, so shell end will provide a global variable named brownieTouchViewPortPosition
        // which contains a accurate client position of user's finger point
        const eventClientPosition = this._context.isBrowniePlatform()
          ? Object.assign({}, (window as any).brownieTouchViewPortPosition)
          : this._context.getDragEventClientPosition(e, this._isUseTouch);
        const currentDragRealPosition = svgView
          .getCoordinateTransfer()
          .viewportToMindMap(eventClientPosition);
        const dx = currentDragRealPosition.x - this._lastDragRealPosition.x;
        const dy = currentDragRealPosition.y - this._lastDragRealPosition.y;
        this._lastDragRealPosition = currentDragRealPosition;
        this._dmove(dx, dy);
        // 保证鼠标位置始终处于视口内部
        this._moveViewPortModule.showMouseInViewPort(
          {
            x: eventClientPosition.x,
            y: eventClientPosition.y,
          },
          null,
          100,
        );
        this.trigger(
          this.viewEvents.dragViewMoving,
          Object.assign({}, this._lastDragRealPosition),
        );
      }),
    );
    // 注册拖拽结束的事件
    this._$dragEventEl.on(dragEndEvent, (e) => {
      isDragEnd = true;
      this.dispose();
      const eventClientPosition = this._context.getDragEventClientPosition(
        e,
        this._isUseTouch,
      );
      this.trigger(
        this.viewEvents.dragViewFinish,
        this._context.getSVGView().getCoordinateTransfer().viewportToMindMap({
          x: eventClientPosition.x,
          y: eventClientPosition.y,
        }),
      );
    });
    this.listenTo(this._context, EVENTS.VIEW_PORT_MOVING, (deltaX, deltaY) => {
      const currentScale = svgView.currentScale;
      const dx = -deltaX / currentScale;
      const dy = -deltaY / currentScale;
      this._dmove(dx, dy);
      this._lastDragRealPosition.x += dx;
      this._lastDragRealPosition.y += dy;
      this.trigger(
        this.viewEvents.dragViewMoving,
        Object.assign({}, this._lastDragRealPosition),
      );
    });
  },
  /** @private */
  _dmove(x, y) {
    this._dragViewContainer.dmove(x, y);
  },
  dispose() {
    if (this._isUseTouch) {
      this._context.setScrollEnable();
    }
    this._$dragEventEl.off(dragEvent);
    this._currentDragView.$el.off(dragEvent);
    document.removeEventListener("touchmove", preventTouchMoveDefault);
    this._$dragCover.hide();
    this._context.getSheetView().clearDragViewContainer();
    this._moveViewPortModule.stopMove();
    this.remove();
  },
  getCloneG() {
    return this._dragViewContainer;
  },
});
