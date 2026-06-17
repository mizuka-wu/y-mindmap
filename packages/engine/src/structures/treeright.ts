import {
  STRUCTURECLASS,
  DIRECTION,
  TREE_RIGHT_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import structuresUtil from "./helper/structuresutil";
import { dragAreaUtil } from "./helper/dragareautil";

import underscore from "underscore";

import { treeLeftAndRight } from "./treeleftandright";
/**
 * structrue -- tree to right
 */

// var PADDING = layoutConstant.PADDING;
// var BOUNDARYGAP = layoutConstant.BOUNDARYGAP;
// var sortBoundaries = structuresUtil.sortBoundaries;
export const treeRight = underscore.extend({}, treeLeftAndRight, {
  STRUCTURECLASS: STRUCTURECLASS.TREERIGHT,
  calAttachedChildrenPos: function (branch, newBounds) {
    treeLeftAndRight.calAttachedChildrenPos.call(this, branch, newBounds, true);
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.DOWN;
  },
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.restrictCalloutToLeft(callout, position);
  },
  getPointsOfBase(branch) {
    const bounds = branch.topicView.bounds;
    const isTop = branch.isCentralBranch() || branch.isDetachedBranch() ? 0 : 1;
    return [
      {
        x: 0,
        y: bounds.y + isTop * bounds.height,
      },
      {
        x: bounds.width,
        y: bounds.y + isTop * bounds.height,
      },
    ];
  },
  getPointsOfNoChildren(branch) {
    const bounds = branch.topicView.bounds;
    return [
      {
        x: bounds.x + (bounds.width * 11) / 6,
        y: bounds.y + bounds.height + dragAreaUtil.virtualConnLen,
      },
      {
        x: 0,
        y: bounds.y + bounds.height + dragAreaUtil.virtualConnLen,
      },
    ];
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return TREE_RIGHT_EXPOSED_STRUCTURE;
  },
});
