import { ANIMATION_FLAGS } from "../../common/constants/index";

import { executeHighLightSelectBoxProcess } from "./util";
export const relationship = {
  [ANIMATION_FLAGS.RELATIONSHIP_SHOW_HIGH_LIGHT_SELECT_BOX]({ target }) {
    const actionPathNode = target.figure.renderWorker.actionPath.node;
    return executeHighLightSelectBoxProcess(actionPathNode, {
      toStrokeWidth: 9,
    });
  },
};
