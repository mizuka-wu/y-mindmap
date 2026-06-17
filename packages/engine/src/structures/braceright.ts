import { STRUCTURECLASS } from "../common/constants/index";

import { logicRight } from "./logicright";
import { BraceLeftAndRight } from "./braceleftandright";

export const BraceRight = Object.assign({}, logicRight, {
  STRUCTURECLASS: STRUCTURECLASS.BRACERIGHT,
  calAttachedChildrenPos(parentBranchView, parentBounds) {
    return BraceLeftAndRight.calAttachedChildrenPos.call(
      this,
      parentBranchView,
      parentBounds,
      true,
    );
  },
});
