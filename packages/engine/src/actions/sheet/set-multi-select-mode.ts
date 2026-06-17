import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class SetMultiSelectModeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_MULTI_SELECT_MODE;
  }
  doExecute({ enabled }) {
    const selectionManger = this._context.getModule(MODULE_NAME.SELECTION);
    if (selectionManger === null || selectionManger === undefined) {
      // do nothing
    } else {
      selectionManger.setMultiSelectMode(enabled);
    }
  }
  queryStatus() {
    return ACTION_STATUS.NORMAL;
  }
}
