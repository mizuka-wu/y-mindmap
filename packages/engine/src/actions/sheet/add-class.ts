/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class AddClassAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_CLASS;
  }
  doExecute({ className, targets = [] }: any = {}) {
    if (className === undefined) {
      return;
    }
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    if (targets.length > 0) {
      targets.forEach((target) => {
        target.model.addClass(className);
      });
    }
  }
  queryStatus({ className, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
