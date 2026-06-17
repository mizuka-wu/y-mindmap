import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class SetSummaryStyleObjectAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_SUMMARY_STYLE_OBJECT;
  }
  doExecute(
    { styleObj = null, targets = [] }: any = {
      styleObj: null,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) => target.type === VIEW_TYPE.BRANCH && target.summaryModel,
    );
    targets.forEach((target) => {
      target.summaryModel.setStyleObj(styleObj);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) => target.type === VIEW_TYPE.BRANCH && target.summaryModel,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
