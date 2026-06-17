import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseHead } from "./fishbonebasehead";

export const FishBoneLeftHead = Object.assign({}, FishBoneBaseHead, {
  direction: DIRECTION.RIGHT,
  getChildStructure(structure, index) {
    if (index % 2 === 0) {
      return STRUCTURECLASS.LEFTHEADTOPBONE;
    } else {
      return STRUCTURECLASS.LEFTHEADBOTTOMBONE;
    }
  },
  getRangeGrowthDirection() {
    return DIRECTION.RIGHT;
  },
  getAvailableChildStructure() {
    return [STRUCTURECLASS.LEFTHEADTOPBONE, STRUCTURECLASS.LEFTHEADBOTTOMBONE];
  },
});
