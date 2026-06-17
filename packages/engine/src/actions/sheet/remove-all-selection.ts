import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class RemoveAllSelectionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_ALL_SELECTION;
  }
  doExecute() {
    const module = this._context.getModule(MODULE_NAME.SELECTION);
    module.selectNone();
  }
}
