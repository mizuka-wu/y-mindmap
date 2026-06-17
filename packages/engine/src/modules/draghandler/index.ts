import { VIEW_TYPE } from "../../common/constants/index";
import * as utils from "../../utils/index";

import { BranchDragHandler } from "./branchdraghandler";
import { CallOutDragHandler } from "./calloutdraghandler";
import { FreeBranchDragHandler } from "./freebranchdraghandler";
import { ImageDragHandler } from "./imagedraghanlder";
import { MatrixLabelDragHandler } from "./matrixlabeldraghandler";
import { MathJaxDragHandler } from "./mathjaxdraghandler";

// import MarkerDragHandler from './markerdraghandler'
const handlerMap = {
  "branch.attached": BranchDragHandler,
  "branch.detached": BranchDragHandler,
  "branch.callout": CallOutDragHandler,
  "branch.free": FreeBranchDragHandler,
  [VIEW_TYPE.IMAGE]: ImageDragHandler,
  // [VIEW_TYPE.MARKER]: MarkerDragHandler,
  [VIEW_TYPE.MATRIX_LABEL]: MatrixLabelDragHandler,
  [VIEW_TYPE.MATH_JAX]: MathJaxDragHandler,
};
export const getHandler = (view) => {
  const getHandlerKey = (view) => {
    const { type, model } = view;
    if (type === VIEW_TYPE.BRANCH) {
      const modelType = Object(utils.isFreePositionBranch)(view)
        ? "free"
        : model.type();
      return `${type}.${modelType}`;
    } else {
      return type;
    }
  };
  const key = getHandlerKey(view);
  return handlerMap[key];
};
