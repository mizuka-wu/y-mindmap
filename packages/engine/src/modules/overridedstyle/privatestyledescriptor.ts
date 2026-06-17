import {
  STYLE_LAYER,
  STYLE_KEYS,
  TOPICSHAPE,
} from "../../common/constants/index";

import * as utils from "../../utils/index";
function isOverrideStyleTreeTableCell(target) {
  if (!Object(utils.isTreeTableCell)(target)) {
    return false;
  }
  if (Object(utils.isTreeTableHeadBranch)(target)) {
    return !(target.originBranchView ?? target).shouldCollapse();
  }
  return true;
}

export const privateStyleDescriptor = {
  [STYLE_LAYER.BEFORE_USER]: [
    {
      type: STYLE_KEYS.SHAPE_CLASS,
      value: TOPICSHAPE.MATRIXMAIN,
      test: utils.isMatrixCell,
    },
    {
      type: STYLE_KEYS.SHAPE_CLASS,
      value: TOPICSHAPE.TREETABLEMAIN,
      test: isOverrideStyleTreeTableCell,
    },
  ],
};
