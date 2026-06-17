/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

/**
 * 清空attach branch上的position，将从freeposition变成正常branch
 * @param {BranchView} [view] 可选，无参数时清空已经选中的。
 */
export class ResetPositionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.RESET_POSITION;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) =>
        target.type === VIEW_TYPE.BRANCH &&
        target.model.type() === TOPIC_TYPE.ATTACHED &&
        target.model.get("position"),
    );
    targets.forEach((target) => {
      const model = target.model;
      model.clearPosition();
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) => (target) =>
        target.type === VIEW_TYPE.BRANCH &&
        target.model.type() === TOPIC_TYPE.ATTACHED &&
        target.model.get("position"),
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
