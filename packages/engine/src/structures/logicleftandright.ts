import {
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_ATTACHED,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as utils from "../figures/renderengine/svg/topicshapes/utils";
import * as js_utils from "../utils/index";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { AbstractStructure } from "./abstractstructure";

// EXTERNAL MODULE: ./js/utils/layoututil.ts
import * as layoututil from "../utils/layoututil";
import { calcOutwardDistanceByAttachedChildren } from "./helper/layoutstyleoptimization";

export const leftAndRight = Object.assign({}, AbstractStructure, {
  calAttachedChildrenPos: function (branch, newBounds, isRight) {
    const attachedChildrenBranches =
      branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    const spacingMinor = parseInt(branch.figure.minorSpacing || 0);
    // if(TOPICSHAPE.UNDERLINE === branch.topicView.topicShapeStyle)
    //   spacingMinor = 8;
    const lineWidth = parseInt(branch.topicView.figure.borderWidth || 0);
    const childrenSize = this.getChildrenSize(branch, isRight);
    let childrenX;
    let childrenY;
    let maxBottom;
    const arrowWidth = 0;
    let currentChildY;
    if (attachedChildrenBranches.length) {
      const topChild = attachedChildrenBranches[0];
      const bottomChild =
        attachedChildrenBranches[attachedChildrenBranches.length - 1];
      const controlPosY =
        getTopicShape(branch.topicView.topicShapeStyle).getControlPosition(
          branch,
          topChild,
        ).y - branch.linePosition.y;
      const topEndPosY =
        getTopicShape(topChild.topicView.topicShapeStyle).getEndAnchorPosition(
          this,
          topChild,
        ).y - topChild.linePosition.y;
      const bottomEndPosY =
        getTopicShape(
          bottomChild.topicView.topicShapeStyle,
        ).getEndAnchorPosition(this, bottomChild).y -
        bottomChild.linePosition.y;
      const outwardOffset = calcOutwardDistanceByAttachedChildren(branch);
      //计算子节点位置变为,主要修改spaceingMajor,根据children的个数
      const spacingMajor = this.calcSpacingMajor(branch);
      if (isRight) {
        childrenX = newBounds.x + newBounds.width + spacingMajor;
      } else {
        childrenX = newBounds.x - spacingMajor;
        newBounds.x = childrenX - childrenSize.width;
      }
      /*
                                +--------+
                          +-----+  rect  |
                          |     +--------+
          +---------+     |
          | parent  +-----+
          +---------+     |
                          |      underline
                          +---------------+
          make parent controlPoint's Y-distance to top topic's startPoint equalize Y-distance to bottom topic's startPoint
          that is the reason of below equation
        */
      childrenY =
        (bottomChild.boundaryBounds.y +
          bottomChild.boundaryBounds.height -
          topEndPosY -
          bottomEndPosY -
          topChild.boundaryBounds.y -
          childrenSize.height) /
          2 +
        topChild.boundaryBounds.y +
        controlPosY;
      const xOffSetByBranchIndex =
        this.getMapOfXOffSetByBranchIndexFromBranchList(
          branch.getChildrenBranchesByType(),
          isRight,
        );
      currentChildY = childrenY;
      let posYoffsetToClosestChild =
        layoutConstant.MAX_BRANCH_POSITION_REALIGN_OFFSET + 1;
      // store computed positions
      const positionMap = new WeakMap();
      attachedChildrenBranches.forEach((childBranchView) => {
        const maxOffset = this.getOffsetForChildBranchView(
          childBranchView,
          attachedChildrenBranches,
          xOffSetByBranchIndex,
        );
        let posX;
        let posY;
        if (isRight) {
          posX =
            childrenX -
            childBranchView.topicView.bounds.x +
            maxOffset +
            outwardOffset;
          posY = currentChildY - childBranchView.boundaryBounds.y;
        } else {
          posX =
            childrenX +
            childBranchView.topicView.bounds.x -
            maxOffset -
            outwardOffset;
          posY = currentChildY - childBranchView.boundaryBounds.y;
        }
        positionMap.set(childBranchView, {
          x: posX,
          y: posY,
        });
        const endAnchorPosition = Object(js_utils.getTopicShape)(
          childBranchView,
        ).getEndAnchorPosition(this, childBranchView);
        const endAnchorRelativePosition =
          endAnchorPosition &&
          Object(utils.realPositionToRelativePosition)(
            endAnchorPosition,
            childBranchView,
          );
        const posYoffset = posY + endAnchorRelativePosition?.y || 0;
        // find smallest position offset between Parent branch and child Branch
        if (Math.abs(posYoffset) < Math.abs(posYoffsetToClosestChild)) {
          posYoffsetToClosestChild = posYoffset;
        }
        currentChildY +=
          childBranchView.boundaryBounds.height + spacingMinor + lineWidth;
      });
      /*
          realign the attached branches in order to align parentBranch yPos to closest child's yPos
                  |-----*
                  |                              |------*
                  |-----*     =======>           |
            P-----|                       p------|------*
                  |                              |
                  |-----*                        |
                                                 |------*
         */
      const childrenHeight = currentChildY - spacingMinor - lineWidth;
      if (
        !layoututil.isNeedRedolayout(
          attachedChildrenBranches,
          posYoffsetToClosestChild,
          childrenHeight,
        )
      ) {
        // clear if not valid
        posYoffsetToClosestChild = 0;
      }
      // Apply new positions with `posYoffsetToClosestChild` calculated
      attachedChildrenBranches.forEach((branchView) => {
        const position = positionMap.get(branchView);
        if (position) {
          const { x, y } = position;
          branchView.setPosition(x, y - posYoffsetToClosestChild);
        }
      });
      maxBottom = Math.max(
        newBounds.y + newBounds.height,
        childrenY + childrenSize.height - posYoffsetToClosestChild,
      );
      newBounds.y = Math.min(newBounds.y, childrenY - posYoffsetToClosestChild);
      newBounds.height = maxBottom - newBounds.y;
      const maxOffsetForNormalChildren = this.getMaxOffsetForNormalChildren(
        attachedChildrenBranches,
        xOffSetByBranchIndex,
      );
      const currentAllWidth = attachedChildrenBranches.map((childBranch) => {
        const startDirection = Object(utils.getStartDirection)(
          childBranch,
          undefined,
        );
        const { boundaryBounds } = childBranch;
        const { bounds: topicBounds } = childBranch.topicView;
        if (
          startDirection === DIRECTION.UP ||
          startDirection === DIRECTION.DOWN
        ) {
          const halfOfTopicWidth = topicBounds.width / 2;
          // boundary 从 topic 原点起, 左右各切一半
          const boundaryBoundsSize = {
            l: Math.abs(boundaryBounds.x),
            r: boundaryBounds.width + boundaryBounds.x, // 右边那一半
          };
          return (
            maxOffsetForNormalChildren +
            halfOfTopicWidth +
            boundaryBoundsSize[isRight ? "r" : "l"]
          );
        } else if (this.isSpecialOffSetBranchView(childBranch)) {
          return boundaryBounds.width;
        } else {
          return maxOffsetForNormalChildren + boundaryBounds.width;
        }
      });
      newBounds.width =
        newBounds.width +
        outwardOffset +
        spacingMajor +
        Math.max(...currentAllWidth) +
        arrowWidth;
    }
  },
  /**
   * [getChildrenSize get childBranches height and width]
   * @param  {[branchView]}  branch  [parentBranch]
   * @param  {Boolean} isRight [true for logicRight, false for logicLeft]
   * @return {[object]}          [return height and width]
   */
  getChildrenSize: function (branch, isRight) {
    const spacingMinor = parseInt(branch.figure.minorSpacing || 0);
    const lineWidth = parseInt(branch.topicView.figure.borderWidth || 0);
    let childrenHeight = 0;
    let childrenWidth = 0;
    // See also: https://gitlab.xmind.cn/xmind/snowbrush/issues/1175
    let appendWidthOfOppositeDirection = 0;
    const attachedChildrenBranches = branch.getChildrenBranchesByType();
    attachedChildrenBranches.forEach((childBranch) => {
      const { width, height, x } = childBranch.boundaryBounds;
      const shapeWidth = childBranch.topicView.shapeBounds.width;
      childrenHeight += height + spacingMinor + lineWidth;
      childrenWidth = Math.max(childrenWidth, width);
      appendWidthOfOppositeDirection = Math.max(
        appendWidthOfOppositeDirection,
        isRight ? -x - shapeWidth / 2 : width + x - shapeWidth / 2,
      );
    });
    if (childrenHeight > 0) {
      childrenHeight -= spacingMinor + lineWidth;
    }
    return {
      height: childrenHeight,
      width: childrenWidth + appendWidthOfOppositeDirection,
    };
  },
  calcSpacingMajor(branchView) {
    const lineStyle = branchView.getConnectionView().getLineShape();
    const spacingMajor = parseInt(`${branchView.figure.majorSpacing || 0}`);
    const slantLineStyles = [
      BRANCHCONNECTION.CURVE,
      BRANCHCONNECTION.STRAIGHT,
      BRANCHCONNECTION.FOLD,
      BRANCHCONNECTION.ROUNDEDFOLD,
      BRANCHCONNECTION.BIGHT,
    ];
    let resultSpacing = spacingMajor;
    if (slantLineStyles.includes(lineStyle)) {
      resultSpacing = spacingMajor * 2;
    }
    resultSpacing += Object(js_utils.getLineEndSpacingPatchGap)(branchView);
    return resultSpacing;
  },
});

export const logicLeftAndRight = leftAndRight;
