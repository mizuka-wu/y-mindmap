import { STRUCTURECLASS, DIRECTION } from "../common/constants/index";

import { FishBoneBaseHead } from "./fishbonebasehead";

export const FishBoneRightHead = Object.assign({}, FishBoneBaseHead, {
  direction: DIRECTION.LEFT,
  getChildStructure(structure, index) {
    if (index % 2 === 0) {
      return STRUCTURECLASS.RIGHTHEADTOPBONE;
    } else {
      return STRUCTURECLASS.RIGHTHEADBOTTOMBONE;
    }
  },
  getRangeGrowthDirection() {
    return DIRECTION.LEFT;
  },
  getSourceOrientation() {
    return DIRECTION.LEFT;
  },
  getAvailableChildStructure() {
    return [
      STRUCTURECLASS.RIGHTHEADTOPBONE,
      STRUCTURECLASS.RIGHTHEADBOTTOMBONE,
    ];
  },
});
