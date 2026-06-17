import { ANIMATION_FLAGS } from "../../common/constants/index";

import { executeHighLightSelectBoxProcess } from "./util";
export const boundary = {
  [ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX]({ target }) {
    const selectBoxNode = target.selectBox.figure.renderWorker.selectBox.node;
    return executeHighLightSelectBoxProcess(selectBoxNode);
  },
};
