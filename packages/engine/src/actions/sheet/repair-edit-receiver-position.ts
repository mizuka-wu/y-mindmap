import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CONFIG,
} from "../../common/constants/index";
import BaseAction from "../action";

export class RepairEditReceiverPositionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REPAIR_EDIT_RECEIVER_POSITION;
  }
  /**
   * @description 根据当前选中的topic，修复editReceiver位置
   */
  doExecute() {
    const editReceiver = this._context.getModule(MODULE_NAME.EDIT_RECEIVER);
    editReceiver.repairPosition();
  }
  queryStatus() {
    if (this._context.config(CONFIG.NO_EDIT_RECEIVER)) {
      return ACTION_STATUS.DISABLE;
    } else {
      return ACTION_STATUS.NORMAL;
    }
  }
}
