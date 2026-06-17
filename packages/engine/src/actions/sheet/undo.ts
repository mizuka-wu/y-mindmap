import {
  ACTION_NAMES,
  ACTION_STATUS,
  UI_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class UndoAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.UNDO;
  }
  doExecute({ needClearRedo = false }: any = {}) {
    const undoManager = this._context.model.getUndo();
    undoManager.undo();
    if (needClearRedo) {
      undoManager.clearRedo();
    }
  }
  queryStatus() {
    if (
      this._context.getActiveUIStatus().indexOf(UI_STATUS.DRAG) === -1 &&
      this._context.model.getUndo().canUndo()
    ) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
