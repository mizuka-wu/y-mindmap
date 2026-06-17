import { BRANCHCONNECTION } from "../../../../common/constants/index";

import { layoutConstant } from "../../../../utils/layoutconstant";

import * as utils from "./utils";

import * as brushes from "./brushes";

import mommonFuncs from "../../../../mommonfuncs";

import * as commonUtils from "../../../../common/utils/index"; // @flow

const LINE_FOCUS_OFFSET_FN_MAP = {
  [utils.LINE_FOCUS_TYPE.DIVER_LINE]: [
    utils.offsetPointCalcFnMap.calcMapStructureStartPoint,
  ],
  [utils.LINE_FOCUS_TYPE.ORDER_LINE]: [
    utils.offsetPointCalcFnMap.calcSinusStartYPoint,
  ],
  [utils.LINE_FOCUS_TYPE.FOCUS_LINE]: [],
};
function getLineOffsetPts(parent, child) {
  const lineFocusType = utils.getLineFocusType(parent);
  const offsetFns = LINE_FOCUS_OFFSET_FN_MAP[lineFocusType];
  return offsetFns.map((fn) => fn(parent, child));
}
export class AbstractTopicShape {
  /**
   * @override
   * @return relative position
   */
  getBasePoint(branch, direction) {
    return Object(utils.getJointPosition)(
      branch.topicView.shapeBounds,
      direction,
    );
  }
  /**
   * @override
   * @return relative position
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPointOffset(branch, direction) {
    return {
      x: 0,
      y: 0,
    };
  }
  /**
   * @override
   * @return relative position
   */
  getCtrlPoint(branch, direction) {
    const isSinusLine =
      branch.getConnectionView().getLineShape() === BRANCHCONNECTION.BIGHT;
    const basePt = this.getBasePoint(branch, direction);
    if (isSinusLine) {
      return basePt;
    } else {
      return Object(utils.addPositionByDirection)(
        basePt,
        direction,
        layoutConstant.LINECOLPOS,
      );
    }
  }
  getStartAnchorPosition(parentBranchView, childBranchView) {
    const direction = Object(utils.getStartDirection)(
      parentBranchView,
      childBranchView,
    );
    const basePt = this.getBasePoint(parentBranchView, direction);
    const startOffset = this.getPointOffset(parentBranchView, direction);
    const startPt = Object(commonUtils.addPoint)(basePt, startOffset);
    const lineOffsetPts = getLineOffsetPts(parentBranchView, childBranchView);
    const pt = lineOffsetPts.reduce(
      (p1, p2) => Object(commonUtils.addPoint)(p1, p2),
      startPt,
    );
    return Object(utils.relativePositionToRealPosition)(pt, parentBranchView);
  }
  getControlPosition(parentBranchView, childBranchView) {
    const focusType = Object(utils.getLineFocusType)(parentBranchView);
    const isStartPt = focusType !== utils.LINE_FOCUS_TYPE.FOCUS_LINE;
    if (isStartPt) {
      return this.getStartAnchorPosition(parentBranchView, childBranchView);
    }
    const dir = Object(utils.getStartDirection)(
      parentBranchView,
      childBranchView,
    );
    const pt = this.getCtrlPoint(parentBranchView, dir);
    return Object(utils.relativePositionToRealPosition)(pt, parentBranchView);
  }
  getEndAnchorPosition(structure, branch) {
    const direction = Object(utils.getEndDirection)(branch.parent(), branch);
    const basePt = this.getBasePoint(branch, direction);
    const endOffset = this.getPointOffset(branch, direction);
    const pt = Object(utils.addPositionByDirection)(
      Object(commonUtils.addPoint)(basePt, endOffset),
      direction,
      utils.END_OFFSET,
    );
    return Object(utils.relativePositionToRealPosition)(pt, branch);
  }
  // return relative position
  getExtColPosition(parentBranchView) {
    const direction = Object(utils.getStartDirection)(parentBranchView);
    return this.getBasePoint(parentBranchView, direction);
  }
  /** @public */
  getDrawBounds(topicBounds, topicBorderWidth) {
    const halfBorderWidth = topicBorderWidth / 2;
    return {
      x: topicBounds.x + halfBorderWidth,
      y: topicBounds.y + halfBorderWidth,
      width: topicBounds.width - halfBorderWidth,
      height: topicBounds.height - halfBorderWidth,
    };
  }
  /** @public */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTopicMargins(branchView /*BranchView*/, size?, isRenderOnTop?) {
    const topicViewFigure = branchView.topicView.figure;
    const borderWidth = parseInt(topicViewFigure.borderWidth || 0);
    return {
      top: parseInt(topicViewFigure.marginTop || 0) + borderWidth,
      left: parseInt(topicViewFigure.marginLeft || 0) + borderWidth,
      bottom: parseInt(topicViewFigure.marginBottom || 0) + borderWidth,
      right: parseInt(topicViewFigure.marginRight || 0) + borderWidth,
    };
  }
  /** @public */
  setTopicShapeSelectBox(topicView /*TopicView*/, bounds) {
    const borderWidth = parseInt(topicView.figure.borderWidth || 0);
    const selectBoxPath = this._calcTopicSelectBoxPath(bounds, borderWidth);
    topicView.setTopicShapeSelectBoxPath(selectBoxPath);
  }
  /** @public */
  render(topicView /*TopicView*/) {
    this._render(topicView);
    this._rotate(topicView);
  }
  _render(topicView, isUnderlineLike?) {
    // 代码执行到这里的时候，已经确定size或者shapeClass发生了改变
    // 所有使用SVG.JS的remember的方法都应该删除
    const borderWidth = topicView.figure.borderWidth || 0;
    const drawBounds = this.getDrawBounds(topicView.shapeBounds, borderWidth);
    const topicShapePath = this.calcTopicShapePath(drawBounds, topicView);
    topicView.setTopicShapePath(topicShapePath);
    let topicFillPath = topicShapePath;
    if (isUnderlineLike) {
      topicFillPath = brushes.rect(drawBounds);
    }
    topicView.setTopicShapeFillPath(topicFillPath);
    this.setTopicShapeSelectBox(topicView, drawBounds);
    Object(utils.setTopicShapeScale)(topicView, 0, 0);
  }
  /** @private */
  _rotate(topicView /*TopicView*/) {
    topicView.topicGroup.rotate(0);
  }
  /** @protected */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcTopicShapePath(bounds, topicView): any {
    throw "need implement";
  }
  /** @private */
  _calcTopicSelectBoxPath(bounds, borderWidth) {
    return mommonFuncs.generateRect(bounds, borderWidth);
  }
}

export default AbstractTopicShape;
