import {
  STRUCTURECLASS,
  DIRECTION,
  LEFT_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import structuresUtil from "./helper/structuresutil";

import underscore from "underscore";

import { logicLeftAndRight } from "./logicleftandright";
/**
 * structrue -- logic to left
 */

export const logicLeft = underscore.extend({}, logicLeftAndRight, {
  STRUCTURECLASS: STRUCTURECLASS.LOGICLEFT,
  calAttachedChildrenPos: function (branch, newBounds) {
    logicLeftAndRight.calAttachedChildrenPos.call(
      this,
      branch,
      newBounds,
      false,
    );
  },
  getSummaryDirection: function () {
    return DIRECTION.LEFT;
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.LEFT;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation: function () {
    return DIRECTION.RIGHT;
  },
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.restrictCalloutToRight(callout, position);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return LEFT_EXPOSED_STRUCTURE;
  },
});
