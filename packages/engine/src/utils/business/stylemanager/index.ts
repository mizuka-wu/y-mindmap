import {
  CLASS_TYPE,
  MODULE_NAME,
  STYLE_KEYS,
} from "../../../common/constants/index";

import { styleSelectors } from "./styleselectors";

import * as utils from "../../index";
class StyleManager {
  a: any;
  getStyleValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getStyleValue(target, key, options);
  }
  getUserStyle(target, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getUserStyle(target, options);
  }
  getUserStyleValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return (
      styleSelector && styleSelector.getUserStyleValue(target, key, options)
    );
  }
  getDataStyleValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getDataStyleValue(target, key);
  }
  getGlobalStyleValue(target, key) {
    let _a;
    const sheetView = target.getContext().getSheetView();
    if ((_a = this._getStyleSelector(sheetView)) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getGlobalStyleValue(sheetView, key);
    }
  }
  getClassList(target, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getClassList(target, options);
  }
  getUserClassValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return (
      styleSelector && styleSelector.getUserClassValue(target, key, options)
    );
  }
  getTheme(target, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getTheme(target, options);
  }
  getThemeStyleValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return (
      styleSelector && styleSelector.getThemeStyleValue(target, key, options)
    );
  }
  getDefaultStyleValue(target, key, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return (
      styleSelector && styleSelector.getDefaultStyleValue(target, key, options)
    );
  }
  getClassName(target, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return styleSelector && styleSelector.getClassName(target, options);
  }
  getActivedClassName(target, options = {}) {
    return (
      this.getClassList(target, options)[0] ||
      this.getClassName(target, options)
    );
  }
  getSuggestedClassName(target, options = {}) {
    const styleSelector = this._getStyleSelector(target, options);
    return (
      styleSelector && styleSelector.getSuggestedClassName(target, options)
    );
  }
  changeTheme(target, newTheme, options = {}) {
    const sheetView = target.getContext().getSheetView();
    const styleSelector = this._getStyleSelector(sheetView);
    sheetView.model.removeSkeletonStructureStyle();
    if (styleSelector === null || styleSelector === undefined) {
      return undefined;
    } else {
      return styleSelector.changeTheme(target, newTheme, options);
    }
  }
  changeSkeletonTheme(target, newSkeletonTheme, options) {
    const sheetView = target.getContext().getSheetView();
    const styleSelector = this._getStyleSelector(sheetView);
    const skeletonStructureStyle = newSkeletonTheme.structureStyle;
    sheetView.model.addSkeletonStructureStyle(skeletonStructureStyle);
    // set central topic's structure
    const centralBranchView = sheetView.getCentralBranchView();
    if (skeletonStructureStyle[CLASS_TYPE.CENTRAL_TOPIC]) {
      centralBranchView.model.changeStructure(
        skeletonStructureStyle[CLASS_TYPE.CENTRAL_TOPIC]
      );
    }
    const oldThemeData = target.getContext().getThemeDataToCombine();
    const snowball = Object(utils.getInjectModule)(MODULE_NAME.SNOWBALL);
    const newTheme = snowball.combineSkeletonTheme(
      oldThemeData,
      newSkeletonTheme,
      options
    );
    const styleKeysToBeFix = snowball.themeFragmentToStyleKeysToFix(
      newSkeletonTheme.theme
    );
    if (styleSelector === null || styleSelector === undefined) {
      return undefined;
    } else {
      return styleSelector.changeTheme(target, newTheme, {
        styleKeysToBeFix,
        newSkeletonTheme,
      });
    }
  }
  changeColorTheme(target, newColorTheme) {
    const sheetView = target.getContext().getSheetView();
    const styleSelector = this._getStyleSelector(sheetView);
    const oldThemeData = target.getContext().getThemeDataToCombine();
    const snowball = Object(utils.getInjectModule)(MODULE_NAME.SNOWBALL);
    const newTheme = snowball.combineColorTheme(oldThemeData, newColorTheme);
    const styleKeysToBeFix = snowball.themeFragmentToStyleKeysToFix(
      snowball.preTreatColorThemeFragment(oldThemeData, newColorTheme),
      true
    );
    if (styleSelector === null || styleSelector === undefined) {
      return undefined;
    } else {
      return styleSelector.changeTheme(target, newTheme, {
        styleKeysToBeFix,
        newColorTheme,
      });
    }
  }
  fixUserStyle(target, options = {}) {
    const styleSelector = this._getStyleSelector(target);
    return styleSelector && styleSelector.fixUserStyle(target, options);
  }
  updateClassIntoTheme(target, className, classData, options = {}) {
    const styleSelector = this._getStyleSelector(
      target.getContext().getSheetView()
    );
    return (
      styleSelector &&
      styleSelector.updateClassIntoTheme(target, className, classData, options)
    );
  }
  removeClassFromTheme(target, classNames) {
    const styleSelector = this._getStyleSelector(
      target.getContext().getSheetView()
    );
    return (
      styleSelector && styleSelector.removeClassFromTheme(target, classNames)
    );
  }
  removeStyleFromClass(target, className, styleKeys) {
    const styleSelector = this._getStyleSelector(
      target.getContext().getSheetView()
    );
    return (
      styleSelector &&
      styleSelector.removeStyleFromClass(target, className, styleKeys)
    );
  }
  getComputedStyle(target) {
    const styleSelector = this._getStyleSelector(target);
    return styleSelector && styleSelector.getComputedStyle(target);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _getStyleSelector(target, options = {}) {
    return styleSelectors(target);
  }
  /**
   * ===========================
   * Utils
   * ===========================
   */
  getFontInfo(target) {
    const styleSelector = this._getStyleSelector(target);
    return (styleSelector && styleSelector.getFontInfo(target)) ?? {};
  }
  getTitleTextStyle(topicModel) {
    return {
      fontFamily: topicModel.getStyleValue(STYLE_KEYS.FONT_FAMILY),
      fontStyle: topicModel.getStyleValue(STYLE_KEYS.FONT_STYLE),
      fontWeight: topicModel.getStyleValue(STYLE_KEYS.FONT_WEIGHT),
      fontSize: topicModel.getStyleValue(STYLE_KEYS.FONT_SIZE),
      textColor: topicModel.getStyleValue(STYLE_KEYS.TEXT_COLOR),
      textAlign: topicModel.getStyleValue(STYLE_KEYS.TEXT_ALIGN),
      textBullet: topicModel.getStyleValue(STYLE_KEYS.TEXT_BULLET),
      textTransform: topicModel.getStyleValue(STYLE_KEYS.TEXT_TRANSFORM),
      textDecoration: topicModel.getStyleValue(STYLE_KEYS.TEXT_DECORATION),
      textBackgroundColor: topicModel.getStyleValue(
        STYLE_KEYS.TEXT_BACKGROUND_COLOR
      ),
    };
  }
}

export const styleManager = new StyleManager();
export default styleManager;
