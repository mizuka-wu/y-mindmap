import stylemanager from "./business/stylemanager/index";
import * as constants from "../common/constants/index";

import { getInjectModule } from "./injectmodule";

export function isPrivateStyleValue(styleValue) {
  return constants.PRIVATE_TOPICSHAPE.includes(styleValue);
}
export function getPrivateStyleValueFallBackValue(styleValue) {
  if (!isPrivateStyleValue) {
    return styleValue;
  }
  return constants.PRIVATE_TOPICSHAPE_FALLBACK[styleValue];
}
export function getSmartFillColorByLineColor(targetBranchView, lineColor) {
  const className = stylemanager.getClassName(targetBranchView);
  if (className === constants.CLASS_TYPE.MAIN_TOPIC) {
    return lineColor;
  } else if (className === constants.CLASS_TYPE.SUB_TOPIC) {
    const { snowballUtil } = getInjectModule(constants.MODULE_NAME.SNOWBALL);
    const svgFillColor = stylemanager.getStyleValue(
      targetBranchView.getContext().getSheetView(),
      constants.STYLE_KEYS.FILL_COLOR,
    );
    return snowballUtil.blendingColor(
      Object.assign(
        Object.assign({}, snowballUtil.hexStringToRgbObject(lineColor)),
        {
          a: 0.2,
        },
      ),
      svgFillColor,
    );
  }
  return lineColor;
}
export function getSuggestedTopicFillColor(targetBranchView) {
  let _a;
  let newFillColor = stylemanager.getStyleValue(
    targetBranchView,
    constants.STYLE_KEYS.FILL_COLOR,
    {
      ignoreUser: true,
      ignoreDefault: true,
    },
  );
  if (newFillColor && newFillColor !== "none") {
    return newFillColor;
  }
  const sheetView = targetBranchView.getContext().getSheetView();
  const { getColorThemeDataById } = getInjectModule(
    constants.MODULE_NAME.SNOWBALL,
  );
  const colorTheme = getColorThemeDataById(
    sheetView.model.theme().getColorThemeId(),
  );
  if (colorTheme) {
    if (newFillColor === "none") {
      const className =
        stylemanager.getClassList(targetBranchView)[0] ||
        stylemanager.getClassName(targetBranchView);
      newFillColor =
        (_a = colorTheme.theme[className]) === null || _a === undefined
          ? undefined
          : _a.properties[constants.STYLE_KEYS.FILL_COLOR];
    }
    if (!newFillColor) {
      const lineColor = stylemanager.getStyleValue(
        targetBranchView,
        constants.STYLE_KEYS.LINE_COLOR,
      );
      newFillColor = getSmartFillColorByLineColor(targetBranchView, lineColor);
    }
  } else {
    newFillColor = stylemanager.getDefaultStyleValue(
      targetBranchView,
      constants.STYLE_KEYS.FILL_COLOR,
    );
  }
  if (newFillColor === "none") {
    newFillColor = "#eeeeee";
  }
  return newFillColor;
} // @link https://gitlab.xmind.cn/morse/snowball/merge_requests/7
export function getDynamicMultiLineColorListWithPreset(sheetEditor) {
  let _a;
  const sheetView = sheetEditor.getSheetView();
  const snowball = getInjectModule(constants.MODULE_NAME.SNOWBALL);
  const currentMultiLineColor =
    (_a = stylemanager.getStyleValue(
      sheetView,
      constants.STYLE_KEYS.MULTI_LINE_COLORS,
    )) === null || _a === undefined
      ? undefined
      : _a.toUpperCase();
  const colorThemeId = sheetView.model.theme().getColorThemeId();
  let dynamicMultiLineColor;
  if (colorThemeId) {
    dynamicMultiLineColor =
      snowball.getMultiLineColorStringByColorThemeId(colorThemeId)[0];
  }
  const presetMultiLineColorList = snowball.getPresetMultiLineColorList();
  let resultMulitLineColorList;
  if (
    !dynamicMultiLineColor ||
    (!presetMultiLineColorList.includes(currentMultiLineColor) &&
      currentMultiLineColor !== dynamicMultiLineColor)
  ) {
    resultMulitLineColorList = [
      currentMultiLineColor,
      ...presetMultiLineColorList,
    ];
  } else {
    resultMulitLineColorList = [
      dynamicMultiLineColor,
      ...presetMultiLineColorList,
    ];
  }
  return resultMulitLineColorList
    .filter((colors) => colors && colors !== "none")
    .map((colorString) => {
      const colorList = colorString.split(" ");
      let newColorList = [...colorList];
      while (newColorList.length < 6) {
        newColorList = newColorList.concat(newColorList);
      }
      return newColorList.slice(0, 6).join(" ");
    });
}
