import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class SheetSavedAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHEET_SAVED;
  }
  // 单sheet情况下，保存sheet后需要调用，保证sheet的modify check正常
  doExecute() {
    this._context.getModule(MODULE_NAME.MODIFY_CHECK).updateBaseIndex();
  }
}
