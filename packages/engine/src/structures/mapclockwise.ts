import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_ATTACHED,
} from "../common/constants/index";
import * as js_utils from "../utils/index";

import underscore from "underscore";

import { calcOutwardDistanceByAttachedChildren } from "./helper/layoutstyleoptimization";

import { baseMap } from "./basemap";
export const mapClockWise = Object(underscore.extend)({}, baseMap, {
  STRUCTURECLASS: STRUCTURECLASS.MAPCLOCKWISE,
  calAttachedChildrenPos(branch, newBounds) {
    const attachedChildrenBranches =
      branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    const spacingMajor = this.calcSpacingMajor(branch);
    const spacingMinor = branch.figure.minorSpacing ?? 0;
    const pos = this.calcNumRight(branch);
    branch.figure.setBalanceRightNumber(pos);
    if (attachedChildrenBranches.length) {
      if (branch.isCentralBranch() || branch.isDetachedBranch()) {
        const rightChildren = attachedChildrenBranches.slice(0, pos);
        const leftChildren = attachedChildrenBranches.slice(pos).reverse();
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
          isUpToDown: false,
          offsetX: outwardOffsetLeft,
        });
        this.calBounds(branch, newBounds);
      }
    }
  },
  //branch的成长方向
  getRangeGrowthDirection(branch, index) {
    const num = this.calcNumRight(branch);
    if (index < num) {
      return DIRECTION.DOWN;
    } else {
      return DIRECTION.UP;
    }
  },
  /**
     这里参数index 指的是attachedChildren的index, 而不是summaryBranch的
     */
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
  //子branch的接受点 south north west east
  getChildTargetOrientation(branch, index) {
    const num = this.calcNumRight(branch);
    if (index < num) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.RIGHT;
    }
  },
  getChildStructure(structure, index, branch) {
    const model = branch.getChildrenBranchesByType()[index].model;
    if (
      Object(js_utils.isFreePositionBranch)(branch) &&
      (model === null || model === undefined
        ? undefined
        : model.get("position"))
    ) {
      if (model.get("position").x > 0) {
        return STRUCTURECLASS.LOGICRIGHT;
      } else {
        return STRUCTURECLASS.LOGICLEFT;
      }
    } else {
      const num = this.calcNumRight(branch);
      if (index < num) {
        return STRUCTURECLASS.LOGICRIGHT;
      } else {
        return STRUCTURECLASS.LOGICLEFT;
      }
    }
  },
});
