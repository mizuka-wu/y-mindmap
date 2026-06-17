import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { changeAllStyle } from "./utils";

export class ChangeBorderWidthAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_BORDER_WIDTH;
  }
  doExecute({ width, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    changeAllStyle({
      style: STYLE_KEYS.BORDER_LINE_WIDTH,
      value: width,
      targets: targets,
    });
  }
  queryStatus({ targets = [] }: any = {}) {
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
