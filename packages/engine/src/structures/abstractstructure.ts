import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_ATTACHED,
  TOPIC_CALLOUT,
  TOPIC_SUMMARY,
  TOPIC_TYPE,
  TOPICSHAPE,
  STYLE_KEYS,
  ATTACHED_EXPOSED_STRUCTURE,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as js_utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";
import * as pointutils from "../utils/pointutils";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";
import { getSummaryLineStyle } from "../render/summarylinestyle";

import structuresUtil from "./helper/structuresutil";
import { dragAreaUtil } from "./helper/dragareautil";

import SelectBoxView from "../modules/svgdraggable/view/selectbox";
import * as index_all from "underscore";
import * as boundutils from "../utils/boundutils";
import { hitDetect as HitDetectInstance } from "./helper/hitdetect";

const PADDING = layoutConstant.PADDING;
const SUMMARYLINEMARGIN = layoutConstant.SUMMARYLINEMARGIN;
const isLineTapered = structuresUtil.isLineTapered;
export const AbstractStructure = {
  STRUCTURECLASS: "",
  isAttachedChildrenStructureImmutable: false,
  //branch的成长方向
  getRangeGrowthDirection: function () {
    return DIRECTION.DOWN;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSummaryDirection: function (...args) {
    return DIRECTION.RIGHT;
  },
  //父branch的出发点
  getSourceOrientation() {
    return DIRECTION.RIGHT;
  },
  //子branch的接受点
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChildTargetOrientation: function (parent, childIndex) {
    return DIRECTION.LEFT;
  },
  isInSameRangeWithLast: function (parent, index) {
    if (index <= 0 || index >= parent.getChildrenBranchesByType().length) {
      return false;
    }
    return this.isInSameRange(parent, index);
  },
  isInSameRange: function (parent, index) {
    const boundaries = parent.model.boundaries();
    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (index - 1 >= boundary.rangeStart && index <= boundary.rangeEnd) {
        return true;
      }
    }
    const summaries = parent.model.summaries();
    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      if (index - 1 >= summary.rangeStart && index <= summary.rangeEnd) {
        return true;
      }
    }
    return false;
  },
  calChildrenBounds: function (branch) {
    branch.calChildrenBounds();
    if (branch.boundaries.length) {
      structuresUtil.sortBoundaries(branch.boundaries);
    }
    structuresUtil.setBoundaryPadding(branch);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calAttachedChildrenPos: function (branch, newBounds) {
    throw new Error("calAttachedChildrenPos must be overrided");
  },
  calCalloutChildrenPos: function (branch, newBounds) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    function checkCoord(branch, coord) {
      const branchCenter = branch.parent().getRealPosition();
      const bounds = branch.boundaryBounds;
      const position = {
        x: coord.left - branchCenter.x - bounds.x,
        y: coord.top - branchCenter.y - bounds.y,
      };
      const result = self.checkCalloutPosition(branch, position);
      if (!result.isAvailable) {
        if (result.left) {
          coord.left -= result.left;
          coord.right -= result.left;
        }
        if (result.right) {
          coord.left += result.right;
          coord.right += result.right;
        }
        if (result.top) {
          coord.top -= result.top;
          coord.bottom -= result.top;
        }
        if (result.bottom) {
          coord.top += result.bottom;
          coord.bottom += result.bottom;
        }
      }
      return true;
    }
    branch.getChildrenBranchesByType(TOPIC_CALLOUT).forEach((callout) => {
      let position = index_all.default.extend(
        {
          x: 0,
          y: 0,
        },
        callout.model.get("position"),
      );
      //  centrlPos = callout.getRealPosition(),
      const calloutBounds = callout.boundaryBounds;
      const hitDetect = new HitDetectInstance.OldHitDetect(callout, {
        checkCoord: function (coord) {
          return checkCoord(this.branch, coord);
        },
      });
      const branchCoords = hitDetect.calCoords();
      const topics = hitDetect.getChildPosList(branch, false);
      const correctPos = hitDetect.calPosition(branchCoords, topics);
      position = {
        x: position.x + correctPos.left - branchCoords.left,
        y: position.y + correctPos.top - branchCoords.top,
      };
      callout.setPosition(position.x, position.y);
      const maxRight = Math.max(
        newBounds.x + newBounds.width,
        position.x + calloutBounds.x + calloutBounds.width,
      );
      const maxBottom = Math.max(
        newBounds.y + newBounds.height,
        position.y + calloutBounds.y + calloutBounds.height,
      );
      newBounds.x = Math.min(newBounds.x, position.x + calloutBounds.x);
      newBounds.width = Math.max(newBounds.width, maxRight - newBounds.x);
      newBounds.y = Math.min(newBounds.y, position.y + calloutBounds.y);
      newBounds.height = Math.max(newBounds.height, maxBottom - newBounds.y);
    });
  },
  calSummaryChildrenPos: function (branch, newBounds) {
    const summaryChildrenBranches =
      branch.getChildrenBranchesByType(TOPIC_SUMMARY);
    if (summaryChildrenBranches.length) {
      index_all.default.each(summaryChildrenBranches, (summaryBranch) => {
        this.renderSummary(branch, summaryBranch, newBounds);
      });
    }
  },
  /**
   * @description set the position of all detached branch
   * @public
   * */
  calDetachedChildrenPos(branchView, newBounds) {
    if (!branchView.isCentralBranch()) {
      return;
    }
    const isTopicOverlapping = branchView.model
      .ownerSheet()
      .isTopicOverlapping();
    const detachedChildren = branchView.getChildrenBranchesByType(
      TOPIC_TYPE.DETACHED,
    );
    const allBranchViewList = [
      branchView,
      ...branchView.getDescendantBranchesByType(
        TOPIC_TYPE.DETACHED,
        TOPIC_TYPE.ATTACHED,
        TOPIC_TYPE.CALLOUT,
        TOPIC_TYPE.SUMMARY,
      ),
    ].filter((v) => {
      return !Object(js_utils.isDescendantOfDetachedBranch)(v);
    });
    detachedChildren.forEach((detachedBranchView) => {
      const modelPosition = detachedBranchView.model.getPosition();
      // if the sheet setting enable topic overlap and the topic model has a position attribute
      // just set the view position as the model position
      if (isTopicOverlapping && modelPosition) {
        detachedBranchView.setPosition(modelPosition);
      } else {
        // in other cases, calculate real position by hit detector
        const realPosition = HitDetectInstance.calcRealPosition(
          detachedBranchView,
          [...allBranchViewList],
        );
        detachedBranchView.setPosition(realPosition);
      }
    });
    index_all.default.extend(
      newBounds,
      structuresUtil.mergeBounds(detachedChildren, newBounds),
    );
  },
  isInBounds: function (parent, index) {
    let i;
    let boundary;
    for (i = 0; i < parent.boundaries.length; i++) {
      boundary = parent.boundaries[i];
      if (
        index >= boundary.model.rangeStart &&
        index <= boundary.model.rangeEnd
      ) {
        return true;
      }
    }
    let summary;
    for (i = 0; i < parent.summaries.length; i++) {
      summary = parent.summaries[i];
      if (
        index >= summary.model.rangeStart &&
        index <= summary.model.rangeEnd
      ) {
        return true;
      }
    }
    return false;
  },
  drawConnectLine: function (parentBranch, childBranch) {
    if (childBranch.isCalloutBranch()) {
      return getTopicLineStyle(BRANCHCONNECTION.CALLOUTLINE)(childBranch);
    } else if (!parentBranch.shouldCollapse()) {
      return this.drawAttachedConnectLine(parentBranch, childBranch);
    }
  },
  drawAttachedConnectLine(parentBranch, childBranch) {
    const connectionView = childBranch.getConnectionView();
    const topicLineStyle =
      connectionView.figure.lineWidth === 0
        ? BRANCHCONNECTION.NONE
        : connectionView.figure.lineShape;
    const structure = this.STRUCTURECLASS;
    const startPt = getTopicShape(
      parentBranch.topicView.topicShapeStyle,
    ).getStartAnchorPosition(parentBranch, childBranch);
    const ctrlPt = getTopicShape(
      parentBranch.topicView.topicShapeStyle,
    ).getControlPosition(parentBranch, childBranch);
    const endPt = getTopicShape(
      childBranch.topicView.topicShapeStyle,
    ).getEndAnchorPosition(this, childBranch);
    const special =
      STRUCTURECLASS.ORGCHARTUP === structure ||
      STRUCTURECLASS.ORGCHARTDOWN === structure;
    getTopicLineStyle(topicLineStyle)(
      childBranch,
      {
        startPt,
        ctrlPt,
        endPt,
      },
      isLineTapered(parentBranch),
      special,
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  specialDeal: function (branch, newBounds) {},
  layoutExtendCollapse(branch, newBounds) {
    if (!branch.getChildrenBranchesByType().length) {
      return;
    }
    if (!branch.collapseExtendView || branch.collapseExtendView.isHide()) {
      return;
    }
    let offset = 0;
    const dir = this.getSourceOrientation(branch);
    const shapeClass = Object(js_utils.getTopicShape)(branch);
    const shapeConnectionOffset =
      shapeClass.getExtConnectionOffset &&
      shapeClass.getExtConnectionOffset(branch);
    offset = shapeConnectionOffset ?? offset;
    const isParallelogram =
      branch.topicView.topicShapeStyle === TOPICSHAPE.PARALLELOGRAM;
    if (isParallelogram && [DIRECTION.RIGHT, DIRECTION.LEFT].includes(dir)) {
      offset = branch.topicView.shapeBounds.height / 4;
    }
    const { EXT_RADIUS, COL_RADIUS, EXT_GAP, COL_GAP } = layoutConstant;
    const isCollapse = branch.model.isCollapse();
    const gap = isCollapse ? EXT_GAP : COL_GAP;
    const r = isCollapse ? EXT_RADIUS : COL_RADIUS;
    const d = r * 2;
    const topicBounds = branch.topicView.shapeBounds;
    const isRotate = branch.isRotate();
    const startPos = getTopicShape(
      branch.topicView.topicShapeStyle,
    ).getExtColPosition(branch);
    switch (dir) {
      case DIRECTION.RIGHT:
        branch.collapseExtendView.move(
          topicBounds.x + topicBounds.width + gap - r,
          -r + startPos.y,
        );
        branch.collapseExtendView.drawConnection({
          x1: 0,
          y1: r,
          x2: -gap + r - offset,
          y2: r,
        });
        if (!isRotate && isCollapse) {
          newBounds.width += gap + r;
        }
        break;
      case DIRECTION.LEFT:
        branch.collapseExtendView.move(
          topicBounds.x - gap - r,
          -r + startPos.y,
        );
        branch.collapseExtendView.drawConnection({
          x1: d,
          y1: r,
          x2: gap + r + offset,
          y2: r,
        });
        if (!isRotate && isCollapse) {
          newBounds.width += gap + r;
          newBounds.x -= gap + r;
        }
        break;
      case DIRECTION.DOWN:
        branch.collapseExtendView.move(
          -r + startPos.x,
          topicBounds.y + topicBounds.height + gap - r,
        );
        branch.collapseExtendView.drawConnection({
          x1: r,
          y1: 0,
          x2: r,
          y2: -gap + r - offset,
        });
        if (!isRotate && isCollapse) {
          newBounds.height += gap + r;
        }
        break;
      case DIRECTION.UP:
        branch.collapseExtendView.move(
          -r + startPos.x,
          topicBounds.y - gap - r,
        );
        branch.collapseExtendView.drawConnection({
          x1: r,
          y1: d,
          x2: r,
          y2: gap + r + offset,
        });
        if (!isRotate && isCollapse) {
          newBounds.height += gap + r;
          newBounds.y -= gap + r;
        }
        break;
      default:
    }
    branch.collapseExtendView.renderHoverArea();
  },
  renderSummary(parentBranch, summaryBranch, newBounds) {
    const attachedChildrenBranches = parentBranch
      .getChildrenBranchesByType(TOPIC_ATTACHED)
      .filter((item) => {
        return item.isPlaceHolderView !== true;
      });
    const summaryPaddingWithTopic =
      PADDING + SUMMARYLINEMARGIN.TOSUMMARY + SUMMARYLINEMARGIN.TORANGE;
    const rangeStart = summaryBranch.summaryModel.rangeStart;
    const rangeEnd = summaryBranch.summaryModel.rangeEnd;
    const length = attachedChildrenBranches.length;
    const summaryDirection = this.getSummaryDirection(parentBranch, rangeStart);
    const childGrowthDirection = summaryBranch.getRangeGrowthDirection();
    let middlePosY;
    let middlePosX;
    let maxBottom;
    let maxRight;
    if (!length) {
      return false;
    }
    let i;
    let j;
    let maxChildrenX;
    let hasSummaryMaxRight;
    let minChildrenX;
    let summaryPosX;
    let minChildrenY;
    let maxChildrenY;
    const { x: startPosX } = attachedChildrenBranches[rangeStart].position;
    const { x: startBoundsX, width: startBoundsWidth } =
      attachedChildrenBranches[rangeStart].boundaryBounds;
    const { x: endPosX } = attachedChildrenBranches[rangeEnd].position;
    const { x: endBoundsX, width: endBoundsWidth } =
      attachedChildrenBranches[rangeEnd].boundaryBounds;
    const _calcDeltaXAndRenderForUpAndDown = (summaryBranch) => {
      const deltaX =
        childGrowthDirection === DIRECTION.LEFT
          ? (startPosX +
              startBoundsX +
              startBoundsWidth -
              (endPosX + endBoundsX)) /
            2
          : (endBoundsX +
              endBoundsWidth +
              endPosX -
              (startBoundsX + startPosX)) /
            2;
      this._drawSummaryLine(summaryBranch, deltaX, summaryDirection, true);
      this._renderSelectBox(summaryBranch, "LR");
    };
    const _calcDeltaYAndRenderForLeftAndRight = (summaryBranch, minY, maxY) => {
      const deltaY = (maxY - minY) / 2;
      this._drawSummaryLine(summaryBranch, deltaY, summaryDirection);
      this._renderSelectBox(summaryBranch, "UD");
    };
    switch (summaryDirection) {
      case DIRECTION.RIGHT:
        hasSummaryMaxRight = 0;
        i = 0;
        maxChildrenX = Number.NEGATIVE_INFINITY;
        minChildrenY = Number.MAX_VALUE;
        maxChildrenY = Number.NEGATIVE_INFINITY;
        for (i = rangeStart; i <= rangeEnd; i++) {
          maxChildrenX = Math.max(
            maxChildrenX,
            attachedChildrenBranches[i].boundaryBounds.x +
              attachedChildrenBranches[i].boundaryBounds.width +
              attachedChildrenBranches[i].position.x,
          );
          minChildrenY = Math.min(
            minChildrenY,
            attachedChildrenBranches[i].bounds.y +
              attachedChildrenBranches[i].position.y,
          );
          maxChildrenY = Math.max(
            maxChildrenY,
            attachedChildrenBranches[i].bounds.y +
              attachedChildrenBranches[i].position.y +
              attachedChildrenBranches[i].bounds.height,
          );
        }
        middlePosY = (maxChildrenY + minChildrenY) / 2;
        if (
          attachedChildrenBranches[rangeEnd] &&
          attachedChildrenBranches[rangeStart]
        ) {
          summaryBranch.setPosition(
            maxChildrenX -
              summaryBranch.boundaryBounds.x +
              summaryPaddingWithTopic,
            middlePosY,
          );
          maxBottom = Math.max(
            newBounds.y + newBounds.height,
            middlePosY +
              summaryBranch.boundaryBounds.y +
              summaryBranch.boundaryBounds.height,
          );
          hasSummaryMaxRight =
            maxChildrenX +
            summaryBranch.boundaryBounds.width +
            summaryPaddingWithTopic;
          newBounds.y = Math.min(
            newBounds.y,
            middlePosY + summaryBranch.boundaryBounds.y,
          );
          newBounds.height = maxBottom - newBounds.y;
          newBounds.width = Math.max(
            hasSummaryMaxRight - newBounds.x,
            newBounds.width,
          );
          _calcDeltaYAndRenderForLeftAndRight(
            summaryBranch,
            minChildrenY,
            maxChildrenY,
          );
        }
        break;
      case DIRECTION.LEFT:
        minChildrenX = Number.MAX_VALUE;
        minChildrenY = Number.MAX_VALUE;
        maxChildrenY = Number.NEGATIVE_INFINITY;
        for (j = rangeStart; j <= rangeEnd; j++) {
          minChildrenX = Math.min(
            minChildrenX,
            attachedChildrenBranches[j].boundaryBounds.x +
              attachedChildrenBranches[j].position.x,
          );
          minChildrenY = Math.min(
            minChildrenY,
            attachedChildrenBranches[j].bounds.y +
              attachedChildrenBranches[j].position.y,
          );
          maxChildrenY = Math.max(
            maxChildrenY,
            attachedChildrenBranches[j].bounds.y +
              attachedChildrenBranches[j].position.y +
              attachedChildrenBranches[j].bounds.height,
          );
        }
        if (
          attachedChildrenBranches[rangeEnd] &&
          attachedChildrenBranches[rangeStart]
        ) {
          middlePosY = (minChildrenY + maxChildrenY) / 2;
          summaryPosX =
            minChildrenX -
            summaryBranch.boundaryBounds.width -
            summaryBranch.boundaryBounds.x -
            summaryPaddingWithTopic;
          summaryBranch.setPosition(summaryPosX, middlePosY);
          maxBottom = Math.max(
            newBounds.y + newBounds.height,
            middlePosY +
              summaryBranch.boundaryBounds.y +
              summaryBranch.boundaryBounds.height,
          );
          newBounds.y = Math.min(
            newBounds.y,
            middlePosY + summaryBranch.boundaryBounds.y,
          );
          newBounds.height = maxBottom - newBounds.y;
          maxRight = newBounds.x + newBounds.width;
          newBounds.x = Math.min(
            newBounds.x,
            summaryPosX + summaryBranch.boundaryBounds.x,
          );
          newBounds.width = Math.max(maxRight - newBounds.x, newBounds.width);
          _calcDeltaYAndRenderForLeftAndRight(
            summaryBranch,
            minChildrenY,
            maxChildrenY,
          );
        }
        break;
      case DIRECTION.DOWN:
        maxChildrenY = Number.NEGATIVE_INFINITY;
        for (j = rangeStart; j <= rangeEnd; j++) {
          maxChildrenY = Math.max(
            maxChildrenY,
            attachedChildrenBranches[j].boundaryBounds.y +
              attachedChildrenBranches[j].boundaryBounds.height +
              attachedChildrenBranches[j].position.y,
          );
        }
        if (
          attachedChildrenBranches[rangeEnd] &&
          attachedChildrenBranches[rangeStart]
        ) {
          middlePosX =
            (attachedChildrenBranches[rangeEnd].boundaryBounds.x +
              attachedChildrenBranches[rangeEnd].boundaryBounds.width +
              attachedChildrenBranches[rangeEnd].position.x +
              (attachedChildrenBranches[rangeStart].boundaryBounds.x +
                attachedChildrenBranches[rangeStart].position.x)) /
            2; //+ attachedChildrenBranches[rangeStart].position.y + attachedChildrenBranches[rangeStart].boundaryBounds.y
          summaryBranch.setPosition(
            middlePosX,
            maxChildrenY -
              summaryBranch.boundaryBounds.y +
              summaryPaddingWithTopic,
          );
          maxRight = Math.max(
            newBounds.x + newBounds.width,
            middlePosX +
              summaryBranch.boundaryBounds.x +
              summaryBranch.boundaryBounds.width,
          );
          newBounds.x = Math.min(
            newBounds.x,
            middlePosX + summaryBranch.boundaryBounds.x,
          );
          newBounds.width = maxRight - newBounds.x;
          newBounds.height = Math.max(
            newBounds.height,
            maxChildrenY +
              summaryPaddingWithTopic +
              summaryBranch.boundaryBounds.height -
              newBounds.y,
          );
          _calcDeltaXAndRenderForUpAndDown(summaryBranch);
        }
        break;
      case DIRECTION.UP:
        minChildrenY = Number.MAX_VALUE;
        for (j = rangeStart; j <= rangeEnd; j++) {
          minChildrenY = Math.min(
            minChildrenY,
            attachedChildrenBranches[j].boundaryBounds.y +
              attachedChildrenBranches[j].position.y,
          );
        }
        if (
          attachedChildrenBranches[rangeEnd] &&
          attachedChildrenBranches[rangeStart]
        ) {
          middlePosX =
            (attachedChildrenBranches[rangeEnd].boundaryBounds.x +
              attachedChildrenBranches[rangeEnd].boundaryBounds.width +
              attachedChildrenBranches[rangeEnd].position.x +
              (attachedChildrenBranches[rangeStart].boundaryBounds.x +
                attachedChildrenBranches[rangeStart].position.x)) /
            2; //+ attachedChildrenBranches[rangeStart].position.y + attachedChildrenBranches[rangeStart].boundaryBounds.y
          summaryBranch.setPosition(
            middlePosX,
            minChildrenY -
              summaryPaddingWithTopic -
              summaryBranch.boundaryBounds.height -
              summaryBranch.boundaryBounds.y,
          );
          maxRight = Math.max(
            newBounds.x + newBounds.width,
            middlePosX +
              summaryBranch.boundaryBounds.x +
              summaryBranch.boundaryBounds.width,
          );
          newBounds.x = Math.min(
            newBounds.x,
            middlePosX + summaryBranch.boundaryBounds.x,
          );
          newBounds.width = maxRight - newBounds.x;
          maxBottom = newBounds.y + newBounds.height;
          newBounds.y = Math.min(
            newBounds.y,
            minChildrenY -
              summaryPaddingWithTopic -
              summaryBranch.boundaryBounds.height,
          );
          newBounds.height = Math.max(
            newBounds.height,
            maxBottom - newBounds.y,
          );
          _calcDeltaXAndRenderForUpAndDown(summaryBranch);
        }
        break;
    }
  },
  _drawSummaryLine(
    summaryBranch,
    posDelta,
    summaryDirection,
    isHorizontal = false,
  ) {
    let middleX;
    let middleY;
    let posArray;
    let posX;
    let posY;
    if (
      summaryDirection === DIRECTION.RIGHT ||
      summaryDirection === DIRECTION.LEFT
    ) {
      const isRight = summaryDirection === DIRECTION.RIGHT;
      middleX =
        summaryBranch.position.x +
        summaryBranch.boundaryBounds.x +
        (isRight ? 0 : 1) * summaryBranch.boundaryBounds.width -
        (isRight ? 1 : -1) * SUMMARYLINEMARGIN.TOSUMMARY;
      middleY = summaryBranch.position.y;
      posX = middleX - (isRight ? 1 : -1) * PADDING;
      posArray = {
        startPos: {
          x: posX,
          y: middleY - posDelta,
        },
        middlePos: {
          x: middleX,
          y: middleY,
        },
        endPos: {
          x: posX,
          y: middleY + posDelta,
        },
      };
    } else if (
      summaryDirection === DIRECTION.UP ||
      summaryDirection === DIRECTION.DOWN
    ) {
      const isUp = summaryDirection === DIRECTION.UP;
      middleX = summaryBranch.position.x;
      middleY =
        summaryBranch.position.y +
        summaryBranch.boundaryBounds.y +
        (isUp ? 1 : 0) * summaryBranch.boundaryBounds.height -
        (isUp ? -1 : 1) * SUMMARYLINEMARGIN.TOSUMMARY;
      posY = middleY + (isUp ? 1 : -1) * PADDING;
      posArray = {
        startPos: {
          x: middleX - posDelta,
          y: posY,
        },
        middlePos: {
          x: middleX,
          y: middleY,
        },
        endPos: {
          x: middleX + posDelta,
          y: posY,
        },
      };
    }
    const summaryLineStyle = styleManager.getStyleValue(
      summaryBranch.summaryView,
      STYLE_KEYS.SHAPE_CLASS,
    );
    //for (var attr in posArray) {
    //  posArray[attr].x += parentRealPos.x;
    //  posArray[attr].y += parentRealPos.y;
    //}
    getSummaryLineStyle(summaryLineStyle)(
      summaryBranch,
      posArray,
      isHorizontal,
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _renderSelectBox(summaryBranch, direction) {
    if (!summaryBranch.selectBox) {
      summaryBranch.selectBox = new SelectBoxView({
        refView: summaryBranch,
      });
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChildStructure: function (parentStructure, index, ...args) {
    return parentStructure;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return ATTACHED_EXPOSED_STRUCTURE;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCalloutStructure: function (parent, callout) {
    return this.getChildStructure(this.STRUCTURECLASS, 0, parent);
  },
  /**
   * check callout position is in available district, if not, return available position offset related to previous position
   * @param callout
   * @param position related to central point of parentBranch, not realPosition
   * @returns {{isAvailable: boolean, top: number, bottom: number, left: number, right: number}}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.CALLOUTPOSAVAILABLE;
  },
  calcSpacingMajor(branchView) {
    const majorSpacing = parseInt(`${branchView.figure.majorSpacing || 0}`);
    const patch = Object(js_utils.getLineEndSpacingPatchGap)(branchView);
    return majorSpacing + patch;
  },
  /**
   * @description drag area related function
   * @public
   * */
  calcPolygons(branchView) {
    const childrenList = branchView.getChildrenBranchesByType();
    if (childrenList.length === 0 || branchView.model.isCollapse()) {
      return this._calcNoChildrenPolygons(branchView);
    } else {
      return this._calcChildrenPolygons(branchView);
    }
  },
  /** @private */
  _calcNoChildrenPolygons(branchView) {
    const pointList = [
      ...this.getPointsOfBase(branchView),
      ...this.getPointsOfNoChildren(branchView),
    ];
    const hullPointList = pointutils.convexHull(pointList);
    return [
      {
        /** @deprecated */
        points: hullPointList,
        pointList: hullPointList,
        relatedBranchViewList: [],
        side: null,
      },
    ];
  },
  /** @private */
  _calcChildrenPolygons(branchView) {
    const basePointList = this.getPointsOfBase(branchView);
    // 这个是子branch叠加的方向
    const direction = this.getRangeGrowthDirection();
    const childrenList = branchView.getChildrenBranchesByType();
    const firstChildSidePointList = dragAreaUtil.getSidePointsWithGap(
      childrenList[0],
      dragAreaUtil.getOppositeDirection(direction),
    );
    const lastChildSidePointList = dragAreaUtil.getSidePointsWithGap(
      childrenList[childrenList.length - 1],
      direction,
    );
    const pointList = [
      ...basePointList,
      ...firstChildSidePointList,
      ...lastChildSidePointList,
    ];
    // get four corner points
    childrenList.forEach((branchView) => {
      pointList.push(
        ...dragAreaUtil.getCornerPoints(branchView, branchView.position),
      );
    });
    const hullPointList = pointutils.convexHull(pointList);
    return [
      {
        points: hullPointList,
        pointList: hullPointList,
        relatedBranchViewList: childrenList,
        side: null,
      },
    ];
  },
  /**
   * @description 获取polygon基础两点
   * @protected
   * */
  getPointsOfBase(branchView) {
    let direction = this.getSourceOrientation();
    if (branchView.isCentralBranch() || branchView.isDetachedBranch()) {
      direction = dragAreaUtil.getOppositeDirection(direction);
    }
    // todo 这里删除了reverse方法，看不出有存在的必要性
    return dragAreaUtil.getSidePoints(branchView, direction);
  },
  getPointsOfNoChildren(branch) {
    return dragAreaUtil.getPointsOfNoChildren(
      branch,
      this.getSourceOrientation(),
    );
  },
  //drag end
  /**
   * A util for every structure.
   * @param {BranchView} branch the parent branch.
   * @return {Bound}
   */
  getChildrenSize(branch) {
    const attachedChildrenBranches = branch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    return boundutils.getUnionBoundingBoxFromAllBounds(
      attachedChildrenBranches.map((child) =>
        boundutils.vector(child.boundaryBounds, child.position),
      ),
    );
  },
  // layout refactor part start
  branchLayoutTreeInfo: {},
  startLayout(branchLayoutTreeInfo) {
    this.branchLayoutTreeInfo = branchLayoutTreeInfo;
  },
  _calcChildrenBoundaryBounds() {},
  isSpecialOffSetBranchView(branchView) {
    return (
      Object(js_utils.isMatrixMainBranch)(branchView) ||
      Object(js_utils.isTreeTableHeadBranch)(branchView)
    );
  },
  /**
   * |------------------------|
   * | (boundary bounds)      |
   * |           |--------|   |
   * |- xOffset -| topic  |   |
   * |           | bounds |   |
   * |           |--------|   |
   * |------------------------|
   */
  getMapOfXOffSetByBranchIndexFromBranchList(branchViewList, isRight) {
    return branchViewList.reduce((map, branchView) => {
      const xOffset = isRight
        ? Math.max(
            Number.MIN_VALUE,
            branchView.topicView.bounds.x - branchView.boundaryBounds.x,
          )
        : Math.max(
            Number.MIN_VALUE,
            branchView.boundaryBounds.x +
              branchView.boundaryBounds.width -
              branchView.topicView.bounds.x -
              branchView.topicView.bounds.width,
          );
      return Object.assign(Object.assign({}, map), {
        [branchView.branchIndex()]: xOffset,
      });
    }, {});
  },
  getMaxOffsetForNormalChildren(branchViewList, xOffsetByBranchIndex) {
    return branchViewList
      .filter(
        (childBranchView) => !this.isSpecialOffSetBranchView(childBranchView),
      )
      .map((childBranchView) => {
        return (
          xOffsetByBranchIndex[childBranchView.branchIndex()] ??
          Number.MIN_VALUE
        );
      })
      .reduce((max, offset) => Math.max(max, offset), Number.MIN_VALUE);
  },
  getOffsetForChildBranchView(
    targetBranch,
    relativeBranchs,
    xOffsetByBranchIndex,
  ) {
    if (this.isSpecialOffSetBranchView(targetBranch)) {
      return xOffsetByBranchIndex[targetBranch.branchIndex()];
    } else {
      return this.getMaxOffsetForNormalChildren(
        relativeBranchs,
        xOffsetByBranchIndex,
      );
    }
  },
};
