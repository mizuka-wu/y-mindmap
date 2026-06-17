import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class ChangeThemeAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_THEME;
  }
  doExecute({
    themeData,
    skeletonThemeData,
    colorThemeData,
    options,
  }: any = {}) {
    const sheetView = this._context.getSheetView();
    if (themeData) {
      this._context.initTemporaryColorThemeInOldThemeFiles();
      return styleManager.changeTheme(sheetView, themeData, options);
    }
    if (skeletonThemeData) {
      const options = {
        temporaryColorThemeId: undefined,
      };
      if (!this._context.model.theme().getColorThemeId()) {
        options.temporaryColorThemeId =
          this._context.getCurrentTemporaryColorTheme()?.id;
      }
      styleManager.changeSkeletonTheme(sheetView, skeletonThemeData, options);
      this.clearHandDrawnActiveMode();
    }
    if (colorThemeData) {
      styleManager.changeColorTheme(sheetView, colorThemeData);
    }
  }
  clearHandDrawnActiveMode() {
    this._context.execAction(ACTION_NAMES.CHANGE_HAND_DRAWN_MODE_ACTIVE, {
      active: false,
    });
  }
}
