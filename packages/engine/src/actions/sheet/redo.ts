import {
  ACTION_NAMES,
  ACTION_STATUS,
  UI_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class RedoAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REDO;
  }
  doExecute() {
    this._context.model.getUndo().redo();
  }
  queryStatus() {
    if (
      this._context.getActiveUIStatus().indexOf(UI_STATUS.DRAG) === -1 &&
      this._context.model.getUndo().canRedo()
    ) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
