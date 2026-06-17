import {
  STRUCTURECLASS,
  DIRECTION,
  TREE_LEFT_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import structuresUtil from "./helper/structuresutil";
import { dragAreaUtil } from "./helper/dragareautil";

import underscore from "underscore";

import { treeLeftAndRight } from "./treeleftandright";

/**
 * structrue -- tree to left
 */

export const treeLeft = underscore.extend({}, treeLeftAndRight, {
  STRUCTURECLASS: STRUCTURECLASS.TREELEFT,
  calAttachedChildrenPos: function (branch, newBounds) {
    treeLeftAndRight.calAttachedChildrenPos.call(
      this,
      branch,
      newBounds,
      false,
    );
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.DOWN;
  },
  getSummaryDirection: function () {
    return DIRECTION.LEFT;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation: function () {
    return DIRECTION.RIGHT;
  },
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.restrictCalloutToRight(callout, position);
  },
  getPointsOfBase(branch) {
    const bounds = branch.topicView.bounds;
    const isTop = branch.isCentralBranch() || branch.isDetachedBranch() ? 0 : 1;
    return [
      {
        x: bounds.x,
        y: bounds.y + isTop * bounds.height,
      },
      {
        x: 0,
        y: bounds.y + isTop * bounds.height,
      },
    ];
  },
  getPointsOfNoChildren(branch) {
    const bounds = branch.topicView.bounds;
    return [
      {
        x: 0,
        y: bounds.y + bounds.height + dragAreaUtil.virtualConnLen,
      },
      {
        x: bounds.x - (bounds.width * 5) / 6,
        y: bounds.y + bounds.height + dragAreaUtil.virtualConnLen,
      },
    ];
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return TREE_LEFT_EXPOSED_STRUCTURE;
  },
});
