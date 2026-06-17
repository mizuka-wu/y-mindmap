import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeTitleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_TITLE;
  }
  doExecute({ newTitle, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH ||
        view.type === VIEW_TYPE.BOUNDARY ||
        view.type === VIEW_TYPE.RELATIONSHIP ||
        view.type === VIEW_TYPE.MATRIX_LABEL,
    );
    targets.forEach((target) => {
      target.saveEdit(newTitle);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH ||
        view.type === VIEW_TYPE.BOUNDARY ||
        view.type === VIEW_TYPE.RELATIONSHIP ||
        view.type === VIEW_TYPE.MATRIX_LABEL,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
