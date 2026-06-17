import * as constant from "../common/constant";

import {
  calculateRatio,
  themeListUniqueFilterById,
  hasMultiBranchLineColor,
  isTopicClassTypeValue,
  hexStringToHsbObject,
  blendingColor,
  hsbObjectToHexString,
  hexStringToRgbObject,
} from "../common/util";

import {
  getColorThemeDataById,
  isSmartColorTheme,
  getSmartTextColor,
  getColorList,
} from "./color";
import { preTreatColorThemeFragment } from "./combiner";

import { skeletonThemes } from "../data/skeletonthemes";
import { skeletonThemePreviews } from "../data/skeletonthemepreviews";
import { skeletonThemeGroup } from "../data/skeletonthemegroup";
import { skeletonthemeuiname as skeletonThemeUiName } from "../data/skeletonthemeuiname";

const grayColorThemIdForSkeletonList = "grayColorThemIdForSkeletonList";
function generateGrayColorThemeForSkeletonList() {
  const baseColorThemeCopy = JSON.parse(
    JSON.stringify(
      getColorThemeDataById(constant.SKELETON_GRAY_COLOR_THEME_ID),
    ),
  );
  baseColorThemeCopy.id = grayColorThemIdForSkeletonList;
  baseColorThemeCopy.theme.id = grayColorThemIdForSkeletonList;
  [
    constant.STYLE_KEYS.BORDER_LINE_COLOR,
    constant.STYLE_KEYS.LINE_COLOR,
  ].forEach((styleKey) => {
    baseColorThemeCopy.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties[
      styleKey
    ] = "#333333";
  });
  return baseColorThemeCopy;
}
export const grayColorThemeForSkeletonList =
  generateGrayColorThemeForSkeletonList();
