import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
  LINE_PATTERN,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeSummaryLinePatternAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_SUMMARY_LINE_PATTERN;
  }
  doExecute(
    { linePattern, targets = [] }: any = {
      linePattern: LINE_PATTERN.SOLID,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => view.summaryModel);
    targets.forEach((target) => {
      target.summaryModel.changeStyle(STYLE_KEYS.LINE_PATTERN, linePattern);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => view.summaryModel);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
