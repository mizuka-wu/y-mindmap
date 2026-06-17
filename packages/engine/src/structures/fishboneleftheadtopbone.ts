import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseMainBone } from "./fishbonebasemainbone";

export const FishBoneLeftHeadTopBone = Object.assign({}, FishBoneBaseMainBone, {
  STRUCTURECLASS: STRUCTURECLASS.LEFTHEADTOPBONE,
  direction: DIRECTION.RIGHT,
  getChildStructure() {
    return STRUCTURECLASS.LOGICRIGHT;
  },
  getRangeGrowthDirection() {
    return DIRECTION.DOWN;
  },
  getSourceOrientation() {
    return DIRECTION.DOWN;
  },
});
