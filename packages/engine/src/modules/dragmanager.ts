import styleManager from "../utils/business/stylemanager/index";
import backbone from "backbone";

import {
  MODULE_NAME,
  VIEW_TYPE,
  UI_STATUS,
  CLASS_TYPE,
} from "../common/constants/index";
import * as utils from "../utils/index";

import { DragShadowView } from "./svgdraggable/view/dragshadow";
import { getHandler as getDragHandler } from "./draghandler/index";

/**
 * @fileOverview drag辅助module
 * */

const MOVE_STEP = 10;
/**
 * @extends {Backbone.Events}
 * */
export class DragManager {
  originalDragSelections: any[];
  triggerDragMoving: any;
  _dragHandler: any;
  _context: any;
  _svgView: any;
  _dragSelections: any[];
  _selectionsModule: any;
  _semaphoreModule: any;
  _contextUndo: any;
  _dragView: any;
  _prePosition: { x: number; y: number };
  _keyPress: { shiftKey: any } | undefined;
  static identifier: string;
  /**
   * @param {SheetEditor} context
   * */
  constructor(context) {
    this.originalDragSelections = [];
    this.triggerDragMoving = Object(utils.throttle)(() => {
      let _a;
      if ((_a = this._dragHandler) === null || _a === undefined) {
        return undefined;
      } else {
        return _a.dragMoving(Object.assign({}, this._transferData));
      }
    }, 50);
    /**
     * @type {SheetEditor}
     * @private
     * */
    this._context = context;
    /** @private */
    this._svgView = null;
    /**
     * @description 记录的是拖拽发生前一刻的选择列表
     * @description 因为拖拽发生的时候，selection会被清空，然后会被仅聚焦在被拖拽的对象上
     * @type {Array.<WorkbookComponentView>}
     * @private
     * */
    this._dragSelections = [];
    this._selectionsModule = null;
    /** @private */
    this._semaphoreModule = null;
    /** @private */
    this._contextUndo = null;
    /** @private */
    this._dragView = null;
    /** @private */
    this._dragHandler = null;
    /** @private */
    this._transferData = {};
    /** @private */
    this._prePosition = {
      x: 0,
      y: 0,
    };
    this.keyPressHandler = this.keyPressHandler.bind(this);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _transferData: any = (arg0: any, _transferData: any): any => {
    throw new Error("Method not implemented.");
  };
  /** @private */
  _initModules() {
    if (!this._selectionsModule) {
      this._selectionsModule = this._context.getModule(MODULE_NAME.SELECTION);
    }
    if (!this._semaphoreModule) {
      this._semaphoreModule = this._context.getModule(MODULE_NAME.SEMAPHORE);
    }
    if (!this._contextUndo) {
      this._contextUndo = this._context.model.getUndo();
    }
    if (!this._svgView) {
      this._svgView = this._context.getSVGView();
    }
  }
  /**
   * @param {MouseEvent} e
   * @param {WorkbookComponentView} view
   * @public
   * */
  prepareStartDrag(e, view) {
    if (this._context.isReadOnly()) {
      return;
    }
    this._initModules();
    this.originalDragSelections = this._selectionsModule.getSelections();
    // 必须在这里缓存鼠标按下时候的selection
    this._dragSelections = Object(utils.filterMultiSelectedBranches)(
      this.originalDragSelections,
    );
    Object(utils.dragThreshold)(
      e,
      (dragStartPosition) => {
        const filterBranchesList = [...this._dragSelections];
        const isUseTouch = e.type === "press";
        this._dragView = new DragShadowView(
          view,
          filterBranchesList,
          dragStartPosition,
          isUseTouch,
        );
        this._transferData.event = e;
        this._startDragView(view, dragStartPosition);
        const viewEvents = this._dragView.viewEvents;
        this.listenTo(
          this._dragView,
          viewEvents.dragViewMoving,
          this._onDragViewMoving,
        );
        this.listenTo(
          this._dragView,
          viewEvents.dragViewFinish,
          this._onDragViewFinish,
        );
      },
      this._context,
    );
  }
  listenTo(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _dragView: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dragViewMoving: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onDragViewMoving: (mouseRealPosition: any) => void,
  ) {
    throw new Error("Method not implemented.");
  }
  dragCancel() {
    if (!this._dragHandler) {
      return;
    }
    const dragResult = this._dragHandler.dragCancel();
    if (dragResult) {
      this._semaphoreModule.decrease(UI_STATUS.DRAG);
      this._dragView.dispose();
      this._contextUndo.keepAllInOne(false);
      this._reset();
    }
  }
  getOriginalDragSelections() {
    return this.originalDragSelections;
  }
  /**
   * @description 开始拖拽流程，触发handler的dragStart
   * @param {WorkbookComponentView} view
   * @param {position} mouseClientPosition
   * @private
   * */
  _startDragView(view, mouseClientPosition) {
    this.preFixOriginalSelections(view);
    this._semaphoreModule.increase(UI_STATUS.DRAG);
    this._contextUndo.keepAllInOne(true);
    this._selectionsModule.disable();
    const DragHandler = getDragHandler(view);
    this._dragHandler = new DragHandler(this._context);
    const mouseRealPosition = this._svgView
      .getCoordinateTransfer()
      .viewportToMindMap({
        x: mouseClientPosition.x,
        y: mouseClientPosition.y,
      });
    Object.assign(this._transferData, {
      // deprecated
      pos: mouseRealPosition,
      // deprecated
      dragedView: view,
      position: mouseRealPosition,
      draggedView: view,
      selections: this._getFinalDragSelections(view),
      dropView: null,
    });
    // add event handler for shift key in svgview
    window.addEventListener("keydown", this.keyPressHandler);
    window.addEventListener("keyup", this.keyPressHandler);
    const dragStartReturnData =
      this._dragHandler.dragStart(Object.assign({}, this._transferData)) || {};
    // update transfer data
    Object.assign(this._transferData, dragStartReturnData);
  }
  keyPressHandler(e) {
    if (e.type === "keydown" && e.key === "Escape") {
      this.dragCancel();
      return;
    }
    this._keyPress = {
      shiftKey: e.shiftKey,
    };
    this._transferData.keyPress = Object.assign({}, this._keyPress);
    this.triggerDragMoving();
  }
  /**
   * @param {position} mouseRealPosition
   * @private
   * */
  _onDragViewMoving(mouseRealPosition) {
    const dragViewPosition = mouseRealPosition;
    if (
      Math.abs(this._prePosition.x - dragViewPosition.x) < MOVE_STEP &&
      Math.abs(this._prePosition.y - dragViewPosition.y) < MOVE_STEP
    ) {
      return;
    }
    this._prePosition = Object.assign({}, dragViewPosition);
    // todo remove
    this._transferData.pos = dragViewPosition;
    this._transferData.position = Object.assign({}, dragViewPosition);
    this._transferData.dropView = this._dragHandler.getDragOverView(
      Object.assign({}, this._transferData),
    );
    this._transferData.keyPress = Object.assign({}, this._keyPress);
    this.triggerDragMoving();
  }
  /**
   * @param {position} mouseRealPosition
   * @private
   * */
  _onDragViewFinish(mouseRealPosition) {
    this._semaphoreModule.decrease(UI_STATUS.DRAG);
    // todo remove
    this._transferData.pos = mouseRealPosition;
    this._transferData.position = mouseRealPosition;
    this._dragHandler.dragFinish(this._transferData);
    this._contextUndo.keepAllInOne(false);
    this._reset();
  }
  /** @private */
  _reset() {
    this._selectionsModule.enable();
    this.stopListening(this._dragView);
    this._dragView = null;
    this._transferData = {};
    this._dragHandler = null;
    this._keyPress = undefined;
    this.originalDragSelections = [];
    window.removeEventListener("keydown", this.keyPressHandler);
    window.removeEventListener("keyup", this.keyPressHandler);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stopListening(_dragView: any) {
    throw new Error("Method not implemented.");
  }
  /** @private */
  _getFinalDragSelections(view) {
    let selections = [...this._dragSelections];
    if (
      view.type !== VIEW_TYPE.BRANCH ||
      styleManager.getClassName(view) === CLASS_TYPE.CALLOUT_TOPIC
    ) {
      selections = [];
    } else if (selections.indexOf(view) === -1) {
      selections = [view];
    }
    return selections;
  }
  preFixOriginalSelections(view) {
    const finalSelections = this._getFinalDragSelections(view);
    if (
      !this._dragSelections.includes(view) &&
      finalSelections.length === 1 &&
      finalSelections[0] === view
    ) {
      // select single if target selection list is brand new
      this._selectionsModule.selectSingle(view);
      this.originalDragSelections = [...finalSelections];
    }
  }
}
DragManager.identifier = MODULE_NAME.DRAG;
Object.assign(DragManager.prototype, backbone.Events);

export default DragManager;
