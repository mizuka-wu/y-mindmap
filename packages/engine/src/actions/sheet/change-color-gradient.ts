import { ACTION_NAMES, STYLE_KEYS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeColorGradientAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_COLOR_GRADIENT;
  }
  doExecute({ gradient }: any = {}) {
    if (gradient !== undefined) {
      this._context
        .getSVGView()
        .content()
        .model.changeStyle(STYLE_KEYS.GRADIENT_COLOR, gradient);
    }
  }
}
