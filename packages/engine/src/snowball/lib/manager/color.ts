import * as constant from "../common/constant";
import {
  getMultiLineColorInfoList,
  calcPrimaryColorType,
  getRainbowPrimaryColorInfo,
  getMaxRatioColorFromList,
  themeListUniqueFilterById,
  hasMultiBranchLineColor,
  getPrimaryColorInfo,
  calculateRatio,
} from "../common/util";

import { colorThemes } from "../data/colorthemes";
import { colorThemeGroup } from "../data/colorthemegroup";
import { colorThemePreviews } from "../data/colorthemepreview";
import { colorThemeUiName } from "../data/colorthemeuiname";
import { featuredColorThemeIds } from "../data/featuredcolorthemeids";
import { SmartColorThemeGenerator } from "../generator/color/smartcolor";

export function getColorThemeOrderInfo(lang) {
  if (!lang) {
    lang = constant.LANGS.EN_US;
  }
  return constant.DEFAULT_COLOR_THEME_ORDER.map((themeName) => {
    // @ts-ignore
    const uiName =
      colorThemeUiName[themeName][lang] ??
      colorThemeUiName[themeName][constant.LANGS.EN_US];
    // @ts-ignore
    const filteredInfoList = colorThemeGroup[themeName].filter(
      (info) => !info.hidden,
    );
    const infoListWidthIndex = filteredInfoList
      .filter((info) => info.index !== undefined)
      .sort((a, b) => a.index - b.index);
    const infoListWidthoutIndex = filteredInfoList.filter(
      (info) => info.index === undefined,
    );
    return {
      themeName,
      uiName,
      // @ts-ignore
      idList: [...infoListWidthIndex, ...infoListWidthoutIndex].map(
        (info) => info.id,
      ),
    };
  });
}
let customColorThemes = [];
export function addCustomColorThemes(newCustomColorThemes) {
  customColorThemes = themeListUniqueFilterById([
    ...customColorThemes,
    ...newCustomColorThemes,
  ]);
}
export function getColorThemeDataById(colorThemeId) {
  // @ts-ignore
  return (
    [...colorThemes, ...customColorThemes].find(
      (colorTheme) => colorTheme.id === colorThemeId,
    ) ?? null
  );
}
export function getRandomColorThemeId() {
  const filteredColorThemes = colorThemes.filter(
    (colorTheme) => !colorTheme.hidden,
  );
  return filteredColorThemes[
    Math.floor(Math.random() * filteredColorThemes.length)
  ].id;
}
const colorThemePreviewPool = new Map();
function getColorThemePreviewFromPool(colorThemeId, previewType) {
  if (!colorThemePreviewPool.has(colorThemeId)) {
    return;
  }
  const targetPool = colorThemePreviewPool.get(colorThemeId);
  if (
    !(targetPool === null || targetPool === undefined
      ? undefined
      : targetPool.has(previewType))
  ) {
    return;
  }
  return targetPool.get(previewType);
}
function saveColorThemePreviewInPool(colorThemeId, previewType, previewString) {
  if (!colorThemePreviewPool.has(colorThemeId)) {
    const newTargetPool = new Map();
    newTargetPool.set(previewType, previewString);
    colorThemePreviewPool.set(colorThemeId, newTargetPool);
  } else {
    const targetPool = colorThemePreviewPool.get(colorThemeId);
    if (targetPool === null || targetPool === undefined) {
      // do nothing
    } else {
      targetPool.set(previewType, previewString);
    }
  }
}
export function preInitColorThemePreviewById(colorThemeId) {
  [
    constant.COLOR_THEME_PREVIEW_TYPE.MAP,
    constant.COLOR_THEME_PREVIEW_TYPE.TABLE,
  ].forEach((previewType) => {
    getColorThemePreviewById(colorThemeId, previewType);
  });
}
export function isSmartColorTheme(colorThemeIdOrFullData) {
  if (!colorThemeIdOrFullData) {
    return false;
  }
  let colorThemeId;
  let colorThemeData = null;
  if (typeof colorThemeIdOrFullData === "string") {
    colorThemeId = colorThemeIdOrFullData;
    colorThemeData = getColorThemeDataById(colorThemeId);
  } else {
    colorThemeData = colorThemeIdOrFullData;
    colorThemeId = colorThemeIdOrFullData.id;
  }
  if (!colorThemeData) {
    return false;
  }
  return !!constant.SMART_COLOR_THEME_NAME[colorThemeData.themeName];
}
export function getColorThemePreviewById(colorThemeIdOrFullData, previewType) {
  let colorThemeId;
  let colorThemeData = null;
  if (!colorThemeIdOrFullData) {
    return null;
  }
  if (typeof colorThemeIdOrFullData === "string") {
    colorThemeId = colorThemeIdOrFullData;
  } else {
    colorThemeData = colorThemeIdOrFullData;
    colorThemeId = colorThemeIdOrFullData.id;
  }
  const targetPreviewInPool = getColorThemePreviewFromPool(
    colorThemeId,
    previewType,
  );
  if (targetPreviewInPool) {
    return targetPreviewInPool;
  }
  if (!colorThemeData) {
    colorThemeData = getColorThemeDataById(colorThemeId);
  }
  if (!colorThemeData) {
    return null;
  }
  if (!previewType) {
    throw new Error("should pass color theme preview type!");
  }
  return getClassicColorThemePreview(colorThemeData, previewType);
}
function getClassicColorThemePreview(colorThemeData, previewType) {
  const isMultiBranchColorTheme = hasMultiBranchLineColor(
    colorThemeData.theme[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.MULTI_LINE_COLORS
    ],
  );
  const repalceDataMap: any = {};
  const colorList = getColorList(colorThemeData);
  repalceDataMap.colorList = colorList;
  // repalce line color list
  let lineColorList;
  const multiLineColors =
    colorThemeData.theme[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.MULTI_LINE_COLORS
    ];
  if (isMultiBranchColorTheme) {
    const multiColorArray = multiLineColors.split(" ");
    lineColorList = [multiColorArray[0], multiColorArray[2]];
  } else {
    const centralTopicLineColor =
      colorThemeData.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
        constant.STYLE_KEYS.LINE_COLOR
      ];
    lineColorList = [centralTopicLineColor, centralTopicLineColor];
  }
  repalceDataMap.lineColorList = lineColorList;
  // replace fill color list
  let fillColorList = [];
  const centralTopicFillColor =
    colorThemeData.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
      constant.STYLE_KEYS.FILL_COLOR
    ];
  const mainTopicFillColor =
    colorThemeData.theme[constant.CLASS_TYPE.MAIN_TOPIC].properties[
      constant.STYLE_KEYS.FILL_COLOR
    ];
  if (previewType === constant.COLOR_THEME_PREVIEW_TYPE.MAP) {
    fillColorList = [centralTopicFillColor, "none", mainTopicFillColor];
  } else {
    fillColorList = ["none", "none", centralTopicFillColor, mainTopicFillColor];
  }
  repalceDataMap.fillColorList = fillColorList;
  // replace border color list
  let borderColorList = [];
  const centralTopicBorderLineColor =
    colorThemeData.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
      constant.STYLE_KEYS.BORDER_LINE_COLOR
    ];
  const centralTopicLineColor =
    colorThemeData.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
      constant.STYLE_KEYS.LINE_COLOR
    ];
  if (previewType === constant.COLOR_THEME_PREVIEW_TYPE.MAP) {
    if (isMultiBranchColorTheme) {
      borderColorList = [
        centralTopicBorderLineColor,
        ...[...lineColorList].reverse(),
      ];
    } else {
      borderColorList = [
        centralTopicFillColor,
        centralTopicLineColor,
        mainTopicFillColor,
      ];
    }
  } else if (isMultiBranchColorTheme) {
    borderColorList = [
      centralTopicBorderLineColor,
      centralTopicBorderLineColor,
      centralTopicBorderLineColor,
      centralTopicBorderLineColor,
    ];
  } else {
    borderColorList = [
      centralTopicLineColor,
      centralTopicLineColor,
      centralTopicFillColor,
      mainTopicFillColor,
    ];
  }
  repalceDataMap.borderColorList = borderColorList;
  repalceDataMap.mapFill =
    colorThemeData.theme[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.FILL_COLOR
    ];
  // @ts-ignore
  const targetPreviewString =
    colorThemePreviews[
      `${previewType}-${colorList.length > 4 ? 4 : colorList.length < 3 ? 3 : colorList.length}`
    ](repalceDataMap);
  saveColorThemePreviewInPool(
    colorThemeData.id,
    previewType,
    targetPreviewString,
  );
  return targetPreviewString;
}
let customSmartColorThemeNameOrder = [];
function setCustomSmartColorThemeNameOrder(newCustomSmartColorThemeListOrder) {
  customSmartColorThemeNameOrder = [...newCustomSmartColorThemeListOrder];
}
function getSmartColorThemeNameOrder() {
  return [
    ...constant.SMART_COLOR_THEME_NAME_ORDER,
    ...customSmartColorThemeNameOrder,
  ];
}
let customSmartColorThemeColorListMap = {};
function setCustomSmartColorThemeColorListMap(
  newCustomSmartColorThemeColorListMap,
) {
  customSmartColorThemeColorListMap = Object.assign(
    {},
    newCustomSmartColorThemeColorListMap,
  );
}
function getSmartColorThemeColorListMap() {
  return Object.assign(
    Object.assign({}, constant.SMART_COLOR_THEME_COLOR_LIST_MAP),
    customSmartColorThemeColorListMap,
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let customSmartColorThemeIdListMap = {};
function setCustomSmartColorThemeIdListMap(newCustomSmartColorThemeIdListMap) {
  customSmartColorThemeIdListMap = Object.assign(
    {},
    newCustomSmartColorThemeIdListMap,
  );
}
export function generateCustomSmartColorThemeInfo(smartColorThemeOriginInfo) {
  const result = {};
  Object.keys(smartColorThemeOriginInfo).forEach((themeName) => {
    const colorList = smartColorThemeOriginInfo[themeName];
    const colorThemes = new SmartColorThemeGenerator(
      colorList,
      themeName,
    ).generateColorThemeList();
    result[themeName] = colorThemes;
  });
  return result;
}
export function generateSmartColorThemeWithAllStyleInfo(
  primaryColor0,
  colorList,
) {
  const themeName = "templateTheme";
  const primaryColorType = calcPrimaryColorType(primaryColor0);
  const smartColorGenerator = new SmartColorThemeGenerator(
    colorList,
    themeName,
  );
  const generator = new (smartColorGenerator.getTargetTypeGenerator(
    primaryColorType,
  ))(colorList, primaryColor0, themeName);
  const themeData = generator.generateSmartColorTheme();
  const id = `${themeName}-${primaryColor0}`;
  themeData.id = id;
  themeData.theme.id = id;
  return themeData;
}
export function getColorList(colorTheme) {
  return colorTheme.theme[constant.CLASS_TYPE.MAP].properties[
    constant.STYLE_KEYS.COLOR_LIST
  ].split(" ");
}
export function setCustomSmartColorThemeInfo(smartColorThemeInfo) {
  const nameOrder = Object.keys(smartColorThemeInfo);
  setCustomSmartColorThemeNameOrder(nameOrder);
  const colorListMap = {};
  const idListMap = {};
  const customThemes = [];
  Object.keys(smartColorThemeInfo).forEach((themeName) => {
    const colorthemes = smartColorThemeInfo[themeName];
    colorListMap[themeName] =
      colorthemes[0].theme[constant.CLASS_TYPE.MAP].properties[
        constant.STYLE_KEYS.COLOR_LIST
      ].split(" ");
    // add to id list map
    idListMap[themeName] = colorthemes.map((colorTheme) => colorTheme.id);
    // add to customThemes
    customThemes.push(...colorthemes);
  });
  setCustomSmartColorThemeColorListMap(colorListMap);
  setCustomSmartColorThemeIdListMap(idListMap);
  addCustomColorThemes(customThemes);
}
export function getMultiLineColorStringByColorThemeId(colorThemeId) {
  const colorTheme = getColorThemeDataById(colorThemeId);
  if (!colorTheme || !isSmartColorTheme(colorTheme)) {
    return [""];
  }
  function getStringListFromPreset(colorTheme) {
    const insideMultiLineColor =
      colorTheme.theme[constant.CLASS_TYPE.MAP].properties[
        constant.STYLE_KEYS.MULTI_LINE_COLORS
      ];
    if (insideMultiLineColor) {
      return [insideMultiLineColor];
    }
    let multiLineColorList;
    const multiLineColorInfoList = getMultiLineColorInfoList(
      getColorList(colorTheme),
      "",
    );
    if (!multiLineColorInfoList.length) {
      multiLineColorList = getColorList(colorTheme);
    } else {
      const multiLineColorString =
        multiLineColorInfoList[0].multiLineColorString;
      multiLineColorList = multiLineColorString.split(" ");
    }
    const mapFillColor =
      colorTheme.theme[constant.CLASS_TYPE.MAP].properties[
        constant.STYLE_KEYS.FILL_COLOR
      ];
    const centralTopicFillColor =
      colorTheme.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
        constant.STYLE_KEYS.FILL_COLOR
      ];
    return [
      multiLineColorList
        .filter(
          (color) => color !== mapFillColor && color !== centralTopicFillColor,
        )
        .join(" "),
    ];
  }
  return getStringListFromPreset(colorTheme);
}
export function getSmartColorListOrderInfo() {
  return getSmartColorThemeNameOrder().map((smartColorThemeName) => {
    const colorList = getSmartColorThemeColorListMap()[smartColorThemeName];
    if (smartColorThemeName === constant.SMART_COLOR_THEME_NAME.Rainbow) {
      return {
        themeName: smartColorThemeName,
        uiName: smartColorThemeName,
        colorInfoList: colorList.map((color) => {
          return {
            color,
            idList: [getRainbowPrimaryColorInfo(color).id],
          };
        }),
      };
    } else {
      const multiLineColorInfoList = getMultiLineColorInfoList(
        colorList,
        smartColorThemeName,
      );
      const colorInfoList = [];
      colorList.forEach((color) => {
        const idList = [];
        const multiLineColorInfo = multiLineColorInfoList.find(
          (info) => info.primaryColor0 === color,
        );
        if (multiLineColorInfo) {
          idList.push(multiLineColorInfo.id);
        }
        const primaryColorInfo = getPrimaryColorInfo(
          color,
          smartColorThemeName,
          colorList,
        );
        if (primaryColorInfo) {
          let ignoreDuplicateColorTheme = false;
          if (multiLineColorInfo) {
            const colorTheme = getColorThemeDataById(primaryColorInfo.id);
            // check central topic fill color, remove duplicate color
            const primaryColor1 =
              colorTheme.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
                constant.STYLE_KEYS.FILL_COLOR
              ];
            const primary1ColorInfo = getPrimaryColorInfo(
              primaryColor1,
              smartColorThemeName,
              colorList,
            );
            if (
              primary1ColorInfo?.primaryColor1 === primaryColor1 &&
              primary1ColorInfo.primaryColor0 === color
            ) {
              ignoreDuplicateColorTheme = true;
            }
          }
          if (!ignoreDuplicateColorTheme) {
            idList.push(primaryColorInfo.id);
          }
        }
        colorInfoList.push({
          color,
          idList,
        });
      });
      return {
        themeName: smartColorThemeName,
        uiName: smartColorThemeName,
        colorInfoList: colorInfoList,
      };
    }
  });
}
export function getSmartTextColor(backColor, colorListResource) {
  const fallbackWhite = constant.SMART_TEXT_FALLBACK_COLOR.WHITE;
  const fallbackBlack = constant.SMART_TEXT_FALLBACK_COLOR.BLACK;
  let colorList;
  if (Array.isArray(colorListResource)) {
    colorList = colorListResource;
  } else {
    colorList = getColorList(colorListResource);
  }
  const primaryTextColor = fallbackWhite;
  if (calculateRatio(backColor, primaryTextColor) > constant.TEXT_MIN_RATIO) {
    return primaryTextColor;
  }
  const targetColor = getMaxRatioColorFromList(backColor, colorList);
  if (calculateRatio(backColor, targetColor) > constant.TEXT_MIN_RATIO) {
    return targetColor;
  }
  if (calculateRatio(backColor, fallbackWhite) > constant.TEXT_MIN_RATIO) {
    return fallbackWhite;
  }
  return fallbackBlack;
}
export function getFeaturedColorThemeIdList() {
  return featuredColorThemeIds;
}
