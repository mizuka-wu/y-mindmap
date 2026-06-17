import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseMainBone } from "./fishbonebasemainbone";

export const FishBoneLeftHeadBottomBone = Object.assign(
  {},
  FishBoneBaseMainBone,
  {
    STRUCTURECLASS: STRUCTURECLASS.LEFTHEADBOTTOMBONE,
    direction: DIRECTION.RIGHT,
    getChildStructure() {
      return STRUCTURECLASS.LOGICRIGHT;
    },
    getRangeGrowthDirection() {
      return DIRECTION.UP;
    },
    getSummaryDirection() {
      return DIRECTION.RIGHT;
    },
    getSourceOrientation() {
      return DIRECTION.UP;
    },
  },
);