export function getSkeletonThemeOrderInfo(lang) {
  if (!lang) {
    lang = constant.LANGS.EN_US;
  }
  return constant.DEFAULT_SKELETON_THEME_ORDER.map((themeName) => {
    // @ts-ignore
    const uiName =
      skeletonThemeUiName[themeName][lang] ??
      skeletonThemeUiName[themeName][constant.LANGS.EN_US];
    return {
      themeName,
      uiName,
      idList: skeletonThemeGroup[themeName].map((info) => info.id),
    };
  });
}
function getLigterMatrixLabelColor(fillColor) {
  const { h, s, b } = hexStringToHsbObject(fillColor);
  return hsbObjectToHexString({
    h,
    s,
    b: Math.min(b + 10, 99),
  });
}
const skeletonThemePreviewPool = new Map();
function getSkeletonThemePreviewFromPool(skeletonThemeId, colorThemeId) {
  if (!skeletonThemePreviewPool.has(skeletonThemeId)) {
    return;
  }
  const targetPool = skeletonThemePreviewPool.get(skeletonThemeId);
  if (
    !(targetPool === null || targetPool === undefined
      ? undefined
      : targetPool.has(colorThemeId))
  ) {
    return;
  }
  return targetPool.get(colorThemeId);
}
function saveSkeletonThemePreviewInPool(
  skeletonThemeId,
  colorThemeId,
  previewString,
) {
  if (!skeletonThemePreviewPool.has(skeletonThemeId)) {
    const newTargetPool = new Map();
    newTargetPool.set(colorThemeId, previewString);
    skeletonThemePreviewPool.set(skeletonThemeId, newTargetPool);
  } else {
    const targetPool = skeletonThemePreviewPool.get(skeletonThemeId);
    if (targetPool === null || targetPool === undefined) {
      // do nothing
    } else {
      targetPool.set(colorThemeId, previewString);
    }
  }
}
export function preInitSkeletonThemePreviewById(
  skeletonThemeId,
  colorThemeIdOrFullData,
) {
  getSkeletonThemePreviewById(skeletonThemeId, colorThemeIdOrFullData);
}
export function getSkeletonThemePreviewById(id, colorThemeIdOrFullData) {
  // color theme id bounds check
  const colorThemeForSkeleton = getColorThemeForSkeleton();
  const targetPreviewInPool = getSkeletonThemePreviewFromPool(
    id,
    colorThemeForSkeleton.id,
  );
  if (targetPreviewInPool) {
    return targetPreviewInPool;
  }
  // skeleton theme id bounds check
  const previewDataReplacer = skeletonThemePreviews[id];
  if (!previewDataReplacer) {
    return null;
  }
  const skeletonTheme = getSkeletonThemeDataById(id);
  if (!skeletonTheme) {
    return null;
  }
  const pretreatedColorThemeFragment = preTreatColorThemeFragment(
    skeletonTheme.theme,
    colorThemeForSkeleton,
    true,
  );
  preTreatGrayColorThemForSkeletonList();
  const isCurrentSmartColorTheme = isSmartColorTheme(colorThemeForSkeleton);
  const multiLineColors =
    pretreatedColorThemeFragment[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.MULTI_LINE_COLORS
    ];
  // branch line color
  const lineColorList = getLineColorList();
  const colorMap: any = {};
  // @ts-ignore
  Object.keys(pretreatedColorThemeFragment).forEach((classType) => {
    if (isTopicClassTypeValue(classType)) {
      const styleList = [
        constant.STYLE_KEYS.FILL_COLOR,
        constant.STYLE_KEYS.BORDER_LINE_COLOR,
        constant.STYLE_KEYS.TEXT_COLOR,
        constant.STYLE_KEYS.LINE_COLOR,
      ];
      // @ts-ignore
      styleList.forEach((styleKey) => {
        const styleValue =
          pretreatedColorThemeFragment[classType].properties[styleKey];
        const styleTemplateString = getTopicStyleTemplateString(
          classType,
          styleKey,
        );
        if (styleKey === constant.STYLE_KEYS.TEXT_COLOR) {
          colorMap.getTextColor = (index, classType) => {
            return getPreviewTopicTextColor(classType, index);
          };
        }
        if (styleKey === constant.STYLE_KEYS.FILL_COLOR) {
          colorMap.getFillColor = (index, classType) => {
            return getPreviewTopicFillColor(classType, index);
          };
          // treat matrix label color
          if (classType === constant.CLASS_TYPE.CENTRAL_TOPIC) {
            colorMap[`${styleTemplateString}_matrixlabel`] =
              styleValue === "none"
                ? "none"
                : getLigterMatrixLabelColor(styleValue);
          }
        }
        if (
          styleKey === constant.STYLE_KEYS.BORDER_LINE_COLOR ||
          styleKey === constant.STYLE_KEYS.LINE_COLOR
        ) {
          colorMap[styleTemplateString] = styleValue;
        }
      });
    }
  });
  colorMap.getLineColor = (index) => {
    return lineColorList[index % lineColorList.length];
  };
  // border color
  colorMap.getBorderLineColor = (index, classType) => {
    if (
      hasMultiBranchLineColor(multiLineColors) &&
      classType !== constant.CLASS_TYPE.CENTRAL_TOPIC
    ) {
      return lineColorList[index % lineColorList.length];
    } else {
      return pretreatedColorThemeFragment[classType].properties[
        constant.STYLE_KEYS.BORDER_LINE_COLOR
      ];
    }
  };
  // bg color
  const bgColor =
    pretreatedColorThemeFragment[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.FILL_COLOR
    ];
  const templateString = `${constant.CLASS_TYPE.MAP}_${constant.STYLE_KEY_TO_PREVIEW_PARAM_KEY[constant.STYLE_KEYS.FILL_COLOR]}`;
  colorMap[templateString] = bgColor;
  const previewString = previewDataReplacer(colorMap);
  saveSkeletonThemePreviewInPool(id, colorThemeForSkeleton.id, previewString);
  return previewString;
  function preTreatGrayColorThemForSkeletonList() {
    if (pretreatedColorThemeFragment.id !== grayColorThemIdForSkeletonList) {
      return;
    }
    const fillColorToTextColorMap = {
      [constant.CLASS_TYPE.CENTRAL_TOPIC]: ["#666666", "#ffffff"],
      [constant.CLASS_TYPE.MAIN_TOPIC]: ["#d0d0d0", "#333333"],
      [constant.CLASS_TYPE.SUB_TOPIC]: ["#eeeeee", "#333333"],
    };
    [
      constant.CLASS_TYPE.CENTRAL_TOPIC,
      constant.CLASS_TYPE.MAIN_TOPIC,
      constant.CLASS_TYPE.SUB_TOPIC,
    ].forEach((classType) => {
      if (
        (skeletonTheme === null || skeletonTheme === undefined
          ? undefined
          : skeletonTheme.theme[classType].properties[
              constant.STYLE_KEYS.FILL_COLOR
            ]) !== "none"
      ) {
        // @ts-ignore
        pretreatedColorThemeFragment[classType].properties[
          constant.STYLE_KEYS.FILL_COLOR
        ] = fillColorToTextColorMap[classType][0];
        // @ts-ignore
        pretreatedColorThemeFragment[classType].properties[
          constant.STYLE_KEYS.TEXT_COLOR
        ] = fillColorToTextColorMap[classType][1];
      } else {
        // @ts-ignore
        pretreatedColorThemeFragment[classType].properties[
          constant.STYLE_KEYS.TEXT_COLOR
        ] = "#333333";
      }
    });
  }
  function getColorThemeForSkeleton() {
    let colorThemeForSkeleton;
    if (typeof colorThemeIdOrFullData === "string") {
      colorThemeForSkeleton = getColorThemeDataById(colorThemeIdOrFullData);
    } else {
      colorThemeForSkeleton = colorThemeIdOrFullData;
    }
    if (!colorThemeForSkeleton) {
      colorThemeForSkeleton = getColorThemeDataById(
        constant.DEFAULT_COLOR_THEME_ID,
      );
    }
    return colorThemeForSkeleton;
  }
  function getTopicStyleTemplateString(classType, styleKey) {
    let styleTemplateString = "";
    if (
      styleKey === constant.STYLE_KEYS.TEXT_COLOR ||
      styleKey === constant.STYLE_KEYS.FILL_COLOR ||
      styleKey === constant.STYLE_KEYS.BORDER_LINE_COLOR
    ) {
      styleTemplateString = `${classType}_${constant.STYLE_KEY_TO_PREVIEW_PARAM_KEY[styleKey]}`;
    }
    if (styleKey === constant.STYLE_KEYS.LINE_COLOR) {
      styleTemplateString = `${classType}_${constant.STYLE_KEY_TO_PREVIEW_PARAM_KEY[constant.STYLE_KEYS.LINE_COLOR]}`;
    }
    return styleTemplateString;
  }
  function getPreviewTopicTextColor(classType, index) {
    const presetTextColor =
      pretreatedColorThemeFragment[classType].properties[
        constant.STYLE_KEYS.TEXT_COLOR
      ];
    if (presetTextColor) {
      return presetTextColor;
    }
    let backColor =
      pretreatedColorThemeFragment[classType].properties[
        constant.STYLE_KEYS.FILL_COLOR
      ];
    if (classType === constant.CLASS_TYPE.CENTRAL_TOPIC) {
      if (backColor === "none") {
        const textColor =
          colorThemeForSkeleton.theme[classType].properties[
            constant.STYLE_KEYS.FILL_COLOR
          ];
        const visualFillColor =
          colorThemeForSkeleton.theme[constant.CLASS_TYPE.MAP].properties[
            constant.STYLE_KEYS.FILL_COLOR
          ];
        if (
          calculateRatio(visualFillColor, textColor) >= constant.TEXT_MIN_RATIO
        ) {
          return colorThemeForSkeleton.theme[classType].properties[
            constant.STYLE_KEYS.FILL_COLOR
          ];
        }
      }
    }
    // for dynamic fill color
    if (!backColor) {
      backColor = getPreviewTopicFillColor(classType, index);
    }
    if (backColor === "none") {
      backColor =
        pretreatedColorThemeFragment[constant.CLASS_TYPE.MAP].properties[
          constant.STYLE_KEYS.FILL_COLOR
        ];
    }
    let colorList = [];
    if (hasMultiBranchLineColor(multiLineColors) || !isCurrentSmartColorTheme) {
      colorList = [
        constant.SMART_TEXT_FALLBACK_COLOR.WHITE,
        constant.SMART_TEXT_FALLBACK_COLOR.BLACK,
      ];
    } else {
      colorList = getColorList(colorThemeForSkeleton);
    }
    return getSmartTextColor(backColor, colorList);
  }
  function getPreviewTopicFillColor(classType, index) {
    let fillColor =
      pretreatedColorThemeFragment[classType].properties[
        constant.STYLE_KEYS.FILL_COLOR
      ];
    if (fillColor) {
      return fillColor;
    }
    if (hasMultiBranchLineColor(multiLineColors)) {
      if (classType === constant.CLASS_TYPE.MAIN_TOPIC) {
        fillColor = lineColorList[index % lineColorList.length];
      }
      if (classType === constant.CLASS_TYPE.SUB_TOPIC) {
        const lineColor = lineColorList[index % lineColorList.length];
        const svgFillColor =
          pretreatedColorThemeFragment[constant.CLASS_TYPE.MAP].properties[
            constant.STYLE_KEYS.FILL_COLOR
          ];
        fillColor = blendingColor(
          Object.assign(Object.assign({}, hexStringToRgbObject(lineColor)), {
            a: 0.2,
          }),
          svgFillColor,
        );
      }
    }
    if (!fillColor) {
      fillColor = "#EEEEEE";
    }
    return fillColor;
  }
  function getLineColorList() {
    let lineColorList = [];
    if (hasMultiBranchLineColor(multiLineColors)) {
      lineColorList = multiLineColors.split(" ");
    } else {
      lineColorList = [
        pretreatedColorThemeFragment[constant.CLASS_TYPE.CENTRAL_TOPIC]
          .properties[constant.STYLE_KEYS.LINE_COLOR],
      ];
    }
    return lineColorList;
  }
} // todo custom skeleton preview?
let customSkeletonThemes = [];
export function addCustomSkeletonThemes(newCustomSkeletonThemes) {
  customSkeletonThemes = themeListUniqueFilterById([
    ...customSkeletonThemes,
    ...newCustomSkeletonThemes,
  ]);
}
export function getSkeletonThemeDataById(id) {
  // @ts-ignore
  const skeletonTheme = [...skeletonThemes, ...customSkeletonThemes].find(
    (data) => data.id === id,
  );
  if (!skeletonTheme) {
    return null;
  }
  const skeletonThemeCopy = [
    fixUnsetSkeletonData,
    fixQuickStyleSkeletonData,
    fixMissingSkeltetonData,
    fixDynamicStyleSkeletonData,
  ].reduce((pre, cur) => {
    return cur(pre);
  }, skeletonTheme);
  return skeletonThemeCopy;
}
function fixUnsetSkeletonData(skeletonTheme) {
  const skeletonThemeCopy = JSON.parse(JSON.stringify(skeletonTheme));
  Object.values(constant.CLASS_TYPE).forEach((classType) => {
    if (!skeletonThemeCopy.theme[classType]) {
      skeletonThemeCopy.theme[classType] = {
        properties: {},
      };
    }
  });
  return skeletonThemeCopy;
}
function fixQuickStyleSkeletonData(skeletonTheme) {
  const skeletonThemeCopy = JSON.parse(JSON.stringify(skeletonTheme));
  // combine cross out
  skeletonThemeCopy.theme[constant.CLASS_TYPE.EXPIRED_TOPIC] = {
    properties: {
      [constant.STYLE_KEYS.TEXT_DECORATION]: "line-through",
      [constant.STYLE_KEYS.FILL_COLOR]: "none",
    },
  };
  return skeletonThemeCopy;
}
function fixMissingSkeltetonData(skeletonTheme) {
  const skeletonThemeCopy = JSON.parse(JSON.stringify(skeletonTheme));
  constant.TOPIC_CLASS_TYPE_LIST.forEach((classType) => {
    const targetProperties = skeletonThemeCopy.theme[classType].properties;
    [constant.STYLE_KEYS.FILL_PATTERN].forEach((styleKey) => {
      if (!targetProperties[styleKey]) {
        targetProperties[styleKey] = "solid";
      }
    });
  });
  [
    ...constant.TOPIC_CLASS_TYPE_LIST,
    constant.CLASS_TYPE.BOUNDARY,
    constant.CLASS_TYPE.RELATIONSHIP,
  ].forEach((classType) => {
    const targetProperties = skeletonThemeCopy.theme[classType].properties;
    if (
      targetProperties[constant.STYLE_KEYS.FONT_FAMILY] === "NeverMind Hand"
    ) {
      targetProperties[constant.STYLE_KEYS.FONT_FAMILY] =
        "NeverMind Hand,全瀨體";
    }
  });
  const centralTopicProperties =
    skeletonThemeCopy.theme[constant.CLASS_TYPE.CENTRAL_TOPIC].properties;
  if (!centralTopicProperties[constant.STYLE_KEYS.LINE_PATTERN]) {
    centralTopicProperties[constant.STYLE_KEYS.LINE_PATTERN] = "solid";
  }
  if (!centralTopicProperties[constant.STYLE_KEYS.ALIGNMENT_BY_LEVEL]) {
    centralTopicProperties[constant.STYLE_KEYS.ALIGNMENT_BY_LEVEL] =
      "inactived";
  }
  if (!centralTopicProperties[constant.STYLE_KEYS.ARROW_END_CLASS]) {
    centralTopicProperties[constant.STYLE_KEYS.ARROW_END_CLASS] =
      "org.xmind.arrowShape.none";
  }
  const boundaryProperties =
    skeletonThemeCopy.theme[constant.CLASS_TYPE.BOUNDARY].properties;
  [constant.STYLE_KEYS.FILL_PATTERN, constant.STYLE_KEYS.LINE_PATTERN].forEach(
    (styleKey) => {
      if (!boundaryProperties[styleKey]) {
        boundaryProperties[styleKey] = "solid";
      }
    },
  );
  [constant.CLASS_TYPE.SUMMARY, constant.CLASS_TYPE.RELATIONSHIP].forEach(
    (classType) => {
      if (
        !skeletonThemeCopy.theme[classType].properties[
          constant.STYLE_KEYS.LINE_PATTERN
        ]
      ) {
        skeletonThemeCopy.theme[classType].properties[
          constant.STYLE_KEYS.LINE_PATTERN
        ] = "solid";
      }
    },
  );
  return skeletonThemeCopy;
}
function fixDynamicStyleSkeletonData(skeletonTheme) {
  const skeletonThemeCopy = JSON.parse(JSON.stringify(skeletonTheme));
  constant.TOPIC_CLASS_TYPE_LIST.forEach((classType) => {
    const targetProperties = skeletonThemeCopy.theme[classType].properties;
    // fix border line pattern
    if (targetProperties[constant.STYLE_KEYS.BORDER_LINE_PATTERN] === "solid") {
      delete targetProperties[constant.STYLE_KEYS.BORDER_LINE_PATTERN];
    }
  });
  return skeletonThemeCopy;
}
export function getRandomSkeletonThemeId() {
  return skeletonThemes[
    Math.floor(Math.random() * (skeletonThemes as any).length)
  ].id;
}
