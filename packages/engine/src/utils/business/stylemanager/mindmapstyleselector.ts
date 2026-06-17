/* eslint-disable @typescript-eslint/no-unused-vars */
import defaultStyles from "./defaultstyles";

import {
  STYLE_KEYS,
  STYLE_LAYER,
  STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
  STYLE_PARENT_GROUP,
  PRESET_GLOBAL_STYLE_CLASS,
  PRIVATE_TOPICSHAPE,
  PRIVATE_TOPICSHAPE_FALLBACK,
  CONFIG,
  DEAFULT_FONT_FAMILT,
  MODULE_NAME,
  CLASS_TYPE,
} from "../../../common/constants/index";

import * as patternConfigurations from "../../patternmanager/configurations";

import * as snowBallLibConstant from "../../../snowball/lib/common/constant";

import * as snowBrushRender from "../../index";

const SPECIAL_HANDLE_KEYS = [STYLE_KEYS.FONT_FAMILY];
// @link https://gitlab.xmind.cn/xmind/snowbrush/issues/1059
const OverridedResultStyle = (target) => {
  return class MindMapStyleSelector extends target {
    getStyleValue(target, key, options = {}) {
      const value = super.getStyleValue(
        target,
        key,
        Object.assign(Object.assign({}, options), {
          ignoreDynamicPriorityOverridedStyle: true,
          ignoreCompatibilityFix: true,
        }),
      );
      return this.getOverridedValue(target, key, value, options);
    }
    getOverridedValue(target, key, value, options) {
      const fixerChain = [this.getOverridedHandDrawnModeValue];
      return fixerChain.reduce((value, fixFunc) => {
        return fixFunc.bind(this)(target, key, value, options);
      }, value);
    }
    getDynamicProprityOverridedValue(
      target,
      overrideStyleId,
      key,
      value,
      options,
    ) {
      const userLayerValue = super.getUserStyleValue(target, key);
      if (userLayerValue && userLayerValue === value) {
        return value;
      }
      const themeLayerValue = super.getThemeStyleValue(target, key);
      const dynamicPriorityLayerValue = super.getLayeredStyleValue(
        target,
        STYLE_LAYER.DYNAMIC_PRIORITY,
        key,
        options,
      );
      const shouldUseThemeValue = super.getThemeStyleValue(
        target,
        `${overrideStyleId}_${key}`,
      );
      if (shouldUseThemeValue) {
        return themeLayerValue;
      } else {
        return dynamicPriorityLayerValue;
      }
    }
    getDynamicProprityOverridedValueForFontFamily(
      target,
      overrideStyleId,
      key,
      value,
      options,
    ) {
      let _a;
      let _c;
      let finalValue = [];
      const fontFamilyList = value.split(",");
      finalValue = [...fontFamilyList];
      const userValueList =
        ((_a = super.getUserStyleValue(target, key)) === null ||
        _a === undefined
          ? undefined
          : _a.split(",")) ?? [];
      const globalFontFamily = this.getGlobalStyleValue(target, key);
      const globalFontFamilyList = globalFontFamily
        ? globalFontFamily.split(",")
        : [];
      if (!userValueList.length) {
        const dynamicPriorityLayerValueList =
          ((_c = super.getLayeredStyleValue(
            target,
            STYLE_LAYER.DYNAMIC_PRIORITY,
            key,
            options,
          )) === null || _c === undefined
            ? undefined
            : _c.split(",")) ?? [];
        const shouldUseOriginalValue = super.getThemeStyleValue(
          target,
          `${overrideStyleId}_${key}`,
        );
        if (!shouldUseOriginalValue) {
          finalValue = Array.from(
            new Set([
              ...globalFontFamilyList,
              ...dynamicPriorityLayerValueList,
              ...finalValue,
            ]),
          );
        }
      }
      return finalValue.join(",");
    }
    getOverridedHandDrawnModeValue(target, key, value, options) {
      const sheetEditor = target.getContext();
      if (options.ignoreDynamicPriorityOverridedStyle) {
        return value;
      }
      if (
        !(sheetEditor === null || sheetEditor === undefined
          ? undefined
          : sheetEditor.model.getHandDrawnModeActive())
      ) {
        return value;
      }
      if (!Object.keys(patternConfigurations).includes(key)) {
        return value;
      }
      if (key === STYLE_KEYS.FONT_FAMILY) {
        return this.getDynamicProprityOverridedValueForFontFamily(
          target,
          STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
          key,
          value,
          options,
        );
      } else {
        return this.getDynamicProprityOverridedValue(
          target,
          STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
          key,
          value,
          options,
        );
      }
    }
  } as typeof target;
};

