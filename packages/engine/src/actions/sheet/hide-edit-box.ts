import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class HideEditBoxAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.HIDE_EDIT_BOX;
  }
  /**
   * @description 隐藏输入框
   */
  doExecute({ notSaveEdit }: any = {}) {
    this._context.getModule(MODULE_NAME.EDIT_RECEIVER).hide(notSaveEdit);
  }
}
