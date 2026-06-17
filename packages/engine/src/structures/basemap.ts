import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_ATTACHED,
  RIGHT_EXPOSED_STRUCTURE,
  LEFT_EXPOSED_STRUCTURE,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as utils from "../figures/renderengine/svg/topicshapes/utils";
import * as js_utils from "../utils/index";
import Util from "../util";

import structuresUtil from "./helper/structuresutil";
import { dragAreaUtil } from "./helper/dragareautil";

import underscore from "underscore";
import { AbstractStructure } from "./abstractstructure";

import * as layoututil from "../utils/layoututil";
const minTopBottomSpacing = 80;
const maxTopBottomSpacing = 180;
const parentTopicThreshold = 230;
export const baseMap = underscore.extend({}, AbstractStructure, {
  /**
   * @deprecated
   * */
  getBalanceTreeHeight(rootBranch) {
    if (!rootBranch.isCentralBranch() && !rootBranch.isDetachedBranch()) {
      return;
    }
    const spacingMinor = rootBranch.figure.minorSpacing ?? 0;
    const pos = this.calcNumRight(rootBranch);
    const attaches = rootBranch.getChildrenBranchesByType();
    const length = attaches.length;
    let rightHeightTotal = 0;
    let leftHeightTotal = 0;
    let rightWidthTotal = 0;
    let leftWidthTotal = 0;
    let widthTotal = 0;
    let heightTotal = 0;
    let index;
    const minPos = Math.min(pos, attaches.length);
    for (index = 0; index < minPos; index++) {
      //attaches[index].changeTag('right');
      if (index < pos - 1) {
        rightHeightTotal += spacingMinor;
      }
      rightHeightTotal += attaches[index].boundaryBounds.height;
      rightWidthTotal =
        rightWidthTotal < attaches[index].boundaryBounds.width
          ? attaches[index].boundaryBounds.width
          : rightWidthTotal;
    }
    for (index = pos; index < length; index++) {
      //attaches[index].changeTag('left');
      if (index < length - 1) {
        leftHeightTotal += spacingMinor;
      }
      leftHeightTotal += attaches[index].boundaryBounds.height;
      leftWidthTotal =
        leftWidthTotal < attaches[index].boundaryBounds.width
          ? attaches[index].boundaryBounds.width
          : leftWidthTotal;
    }
    widthTotal =
      leftWidthTotal +
      rootBranch.boundaryBounds.width +
      rightWidthTotal +
      spacingMinor * 2;
    heightTotal =
      rightHeightTotal > leftHeightTotal ? rightHeightTotal : leftHeightTotal;
    return {
      pos: minPos,
      rightHeightTotal: rightHeightTotal,
      leftHeightTotal: leftHeightTotal,
      rightWidthTotal: rightWidthTotal,
      leftWidthTotal: leftWidthTotal,
      widthTotal: widthTotal,
      heightTotal: heightTotal,
    };
  },
  calcNumRight(rootBranch) {
    if (rootBranch.numRightInDraging !== undefined) {
      return rootBranch.numRightInDraging;
    }
    const totalWeight = this.getTotalWeight(rootBranch);
    const halfWeight = totalWeight / 2;
    let lastIndex = -1;
    let rightWeight = 0;
    let blockWeight = 0;
    let index;
    let newRightWeight;
    let lastNum;
    let num;
    const attaches = rootBranch.getChildrenBranchesByType();
    const length = attaches.length;
    for (index = 0; index < length; index++) {
      blockWeight += this.getWeight(attaches[index]);
      num = index + 1;
      if (!this.isInSameRangeWithLast(rootBranch, index + 1)) {
        newRightWeight = rightWeight + blockWeight;
        if (newRightWeight >= halfWeight) {
          if (
            lastIndex >= 0 &&
            newRightWeight - halfWeight > halfWeight - rightWeight
          ) {
            lastNum = lastIndex + 1;
            if (
              index === 1 &&
              lastIndex === 0 &&
              (this.isInSameRangeWithLast(rootBranch, index) ||
                (this.isWithinThreshold(attaches[0], length) &&
                  this.isWithinThreshold(attaches[index], length)))
            ) {
              return 2;
            }
            return lastNum;
          }
          if (
            index === 0 &&
            this.isWithinThreshold(attaches[index], length) &&
            (length === 2 ||
              (length > 2 && !this.isInSameRangeWithLast(rootBranch, 2))) &&
            this.isWithinThreshold(attaches[1], length)
          ) {
            return 2;
          }
          return num;
        }
        rightWeight = newRightWeight;
        blockWeight = 0;
        lastIndex = index;
      }
    }
    return index;
  },
  getTotalWeight(branch) {
    let weight = 0;
    underscore.each(branch.getChildrenBranchesByType(), (child) => {
      weight += this.getWeight(child);
    });
    return weight;
  },
  getWeight(branch) {
    return branch.boundaryBounds.height + (layoutConstant.PADDING / 2) * 3;
  },
  isWithinThreshold(child, length) {
    return this.getWeight(child) < (Math.log(length) + 1) * 200;
  },
  getChildTargetOrientation(branch, index) {
    const num = this.calcNumRight(branch);
    if (index < num) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.RIGHT;
    }
  },
  /**
   * 计算某侧children topic的位置，随着index增加，children从高到低摆位置
   * 需求1：让最高最低branch的出线口相对水平中轴线位置对称
   * 需求2：能设置最小topic的总间距和(getMinSumTopicSpacing)
   * @param {Object} argObj
   * @param {BranchView[]} argObj.children - children will be placed from up to down by index increase
   * @param {string} argObj.side - "left" or "right"
   * @param {Number} argObj.offsetY - children's position will add the offsetY
   */
  calSidePos(argObj) {
    const {
      side,
      spacingMajor,
      spacingMinor,
      children,
      newBounds,
      isUpToDown,
      offsetX = 0,
      offsetY = 0,
    } = argObj;
    if (!children || children.length === 0) {
      return;
    }
    //Calculate the Y-pos relative to first child
    const minSumTopicSpacing = this.getMinSumTopicSpacing(children, newBounds);
    let sumTopicSpacing = minSumTopicSpacing;
    const yPosRelativeToFirstChild = [0];
    children.forEach((now, index) => {
      if (index === 0) {
        return;
      }
      const pre = children[index - 1];
      yPosRelativeToFirstChild[index] = Math.max(
        yPosRelativeToFirstChild[index - 1] +
          pre.boundaryBounds.y +
          pre.boundaryBounds.height +
          spacingMinor -
          now.boundaryBounds.y,
        yPosRelativeToFirstChild[index - 1] +
          pre.topicView.bounds.y +
          pre.topicView.bounds.height +
          sumTopicSpacing / (children.length - index) -
          now.topicView.bounds.y,
      );
      sumTopicSpacing =
        sumTopicSpacing -
        (yPosRelativeToFirstChild[index] +
          now.topicView.bounds.y -
          (yPosRelativeToFirstChild[index - 1] +
            pre.topicView.bounds.y +
            pre.topicView.bounds.height));
    });
    const firstChild = children[0];
    const lastChild = children[children.length - 1];
    const firstChildEndPosY =
      Object(js_utils.getTopicShape)(firstChild).getEndAnchorPosition(
        this,
        firstChild,
      ).y - firstChild.linePosition.y;
    const lastChildEndPosY =
      Object(js_utils.getTopicShape)(lastChild).getEndAnchorPosition(
        this,
        lastChild,
      ).y - lastChild.linePosition.y;
    //Calculate the Y-pos of parent branch relative to first child, and translate the axes from first child to parent topic
    const parentPosRelativeToFirstChild =
      (firstChildEndPosY +
        yPosRelativeToFirstChild[0] +
        lastChildEndPosY +
        yPosRelativeToFirstChild[children.length - 1]) /
      2;
    let firstChildY = -parentPosRelativeToFirstChild;
    //only one child, treat special
    if (firstChild === lastChild) {
      firstChildY =
        ((isUpToDown ? -1 : 1) * minSumTopicSpacing) / 2 -
        firstChild.topicView.bounds.y -
        (isUpToDown ? 1 : 0) * firstChild.topicView.bounds.height;
    }
    let x; //alignment x
    if (side === "left") {
      x = newBounds.x - spacingMajor;
    } else {
      x = newBounds.x + newBounds.width + spacingMajor;
    }
    let posYoffsetToClosestChild =
      layoutConstant.MAX_BRANCH_POSITION_REALIGN_OFFSET + 1;
    // store computed positions
    const positionMap = new WeakMap();
    const xOffSetByBranchIndex =
      this.getMapOfXOffSetByBranchIndexFromBranchList(
        children,
        side === "right",
      );
    children.forEach((branch, index) => {
      branch.changeTag(side);
      const y = firstChildY + yPosRelativeToFirstChild[index];
      const maxOffset = this.getOffsetForChildBranchView(
        branch,
        children,
        xOffSetByBranchIndex,
      );
      const position = branch.model.get("position");
      if (Object(js_utils.isFreePositionBranch)(branch) && position) {
        positionMap.set(branch, position);
      } else {
        let posX;
        let posY;
        if (side === "left") {
          posX = x + branch.topicView.bounds.x - maxOffset - offsetX;
          posY = y + offsetY;
          // branch.setPosition(x + branch.topicView.bounds.x - maxOffset - offsetX, y + offsetY)
        } else {
          posX = x - branch.topicView.bounds.x + maxOffset + offsetX;
          posY = y + offsetY;
        }
        positionMap.set(branch, {
          x: posX,
          y: posY,
        });
        const endAnchorPosition = Object(js_utils.getTopicShape)(
          branch,
        ).getEndAnchorPosition(this, branch);
        const endAnchorRelativePosition =
          endAnchorPosition &&
          Object(utils.realPositionToRelativePosition)(
            endAnchorPosition,
            branch,
          );
        const posYoffset = posY + endAnchorRelativePosition?.y || 0;
        // find smallest position offset between Parent branch and child Branch
        if (Math.abs(posYoffset) < Math.abs(posYoffsetToClosestChild)) {
          posYoffsetToClosestChild = posYoffset;
        }
      }
    });
    const childrenHeight = children
      .map((child) => child.boundaryBounds.height + spacingMinor)
      .reduce((pre, cur) => pre + cur, -spacingMinor);
    if (
      !Object(layoututil.isNeedRedolayout)(
        children,
        posYoffsetToClosestChild,
        childrenHeight,
      )
    ) {
      // clear if not valid
      posYoffsetToClosestChild = 0;
    }
    children.forEach((branchView) => {
      const position = positionMap.get(branchView);
      if (position) {
        const { x, y } = position;
        branchView.setPosition(x, y - posYoffsetToClosestChild);
      }
    });
  },
  calBounds(branch, newBounds) {
    const children = branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    return underscore.extend(
      newBounds,
      structuresUtil.mergeBounds(children, newBounds),
    );
  },
  getCalloutStructure(parent, callout) {
    const position = callout.model.get("position") || {
      x: 0,
      y: 0,
    };
    if (position.x <= 0) {
      return STRUCTURECLASS.LOGICLEFT; //todo
    } else {
      return STRUCTURECLASS.LOGICRIGHT;
    }
  },
  getMinSumTopicSpacing(children, parentTopicBounds) {
    let sumSpacing;
    let topBottomSpacing = minTopBottomSpacing;
    if (parentTopicBounds.height > parentTopicThreshold) {
      topBottomSpacing = Math.min(
        maxTopBottomSpacing,
        parentTopicBounds.height - parentTopicThreshold + topBottomSpacing,
      );
    }
    const n = children.length;
    if (n <= 2) {
      sumSpacing = topBottomSpacing;
    } else {
      sumSpacing = children.reduce((pre, cur, index) => {
        if (index !== 0 && index !== children.length - 1) {
          return pre - cur.boundaryBounds.height;
        } else {
          return pre;
        }
      }, topBottomSpacing);
    }
    return sumSpacing;
  },
  /**
   * @description 计算拖拽多边形区域
   * @public
   * */
  calcPolygons(branchView) {
    const result = [];
    const leftChildrenList = [];
    const rightChildrenList = [];
    const children = branchView.getChildrenBranchesByType();
    const currentBranchPos = branchView.getRealPosition();
    children.forEach((childBranchView) => {
      if (childBranchView.getRealPosition().x - currentBranchPos.x < 0) {
        leftChildrenList.push(childBranchView);
      } else {
        rightChildrenList.push(childBranchView);
      }
    });
    // 计算左侧的多边形
    const leftPointList = [...this.getPointsOfBase(branchView)];
    if (leftChildrenList.length === 0) {
      leftPointList.push(
        ...this.getPointsOfNoChildren(branchView, DIRECTION.LEFT),
      );
    } else {
      // use no child point list as mini point list
      const miniPointList = this.getPointsOfNoChildren(
        branchView,
        DIRECTION.LEFT,
      );
      const upToDownChildrenPointList = dragAreaUtil.getPointsOfUDChildren(
        leftChildrenList,
        true,
      );
      // for map structure's left wing, the first child was layout to the bottom place,
      const firstChildDownSidePointList = dragAreaUtil.getSidePointsWithGap(
        leftChildrenList[0],
        DIRECTION.DOWN,
      );
      // and the last child was layout on the top as well
      const lastChildUpSidePointList = dragAreaUtil.getSidePointsWithGap(
        leftChildrenList[leftChildrenList.length - 1],
        DIRECTION.UP,
      );
      leftPointList.push(
        ...[
          ...upToDownChildrenPointList,
          ...firstChildDownSidePointList,
          ...lastChildUpSidePointList,
          ...miniPointList,
        ],
      );
    }
    const leftSideHullPointList = Util.convexHull(leftPointList);
    result.push({
      points: leftSideHullPointList,
      pointList: leftSideHullPointList,
      relatedBranchViewList: leftChildrenList,
      side: "left",
    });
    //right side
    const rightPointList = [...this.getPointsOfBase(branchView)];
    if (rightChildrenList.length === 0) {
      rightPointList.push(
        ...this.getPointsOfNoChildren(branchView, DIRECTION.RIGHT),
      );
    } else {
      const miniPointList = this.getPointsOfNoChildren(
        branchView,
        DIRECTION.RIGHT,
      );
      const upToDownChildrenPointList = dragAreaUtil.getPointsOfUDChildren(
        rightChildrenList,
        false,
      );
      const firstChildUpSidePointList = dragAreaUtil.getSidePointsWithGap(
        rightChildrenList[0],
        DIRECTION.UP,
      );
      const lastChildDownSidePointList = dragAreaUtil.getSidePointsWithGap(
        rightChildrenList[rightChildrenList.length - 1],
        DIRECTION.DOWN,
      );
      rightPointList.push(
        ...[
          ...miniPointList,
          ...upToDownChildrenPointList,
          ...firstChildUpSidePointList,
          ...lastChildDownSidePointList,
        ],
      );
    }
    const rightSideHullPointList = Util.convexHull(rightPointList);
    result.push({
      points: Util.convexHull(rightSideHullPointList),
      pointList: rightSideHullPointList,
      relatedBranchViewList: rightChildrenList,
      side: "right",
    });
    return result;
  },
  /**
   * @description 获取多边形基本点
   * @param {BranchView} branch
   * @return {Array.<Point>}
   * */
  getPointsOfBase(branch) {
    return [
      {
        x: 0,
        y: branch.topicView.bounds.y - 60,
      },
      {
        x: 0,
        y: branch.topicView.bounds.y + branch.topicView.bounds.height + 60,
      },
    ];
  },
  getPointsOfNoChildren(branch, direction) {
    return dragAreaUtil.getPointsOfNoChildren(branch, direction);
  },
  calcSpacingMajor(branchView) {
    const lineShape = branchView.getConnectionView().getLineShape();
    const foldLineShapeList = [
      BRANCHCONNECTION.FOLD,
      BRANCHCONNECTION.ROUNDEDFOLD,
      BRANCHCONNECTION.BIGHT,
    ];
    if (foldLineShapeList.includes(lineShape)) {
      return (
        layoutConstant.LINECOLPOS * 3 +
        Object(js_utils.getLineEndSpacingPatchGap)(branchView)
      );
    } else {
      return AbstractStructure.calcSpacingMajor.call(this, branchView);
    }
  },
  _isRight(index, branch) {
    const num = this.calcNumRight(branch);
    return index < num;
  },
  getAvailableChildStructure(branch, child) {
    const index = child.branchIndex();
    const isRight = this._isRight(index, branch);
    if (isRight) {
      return RIGHT_EXPOSED_STRUCTURE;
    } else {
      return LEFT_EXPOSED_STRUCTURE;
    }
  },
});