@OverridedResultStyle
export class MindMapStyleSelector {
  /**
   * @param {*} target
   * @param {*} key
   * @param {*} options
   */
  getStyleValue(target, key, options: any = {}) {
    key = this.protectedHandleKey(target, key, options);
    let value;
    // Special handle
    if (!options.ignoreSpecialHandle) {
      if (SPECIAL_HANDLE_KEYS.includes(key)) {
        return this._getSpecialHandleValue(target, key, options);
      }
    }
    if (!options.ignoreUser) {
      if (!options.ignoreLayeredBeforeUser) {
        value = this.getLayeredStyleValue(
          target,
          STYLE_LAYER.BEFORE_USER,
          key,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      value = this.getUserStyleValue(target, key);
      if (this.isValidValue(target, key, value)) {
        return value;
      }
    }
    if (!options.ignoreClass) {
      if (!options.ignoreParent) {
        value = this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_CLASS_GROUP,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      if (!options.ignoreLayeredBeforeClass) {
        value = this.getLayeredStyleValue(
          target,
          STYLE_LAYER.BEFORE_CLASS,
          key,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      value = this.getUserClassValue(target, key);
      if (this.isValidValue(target, key, value)) {
        return value;
      }
    }
    if (!options.ignoreTheme) {
      if (!options.ignoreParent) {
        value = this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_THEME_GROUP,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      if (!options.ignoreLayeredBeforeTheme) {
        value = this.getLayeredStyleValue(
          target,
          STYLE_LAYER.BEFORE_THEME,
          key,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      // todo getThemeStyleValue 提前整合了 defaultStyleValue，可能导致后面 ignoreDefault 永远不会被执行
      value = this.getThemeStyleValue(target, key, options);
      if (this.isValidValue(target, key, value)) {
        return value;
      }
    }
    if (!options.ignoreDefault) {
      if (!options.ignoreParent) {
        value = this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_DEFAULT_GROUP,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      if (options.defaultStyleProvider) {
        value = options.defaultStyleProvider.getValue(target, key);
        if (
          this.isValidValue(target, key, value) ||
          options.defaultStyleProvider.isKeyInteresting(target, key)
        ) {
          return value;
        }
      }
      if (!options.ignoreLayeredBeforeDefault) {
        value = this.getLayeredStyleValue(
          target,
          STYLE_LAYER.BEFORE_DEFAULT,
          key,
          options,
        );
        if (this.isValidValue(target, key, value)) {
          return value;
        }
      }
      value = this.getDefaultStyleValue(target, key);
      if (this.isValidValue(target, key, value)) {
        return value;
      }
    }
    return value;
  }
  getGlobalStyleValue(target, key) {
    const shouldUseThemeValue = this.getThemeStyleValue(
      target,
      `${PRESET_GLOBAL_STYLE_CLASS}_${key}`,
    );
    if (shouldUseThemeValue) {
      return null;
    }
    const theme = this.getTheme(target);
    let value =
      (theme === null || theme === undefined
        ? undefined
        : theme.getStyleValue(PRESET_GLOBAL_STYLE_CLASS, key)) || null;
    if (!this.isValidValue(target, key, value)) {
      value = null;
    }
    return value;
  }
  getDataStyleValue(target, key) {
    let value = this.getStyleValue(target, key, {
      ignoreLayeredBeforeUser: true,
    });
    if (PRIVATE_TOPICSHAPE.includes(value)) {
      value = PRIVATE_TOPICSHAPE_FALLBACK[value];
    }
    return value;
  }
  _getSpecialHandleValue(target, key, options = {}) {
    if (key === STYLE_KEYS.FONT_FAMILY) {
      return this.getSpecialHandleFontFamily(target, options);
    }
  }
  getSpecialHandleFontFamily(target, options: any = {}) {
    const key = STYLE_KEYS.FONT_FAMILY;
    let familyArr = [];
    if (!options.ignoreUser) {
      if (!options.ignoreLayeredBeforeUser) {
        familyArr.push(
          this.getLayeredStyleValue(
            target,
            STYLE_LAYER.BEFORE_USER,
            key,
            options,
          ),
        );
      }
      familyArr.push(this.getUserStyleValue(target, key, options));
    }
    if (!options.ignoreParent) {
      familyArr.push(
        this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_CLASS_GROUP,
          options,
        ),
      );
    }
    if (!options.ignoreClass) {
      if (!options.ignoreLayeredBeforeClass) {
        familyArr.push(
          this.getLayeredStyleValue(
            target,
            STYLE_LAYER.BEFORE_CLASS,
            key,
            options,
          ),
        );
      }
      familyArr.push(this.getUserClassValue(target, key, options));
    }
    if (!options.ignoreParent) {
      familyArr.push(
        this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_THEME_GROUP,
          options,
        ),
      );
    }
    if (!options.ignoreTheme) {
      if (!options.ignoreLayeredBeforeTheme) {
        familyArr.push(
          this.getLayeredStyleValue(
            target,
            STYLE_LAYER.BEFORE_THEME,
            key,
            options,
          ),
        );
      }
      familyArr.push(this.getThemeStyleValue(target, key, options));
    }
    if (!options.ignoreParent) {
      familyArr.push(
        this.getParentStyleValue(
          target,
          key,
          STYLE_PARENT_GROUP.BEFORE_DEFAULT_GROUP,
          options,
        ),
      );
    }
    //CJK
    const sheetView = target.getContext().getSheetView();
    const cjkFontFamily = sheetView.figure.cjkFontFamily;
    familyArr.push(cjkFontFamily);
    familyArr.push(target.getContext().config(CONFIG.CJK_FONT_FAMILY));
    if (!options.ignoreDefault) {
      if (!options.ignoreLayeredBeforeDefault) {
        familyArr.push(
          this.getLayeredStyleValue(
            target,
            STYLE_LAYER.BEFORE_DEFAULT,
            key,
            options,
          ),
        );
      }
      familyArr.push(this.getDefaultStyleValue(target, key, options));
    }
    familyArr = familyArr.filter((item) => item && item !== "$system$");
    familyArr = familyArr.concat(DEAFULT_FONT_FAMILT.split(","));
    familyArr = familyArr.reduce((arr, item) => {
      return arr.concat(item.split(","));
    }, []);
    return Array.from(
      new Set(
        familyArr
          .map((item) => {
            if (item[0] === "'" || item[0] === '"') {
              return item;
            }
            return `'${item}'`;
          })
          .concat("sans-serif"),
      ),
    ).join(","); //sans-serif is generic family!!!
  }
  protectedHandleKey(target, key, options = {}) {
    return key;
  }
  getUserStyle(target, options = {}) {
    return this.protectedGetModel(target).style();
  }
  getUserStyleValue(target, key, options = {}) {
    return this.protectedGetModel(target).getStyleValue(key);
  }
  getClassList(target, options = {}) {
    return this.protectedGetModel(target).classList();
  }
  getUserClassValue(target, key, options = {}) {
    const classList = this.getClassList(target, options);
    const theme = this.getTheme(target, options);
    let value;
    if (theme) {
      for (const className of classList) {
        const thisValue = theme.getStyleValue(className, key);
        if (this.isValidValue(target, key, thisValue)) {
          value = thisValue;
        }
      }
    }
    return value;
  }
  getTheme(target, options?) {
    const theme = this.protectedGetModel(target).ownerSheet().theme();
    if (theme) {
      return theme;
    }
  }
  getThemeStyleValue(target, key, options = {}) {
    const className = this.getSuggestedClassName(target, options);
    const theme = this.getTheme(target, options);
    const value = theme && theme.getStyleValue(className, key);
    return value;
  }
  getDefaultStyleValue(target, key, options = {}) {
    const className = this.getClassName(target, options);
    return defaultStyles.getStyleValue(className, key);
  }
  getLayeredStyleValue(target, layerName, key, options = {}) {
    const overridedStyleManager = this._getOverridedStyleManager(target);
    return (
      overridedStyleManager &&
      overridedStyleManager.getStyleValue(layerName, key, target, options)
    );
  }
  _getOverridedStyleManager(target) {
    return target.getModule(MODULE_NAME.OVERRIDE_STYLE);
  }
  getComputedStyle(target) {
    const toComputedStyleKeys = this.protectedGetComputedStyleKeys(target);
    const computedStyle = {};
    toComputedStyleKeys.forEach((styleKey) => {
      const value = this.getStyleValue(target, styleKey);
      if (value) {
        computedStyle[styleKey] = value;
      }
    });
    return computedStyle;
  }

  protectedGetComputedStyleKeys(target, options?) {
    return [];
  }
  /**
   * @description [protected] Only subclass can invoke or override it
   * @param {*} target
   */
  protectedGetModel(target) {
    return target.model;
  }
  /**
   * @description [protected] Only subclass MUST override it
   * @param {*} target
   */
  protectedFindStyleSelector(target): any {
    return;
  }
  getParentStyleValue(target, key, level, options = {}) {
    const value = this.getLayeredStyleValue(
      target,
      STYLE_LAYER.BEFORE_PARENT,
      key,
    );
    if (this.isValidValue(target, key, value)) {
      return value;
    }
    return this.protectedParentStyleValue(target, level, key, options);
  }
  /**
   * @description [protected] Subclass can invoke or override it
   */
  protectedParentStyleValue(target, level, key, options) {
    if (level === STYLE_PARENT_GROUP.BEFORE_CLASS_GROUP) {
      if (key === STYLE_KEYS.LINE_WIDTH) {
        return null;
      }
      return this.getGlobalStyleValue(target, key);
    }
  }
  isValidValue(target, key, value, ignoreProtectedPrivateStyleValue?) {
    const shouldIgnoreProtectedPrivateStyleValue = () => {
      if (
        ignoreProtectedPrivateStyleValue &&
        PRIVATE_TOPICSHAPE.includes(value)
      ) {
        return true;
      }
    };
    return (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !shouldIgnoreProtectedPrivateStyleValue()
    );
  }
  /**
   * @description Subclass should override it
   * @param {*} target
   * @param {*} options
   * @returns {string}
   */
  getClassName(target, options = {}) {
    return "";
  }
  /**
   * @description Subclass can override it
   * @param {*} target
   * @param {*} options
   * @returns CLASS_TYPE
   */
  getSuggestedClassName(target, options = {}) {
    return this.getClassName(target, options);
  }
  /**
   * @description Subclass can override it
   * @param {*} target
   * @param {*} options
   */
  changeTheme(target, newTheme, options) {}
  /**
   * @description Subclass can override it
   * @param {*} target
   */
  updateClassIntoTheme(target, className, classData, options) {}
  removeStyleFromClass(target, className, styleKeys) {}
  removeClassFromTheme(target, classNames = []) {}
  getFontInfo(target) {
    return {
      color: this.getStyleValue(target, STYLE_KEYS.TEXT_COLOR),
      fontSize: this.getStyleValue(target, STYLE_KEYS.FONT_SIZE),
      fontFamily: this.getStyleValue(target, STYLE_KEYS.FONT_FAMILY),
      fontStyle: this.getStyleValue(target, STYLE_KEYS.FONT_STYLE),
      fontWeight: this.getStyleValue(target, STYLE_KEYS.FONT_WEIGHT),
      textAlign: this.getStyleValue(target, STYLE_KEYS.TEXT_ALIGN),
      textTransform: this.getStyleValue(target, STYLE_KEYS.TEXT_TRANSFORM),
      textDecoration: this.getStyleValue(target, STYLE_KEYS.TEXT_DECORATION),
    };
  }
  fixUserStyle(target, options) {
    const userStyle =
      this.protectedFindStyleSelector(target).getUserStyle(target);
    if (!userStyle) {
      return;
    }
    const userStyleData = userStyle.toJSON();
    const styleSelector = this.protectedFindStyleSelector(target);
    const styleKeysToBeFixedByTheme = this.getStyleKeysToBeFixByTheme(
      target,
      options,
    );
    userStyle.keys().forEach((styleKey) => {
      const userValue = userStyle.getValue(styleKey);
      const classValue = styleSelector.getUserClassValue(target, styleKey);
      const themeValue = styleSelector.getThemeStyleValue(target, styleKey);
      const isUserValueInThemeData =
        userValue === classValue || userValue === themeValue;
      if (
        isUserValueInThemeData ||
        styleKeysToBeFixedByTheme.includes(styleKey)
      ) {
        delete userStyleData.properties[styleKey];
        // special treat
        if (styleKey === STYLE_KEYS.FILL_COLOR) {
          const fixedFillColor = this.getFixedUserFillColor(
            target,
            userValue,
            options,
          );
          if (fixedFillColor) {
            userStyleData.properties[styleKey] = fixedFillColor;
          }
        }
      }
    });
    this.protectedGetModel(target).setStyleObj(userStyleData);
  }
  getStyleKeysToBeFixByTheme(target, options) {
    const className = this.getClassName(target, options);
    if (Array.isArray(options?.styleKeysToBeFix)) {
      return options.styleKeysToBeFix;
    } else {
      return (
        (options?.styleKeysToBeFix ?? {})[className] ??
        this.getDefaultStyleKeysToBeFixByTheme()
      );
    }
  }
  getDefaultStyleKeysToBeFixByTheme() {
    return [];
  }
  getFixedUserFillColor(target, originalUserFillColor, options) {
    if (options.newColorTheme) {
      if (!originalUserFillColor) {
        return;
      }
      if (originalUserFillColor === "none") {
        return originalUserFillColor;
      }
      const qucikClass = this.getClassList(target)[0];
      const themeValue = this.getThemeStyleValue(target, STYLE_KEYS.FILL_COLOR);
      if (qucikClass === CLASS_TYPE.EXPIRED_TOPIC) {
        if (themeValue) {
          return themeValue;
        }
      } else if (themeValue !== "none") {
        return;
      }
      const className = this.getClassName(target);
      const styleData = options.newColorTheme.theme[className];
      const colorThemeValue =
        styleData === null || styleData === undefined
          ? undefined
          : styleData.properties[STYLE_KEYS.FILL_COLOR];
      if (colorThemeValue) {
        return colorThemeValue;
      }
      return Object(snowBrushRender.getSmartFillColorByLineColor)(
        target,
        this.getStyleValue(target, STYLE_KEYS.LINE_COLOR),
      );
    } else if (options.newSkeletonTheme) {
      if (!originalUserFillColor) {
        return;
      }
      let className;
      if (Object(snowBrushRender.isCentralBranch)(target)) {
        className = this.getClassName(target);
      } else {
        className = this.getClassList(target)[0] || this.getClassName(target);
      }
      if (snowBallLibConstant.QUICK_TOPIC_CLASS_TYPE_LIST.includes(className)) {
        return originalUserFillColor;
      } else {
        const styleData = options.newSkeletonTheme.theme[className];
        const skeletonThemeValue =
          styleData === null || styleData === undefined
            ? undefined
            : styleData.properties[STYLE_KEYS.FILL_COLOR];
        if (skeletonThemeValue === "none") {
          return;
        }
        if (originalUserFillColor === "none") {
          return;
        }
        return originalUserFillColor;
      }
    } else if (options.newMultiLineColors) {
      const themeValue = this.getThemeStyleValue(target, STYLE_KEYS.FILL_COLOR);
      if (themeValue !== "none") {
        return;
      }
      return Object(snowBrushRender.getSmartFillColorByLineColor)(
        target,
        this.getStyleValue(target, STYLE_KEYS.LINE_COLOR),
      );
    }
  }
}

export default MindMapStyleSelector;
