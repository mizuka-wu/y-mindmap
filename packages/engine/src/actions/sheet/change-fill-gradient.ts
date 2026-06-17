import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

// 设置 topic 的 fill 为渐变色。
// fillGradient 会覆盖 fill 属性，优先级更高。（因此再次设置 fill 的时候，应该清空 fillGradient。
export class ChangeFillGradientAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_FILL_GRADIENT;
  }
  doExecute({ gradient, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => view.type === VIEW_TYPE.BRANCH);
    targets.forEach((target) => {
      const model = target.model;
      model.changeStyle(STYLE_KEYS.FILL_GRADIENT, gradient);
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
