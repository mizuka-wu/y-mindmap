import {
  STRUCTURECLASS,
  DIRECTION,
  TOP_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import underscore from "underscore";

import { orgChartDownAndUp } from "./orgchartupanddown";
/**
 * structrue -- orgnization chart up
 */

export const orgChartUp = underscore.extend({}, orgChartDownAndUp, {
  STRUCTURECLASS: STRUCTURECLASS.ORGCHARTUP,
  calAttachedChildrenPos: function (branch, newBounds) {
    orgChartDownAndUp.calAttachedChildrenPos.call(
      this,
      branch,
      newBounds,
      false,
    );
  },
  //branch的成长方向
  getRangeGrowthDirection: function () {
    return DIRECTION.RIGHT;
  },
  getSummaryDirection: function () {
    return DIRECTION.UP;
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.UP;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation: function () {
    return DIRECTION.DOWN;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return TOP_EXPOSED_STRUCTURE;
  },
});
