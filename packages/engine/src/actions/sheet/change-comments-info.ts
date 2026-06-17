import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeCommentsInfoAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_COMMENTS_INFO;
  }
  /**
   * @description 修改comments，不传参数即为删除comments
   */
  doExecute({ newCommentsInfo, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((target) => target.type === VIEW_TYPE.BRANCH);
    targets.forEach((target) => {
      target.model.changeComments(newCommentsInfo);
    });
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
