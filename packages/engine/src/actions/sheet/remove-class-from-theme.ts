import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class RemoveClassFromThemeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_CLASS_FROM_THEME;
  }
  doExecute(
    { classNames } = {
      classNames: [],
    },
  ) {
    styleManager.removeClassFromTheme(this._context.getSheetView(), classNames);
  }
}
