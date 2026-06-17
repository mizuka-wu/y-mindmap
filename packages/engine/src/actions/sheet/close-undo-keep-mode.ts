import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class CloseUndoKeepModeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CLOSE_UNDO_KEEP_MODE;
  }
  doExecute() {
    this._context.model.getUndo().keepAllInOne(false);
  }
}
