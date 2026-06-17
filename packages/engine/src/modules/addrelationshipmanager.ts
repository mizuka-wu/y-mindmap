/* eslint-disable prefer-const */
import * as sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__ from "../common/constants/index";
import jquery from "jquery";

import RelationshipView from "../view/relationshipview";

import Util from "../util";

import { getRelationshipLineType } from "../render/relationshiplinetype";

import * as pointutils from "../utils/pointutils";

import * as utils from "../utils/index";

import BaseEvent from "../common/utils/base-event";

import BranchView from "../view/branchview";

import * as commonUtils from "../common/utils/index";

const STATE = {
  READY: "ready",
  SELECT_ONE: "select_one",
  SELECT_ANOTHER: "select_another",
  FINISH: "finish",
};
const EMIT_NAME = {
  START: "start",
  ADD: "add",
  STOP: "stop",
};
const LINE_STYLE_WHEN_SHIFT_PRESSED =
  sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.RELATIONSHIPSHAPE
    .STRAIGHT;
// Finite-state Machine: `from` currentState `to` nextState when `emit`.
const transitions = [
  {
    from: STATE.READY,
    emit: EMIT_NAME.START,
    to: STATE.SELECT_ONE,
  },
  {
    from: STATE.SELECT_ONE,
    emit: EMIT_NAME.ADD,
    to: STATE.SELECT_ANOTHER,
  },
  {
    from: STATE.SELECT_ONE,
    emit: EMIT_NAME.STOP,
    to: STATE.READY,
  },
  {
    from: STATE.SELECT_ANOTHER,
    emit: EMIT_NAME.ADD,
    to: STATE.FINISH,
  },
  {
    from: STATE.SELECT_ANOTHER,
    emit: EMIT_NAME.STOP,
    to: STATE.READY,
  },
  {
    from: STATE.FINISH,
    emit: EMIT_NAME.STOP,
    to: STATE.READY,
  },
];
export class AddRelationshipManager extends BaseEvent {
  _context: any;
  _currentState: string;
  _end1View: any;
  _end2View: any;
  _movingRelationship: any;
  _stickyToAngle: boolean;
  _stickyEndPointCache: any;
  _defaultLineStyle: any;
  _mouseMovePointCache: any;
  static identifier: string;
  constructor(context) {
    super();
    this._context = context;
    this._currentState = STATE.READY;
    this._end1View = null;
    this._end2View = null;
    this._movingRelationship = null;
    this._stickyToAngle = false;
    this._stickyEndPointCache = null;
    this._defaultLineStyle = null;
    this._mouseMovePointCache = null;
    // bind `this` to callback function.
    this._clickBranchOrBoundaryCallback =
      this._clickBranchOrBoundaryCallback.bind(this);
    this._clickSheetCallback = this._clickSheetCallback.bind(this);
    this._escFn = this._escFn.bind(this);
    this._mouseMoveCallback = this._mouseMoveCallback.bind(this);
    this.listenTo(
      this._context,
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.EVENTS
        .AFTER_SHEET_CONTENT_CHANGE,
      () => this._onSheetContentChanged(),
    );
  }
  isReady() {
    return this._isState(STATE.READY);
  }
  start() {
    if (!this.isReady()) {
      return;
    }
    const selections = this._context
      .getModule(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.MODULE_NAME
          .SELECTION,
      )
      .getSelections();
    if (selections.length > 2) {
      return;
    }
    this._transit(EMIT_NAME.START);
    selections.forEach((v) => {
      this._transit(EMIT_NAME.ADD, {
        endView: v,
      });
    });
  }
  cancel() {
    this._transit(EMIT_NAME.STOP);
  }
  _transit(e, options = {}) {
    // emit and change the currentState. then doSomething.
    const found = transitions.find(
      (t) => t.from === this._currentState && t.emit === e,
    );
    if (!found) {
      return;
    }
    if (!this._shouldTransit(found.to, options)) {
      return;
    }
    this._currentState = found.to;
    _setCursor(this._context, this._currentState);
    switch (this._currentState) {
      case STATE.SELECT_ONE:
        this._onSelectOne();
        break;
      case STATE.SELECT_ANOTHER:
        this._onSelectAnother(options);
        break;
      case STATE.FINISH:
        this._onFinish(options);
        break;
      case STATE.READY:
        this._onReady();
        break;
      default:
        break;
    }
  }
  _shouldTransit(nextState, options) {
    const funcName = `_should${_toCamelCase(`_${nextState}`)}`;
    if (this[funcName]) {
      return this[funcName](options);
    } else {
      return true;
    }
  }
  _isState(state) {
    return state === this._currentState;
  }
  _bindModifierKeyEventHandler() {
    jquery("body")
      .on("keydown.addRelationship", (e) => {
        // Esc
        if (e.which === 27) {
          this._escFn();
        }
        // Shift
        if (e.which === 16) {
          this._stickyToAngle = true;
          this._createRelationshipByMouse(
            this._movingRelationship,
            this._end1View,
          );
        }
      })
      .on("keyup.addRelationship", (e) => {
        // Shift
        if (e.which === 16) {
          this._stickyToAngle = false;
          this._createRelationshipByMouse(
            this._movingRelationship,
            this._end1View,
          );
        }
      });
  }
  _unbindModifierKeyEventHandler() {
    jquery("body").off("keydown.addRelationship").off("keyup.addRelationship");
  }
  _onSelectOne() {
    this._context
      .getModule(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.MODULE_NAME
          .SEMAPHORE,
      )
      .increase(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.UI_STATUS
          .ADD_RELATIONSHIP,
      );
    _addClickEvent(
      this._context,
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.BRANCH,
      this._clickBranchOrBoundaryCallback,
    );
    _addClickEvent(
      this._context,
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.BOUNDARY,
      this._clickBranchOrBoundaryCallback,
    );
    _addClickEvent(
      this._context,
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.SVG,
      this._clickSheetCallback,
    );
    this._bindModifierKeyEventHandler();
    document.addEventListener("mousemove", this._mouseMoveCallback);
  }
  _shouldSelectAnother(options: any = {}) {
    return !!options.endView;
  }
  _onSelectAnother(options: any = {}) {
    this._end1View = options.endView;
    const svgView = this._context.getSVGView();
    this._movingRelationship = _createMovingView(
      this._context,
      svgView,
      options.endView,
    );
    this._defaultLineStyle = this._movingRelationship.figure.lineStyle;
  }
  _shouldFinish(options: any = {}) {
    return (
      !!options.endView &&
      !!this._end1View &&
      this._end1View !== options.endView
    );
  }
  _onFinish(options: any = {}) {
    this._end2View = options.endView;
    this._movingRelationship.model.removeSelf();
    this._movingRelationship.remove();
    this._movingRelationship = null;
    const newRelationshipModel = this._addRelationship(
      this._context,
      this._end1View,
      this._end2View,
    );
    const view1 = this._end1View;
    const view2 = this._end2View;
    const stickyEndPoint = Object.assign({}, this._stickyEndPointCache);
    const lineStyle = this._stickyToAngle
      ? LINE_STYLE_WHEN_SHIFT_PRESSED
      : this._defaultLineStyle;
    /**
     * This calculation process needs real positions of end views, but refefences of end views
     * will be clear after current event cycle. So we store refefences first, then calculate insectpoints
     * and re-render the relationship within a closure, which runs after end views has their real position.
     */
    const tmpStickyToAngle = this._stickyToAngle;
    this._context.afterRender().then(() => {
      if (tmpStickyToAngle) {
        const lineEndPoints = this._calcLineEndPointsByEndViews(
          view1,
          view2,
          stickyEndPoint,
        );
        newRelationshipModel.changeLineEndPosition(lineEndPoints);
      }
      newRelationshipModel.changeStyle(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.STYLE_KEYS
          .SHAPE_CLASS,
        lineStyle,
      );
    });
    this._stickyToAngle = false;
    this._stickyEndPointCache = null;
    this._defaultLineStyle = null;
    this._mouseMovePointCache = null;
    // select the new relationship.
    if (!options.selectNewTopic) {
      const newRelationshipView =
        this._context.getSVGView().model2View[newRelationshipModel.get("id")];
      this._context
        .getModule(
          sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.MODULE_NAME
            .SELECTION,
        )
        .selectSingle(newRelationshipView);
    }
    this._transit(EMIT_NAME.STOP);
  }
  _calcLineEndPointsByEndViews(end1View, end2View, preferedPoint) {
    // calculate end point 1
    const absInsectPoint1 = Util.topicInsectLine(end1View, preferedPoint);
    const end1ViewPos = end1View.getRealPosition();
    const endPoint1 = Object(pointutils.diff)(end1ViewPos, absInsectPoint1);
    // calculate end point 2
    const rayCastFn =
      end2View instanceof BranchView
        ? Util.branchRayCast
        : Util.boundaryRayCast;
    const rayCastResult = rayCastFn(end2View, absInsectPoint1, endPoint1);
    // If the ray did not get through end2View, we simply link the end1View and end2View
    const absInsectPos2 =
      rayCastResult ?? Util.topicInsectLine(end2View, end1ViewPos);
    const end2ViewPos = end2View.getRealPosition();
    const endPoint2 = Object(pointutils.diff)(end2ViewPos, absInsectPos2);
    return {
      "0": endPoint1,
      "1": endPoint2,
    };
  }
  _onReady() {
    this._end1View = null;
    this._end2View = null;
    if (this._movingRelationship) {
      this._movingRelationship.model.removeSelf();
      this._movingRelationship.remove();
      this._movingRelationship = null;
    }
    document.removeEventListener("mousemove", this._mouseMoveCallback);
    this._context.offEvent(
      "click",
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.BRANCH,
      this._clickBranchOrBoundaryCallback,
    );
    this._context.offEvent(
      "click",
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.BOUNDARY,
      this._clickBranchOrBoundaryCallback,
    );
    this._context.offEvent(
      "click",
      sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.VIEW_TYPE.SVG,
      this._clickSheetCallback,
    );
    this._unbindModifierKeyEventHandler();
    this._context
      .getModule(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.MODULE_NAME
          .SEMAPHORE,
      )
      .decrease(
        sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.UI_STATUS
          .ADD_RELATIONSHIP,
      );
  }
  _mouseMoveCallback(event) {
    if (this._isState(STATE.SELECT_ANOTHER) && this._movingRelationship) {
      const svgView = this._context.getSVGView();
      const clientPosition = this._context.getDragEventClientPosition(event);
      // in doughnut, y should add header bar's height
      if (this._context.isDoughnutPlatform()) {
        clientPosition.y += this._context.getDoughnutExportInfo().headerHeight;
      }
      this._mouseMovePointCache = svgView
        .getCoordinateTransfer()
        .viewportToMindMap(Object.assign({}, clientPosition));
      this._createRelationshipByMouse(this._movingRelationship, this._end1View);
    }
  }
  _computeStickyPointIfCloseToSpecificDeg(from, to) {
    const degStep = 45;
    const diffLimit = 5;
    const { x, y } = Object(pointutils.diff)(from, to);
    const currentDeg = (Math.atan(y / x) * 180) / Math.PI;
    const targetDeg = Math.round(currentDeg / degStep) * degStep;
    const degDiff = targetDeg - currentDeg;
    if (Math.abs(degDiff) < diffLimit) {
      return Object(pointutils.rotateAroundDeg)(to, from, degDiff);
    } else {
      return to;
    }
  }
  _createRelationshipByMouse(relationshipView, end1View) {
    this._stickyEndPointCache = null;
    let startPoint;
    let endPoint;
    if (!this._mouseMovePointCache) {
      return;
    }
    relationshipView.figure.setLineStyle(
      this._stickyToAngle
        ? LINE_STYLE_WHEN_SHIFT_PRESSED
        : this._defaultLineStyle,
    );
    const end1ViewPos = end1View.realPosition;
    endPoint = this._computeStickyPointIfCloseToSpecificDeg(
      end1ViewPos,
      this._mouseMovePointCache,
    );
    startPoint = Util.topicInsectLine(end1View, endPoint);
    this._stickyEndPointCache = endPoint;
    const { x: dx, y: dy } = Object(pointutils.diff)(startPoint, endPoint);
    const controlPointOffset = Object(pointutils.rotate)(
      {
        x: dx / 3,
        y: dy / 3,
      },
      Object(commonUtils.degree)(30),
    );
    const control1 = {
      x: startPoint.x + controlPointOffset.x,
      y: startPoint.y + controlPointOffset.y,
    };
    const control2 = {
      x: endPoint.x - controlPointOffset.x,
      y: endPoint.y - controlPointOffset.y,
    };
    const lineType = relationshipView.figure.lineStyle;
    Object(getRelationshipLineType)(lineType).updatePath(
      relationshipView,
      startPoint,
      endPoint,
      control1,
      control2,
    );
    relationshipView.setPointerEventsNone(true);
  }
  _clickBranchOrBoundaryCallback(e) {
    this._transit(EMIT_NAME.ADD, {
      endView: e.sbView,
    });
    return false;
  }
  _clickSheetCallback(e) {
    const floatingTopic = this._addFloatingTopic(e, this._stickyEndPointCache);
    this._transit(EMIT_NAME.ADD, {
      endView: floatingTopic,
      selectNewTopic: true,
    });
    return false;
  }
  _escFn() {
    this._transit(EMIT_NAME.STOP);
  }
  _onSheetContentChanged() {
    if (!this._isState(STATE.SELECT_ANOTHER)) {
      return;
    }
    // cancel process if end1View has been removed
    if (!this._end1View.model.parent()) {
      return this.cancel();
    }
  }
  _addFloatingTopic(e, forcedPos) {
    const rootTopic = this._context.getSheetModel().rootTopic();
    const topicModel = rootTopic.createEmptyTopic({
      title: this._context.getTranslatedText("DEFAULT_FLOATING_TOPIC_TITLE"),
      titleUnedited: true,
    });
    // todo 兼容surface
    topicModel.set(
      "position",
      forcedPos ??
        this._context
          .getSVGView()
          .getCoordinateTransfer()
          .viewportToMindMap(this._context.getDragEventClientPosition(e)),
    );
    rootTopic.addChildTopic(topicModel, {
      type: sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.TOPIC_TYPE
        .DETACHED,
    });
    return this._context.getSVGView().model2View[topicModel.get("id")];
  }
  _addRelationship(context, end1View, end2View) {
    const end1Id = end1View.model.get("id");
    const end2Id = end2View.model.get("id");
    const sheetModel = context.getSheetModel();
    const relationshipData = {
      id: sheetModel.generateComponentId(),
      end1Id: end1Id,
      end2Id: end2Id,
      controlPoints: getNewRelationshipControlPoints(end1View, end2View),
    };
    return sheetModel.addRelationship(relationshipData);
  }
}
AddRelationshipManager.identifier =
  sb_common_constants_index__WEBPACK_IMPORTED_MODULE_0__.MODULE_NAME.ADD_RELATIONSHIP;
