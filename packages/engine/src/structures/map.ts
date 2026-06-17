import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_ATTACHED,
} from "../common/constants/index";

import underscore from "underscore";

import { calcOutwardDistanceByAttachedChildren } from "./helper/layoutstyleoptimization";

import { baseMap } from "./basemap";

const map = underscore.extend({}, baseMap, {
  STRUCTURECLASS: STRUCTURECLASS.MAP,
  calAttachedChildrenPos(branch, newBounds) {
    const attachedChildrenBranches =
      branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    let spacingMajor;
    const spacingMinor = branch.figure.minorSpacing ?? 0;
    const numRight = this.calcNumRight(branch);
    branch.figure.setBalanceRightNumber(numRight);
    // var PADDING = 20;
    if (attachedChildrenBranches.length) {
      if (branch.isCentralBranch() || branch.isDetachedBranch()) {
        spacingMajor = this.calcSpacingMajor(branch);
        const rightChildren = attachedChildrenBranches.slice(0, numRight);
        const leftChildren = attachedChildrenBranches.slice(numRight);
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
          isUpToDown: true,
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
  getRangeGrowthDirection() {
    return DIRECTION.DOWN;
  },
  getSummaryDirection(branch, index) {
    const direction = this.getChildTargetOrientation(branch, index);
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
  getChildStructure(structure, index, branch) {
    const num = this.calcNumRight(branch);
    if (index < num) {
      return STRUCTURECLASS.LOGICRIGHT;
    } else {
      return STRUCTURECLASS.LOGICLEFT;
    }
  },
});
/* harmony default export */
export const structuresMap = map;
