import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
  LINE_PATTERN,
  LINETAPERED,
} from "../../common/constants/index";
import BaseAction from "../action";

import { changeAllStyle } from "./utils";

export class ChangeLinePatternAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_LINE_PATTERN;
  }
  doExecute({ linePattern, targets }: any = {}) {
    const filteredTargets = this.getFilterViewList(targets);
    changeAllStyle({
      style: STYLE_KEYS.LINE_PATTERN,
      value: linePattern,
      targets: filteredTargets,
    });
    if (
      linePattern &&
      ![LINE_PATTERN.SOLID, LINE_PATTERN.HANDDRAWNSOLID].includes(linePattern)
    ) {
      this.clearSheetLineTapered(filteredTargets);
    }
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
    const targetTypeList = [
      VIEW_TYPE.BRANCH,
      VIEW_TYPE.BOUNDARY,
      VIEW_TYPE.RELATIONSHIP,
    ];
    return targets.filter((view) => targetTypeList.includes(view.type));
  }
  clearSheetLineTapered(targets) {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    if (!targets.some((target) => target === centralBranchView)) {
      return;
    }
    this._context.execAction(ACTION_NAMES.CHANGE_LINE_TAPERED, {
      tapered: LINETAPERED.NONE,
    });
  }
}
