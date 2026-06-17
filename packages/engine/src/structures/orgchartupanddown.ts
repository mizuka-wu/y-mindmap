import {
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as utils from "../figures/renderengine/svg/topicshapes/utils";
import * as js_utils from "../utils/index";

import { AbstractStructure } from "./abstractstructure";

import * as layoututil from "../utils/layoututil";
import { calcOutwardDistanceByAttachedChildren } from "./helper/layoutstyleoptimization";
/**
 *  给orgChartLeft和orgChartRight继承的structure
 *
 */

export const orgChartDownAndUp = Object.assign({}, AbstractStructure, {
  /**
   * [getChildrenSize get childBranches height and width]
   * @param  {[branchView]}  branch  [parentBranch]
   * @param  {Boolean} isDown [true for orgChartDown, false for orgChartUp]
   * @return {[object]}          [return height and width]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChildrenSize(branch, isDown) {
    let childrenHeight = 0;
    let childrenWidth = 0;
    const spacingMinor = parseInt(branch.figure.minorSpacing || 0);
    const lineWidth = parseInt(branch.topicView.figure.borderWidth || 0);
    const attachedChildrenBranches = branch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    attachedChildrenBranches.forEach((childBranch) => {
      childrenWidth +=
        childBranch.boundaryBounds.width + spacingMinor + lineWidth;
      childrenHeight = Math.max(
        childrenHeight,
        childBranch.boundaryBounds.height,
      );
    });
    if (childrenWidth > 0) {
      childrenWidth -= spacingMinor + lineWidth;
    }
    return {
      height: childrenHeight,
      width: childrenWidth,
    };
  },
  calAttachedChildrenPos(branch, newBounds, isDown) {
    const attachedChildrenBranches = branch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    const spacingMajor = this.calcSpacingMajor(branch);
    const spacingMinor = parseInt(branch.figure.minorSpacing || 0);
    const lineWidth = parseInt(branch.topicView.figure.borderWidth || 0);
    const childrenSize = this.getChildrenSize(branch, isDown);
    if (attachedChildrenBranches.length > 0) {
      // get minChildX
      let minChildX = -childrenSize.width / 2;
      if (attachedChildrenBranches.length > 1) {
        let levelWidth = childrenSize.width;
        const firstChild = attachedChildrenBranches[0];
        const lastChild =
          attachedChildrenBranches[attachedChildrenBranches.length - 1];
        levelWidth += firstChild.boundaryBounds.x;
        levelWidth -= lastChild.boundaryBounds.width;
        levelWidth -= lastChild.boundaryBounds.x;
        minChildX = -levelWidth / 2 + firstChild.boundaryBounds.x;
      }
      const maxChildX = childrenSize.width / 2;
      const minParentX = -newBounds.width / 2;
      const maxParentX = newBounds.width / 2;
      const outwardOffset = calcOutwardDistanceByAttachedChildren(branch);
      let childrenY;
      if (isDown) {
        childrenY = newBounds.y + newBounds.height + spacingMajor;
      } else {
        childrenY = newBounds.y - spacingMajor;
        newBounds.y = Math.min(newBounds.y, childrenY - childrenSize.height);
      }
      newBounds.x = Math.min(minChildX, minParentX);
      let maxOffset = Number.MIN_VALUE;
      attachedChildrenBranches.forEach((childBranch) => {
        if (isDown) {
          maxOffset = Math.max(
            maxOffset,
            childBranch.topicView.bounds.y - childBranch.boundaryBounds.y,
          );
        } else {
          maxOffset = Math.max(
            maxOffset,
            childBranch.boundaryBounds.y +
              childBranch.boundaryBounds.height -
              childBranch.topicView.bounds.y -
              childBranch.topicView.bounds.height,
          );
        }
      });
      let posXoffsetToClosestChild =
        layoutConstant.MAX_BRANCH_POSITION_REALIGN_OFFSET + 1;
      // store computed positions
      const positionMap = new WeakMap();
      // set position for children
      let currentChildX = minChildX;
      attachedChildrenBranches.forEach((child) => {
        const { x, width } = child.boundaryBounds;
        const posX = currentChildX - x;
        const posY = isDown
          ? childrenY - child.topicView.bounds.y + maxOffset + outwardOffset
          : childrenY + child.topicView.bounds.y - maxOffset - outwardOffset;
        positionMap.set(child, {
          x: posX,
          y: posY,
        });
        // child.setPosition(posX, posY)
        // find smallest position offset between Parent branch and child Branch
        if (Math.abs(posX) < Math.abs(posXoffsetToClosestChild)) {
          posXoffsetToClosestChild = posX;
        }
        currentChildX += width + spacingMinor + lineWidth;
      });
      const childrenWidth = currentChildX - spacingMinor - lineWidth;
      if (
        layoututil.isNeedRedolayout(
          attachedChildrenBranches,
          posXoffsetToClosestChild,
          childrenWidth,
        )
      ) {
        newBounds.x -= posXoffsetToClosestChild;
      } else {
        // clear if not valid
        posXoffsetToClosestChild = 0;
      }
      // Apply new positions with `posXoffsetToClosestChild` calculated
      attachedChildrenBranches.forEach((branchView) => {
        const position = positionMap.get(branchView);
        if (position) {
          const { x, y } = position;
          branchView.setPosition(x - posXoffsetToClosestChild, y);
        }
      });
      const sizeMinChildX = -childrenSize.width / 2;
      newBounds.width =
        Math.max(maxChildX, maxParentX) - Math.min(sizeMinChildX, minParentX);
      const currentAllHeight = attachedChildrenBranches.map((childBranch) => {
        const startDirection = Object(utils.getStartDirection)(
          childBranch,
          undefined,
        );
        const { boundaryBounds } = childBranch;
        const { bounds: topicBounds } = childBranch.topicView;
        if (
          startDirection === DIRECTION.LEFT ||
          startDirection === DIRECTION.RIGHT
        ) {
          // boundary 从 topic 原点起, 上下各切一半
          const halfOfTopicHeight = topicBounds.height / 2;
          const restSize = isDown
            ? boundaryBounds.height + boundaryBounds.y
            : Math.abs(boundaryBounds.y);
          return maxOffset + halfOfTopicHeight + restSize;
        } else {
          return maxOffset + childBranch.boundaryBounds.height;
        }
      });
      newBounds.height =
        newBounds.height +
        spacingMajor +
        outwardOffset +
        Math.max(...currentAllHeight);
    }
  },
  calcSpacingMajor(branch) {
    const lineStyle = branch.getConnectionView().getLineShape();
    const spacingMajor = parseInt(branch.figure.majorSpacing || 0);
    const slantLineStyles = [
      BRANCHCONNECTION.CURVE,
      BRANCHCONNECTION.STRAIGHT,
      BRANCHCONNECTION.FOLD,
      BRANCHCONNECTION.ROUNDEDFOLD,
      BRANCHCONNECTION.BIGHT,
    ];
    const finalSpacing = slantLineStyles.includes(lineStyle)
      ? spacingMajor * 2
      : spacingMajor;
    return finalSpacing + Object(js_utils.getLineEndSpacingPatchGap)(branch);
  },
});
