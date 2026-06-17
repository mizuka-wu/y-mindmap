import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { changeAllStyle } from "./utils";

export class ChangeEndArrowTypeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_END_ARROW_TYPE;
  }
  doExecute({ style, targets }: any = {}) {
    changeAllStyle({
      style: STYLE_KEYS.ARROW_END_CLASS,
      value: style,
      targets: this.getFilterViewList(targets),
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    targets = this.getFilterViewList(targets);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  getFilterViewList(targets) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const targetTypeList = [VIEW_TYPE.BRANCH, VIEW_TYPE.RELATIONSHIP];
    return targets.filter((view) => targetTypeList.includes(view.type));
  }
}
