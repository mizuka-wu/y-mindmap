import { VIEW_TYPE, ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeInfoItemDisplayAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_INFO_ITEM_DISPLAY;
  }
  /**
   * @deprecated
   * @param {string} [type] - optional param, type of infoItem. if not indicated, action will change display mode of all type. dictionary: "label", "href", "note", "task" and "audio"
   * @param {string} mode - "card" or "icon"
   */
  doExecute({ type, mode }: any = {}) {
    const sheetModel = this._context.getSheetView().model;
    if (!type) {
      [VIEW_TYPE.LABEL, VIEW_TYPE.HREF, VIEW_TYPE.NOTE, VIEW_TYPE.TASK].forEach(
        (type) => {
          sheetModel.changeInfoItemDisplay(type, mode);
        },
      );
    } else {
      sheetModel.changeInfoItemDisplay(type, mode);
    }
  }
}
