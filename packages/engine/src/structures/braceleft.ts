import { STRUCTURECLASS } from "../common/constants/index";

import { BraceLeftAndRight } from "./braceleftandright";
import { logicLeft } from "./logicleft";

export const BraceLeft = Object.assign({}, logicLeft, {
  STRUCTURECLASS: STRUCTURECLASS.BRACELEFT,
  calAttachedChildrenPos(parentBranchView, parentBounds) {
    return BraceLeftAndRight.calAttachedChildrenPos.call(
      this,
      parentBranchView,
      parentBounds,
    );
  },
});
