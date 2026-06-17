import {
  ACTION_NAMES,
  MODULE_NAME,
  CLASS_TYPE,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

import * as js_utils from "../../utils/index";

const change_multi_line_colors_classList = [
  CLASS_TYPE.MAIN_TOPIC,
  CLASS_TYPE.SUB_TOPIC,
];
const themeStyleKeyList = [STYLE_KEYS.TEXT_COLOR, STYLE_KEYS.FILL_COLOR];
export class ChangeMultiLineColorsAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_MULTI_LINE_COLORS;
  }
  doExecute({ multiLineColors }: any = {}) {
    const snowball = Object(js_utils.getInjectModule)(MODULE_NAME.SNOWBALL);
    const colorThemeId = this._context.model.theme().getColorThemeId();
    if (colorThemeId && snowball.isSmartColorTheme(colorThemeId)) {
      if (!multiLineColors || multiLineColors === "none") {
        this.restoreThemeData();
      } else {
        this.clearThemeData();
      }
    }
    this._context
      .getSVGView()
      .content()
      .model.changeStyle(STYLE_KEYS.MULTI_LINE_COLORS, multiLineColors);
  }
  clearThemeData() {
    const newThemeData = this._context.model.theme().toJSON();
    change_multi_line_colors_classList.forEach((className) => {
      if (!newThemeData[className] || !newThemeData[className].properties) {
        return;
      }
      themeStyleKeyList.forEach((styleKey) => {
        const styleValue = newThemeData[className].properties[styleKey];
        if (styleKey === STYLE_KEYS.FILL_COLOR && styleValue === "none") {
          return;
        }
        delete newThemeData[className].properties[styleKey];
      });
    });
    const styleKeysToBeFix = {};
    Object.values(CLASS_TYPE).forEach(
      (className) => (styleKeysToBeFix[className] = []),
    );
    const userStyleKeyList = [
      STYLE_KEYS.LINE_COLOR,
      STYLE_KEYS.FILL_COLOR,
      STYLE_KEYS.BORDER_LINE_COLOR,
      STYLE_KEYS.TEXT_COLOR,
    ];
    change_multi_line_colors_classList.forEach(
      (className) => (styleKeysToBeFix[className] = userStyleKeyList),
    );
    styleManager.changeTheme(this._context.getSheetView(), newThemeData, {
      styleKeysToBeFix,
      newMultiLineColors: true,
    });
  }
  restoreThemeData() {
    const colorThemeId = this._context.model.theme().getColorThemeId();
    const snowball = Object(js_utils.getInjectModule)(MODULE_NAME.SNOWBALL);
    const colorTheme = snowball.getColorThemeDataById(colorThemeId);
    const primaryColor0 =
      colorTheme.theme[CLASS_TYPE.MAP].properties[STYLE_KEYS.FILL_COLOR];
    const colorList =
      colorTheme.theme[CLASS_TYPE.MAP].properties[STYLE_KEYS.COLOR_LIST].split(
        " ",
      );
    const colorThemeDataWithAllStyle =
      snowball.generateSmartColorThemeWithAllStyleInfo(
        primaryColor0,
        colorList,
      );
    if (!colorThemeDataWithAllStyle) {
      return;
    }
    const newThemeData = this._context.model.theme().toJSON();
    change_multi_line_colors_classList.forEach((className) => {
      if (!newThemeData[className] || !newThemeData[className].properties) {
        return;
      }
      themeStyleKeyList.forEach((styleKey) => {
        const oldStyleValue = newThemeData[className].properties[styleKey];
        if (styleKey === STYLE_KEYS.FILL_COLOR && oldStyleValue === "none") {
          return;
        }
        const newStyleValue =
          colorThemeDataWithAllStyle.theme[className].properties[styleKey];
        if (newStyleValue) {
          newThemeData[className].properties[styleKey] = newStyleValue;
        }
      });
    });
    styleManager.changeTheme(this._context.getSheetView(), newThemeData, {
      toFixUserStyle: false,
    });
  }
}
