import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class SheetModifiedAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHEET_MODIFIED;
  }
  doExecute() {
    this._context.getModule(MODULE_NAME.MODIFY_CHECK).simulateModify();
  }
}
