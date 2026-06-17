import {
  STRUCTURECLASS,
  RIGHT_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import structuresUtil from "./helper/structuresutil";

import { logicLeftAndRight } from "./logicleftandright";
/**
 * structrue -- logic to right
 */

export const logicRight = Object.assign({}, logicLeftAndRight, {
  STRUCTURECLASS: STRUCTURECLASS.LOGICRIGHT,
  calAttachedChildrenPos: function (branch, newBounds) {
    logicLeftAndRight.calAttachedChildrenPos.call(
      this,
      branch,
      newBounds,
      true,
    );
  },
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.restrictCalloutToLeft(callout, position);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return RIGHT_EXPOSED_STRUCTURE;
  },
});
