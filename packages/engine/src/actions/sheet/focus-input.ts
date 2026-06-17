import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CONFIG,
} from "../../common/constants/index";
import BaseAction from "../action";

export class FocusInputAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.FOCUS_INPUT;
  }
  /**
   * @description 手动聚焦到input
   */
  doExecute({ preventScroll }) {
    const editReceiverModule = this._context.getModule(
      MODULE_NAME.EDIT_RECEIVER,
    );
    editReceiverModule.getInputDOM().focus({
      preventScroll,
    });
  }
  queryStatus() {
    if (this._context.config(CONFIG.NO_EDIT_RECEIVER)) {
      return ACTION_STATUS.DISABLE;
    } else {
      return ACTION_STATUS.NORMAL;
    }
  }
}
