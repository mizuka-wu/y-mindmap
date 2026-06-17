import {
  ACTION_NAMES,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { changeAllStyle } from "./utils";

export class ChangeBorderPatternAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_BORDER_PATTERN;
  }
  doExecute({ targets, linePattern }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    changeAllStyle({
      style: STYLE_KEYS.BORDER_LINE_PATTERN,
      value: linePattern,
      targets: targets,
    });
  }
  queryStatus({ targets }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
