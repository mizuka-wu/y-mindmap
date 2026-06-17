import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_ATTACHED,
} from "../common/constants/index";

import underscore from "underscore";

import { calcOutwardDistanceByAttachedChildren } from "./helper/layoutstyleoptimization";

import { baseMap } from "./basemap";
export const mapAntiClockWise = underscore.extend({}, baseMap, {
  STRUCTURECLASS: STRUCTURECLASS.MAPANTICLOCKWISE,
  calAttachedChildrenPos(branch, newBounds) {
    const spacingMajor = this.calcSpacingMajor(branch);
    const spacingMinor = branch.figure.minorSpacing ?? 0;
    const attachedChildrenBranches =
      branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    const pos = this.calcNumRight(branch);
    // var PADDING = 20;
    if (attachedChildrenBranches.length) {
      if (branch.isCentralBranch() || branch.isDetachedBranch()) {
        const rightChildren = attachedChildrenBranches.slice(pos).reverse();
        const leftChildren = attachedChildrenBranches.slice(0, pos);
        const outwardOffsetLeft = calcOutwardDistanceByAttachedChildren(
          branch,
          leftChildren,
        );
        const outwardOffsetRight = calcOutwardDistanceByAttachedChildren(
          branch,
          rightChildren,
        );
        this.calSidePos({
          side: "right",
          spacingMajor,
          spacingMinor,
          newBounds,
          children: rightChildren,
          isUpToDown: false,
          offsetX: outwardOffsetRight,
        });
        this.calSidePos({
          side: "left",
          spacingMajor,
          spacingMinor,
          newBounds,
          children: leftChildren,
          isUpToDown: true,
          offsetX: outwardOffsetLeft,
        });
        this.calBounds(branch, newBounds);
      }
    }
  },
  //branch的成长方向
  getRangeGrowthDirection(branchView, topicIndex) {
    const num = this.calcNumRight(branchView);
    if (topicIndex < num) {
      return DIRECTION.DOWN;
    } else {
      return DIRECTION.UP;
    }
  },
  getSummaryDirection(branchView, topicIndex) {
    const direction = this.getChildTargetOrientation(branchView, topicIndex);
    if (direction === DIRECTION.LEFT) {
      return DIRECTION.RIGHT;
    } else {
      return DIRECTION.LEFT;
    }
  },
  //父branch的出发点 south north west east
  getSourceOrientation() {
    return DIRECTION.NONE;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation(branchView, topicIndex) {
    const num = this.calcNumRight(branchView);
    if (topicIndex < num) {
      return DIRECTION.RIGHT;
    } else {
      return DIRECTION.LEFT;
    }
  },
  getChildStructure(structure, index, branch) {
    const num = this.calcNumRight(branch);
    if (index < num) {
      return STRUCTURECLASS.LOGICLEFT;
    } else {
      return STRUCTURECLASS.LOGICRIGHT;
    }
  },
  _isRight(index, branch) {
    const num = this.calcNumRight(branch);
    return index >= num;
  },
});
