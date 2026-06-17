import * as utils from "../../utils/index";

import BaseHandler from "../draghandler/basehandler";

export class CallOutDragHandler extends BaseHandler {
  dragFinish(transferData) {
    const { draggedView, position } = transferData;
    const newPosition = Object(utils.relativePositionFor)(
      position,
      draggedView.parent().getRealPosition(),
    );
    draggedView.model.changePosition(newPosition);
  }
}
