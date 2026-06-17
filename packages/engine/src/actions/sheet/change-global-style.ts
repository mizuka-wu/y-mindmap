import { getAllViewToFixUserStyle } from "../../utils/business/stylemanager/sheetstyleselector";

import {
  ACTION_NAMES,
  STYLE_KEYS,
  ALL_TOPIC_TYPES,
  PRESET_GLOBAL_STYLE_CLASS,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

const isRemoveKey = (value) => {
  return value === null || value === undefined;
};
export class ChangeGlobalStyleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_GLOBAL_STYLE;
  }
  doExecute({ key, value }) {
    if (!key) {
      return;
    }
    if (!isRemoveKey(value)) {
      this.clearUserStyle(key);
    }
    this.clearThemePriorityGlobalFlag(key);
    this.updateGlobalStyleClass(key, value);
  }
  updateGlobalStyleClass(key, value) {
    const sheetView = this._context.getSheetView();
    const classData = {
      properties:
        sheetView.model.theme().getStyle(PRESET_GLOBAL_STYLE_CLASS) ?? {},
    };
    if (isRemoveKey(value)) {
      delete classData.properties[key];
    } else {
      classData.properties[key] = value;
    }
    styleManager.updateClassIntoTheme(
      sheetView,
      PRESET_GLOBAL_STYLE_CLASS,
      classData,
      {
        newGlobalStyle: true,
      },
    );
  }
  clearUserStyle(styleKey) {
    switch (styleKey) {
      case STYLE_KEYS.LINE_WIDTH:
        return this.clearUserLineWidth();
      case STYLE_KEYS.FONT_FAMILY:
        return this.clearUserFontFamily();
      case STYLE_KEYS.LINE_TAPERED:
        return this.clearUserLineTapered();
      default:
    }
  }
  clearUserLineWidth() {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    const allBranchView = [
      centralBranchView,
      ...centralBranchView.getDescendantBranchesByType(ALL_TOPIC_TYPES),
    ];
    allBranchView.forEach((branchView) => {
      styleManager.fixUserStyle(branchView, {
        styleKeysToBeFix: [STYLE_KEYS.LINE_WIDTH],
      });
    });
  }
  clearUserLineTapered() {
    const sheetView = this._context.getSheetView();
    sheetView.model.changeStyle(STYLE_KEYS.LINE_TAPERED, null);
  }
  clearUserFontFamily() {
    const sheetView = this._context.getSheetView();
    getAllViewToFixUserStyle(sheetView).forEach((view) => {
      styleManager.fixUserStyle(view, {
        styleKeysToBeFix: [STYLE_KEYS.FONT_FAMILY],
      });
    });
  }
  clearThemePriorityGlobalFlag(styleKey) {
    const theme = this._context.model.theme().toJSON();
    const sheetView = this._context.getSheetView();
    for (const className in theme) {
      if (!(theme[className] instanceof Object)) {
        continue;
      }
      const { properties } = theme[className];
      const targetGlobalFlag = `${PRESET_GLOBAL_STYLE_CLASS}_${styleKey}`;
      if (targetGlobalFlag in (properties ?? {})) {
        styleManager.removeStyleFromClass(sheetView, className, [
          targetGlobalFlag,
        ]);
      }
    }
  }
}
