import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseMainBone } from "./fishbonebasemainbone";

export const FishBoneRightHeadTopBone = Object.assign(
  {},
  FishBoneBaseMainBone,
  {
    STRUCTURECLASS: STRUCTURECLASS.RIGHTHEADTOPBONE,
    direction: DIRECTION.LEFT,
    getChildStructure() {
      return STRUCTURECLASS.LOGICLEFT;
    },
    getRangeGrowthDirection() {
      return DIRECTION.DOWN;
    },
    getSummaryDirection() {
      return DIRECTION.LEFT;
    },
    getSourceOrientation() {
      return DIRECTION.DOWN;
    },
    getChildTargetOrientation() {
      return DIRECTION.RIGHT;
    },
  },
);
