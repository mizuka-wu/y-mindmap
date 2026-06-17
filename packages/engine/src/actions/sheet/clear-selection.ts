import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class ClearSelectionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CLEAR_SELECTION;
  }
  doExecute({ forceFlush }) {
    const selectionModule = this._context.getModule(MODULE_NAME.SELECTION);
    selectionModule.selectNone({
      forceFlush,
    });
  }
}
