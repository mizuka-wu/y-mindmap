import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseMainBone } from "./fishbonebasemainbone";

export const FishBoneRightHeadBottomBone = Object.assign(
  {},
  FishBoneBaseMainBone,
  {
    STRUCTURECLASS: STRUCTURECLASS.RIGHTHEADBOTTOMBONE,
    direction: DIRECTION.LEFT,
    getChildStructure() {
      return STRUCTURECLASS.LOGICLEFT;
    },
    getRangeGrowthDirection() {
      return DIRECTION.UP;
    },
    getSummaryDirection() {
      return DIRECTION.LEFT;
    },
    getSourceOrientation() {
      return DIRECTION.UP;
    },
    getChildTargetOrientation() {
      return DIRECTION.RIGHT;
    },
  },
);
