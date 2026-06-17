import {
  STRUCTURECLASS,
  DIRECTION,
  ATTACHED_EXPOSED_STRUCTURE,
} from "../common/constants/index";

import underscore from "underscore";

import { orgChartDownAndUp } from "./orgchartupanddown";

/**
 * structrue -- orgnization chart down
 */

export const orgChartDown = underscore.extend({}, orgChartDownAndUp, {
  STRUCTURECLASS: STRUCTURECLASS.ORGCHARTDOWN,
  calAttachedChildrenPos: function (branch, newBounds) {
    orgChartDownAndUp.calAttachedChildrenPos.call(
      this,
      branch,
      newBounds,
      true,
    );
  },
  //branch的成长方向
  getRangeGrowthDirection: function () {
    return DIRECTION.RIGHT;
  },
  getSummaryDirection: function () {
    return DIRECTION.DOWN;
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.DOWN;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation: function () {
    return DIRECTION.UP;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return ATTACHED_EXPOSED_STRUCTURE.filter((item) => {
      const isOrgUp = item.indexOf("org.xmind.ui.org-chart.up") === 0;
      return !isOrgUp;
    });
  },
});
