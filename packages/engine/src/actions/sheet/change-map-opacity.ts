import { ACTION_NAMES, STYLE_KEYS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeMapOpacityAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_MAP_OPACITY;
  }
  doExecute({ opacity }: any = {}) {
    const sheetView = this._context.getSheetView();
    sheetView.model.changeStyle(STYLE_KEYS.OPACITY, opacity);
  }
}
