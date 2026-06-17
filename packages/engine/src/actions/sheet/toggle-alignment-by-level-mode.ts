import {
  ACTION_NAMES,
  STYLE_KEYS,
  ALIGNMENT_BY_LEVEL_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class SetAlignmentByLevelAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.TOGGLE_ALIGNMENT_BY_LEVEL_MODE;
  }
  doExecute() {
    const isCurrentAlignmentByLevelMode =
      this._context.isAlignmentByLevelMode();
    this._context
      .getSheetView()
      .getCentralBranchView()
      .model.changeStyle(
        STYLE_KEYS.ALIGNMENT_BY_LEVEL,
        isCurrentAlignmentByLevelMode
          ? ALIGNMENT_BY_LEVEL_STATUS.INACTIVED
          : ALIGNMENT_BY_LEVEL_STATUS.ACTIVED,
      );
  }
}
