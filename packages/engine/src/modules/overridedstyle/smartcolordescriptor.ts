import {
  STYLE_LAYER,
  STYLE_KEYS,
  CLASS_TYPE,
  MODULE_NAME,
  VISUAL_BACK_COLOR,
} from "../../common/constants/index";

import styleManager from "../../utils/business/stylemanager/index";

import * as utils from "../../utils/index";

import BranchView from "../../view/branchview";
import BoundaryView from "../../view/boundaryview";
import RelationshipView from "../../view/relationshipview";
import { styleSelectors } from "../../utils/business/stylemanager/styleselectors";
const not = (test) => (m) => !test(m);
const and = (...args) => {
  return (m) => args.every((fn) => fn(m));
};
const or = (...args) => {
  return (m) => args.some((fn) => fn(m));
};
const isType = (type) => (target) => styleManager.getClassName(target) === type;

const whiteTextColor = "#ffffff";
const smartcolordescriptor_blackTextColor = "#000000";
function isTopicFillColorNone(branchView) {
  const userStyle = styleManager.getUserStyleValue(
    branchView,
    STYLE_KEYS.FILL_COLOR,
  );
  if (userStyle === "none") {
    return true;
  }
  const theme = styleManager.getTheme(branchView);
  if (!Object.keys(theme.toJSON()).length) {
    const defaultStyle = styleManager.getDefaultStyleValue(
      branchView,
      STYLE_KEYS.FILL_COLOR,
    );
    return defaultStyle === "none";
  } else {
    const themeStyle = styleManager.getThemeStyleValue(
      branchView,
      STYLE_KEYS.FILL_COLOR,
    );
    return themeStyle === "none";
  }
}
function hasColorTheme(targetView) {
  const currentColorTheme = getCurrentColorTheme(targetView);
  return !!currentColorTheme;
}
function isBoundaryView(boundaryView) {
  return boundaryView instanceof BoundaryView;
}
function isRelationshipView(relationshipView) {
  return relationshipView instanceof RelationshipView;
}
function isAncestorFloating(branchView) {
  if (!isType(CLASS_TYPE.SUB_TOPIC)(branchView)) {
    return false;
  }
  const parentBranchView = branchView.parent();
  if (!(parentBranchView instanceof BranchView)) {
    return false;
  }
  const parentClassType = styleManager.getClassName(parentBranchView);
  if (parentClassType === CLASS_TYPE.FLOATING_TOPIC) {
    return true;
  }
  if (parentClassType === CLASS_TYPE.MAIN_TOPIC) {
    return false;
  }
  return isAncestorFloating(parentBranchView);
}
function smartcolordescriptor_getSmartTextColor(targetView, colorList) {
  const sheetEditor = targetView.getContext();
  let fillColor;
  if (targetView instanceof BranchView) {
    fillColor = targetView.topicView.figure.visualFillColor;
  } else if (targetView instanceof BoundaryView) {
    fillColor = targetView.figure.lineColor;
  } else if (targetView instanceof RelationshipView) {
    fillColor = "none";
  }
  if (fillColor === "none") {
    fillColor = sheetEditor.getSheetView().figure.backgroundColor;
  }
  const { getSmartTextColor, snowballUtil } = utils.getInjectModule(
    MODULE_NAME.SNOWBALL,
  );
  const visualFillColor = snowballUtil.blendingColor(
    fillColor,
    VISUAL_BACK_COLOR,
  );
  return getSmartTextColor(visualFillColor, colorList);
}
function getCurrentColorTheme(targetView) {
  const { getColorThemeDataById } = utils.getInjectModule(MODULE_NAME.SNOWBALL);
  const sheetEditor = targetView.getContext();
  return getColorThemeDataById(sheetEditor.model.theme().getColorThemeId());
}
export const smartColorDescriptor = {
  [STYLE_LAYER.BEFORE_THEME]: [
    // for smart fill color
    {
      type: STYLE_KEYS.FILL_COLOR,
      value: (branchView) => {
        return Object(utils.getSmartFillColorByLineColor)(
          branchView,
          branchView.figure.lineColor,
        );
      },
      test: and(
        utils.isBranch,
        utils.isInMultiLineColorsMode,
        not(isTopicFillColorNone),
        hasColorTheme,
      ),
    },
    // for smart text color
    {
      type: STYLE_KEYS.TEXT_COLOR,
      value: (branchView) => {
        const currentColorTheme = getCurrentColorTheme(branchView);
        if (!currentColorTheme) {
          return;
        }
        const colorThemeCentralTopicFillColor =
          currentColorTheme.theme[CLASS_TYPE.CENTRAL_TOPIC].properties[
            STYLE_KEYS.FILL_COLOR
          ];
        const visualFillColor = branchView.topicView.figure.visualFillColor;
        if (!visualFillColor) {
          return;
        }
        const { snowballUtil, snowballConstant } = Object(
          utils.getInjectModule,
        )(MODULE_NAME.SNOWBALL);
        if (
          snowballUtil.calculateRatio(
            visualFillColor,
            colorThemeCentralTopicFillColor,
          ) >= snowballConstant.TEXT_MIN_RATIO
        ) {
          return colorThemeCentralTopicFillColor;
        }
      },
      test: and(
        utils.isBranch,
        isType(CLASS_TYPE.CENTRAL_TOPIC),
        isTopicFillColorNone,
        hasColorTheme,
      ),
    },
    {
      type: STYLE_KEYS.TEXT_COLOR,
      value: (targetView) => {
        let _a;
        const sheetView = targetView.getContext().getSheetView();
        const colorList = ((_a = styleManager.getThemeStyleValue(
          sheetView,
          STYLE_KEYS.COLOR_LIST,
        )) === null || _a === undefined
          ? undefined
          : _a.split(" ")) ?? [
          smartcolordescriptor_blackTextColor,
          whiteTextColor,
        ];
        return smartcolordescriptor_getSmartTextColor(targetView, colorList);
      },
      test: and(
        or(isBoundaryView, isRelationshipView, (targetView) => {
          if (!Object(utils.isInMultiLineColorsMode)(targetView)) {
            return true;
          } else {
            if (isType(CLASS_TYPE.MAIN_TOPIC)(targetView)) {
              return false;
            }
            if (isType(CLASS_TYPE.SUB_TOPIC)(targetView)) {
              return isAncestorFloating(targetView);
            }
            return true;
          }
        }),
        hasColorTheme,
      ),
    },
    {
      type: STYLE_KEYS.TEXT_COLOR,
      value: (branchView) => {
        return smartcolordescriptor_getSmartTextColor(branchView, [
          whiteTextColor,
          smartcolordescriptor_blackTextColor,
        ]);
      },
      test: and(
        utils.isBranch,
        utils.isInMultiLineColorsMode,
        isType(CLASS_TYPE.MAIN_TOPIC),
        hasColorTheme,
      ),
    },
    {
      type: STYLE_KEYS.TEXT_COLOR,
      value: (branchView) => {
        const { snowballUtil } = Object(utils.getInjectModule)(
          MODULE_NAME.SNOWBALL,
        );
        let lineColor =
          styleSelectors(branchView).getMultiLineColor(branchView);
        if (!lineColor) {
          lineColor = branchView.figure.lineColor;
        }
        const { h, s } = snowballUtil.hexStringToHSLObject(lineColor);
        const blackTextColor = snowballUtil.hslObjectToHexString({
          h,
          s,
          l: 20,
        });
        return smartcolordescriptor_getSmartTextColor(branchView, [
          whiteTextColor,
          blackTextColor,
        ]);
      },
      test: and(
        utils.isBranch,
        utils.isInMultiLineColorsMode,
        isType(CLASS_TYPE.SUB_TOPIC),
        not(isAncestorFloating),
        hasColorTheme,
      ),
    },
  ],
};
