import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class OpenUndoKeepModeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.OPEN_UNDO_KEEP_MODE;
  }
  doExecute() {
    this._context.model.getUndo().keepAllInOne(true);
  }
}