const _addClickEvent = (context, targetType, fn) => {
  const EVT_TYPE = "click";
  context.onEvent(EVT_TYPE, targetType, fn);
  return () => context.offEvent(EVT_TYPE, targetType, fn);
};
const _setCursor = (context, currentState) => {
  const mapStateToStyle = {
    [STATE.READY]: "default",
    [STATE.SELECT_ONE]: "pointer",
    [STATE.SELECT_ANOTHER]: "pointer",
    [STATE.FINISH]: "default",
  };
  const svg = context.getSVGView().svg;
  svg.style("cursor", mapStateToStyle[currentState]);
};
const absDistance = 150;
function getEndViewRealPosition(endView) {
  if (Object(utils.isBranch)(endView)) {
    if (Object(utils.isDetachedBranch)(endView)) {
      return endView.model.getPosition();
    } else {
      return endView.getRealPosition();
    }
  } else {
    const boundaryRealPosition = endView.getRealPosition();
    const boundarySize = endView.figure.size;
    return {
      x: boundaryRealPosition.x + boundarySize.width / 2,
      y: boundaryRealPosition.y + boundarySize.height / 2,
    };
  }
}
function getEndViewSize(endView) {
  if (Object(utils.isBranch)(endView)) {
    return Object.assign({}, endView.topicView.bounds);
  } else {
    return endView.figure.size;
  }
}
function getNewRelationshipControlPoints(end1View, end2View) {
  const realPosition1 = getEndViewRealPosition(end1View);
  const realPosition2 = getEndViewRealPosition(end2View);
  const approximationDetachedTopicWidth = 78;
  const centerAbsX = Math.abs(realPosition1.x - realPosition2.x);
  const borderAbsX =
    centerAbsX -
    (getEndViewSize(end1View).width +
      (getEndViewSize(end2View).width || approximationDetachedTopicWidth)) /
      2;
  const centerAbsY = Math.abs(realPosition1.y - realPosition2.y);
  const angle = (30 / 180) * Math.PI;
  let controlPoint1: any = {
    angle: angle,
    amount: 0.33,
  };
  let controlPoint2: any = {
    angle: angle,
    amount: 0.33,
  };
  const type1 = "1";
  const type2 = "2";
  const type3 = "3";
  const type4 = "4";
  const type5 = "5";
  const type6 = "6";
  const type7 = "7";
  const type8 = "8";
  let controlPointInitType;
  if (borderAbsX < 0) {
    if (centerAbsY < absDistance + 50) {
      if (realPosition1.x >= 0) {
        controlPointInitType = type3;
      } else {
        controlPointInitType = type4;
      }
    }
  } else if (borderAbsX <= absDistance) {
    if (centerAbsY < absDistance + 50) {
      if (realPosition1.y >= 0) {
        controlPointInitType = type1;
      } else {
        controlPointInitType = type2;
      }
    }
  }
  const type12ControlPointY = Math.min(centerAbsX, 600) * 0.618;
  const type34End1ViewControlPointX = Math.max(
    66 + getEndViewSize(end1View).width / 2,
    Math.min(centerAbsY, 600) * 0.75,
  );
  const type34End2ViewControlPointX = Math.max(
    66 + (getEndViewSize(end2View).width || 100) / 2,
    Math.min(centerAbsY, 600) * 0.75,
  );
  const type56ControlPointXY = centerAbsY * 0.5;
  switch (controlPointInitType) {
    case type1: {
      controlPoint1 = {
        x: 0,
        y: type12ControlPointY,
      };
      controlPoint2 = {
        x: 0,
        y: type12ControlPointY,
      };
      break;
    }
    case type2: {
      controlPoint1 = {
        x: 0,
        y: -type12ControlPointY,
      };
      controlPoint2 = {
        x: 0,
        y: -type12ControlPointY,
      };
      break;
    }
    case type3: {
      controlPoint1 = {
        x: type34End1ViewControlPointX,
        y: 0,
      };
      controlPoint2 = {
        x: type34End2ViewControlPointX,
        y: 0,
      };
      break;
    }
    case type4: {
      controlPoint1 = {
        x: -type34End1ViewControlPointX,
        y: 0,
      };
      controlPoint2 = {
        x: -type34End2ViewControlPointX,
        y: 0,
      };
      break;
    }
    case type5: {
      controlPoint1 = {
        x: -type56ControlPointXY,
        y: type56ControlPointXY,
      };
      controlPoint2 = {
        x: type56ControlPointXY,
        y: -type56ControlPointXY,
      };
      break;
    }
    case type6: {
      controlPoint1 = {
        x: type56ControlPointXY,
        y: -type56ControlPointXY,
      };
      controlPoint2 = {
        x: -type56ControlPointXY,
        y: type56ControlPointXY,
      };
      break;
    }
    case type7: {
      controlPoint1 = {
        x: 0,
        y: (centerAbsY * 2) / 3,
      };
      controlPoint2 = {
        x: 0,
        y: (-centerAbsY * 2) / 3,
      };
      break;
    }
    case type8: {
      controlPoint1 = {
        x: 0,
        y: (-centerAbsY * 2) / 3,
      };
      controlPoint2 = {
        x: 0,
        y: (centerAbsY * 2) / 3,
      };
      break;
    }
  }
  return {
    "0": controlPoint1,
    "1": controlPoint2,
  };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _createMovingView = (context, editDomain, end1View) => {
  const sheetView = editDomain.content();
  const sheetModel = context.getSheetModel();
  const fakeRelationshipModel = sheetModel.createComponent("relationship", {});
  fakeRelationshipModel.parent(sheetModel);
  const relationshipView = new RelationshipView(fakeRelationshipModel, true);
  relationshipView.parent(sheetView);
  relationshipView.initStyle();
  relationshipView.titleView.setVisible(false);
  return relationshipView;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _toCamelCase = (str) =>
  str.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2, offset) =>
    p2 ? p2.toUpperCase() : p1.toLowerCase(),
  );

export default AddRelationshipManager;
