import { STRUCTURECLASS } from "../common/constants/index";

import underscore from "underscore";

import { mapClockWise } from "./mapclockwise";
export const MapUnbalanced = underscore.extend({}, mapClockWise, {
  STRUCTURECLASS: STRUCTURECLASS.MAPUNBALANCED,
  calcNumRight(branch) {
    const unBalancedInfo = branch.model.unBalancedInfo();
    let numRight = -1;
    if (unBalancedInfo) {
      if (unBalancedInfo.name === "right-number") {
        // if has unbalance info, then figure has already safely init, avoid NaN
        // should use figure value here cause we need use this to layout placeholder correctly
        numRight = branch.figure.unbalanceRightNumber;
      }
    }
    if (numRight < 0 || isNaN(numRight)) {
      numRight = mapClockWise.calcNumRight.bind(this)(branch);
      branch.model.setUnBalancedInfoContent(numRight, true);
    }
    return numRight;
  },
});
