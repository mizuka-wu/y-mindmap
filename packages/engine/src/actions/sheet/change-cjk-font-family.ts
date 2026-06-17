import { ACTION_NAMES, STYLE_KEYS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeCJKFontFamilyAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_CJK_FONT_FAMILY;
  }
  doExecute({ fontFamily }: any = {}) {
    this._context.model.changeStyle(STYLE_KEYS.CJK_FONT_FAMILY, fontFamily);
  }
}
