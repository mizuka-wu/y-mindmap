import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CONFIG,
  VIEW_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

const isViewTitleEditable = (view) => {
  const types = [VIEW_TYPE.BOUNDARY, VIEW_TYPE.BRANCH, VIEW_TYPE.RELATIONSHIP];
  return (
    types.includes(view.type) &&
    (!view.shouldPreventTitle || !view.shouldPreventTitle())
  );
};

export class ShowEditBoxAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHOW_EDIT_BOX;
  }
  /**
   * @description 在指定的组件上显示输入框
   */
  doExecute({ placeholder, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const target = targets[0];
    this._context.execAction(ACTION_NAMES.SHOW_VIEW_IN_VIEWPORT, {
      targets: [target],
      prue: true,
    });
    if (placeholder === undefined) {
      placeholder = target.getEditContent();
    }
    this._context
      .getModule(MODULE_NAME.EDIT_RECEIVER)
      .show(placeholder, target);
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(isViewTitleEditable);
    const config = !this._context.config(CONFIG.NO_EDIT_RECEIVER);
    if (config && targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
