import MindMapStyleSelector from "./mindmapstyleselector";

import { styleSelectors } from "./styleselectors";

import {
  ALL_TOPIC_TYPES,
  MODULE_NAME,
  UI_STATUS,
  CLASS_TYPE,
  MAP_COLOR_STYLE_KEYS,
  MAP_SKELETON_STYLE_KEYS,
  STYLE_KEYS,
} from "../../../common/constants/index";

import * as commonUtils from "../../../common/utils/index";
export function getAllViewToFixUserStyle(sheetView) {
  const centralBranchView = sheetView.centralBranchView;
  const allChildrenBranchView = centralBranchView.getDescendantBranchesByType(
    ...ALL_TOPIC_TYPES,
  );
  const allViewToFixUserStyle = [];
  const allBranchView = [centralBranchView, ...allChildrenBranchView];
  const allRelationshipView = sheetView.relationships;
  allViewToFixUserStyle.push(...allBranchView, ...allRelationshipView);
  return allViewToFixUserStyle;
}

class SheetStyleSelector extends MindMapStyleSelector {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getClassName(sheetView, options = {}) {
    return CLASS_TYPE.MAP;
  }
  changeTheme(target, newTheme, options) {
    const semaphoreModule = target
      .getContext()
      .getModule(MODULE_NAME.SEMAPHORE);
    semaphoreModule.increase(UI_STATUS.CHANGING_THEME);
    const defaultOptions = {
      toFixUserStyle: true,
    };
    options = Object.assign({}, defaultOptions, options);
    const sheetView = target.getContext().getSheetView();
    if (options.toFixUserStyle) {
      options.fixUserStyleWhenChangeTheme = () =>
        this.fixUserStyle(sheetView, options);
    }
    this.protectedGetModel(sheetView).changeTheme(newTheme, options);
    semaphoreModule.decrease(UI_STATUS.CHANGING_THEME);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedGetComputedStyleKeys(target) {
    return [...MAP_COLOR_STYLE_KEYS, ...MAP_SKELETON_STYLE_KEYS];
  }
  fixUserStyle(sheetView, options) {
    getAllViewToFixUserStyle(sheetView).forEach((view) => {
      this.protectedFindStyleSelector(view).fixUserStyle(view, options);
    });
    this._fixSheetUserStyleWhenChangeTheme(sheetView, options);
  }
  _fixSheetUserStyleWhenChangeTheme(sheetView, options) {
    const userStyle = this.getUserStyle(sheetView);
    if (!userStyle) {
      return;
    }
    const styleKeysToBeFixByTheme = this.getStyleKeysToBeFixByTheme(
      sheetView,
      options,
    );
    const styleObj = {
      properties: {},
    };
    const styleKeysArr = userStyle.keys();
    for (const styleKey of styleKeysArr) {
      const oldUserValue = this.getUserStyleValue(sheetView, styleKey);
      const classValue = this.getUserClassValue(sheetView, styleKey);
      const themeValue = this.getThemeStyleValue(sheetView, styleKey);
      const needToFixByTheme = styleKeysToBeFixByTheme.includes(styleKey);
      const needToFixByThemeClass =
        oldUserValue === classValue || oldUserValue === themeValue;
      if (oldUserValue && !needToFixByTheme && !needToFixByThemeClass) {
        styleObj.properties[styleKey] = oldUserValue;
      }
    }
    this.protectedGetModel(sheetView).setStyleObj(styleObj);
  }
  updateClassIntoTheme(target, className, classData, options: any = {}) {
    const sheetView = target.getContext().getSheetView();
    const themeContent = this.getTheme(sheetView).toJSON();
    themeContent[className] = {
      id: Object(commonUtils.UUID)(),
      properties: options.isMerge
        ? (themeContent[className]?.properties ?? {})
        : {},
    };
    for (const key in classData.properties) {
      themeContent[className].properties[key] = classData.properties[key];
    }
    this.changeTheme(
      sheetView,
      themeContent,
      Object.assign(Object.assign({}, options), {
        toFixUserStyle: false,
      }),
    );
  }
  removeClassFromTheme(target, classNames = []) {
    const sheetView = target.getContext().getSheetView();
    const themeContent = this.getTheme(sheetView).toJSON();
    classNames.forEach((className) => {
      delete themeContent[className];
    });
    this.changeTheme(sheetView, themeContent, {
      toFixUserStyle: false,
    });
  }
  removeStyleFromClass(target, className, styleKeys) {
    const sheetView = target.getContext().getSheetView();
    const themeContent = this.getTheme(sheetView).toJSON();
    const properties = themeContent[className]?.properties;
    if (!properties) {
      return;
    }
    for (const styleKey of styleKeys) {
      delete properties[styleKey];
    }
    themeContent[className].properties = properties;
    this.changeTheme(sheetView, themeContent, {
      toFixUserStyle: false,
    });
  }
  protectedFindStyleSelector(target) {
    return styleSelectors(target);
  }
  getDefaultStyleKeysToBeFixByTheme() {
    return [
      STYLE_KEYS.FILL_COLOR,
      STYLE_KEYS.LINE_TAPERED,
      STYLE_KEYS.MULTI_LINE_COLORS,
    ];
  }
  protectedParentStyleValue(target, level, key, options) {
    const superValue = super.protectedParentStyleValue(
      target,
      level,
      key,
      options,
    );
    if (superValue) {
      return superValue;
    }
    return null;
  }
}
/* harmony default export */
export const sheetStyleSelector = new SheetStyleSelector();
export default sheetStyleSelector;
