import { ACTION_NAMES, STYLE_KEYS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeSheetBackgroundAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_SHEET_BACKGROUND;
  }
  doExecute({ color, targets = [this._context.getSheetView()] }: any = {}) {
    this._context.execAction(ACTION_NAMES.CHANGE_COLOR, {
      key: STYLE_KEYS.FILL_COLOR,
      color,
      targets,
      prue: true,
    });
  }
}
