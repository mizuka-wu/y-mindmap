import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ShowViewInViewportAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHOW_VIEW_IN_VIEWPORT;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const target = targets[0];
    this._context
      .getModule(MODULE_NAME.MOVE_VIEW_PORT)
      .showBranchInViewPort(target);
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((target) => target.type === VIEW_TYPE.BRANCH);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
