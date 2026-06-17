import {
  DIRECTION,
  STYLE_KEYS,
  VIEW_TYPE,
  FIGURE_TYPE,
  MASTER_RANGE,
  CONFIG,
  PLATFORMS,
  BOUNDARYSHAPE,
  TOPICSHAPE,
  MODULE_NAME,
  SERVICE_NAME,
} from "../../../common/constants/index";

import figures from "../../../figures/index";

import Util from "../../../util";

import * as sb_utils_index__WEBPACK_IMPORTED_MODULE_3__ from "../../../utils/index";

import SvgComponentView from "../../../view/svgcomponentview";

import { layoutConstant } from "../../../utils/layoutconstant";

import BoundaryView from "../../../view/boundaryview";

import BranchView from "../../../view/branchview";

import styleManager from "../../../utils/business/stylemanager/index";

const { CROSSBOUNDARYLEN } = layoutConstant;
const CONTROL_BOX_LENGTH = 7;
const CONTROL_BOX_FILLCOLOR = "#ffffff";
const CONTROL_BOX_BORDER_WIDTH = layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH;
const CONTROL_BOX_STROKECOLOR = "#2ebdff";
const HANDLER_BOX_EXTEND_OFFSET = 4;
const SELECT_BOX_DEFOCUS_COLOR = "#9f9f9f";
const CONTROL_BOX_PADDING_Y = layoutConstant.TOPIC_SELECTBOX_PADDING;
const CONTROL_BOX_PADDING_X = layoutConstant.TOPIC_SELECTBOX_PADDING;
const CONTROL_BOX_BORDER_RADIUS = layoutConstant.TOPIC_SELECTBOX_RADIUS;
const ADD_TITLE_BUTTON_HEIGHT = 16;
export class SelectBoxView extends SvgComponentView {
  sbEvents: { click: string; mouseover: string };
  direction: string;
  rangeStart: number;
  rangeEnd: number;
  isClickAddTitleButtonEventInit: boolean;
  isDragEventsInit: boolean;
  relationBranch: any;
  refView: any;
  figure: any;
  stateMachine: sb_utils_index__WEBPACK_IMPORTED_MODULE_3__.StateMachine;
  event_deselect: any;
  event_select: any;
  event_defocus: any;
  event_hover: any;
  event_out: any;
  event_drag: any;
  event_drag_end: any;
  event_edit: any;
  event_edit_end: any;
  state_normal: any;
  state_hover: any;
  state_select: any;
  state_defocus: any;
  state_drag: any;
  state_edit: any;
  selectBox: any;
  selectBoxOneG: any;
  selectBoxTwoG: any;
  constructor({ refView }) {
    super();
    this.sbEvents = {
      click: "onClick",
      mouseover: "onMouseOver",
    };
    this.direction = DIRECTION.UP;
    this.rangeStart = 0;
    this.rangeEnd = 0;
    this.isClickAddTitleButtonEventInit = false;
    this.isDragEventsInit = false;
    this.relationBranch = {};
    this.refView = refView;
    this.figure = figures.createFigure(this);
    /**
     * @description 保存被关联到的branch的id
     * @public
     * */
    this.relationBranch = {};
    this.figure = figures.createFigure(this);
    this.initSVGStructure();
    this.parent(this.refView);
    this.listenTo(this.refView, "afterSizeChange", () => this.render());
    this.listenTo(this.refView, "afterRealPosChange", () => this.render());
    if (this.refView instanceof BoundaryView) {
      this.listenTo(this.refView.model, "changeStyle", (styleKey) => {
        if (styleKey === STYLE_KEYS.LINE_WIDTH) {
          this.render();
        }
      });
    }
    this.stateMachine =
      new sb_utils_index__WEBPACK_IMPORTED_MODULE_3__.StateMachine();
    this.initStateMachine();
  }
  get type() {
    return VIEW_TYPE.SELECTBOX;
  }
  get figureType() {
    return FIGURE_TYPE.SELECT_BOX;
  }
  initStateMachine() {
    const sm = this.stateMachine;
    const state_normal = sm.newState("NORAML");
    const state_hover = sm.newState("HOVER");
    const state_select = sm.newState("SELECT");
    const state_defocus = sm.newState("DEFOCUS");
    const state_drag = sm.newState("DRAG");
    const state_edit = sm.newState("EDIT");
    const event_deselect = sm.newEvent("DESELECT");
    const event_select = sm.newEvent("SELECT");
    const event_defocus = sm.newEvent("DEFOCUS");
    const event_hover = sm.newEvent("HOVER");
    const event_out = sm.newEvent("OUT");
    const event_drag = sm.newEvent("DRAG");
    const event_drag_end = sm.newEvent("DRAG_END");
    const event_edit = sm.newEvent("EDIT");
    const event_edit_end = sm.newEvent("EDIT_END");
    sm.addTransition(state_normal, event_hover, state_hover, () => {
      this.toHoverState();
    });
    sm.addTransition(state_normal, event_select, state_select, () => {
      this.toSelectState();
    });
    sm.addTransition(state_hover, event_select, state_select, () => {
      this.toSelectState();
    });
    sm.addTransition(state_select, event_deselect, state_normal, () => {
      this.hideControlBar();
      this.hideAddTitleButton();
    });
    sm.addTransition(state_hover, event_out, state_normal, () => {
      this.hideControlBar();
      if (this.refView.getEditContent() === "") {
        this.showAddTitleButton();
      } else {
        this.hideAddTitleButton();
      }
    });
    sm.addTransition(state_select, event_drag, state_drag, () => {
      this.showControlBar();
      this.hideAddTitleButton();
    });
    sm.addTransition(state_select, event_defocus, state_defocus, () => {
      this.hideControlBar();
      this.hideAddTitleButton();
      this.setDefocusStateBoxStyle();
    });
    sm.addTransition(state_defocus, event_select, state_select, () => {
      this.setSelectStateBoxStyle();
      this.toSelectState();
    });
    sm.addTransition(state_drag, event_drag_end, state_select, () => {
      this.showControlBar();
      if (this.refView.getEditContent() === "") {
        this.showAddTitleButton();
      } else {
        this.hideAddTitleButton();
      }
    });
    sm.addTransition(state_select, event_edit, state_edit, () => {
      this.showControlBar();
      this.hideAddTitleButton();
    });
    sm.addTransition(state_edit, event_edit_end, state_select, () => {
      this.showControlBar();
      if (this.refView.getEditContent() === "") {
        this.showAddTitleButton();
      } else {
        this.hideAddTitleButton();
      }
    });
    sm.addTransition(state_edit, event_deselect, state_normal, () => {
      this.hideControlBar();
      this.hideAddTitleButton();
    });
    this.hideControlBar();
    this.hideAddTitleButton();
    sm.setCurrentState(state_normal);
    this.event_deselect = event_deselect;
    this.event_select = event_select;
    this.event_defocus = event_defocus;
    this.event_hover = event_hover;
    this.event_out = event_out;
    this.event_drag = event_drag;
    this.event_drag_end = event_drag_end;
    this.event_edit = event_edit;
    this.event_edit_end = event_edit_end;
    this.state_normal = state_normal;
    this.state_hover = state_hover;
    this.state_select = state_select;
    this.state_defocus = state_defocus;
    this.state_drag = state_drag;
    this.state_edit = state_edit;
  }
  initSVGStructure() {
    const renderWorker = this.figure.renderWorker;
    this.selectBox = renderWorker.selectBox;
    this.selectBoxOneG = renderWorker.selectBoxOneG;
    this.selectBoxTwoG = renderWorker.selectBoxTwoG;
  }
  generateBoxPath(innerBoxSize) {
    const { width, height, x, y } = innerBoxSize;
    return (
      "M " +
      (x - CONTROL_BOX_PADDING_X + CONTROL_BOX_BORDER_RADIUS) +
      " " +
      (y - CONTROL_BOX_PADDING_Y) +
      "L " +
      (x + width + CONTROL_BOX_PADDING_X - CONTROL_BOX_BORDER_RADIUS) +
      " " +
      (y - CONTROL_BOX_PADDING_Y) +
      "Q " +
      (x + width + CONTROL_BOX_PADDING_X) +
      " " +
      (y - CONTROL_BOX_PADDING_Y) +
      "  " +
      (x + width + CONTROL_BOX_PADDING_X) +
      " " +
      (y - CONTROL_BOX_PADDING_Y + CONTROL_BOX_BORDER_RADIUS) +
      "L " +
      (x + width + CONTROL_BOX_PADDING_X) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y - CONTROL_BOX_BORDER_RADIUS) +
      "Q " +
      (x + width + CONTROL_BOX_PADDING_X) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y) +
      "  " +
      (x + width + CONTROL_BOX_PADDING_X - CONTROL_BOX_BORDER_RADIUS) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y) +
      "L " +
      (x - CONTROL_BOX_PADDING_X + CONTROL_BOX_BORDER_RADIUS) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y) +
      "Q " +
      (x - CONTROL_BOX_PADDING_X) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y) +
      "  " +
      (x - CONTROL_BOX_PADDING_X) +
      " " +
      (y + height + CONTROL_BOX_PADDING_Y - CONTROL_BOX_BORDER_RADIUS) +
      "L " +
      (x - CONTROL_BOX_PADDING_X) +
      " " +
      (y - CONTROL_BOX_PADDING_Y + CONTROL_BOX_BORDER_RADIUS) +
      "Q " +
      (x - CONTROL_BOX_PADDING_X) +
      " " +
      (y - CONTROL_BOX_PADDING_Y) +
      "  " +
      (x - CONTROL_BOX_PADDING_X + CONTROL_BOX_BORDER_RADIUS) +
      " " +
      (y - CONTROL_BOX_PADDING_Y) +
      "z"
    );
  }
  generateHandlerPath(direction) {
    let { x, y, width, height } = this.getSelectBoxSize();
    let paddingX = CONTROL_BOX_PADDING_X;
    let paddingY = CONTROL_BOX_PADDING_Y;
    /**
     * calc handler box area infomation
     *                paddingX          paddingX
     * -----------------------          -------------------------
     * |         up          | paddingY |       |       |       |
     * |---------------------|          |       |-------|       |
     * |      |      |       |          | left  |       | right |
     * |---------------------|          |       |-------|       |
     * |        down         |          |       |       |       |
     * -----------------------          -------------------------
     */
    switch (direction) {
      case DIRECTION.UP:
        paddingY += HANDLER_BOX_EXTEND_OFFSET; // extend controlable area to improve user experience of mobile device, same as below
        x = x - paddingX;
        y = y - paddingY * 2;
        width = width + paddingX * 2;
        height = paddingY * 2;
        break;
      case DIRECTION.DOWN:
        paddingY += HANDLER_BOX_EXTEND_OFFSET;
        x = x - paddingX;
        y = y + height;
        width = width + paddingX * 2;
        height = paddingY * 2;
        break;
      case DIRECTION.LEFT:
        paddingX += HANDLER_BOX_EXTEND_OFFSET;
        x = x - paddingX * 2;
        y = y - paddingY;
        width = paddingX * 2;
        height = height + paddingY * 2;
        break;
      case DIRECTION.RIGHT:
        paddingX += HANDLER_BOX_EXTEND_OFFSET;
        x = x + width;
        y = y - paddingY;
        width = paddingX * 2;
        height = height + paddingY * 2;
        break;
    }
    const topLeft = {
      x: x,
      y: y,
    };
    const topRight = {
      x: x + width,
      y: y,
    };
    const bottomLeft = {
      x: x,
      y: y + height,
    };
    const bottomRight = {
      x: x + width,
      y: y + height,
    };
    return `M ${topRight.x} ${topRight.y} L ${topLeft.x} ${topLeft.y} L ${bottomLeft.x} ${bottomLeft.y} L ${bottomRight.x} ${bottomRight.y} Z`;
  }
  generateControlBarPath(direction) {
    if (!direction) {
      return "";
    }
    const boxSize = this.getSelectBoxSize();
    let { width, height, x, y } = boxSize;
    x -= CONTROL_BOX_PADDING_X;
    y -= CONTROL_BOX_PADDING_Y;
    width += CONTROL_BOX_PADDING_X * 2;
    height += CONTROL_BOX_PADDING_Y * 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const boxBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    boxBounds.width = CONTROL_BOX_LENGTH;
    boxBounds.height = CONTROL_BOX_LENGTH;
    const colLineStartPos = {
      x: 0,
      y: 0,
    };
    const colLineEndPos = {
      x: 0,
      y: 0,
    };
    switch (direction) {
      case DIRECTION.UP:
        boxBounds.x = x + halfWidth;
        boxBounds.y = y;
        colLineStartPos.x = x + CONTROL_BOX_BORDER_RADIUS;
        colLineStartPos.y = y;
        colLineEndPos.x = x + width - CONTROL_BOX_BORDER_RADIUS;
        colLineEndPos.y = y;
        break;
      case DIRECTION.DOWN:
        boxBounds.x = x + halfWidth;
        boxBounds.y = y + height;
        colLineStartPos.x = x + CONTROL_BOX_BORDER_RADIUS;
        colLineStartPos.y = y + height;
        colLineEndPos.x = x + width - CONTROL_BOX_BORDER_RADIUS;
        colLineEndPos.y = y + height;
        break;
      case DIRECTION.LEFT:
        boxBounds.x = x;
        boxBounds.y = y + halfHeight;
        colLineStartPos.x = x;
        colLineStartPos.y = y + CONTROL_BOX_BORDER_RADIUS;
        colLineEndPos.x = x;
        colLineEndPos.y = y + height - CONTROL_BOX_BORDER_RADIUS;
        break;
      case DIRECTION.RIGHT:
        boxBounds.x = x + width;
        boxBounds.y = y + halfHeight;
        colLineStartPos.x = x + width;
        colLineStartPos.y = y + CONTROL_BOX_BORDER_RADIUS;
        colLineEndPos.x = x + width;
        colLineEndPos.y = y + height - CONTROL_BOX_BORDER_RADIUS;
        break;
    }
    boxBounds.x -= boxBounds.width / 2;
    boxBounds.y -= boxBounds.height / 2;
    return `M ${boxBounds.x} ${boxBounds.y} L ${boxBounds.x} ${boxBounds.y + boxBounds.height} L ${boxBounds.x + boxBounds.height} ${boxBounds.y + boxBounds.height} L ${boxBounds.x + boxBounds.height} ${boxBounds.y} Z ${direction === DIRECTION.UP || direction === DIRECTION.DOWN ? `M ${colLineStartPos.x} ${colLineStartPos.y} L ${boxBounds.x} ${colLineStartPos.y} M ${boxBounds.x + CONTROL_BOX_LENGTH} ${colLineEndPos.y} L ${colLineEndPos.x} ${colLineEndPos.y}` : `M ${colLineStartPos.x} ${colLineStartPos.y} L ${colLineStartPos.x} ${boxBounds.y} M ${colLineEndPos.x} ${boxBounds.y + CONTROL_BOX_LENGTH} L ${colLineEndPos.x} ${colLineEndPos.y}`}`;
  }
  /**
   * @description 计算拖拽时移动的box path
   * */
  generateDragMovingBox(startPos, size, x = 0, y = 0) {
    const bounds = {
      x: startPos.x + x,
      y: startPos.y + y,
      width: size.width,
      height: size.height,
    };
    return this.generateBoxPath(bounds);
  }
  transparent(on) {
    this.figure.setTransparent(on);
    return this;
  }
  hide() {
    this.figure.setVisible(false, true);
    return this;
  }
  show() {
    this.figure.setVisible(true, true);
    return this;
  }
  toHoverState() {
    this.hideControlBar();
    this.hideAddTitleButton();
  }
  toSelectState() {
    this.showControlBar();
    if (this.refView.getEditContent() === "") {
      this.showAddTitleButton();
    } else {
      this.hideAddTitleButton();
    }
  }
  setDefocusStateBoxStyle() {
    this.figure.setSelectBoxAttrs({
      stroke: SELECT_BOX_DEFOCUS_COLOR,
    });
  }
  setSelectStateBoxStyle() {
    this.figure.setSelectBoxAttrs({
      stroke: CONTROL_BOX_STROKECOLOR,
    });
  }
  hideControlBar() {
    this.figure.setSelectBoxOneAttrs({
      opacity: 0,
    });
    this.figure.setSelectBoxTwoAttrs({
      opacity: 0,
    });
  }
  showControlBar() {
    this.figure.setSelectBoxOneAttrs({
      opacity: 1,
    });
    this.figure.setSelectBoxTwoAttrs({
      opacity: 1,
    });
  }
  hideAddTitleButton() {
    this.figure.setAddTitleButtonAttrs({
      opacity: 0,
    });
  }
  showAddTitleButton() {
    if (this.refView.type === VIEW_TYPE.SUMMARY) {
      return;
    }
    if (
      this.refView.type === VIEW_TYPE.BOUNDARY &&
      this.refView.shouldPreventTitle()
    ) {
      return;
    }
    this.figure.setAddTitleButtonAttrs({
      opacity: 1,
    });
  }
  render() {
    const direction = this.refView.parent().getDirection();
    const refView = this.refView;
    if (!direction || !refView.parent()) {
      return this;
    }
    this.direction = direction;
    this.setSelectRange();
    this.renderDraggableArea();
    return this;
  }
  getRangeModel() {
    if (this.refView instanceof BranchView) {
      return (this.refView as any).summaryModel;
    } else {
      return this.refView.model;
    }
  }
  isUpDownDirection() {
    return this.direction === DIRECTION.UPDOWN;
  }
  /**
   * @description 渲染动态部分
   * */
  renderDraggableArea() {
    // range为master的select box不可拖拽
    // todo 应该改成从model调用方法的模式
    if (this.getRangeModel().getRange() === MASTER_RANGE) {
      return;
    }
    const boxSize = this.getSelectBoxSize();
    const boxPath = this.generateBoxPath(boxSize);
    const isMobile =
      Object(sb_utils_index__WEBPACK_IMPORTED_MODULE_3__.browserIsMobile)() ||
      this.getContext().config(CONFIG.PLATFORM) === PLATFORMS.BROWNIE;
    let controlBarOnePath;
    let controlBarTwoPath;
    let handlerAreaOnePath;
    let handlerAreaTwoPath;
    if (this.isUpDownDirection()) {
      controlBarOnePath = this.generateControlBarPath(DIRECTION.UP);
      controlBarTwoPath = this.generateControlBarPath(DIRECTION.DOWN);
      if (isMobile) {
        handlerAreaOnePath = this.generateHandlerPath(DIRECTION.UP);
        handlerAreaTwoPath = this.generateHandlerPath(DIRECTION.DOWN);
      }
    } else {
      controlBarOnePath = this.generateControlBarPath(DIRECTION.LEFT);
      controlBarTwoPath = this.generateControlBarPath(DIRECTION.RIGHT);
      if (isMobile) {
        handlerAreaOnePath = this.generateHandlerPath(DIRECTION.LEFT);
        handlerAreaTwoPath = this.generateHandlerPath(DIRECTION.RIGHT);
      }
    }
    const cursorStyle = this.isUpDownDirection() ? "row-resize" : "col-resize";
    this.figure.setSelectBoxAttrs({
      d: boxPath,
      "stroke-width": CONTROL_BOX_BORDER_WIDTH,
      stroke:
        this.stateMachine.getCurrentState() === this.state_defocus
          ? SELECT_BOX_DEFOCUS_COLOR
          : CONTROL_BOX_STROKECOLOR,
      "stroke-opacity": 1,
      fill: "none",
    });
    this.figure.setSelectBoxOneAttrs({
      d: controlBarOnePath,
      "stroke-width": CONTROL_BOX_BORDER_WIDTH,
      stroke: CONTROL_BOX_STROKECOLOR,
      fill: CONTROL_BOX_FILLCOLOR,
      cursor: cursorStyle,
    });
    this.figure.setSelectBoxTwoAttrs({
      d: controlBarTwoPath,
      "stroke-width": CONTROL_BOX_BORDER_WIDTH,
      stroke: CONTROL_BOX_STROKECOLOR,
      fill: CONTROL_BOX_FILLCOLOR,
      cursor: cursorStyle,
    });
    if (isMobile) {
      this.figure.setDragHandlerAreaOneAttrs({
        d: handlerAreaOnePath,
        fill: "transparent",
      });
      this.figure.setDragHandlerAreaTwoAttrs({
        d: handlerAreaTwoPath,
        fill: "transparent",
      });
    }
    this.figure.setAddTitleButtonAttrs({
      transform: `translate(${boxSize.x + 2}  ${boxSize.y - ADD_TITLE_BUTTON_HEIGHT - CONTROL_BOX_PADDING_Y})`,
    });
    this.registerAddTitleButtonOnClickEvent();
    this.registerDragEvents();
  }
  /**
   * @description 设置rangeStart和rangeEnd
   * */
  setSelectRange() {
    const rangeModel = this.getRangeModel();
    this.rangeStart = rangeModel.rangeStart;
    this.rangeEnd = rangeModel.rangeEnd;
  }
  /**
   * @description 获取select box的尺寸
   * */
  getSelectBoxSize() {
    const refView = this.refView;
    if (refView instanceof BoundaryView) {
      const len =
        refView.figure.shapeClass === BOUNDARYSHAPE.CROSS
          ? CROSSBOUNDARYLEN
          : 0;
      const borderWidth = parseInt(
        `${styleManager.getStyleValue(this.refView, STYLE_KEYS.LINE_WIDTH)}`,
      );
      const boundaryTitlePosition = refView.titleView.figure.position;
      const boundaryRealPosition =
        refView.getRealPosition() || refView.position;
      return {
        width: refView.size.width + borderWidth + len * 2,
        height: refView.size.height + borderWidth + len * 2,
        x: boundaryRealPosition.x - borderWidth / 2 - len,
        y:
          boundaryRealPosition.y -
          borderWidth / 2 -
          len +
          boundaryTitlePosition.y,
      };
    } else {
      const couldSelectChildrenArray = refView
        .parent()
        .getChildrenBranchesByType();
      let left = Number.MAX_VALUE;
      let top = Number.MAX_VALUE;
      let bottom = Number.NEGATIVE_INFINITY;
      let right = Number.NEGATIVE_INFINITY; // fix top, bottom, left and right
      for (let i = this.rangeStart; i <= this.rangeEnd; i++) {
        const child = couldSelectChildrenArray[i];
        const halfInnerBorderWidth =
          parseInt(
            `${styleManager.getStyleValue(child, STYLE_KEYS.BORDER_LINE_WIDTH)}`,
          ) / 2;
        left = Math.min(left, child.bounds.x + child.getRealPosition().x);
        right = Math.max(
          right,
          child.bounds.x +
            child.getRealPosition().x +
            child.bounds.width +
            halfInnerBorderWidth,
        );
        top = Math.min(top, child.bounds.y + child.getRealPosition().y);
        bottom = Math.max(
          bottom,
          child.bounds.y +
            child.getRealPosition().y +
            child.bounds.height +
            halfInnerBorderWidth,
        );
        // fix size for underlineshape
        if (child.topicView.figure.shapeClass === TOPICSHAPE.UNDERLINE) {
          bottom = bottom - halfInnerBorderWidth;
          left = left - halfInnerBorderWidth;
          top = top - halfInnerBorderWidth;
        }
      }
      return {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
      };
    }
  }
  registerAddTitleButtonOnClickEvent() {
    if (this.isClickAddTitleButtonEventInit) {
      return;
    }
    if (!(this.refView instanceof BoundaryView)) {
      return;
    }
    this.figure.renderWorker.addTitleButtonG.on("click", () => {
      const editReceiver = this.refView.getModule(MODULE_NAME.EDIT_RECEIVER);
      editReceiver.show(this.refView.getEditContent(), this.refView);
    });
    this.isClickAddTitleButtonEventInit = true;
  }
  /**
   * @description 注册拖拽事件
   * */
  registerDragEvents() {
    if (this.isDragEventsInit) {
      return;
    }
    if (this.getContext().isReadOnly()) {
      return;
    }
    const refParentView = this.refView.parent();
    if (!this.direction || !(refParentView instanceof BranchView)) {
      return;
    }
    const svgDraggableModule = this.refView.getModule(
      MODULE_NAME.SVG_DRAGGABLE,
    );
    const selectBoxOneDragRegister =
      svgDraggableModule &&
      svgDraggableModule
        .draggable(this.selectBoxOneG)
        .dragStart(() => {
          this.onDragStart(selectBoxOneDragRegister, 1);
        })
        .dragMove((info) => {
          this.onDragMoving(info.x, info.y, 1);
        })
        .dragEnd(() => {
          this.onDragEnd();
        });
    const selectBoxTwoDragRegister =
      svgDraggableModule &&
      svgDraggableModule
        .draggable(this.selectBoxTwoG)
        .dragStart(() => {
          this.onDragStart(selectBoxTwoDragRegister, 2);
        })
        .dragMove((info) => {
          this.onDragMoving(info.x, info.y, 2);
        })
        .dragEnd(() => {
          this.onDragEnd();
        });
    this.isDragEventsInit = true;
  }
  /**
   * @param register
   * @param {number} which 控制杆的顺序
   * */
  onDragStart(register, which) {
    const dragMoveMaxDistance = this.getDragMoveMaxDistance();
    const preFix = which === 1 ? "one" : "two";
    const isUD = this.isUpDownDirection();
    register.updateConstraint({
      x: !isUD,
      y: isUD,
      minX: dragMoveMaxDistance[preFix + "GForwardMax"],
      maxX: dragMoveMaxDistance[preFix + "GBackMax"],
      minY: dragMoveMaxDistance[preFix + "GForwardMax"],
      maxY: dragMoveMaxDistance[preFix + "GBackMax"],
    });
    // 显示mask
    const $mask = this.refView.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    $mask.show().css("cursor", isUD ? "row-resize" : "col-resize");
    this.stateMachine.transition(this.event_drag);
  }
  onDragMoving(movingX, movingY, which) {
    // 通知selectDragManager，后面一大块儿需要加注释
    const selectDragManager = this.refView.getModule(MODULE_NAME.SELECT_DRAG);
    if (!selectDragManager.hasStarted()) {
      selectDragManager.trigger("start", this, this.refView, this.direction);
    }
    const movableBranchList = this.refView.parent().getChildrenBranchesByType();
    movableBranchList.forEach((child) => {
      const selected = Util.isSelected(child, this, this.direction);
      if (selected) {
        selectDragManager.trigger("addSelectedBranch", child);
        this.relationBranch[child.cid] = true;
      } else {
        selectDragManager.trigger("removeSelectedBranch", child);
        delete this.relationBranch[child.cid];
      }
    });
    // 更新select box
    const isUD = this.isUpDownDirection();
    const compareDire = isUD ? movingY : movingX;
    const isOneG = which === 1;
    const originBoxSize = this.getSelectBoxSize();
    const originWidth = originBoxSize.width;
    const originHeight = originBoxSize.height;
    let newWidth;
    let newHeight; // 若是上下移动，则改变的只有高度
    if (isUD) {
      newWidth = originWidth;
      newHeight = isOneG
        ? originHeight - compareDire
        : originHeight + compareDire;
    } else {
      newWidth = isOneG ? originWidth - compareDire : originWidth + compareDire;
      newHeight = originHeight;
    }
    const externalArg = !isOneG
      ? []
      : isUD
        ? [0, compareDire]
        : [compareDire, 0];
    const movingBoxPath = this.generateDragMovingBox(
      originBoxSize,
      {
        width: newWidth,
        height: newHeight,
      },
      ...externalArg,
    );
    this.figure.setSelectBoxAttrs({
      d: movingBoxPath,
    });
  }
  /** @private */
  onDragEnd() {
    const $mask = this.refView.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    $mask.hide().css("cursor", "");
    const selectDragManager = this.refView.getModule(MODULE_NAME.SELECT_DRAG);
    if (selectDragManager.hasStarted()) {
      selectDragManager.trigger("end");
    }
    this.stateMachine.transition(this.event_drag_end);
  }
  /**
   * @description 获取select box可移动的距离范围
   * */
  getDragMoveMaxDistance() {
    // 可移动branch列表
    const movableBranchList = this.refView.parent().getChildrenBranchesByType();
    const [dire, dis] = this.isUpDownDirection()
      ? ["y", "height"]
      : ["x", "width"];
    const dire1Arr = [];
    const dire2Arr = [];
    const _dire1Arr = [];
    const _dire2Arr = [];
    movableBranchList.forEach((child, index) => {
      const realPosition = child.getRealPosition();
      const childBounds = child.bounds;
      const halfInnerBorderWidth =
        parseInt(`${child.topicView.figure.borderWidth}`) / 2;
      dire1Arr.push(childBounds[dire] + realPosition[dire]);
      dire2Arr.push(
        childBounds[dire] +
          realPosition[dire] +
          childBounds[dis] +
          halfInnerBorderWidth,
      );
      if (this.rangeStart <= index && index <= this.rangeEnd) {
        _dire1Arr.push(childBounds[dire] + realPosition[dire]);
        let dire2Item =
          childBounds[dire] +
          realPosition[dire] +
          childBounds[dis] +
          halfInnerBorderWidth;
        // special fix for underline
        if (child.topicView.figure.shapeClass === TOPICSHAPE.UNDERLINE) {
          dire2Item = dire2Item - halfInnerBorderWidth;
        }
        _dire2Arr.push(dire2Item);
      }
    });
    const controlBarHeight = this.isUpDownDirection()
      ? this.selectBoxOneG.bbox().height
      : this.selectBoxOneG.bbox().width;
    const selectBoxBBox = this.selectBox.bbox();
    const padding = this.isUpDownDirection()
      ? CONTROL_BOX_PADDING_Y
      : CONTROL_BOX_PADDING_X;
    let oneGForwardMax =
      Math.min(...dire1Arr) -
      selectBoxBBox[dire] -
      layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH / 2 -
      padding * 2;
    const oneGBackMax =
      Math.max(..._dire1Arr) -
      selectBoxBBox[dire] +
      controlBarHeight -
      layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH / 2;
    const twoGForwardMax =
      Math.min(..._dire2Arr) -
      selectBoxBBox[dire + "2"] +
      layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH / 2;
    let twoGBackMax =
      Math.max(...dire2Arr) -
      selectBoxBBox[dire + "2"] +
      controlBarHeight +
      layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH / 2 +
      padding * 2;
    if (this.refView instanceof BoundaryView) {
      oneGForwardMax = oneGForwardMax - controlBarHeight - padding;
      twoGBackMax = twoGBackMax + controlBarHeight + padding;
    }
    return {
      oneGForwardMax: oneGForwardMax,
      oneGBackMax: oneGBackMax,
      twoGForwardMax: twoGForwardMax,
      twoGBackMax: twoGBackMax,
    };
  }
  remove() {
    this.figure.dispose();
    this.parent(null);
    this.stopListening();
    return this;
  }
  onClick() {
    return false;
  }
}

export default SelectBoxView;
