import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

// 同 ChangeFillGradientAction, 会覆盖 borderLineColor 属性
export class ChangeBorderGradientAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_BORDER_GRADIENT;
  }
  doExecute({ gradient, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => view.type === VIEW_TYPE.BRANCH);
    targets.forEach((target) => {
      const model = target.model;
      model.changeStyle(STYLE_KEYS.BORDER_GRADIENT, gradient);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => view.type === VIEW_TYPE.BRANCH);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
