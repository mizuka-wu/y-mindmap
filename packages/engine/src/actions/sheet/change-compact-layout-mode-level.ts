import {
  ACTION_NAMES,
  COMPACT_LAYOUT_MODE_LEVEL,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeCompactLayoutModeLevelAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_COMPACT_LAYOUT_MODE_LEVEL;
  }
  doExecute({ level }) {
    this._context.model.changeCompactLayoutModeLevel(
      level ?? COMPACT_LAYOUT_MODE_LEVEL.Second,
    );
  }
}
