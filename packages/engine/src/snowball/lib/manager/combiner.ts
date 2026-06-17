import * as constant from "../common/constant";

import {
  UUID,
  getProperRatioColorFromBgColor,
  isTopicClassTypeValue,
} from "../common/util";
import { getColorThemeDataById } from "./color";

const colorThemeDynamicStyleKeyList = [
  constant.STYLE_KEYS.LINE_COLOR,
  constant.STYLE_KEYS.BORDER_LINE_COLOR,
  constant.STYLE_KEYS.FILL_COLOR,
  constant.STYLE_KEYS.TEXT_COLOR,
];
const skeletonThemeDynamicStyleKeyList = [
  constant.STYLE_KEYS.LINE_WIDTH,
  constant.STYLE_KEYS.BORDER_LINE_WIDTH,
  constant.STYLE_KEYS.LINE_PATTERN,
  constant.STYLE_KEYS.ARROW_END_CLASS,
  constant.STYLE_KEYS.BORDER_LINE_PATTERN,
];
const levelStylePrefix = "level";
function traverseLevelStyleInFinalThemeData(
  themeData,
  relativeStyles,
  callback,
) {
  Object.keys(themeData).forEach((levelStyleName) => {
    if (
      levelStyleName.startsWith(levelStylePrefix) &&
      typeof themeData[levelStyleName] === "object"
    ) {
      if (themeData[levelStyleName].properties) {
        relativeStyles.forEach((styleKey) => {
          if (!relativeStyles.includes(styleKey)) {
            return;
          }
          if (styleKey !== constant.STYLE_KEYS.FILL_COLOR) {
            const subTopicStyleValue =
              themeData[constant.CLASS_TYPE.SUB_TOPIC].properties[styleKey];
            if (subTopicStyleValue) {
              themeData[levelStyleName].properties[styleKey] =
                subTopicStyleValue;
            } else {
              delete themeData[levelStyleName].properties[styleKey];
            }
          }
          callback(levelStyleName, styleKey);
        });
      }
    }
  });
}
// preTreat color theme fragment in two situations
// first: combine color theme
//   in this situation, color theme should check current theme's status
//   the oldThemeData param should be full current theme data in the content json
// second: get skeleton preview
//   in this situation, color theme only need to check original skeleton theme data
//   so the oldThemeData param should be original skeleton theme
//   see skeleton.getSkeletonThemePreviewById
export function preTreatColorThemeFragment(
  oldThemeData,
  colorTheme,
  forSkeletonPreview = false,
) {
  const preTreatedColorThemeFragment = JSON.parse(
    JSON.stringify(colorTheme.theme),
  );
  Object.keys(preTreatedColorThemeFragment).forEach((classType) => {
    // for topic class type, check skeleton theme's fill and border color
    if (isTopicClassTypeValue(classType)) {
      if (oldThemeData && oldThemeData[classType]) {
        // fix fill color if old theme define was none
        // @ts-ignore
        if (
          oldThemeData[classType].properties[constant.STYLE_KEYS.FILL_COLOR] ===
          "none"
        ) {
          preTreatedColorThemeFragment[classType].properties[
            constant.STYLE_KEYS.FILL_COLOR
          ] = "none";
        }
        // set border color as central topic's line color if skeleton's shape class was underline
        // if (oldThemeData[classType].properties[STYLE_KEYS.SHAPE_CLASS] === TOPIC_SHAPE_UNDERLINE) {
        //   delete preTreatedColorThemeFragment[classType].properties[STYLE_KEYS.BORDER_LINE_COLOR]
        // }
        // for skeleton preview
        if (forSkeletonPreview) {
          [
            constant.STYLE_KEYS.LINE_COLOR,
            constant.STYLE_KEYS.BORDER_LINE_COLOR,
          ].forEach((styleKey) => {
            if (!preTreatedColorThemeFragment[classType].properties[styleKey]) {
              preTreatedColorThemeFragment[classType].properties[styleKey] =
                preTreatedColorThemeFragment[
                  constant.CLASS_TYPE.CENTRAL_TOPIC
                ].properties[constant.STYLE_KEYS.LINE_COLOR];
            }
          });
        }
      }
    }
  });
  return preTreatedColorThemeFragment;
} // only use this while pretreated topic fill color was none!!
/** @deprecated */
export function getProperTextColor(classType, colorTheme) {
  const mapFillColor =
    colorTheme.theme[constant.CLASS_TYPE.MAP].properties[
      constant.STYLE_KEYS.FILL_COLOR
    ];
  let finalTextColor;
  if (colorTheme.colorFieldsMap) {
    finalTextColor = getProperRatioColorFromBgColor(
      mapFillColor,
      colorTheme.colorFieldsMap[constant.COLOR_FIELDS.LIGHT_COLOR],
      colorTheme.colorFieldsMap[constant.COLOR_FIELDS.DARK_COLOR],
    );
    // for those color theme, treat central topic text specially
    const shouldTreatTextColorThemeName = [
      constant.COLOR_THEME_NAME.Classic,
      constant.COLOR_THEME_NAME.VLight,
      constant.COLOR_THEME_NAME.VDark,
      constant.COLOR_THEME_NAME.Mono,
    ].some((colorThemeName) => colorTheme.tags.includes(colorThemeName));
    // if fill color is primaryColor0
    const primaryColor0 =
      colorTheme.colorFieldsMap[constant.COLOR_FIELDS.PRIMARY_COLOR_0];
    if (
      shouldTreatTextColorThemeName &&
      classType === constant.CLASS_TYPE.CENTRAL_TOPIC &&
      colorTheme.theme[classType].properties[constant.STYLE_KEYS.FILL_COLOR] ===
        primaryColor0
    ) {
      // try to set text color to primary color 0
      finalTextColor = primaryColor0;
    }
  } else {
    finalTextColor = getProperRatioColorFromBgColor(
      mapFillColor,
      constant.LIGHT_TEXT_COLOR,
      constant.DARK_TEXT_COLOR,
    );
  }
  return finalTextColor;
}
export function themeFragmentToStyleKeysToFix(newThemeData, isColorTheme) {
  const result = {};
  Object.values(constant.CLASS_TYPE).forEach((classType) => {
    const styleData = newThemeData[classType];
    if (styleData) {
      const dynamicStyleKeyList = isColorTheme
        ? colorThemeDynamicStyleKeyList
        : skeletonThemeDynamicStyleKeyList;
      result[classType] = Array.from(
        new Set([...Object.keys(styleData.properties), ...dynamicStyleKeyList]),
      );
    }
  });
  return result;
}
function combineThemeData(oldThemeData, newThemeData, dynamicStyleKeyList) {
  const finalThemeData = JSON.parse(JSON.stringify(oldThemeData));
  if (!finalThemeData.id) {
    finalThemeData.id = UUID();
  }
  Object.values(constant.CLASS_TYPE).forEach((classType) => {
    if (oldThemeData[classType] || newThemeData[classType]) {
      const oldStyle = oldThemeData[classType] ?? {
        properties: {},
      };
      const newStyle = newThemeData[classType] ?? {
        properties: {},
      };
      const finalStyle: any = {};
      finalStyle.id = oldStyle.id ?? newStyle.id ?? UUID();
      finalStyle.properties = Object.assign(
        Object.assign({}, oldStyle.properties),
        newStyle.properties,
      );
      if (isTopicClassTypeValue(classType)) {
        dynamicStyleKeyList.forEach((dynamicStyleKey) => {
          if (!newStyle.properties[dynamicStyleKey]) {
            // remove dynamic style value from theme
            delete finalStyle.properties[dynamicStyleKey];
          }
        });
      }
      if (
        classType === constant.CLASS_TYPE.BOUNDARY ||
        classType === constant.CLASS_TYPE.RELATIONSHIP
      ) {
        delete finalStyle.properties[constant.STYLE_KEYS.TEXT_COLOR];
      }
      finalThemeData[classType] = finalStyle;
    }
  });
  return finalThemeData;
}
export function combineColorTheme(oldThemeData, colorTheme) {
  const newThemeData = preTreatColorThemeFragment(oldThemeData, colorTheme);
  const finalThemeData = combineThemeData(
    oldThemeData,
    newThemeData,
    colorThemeDynamicStyleKeyList,
  );
  finalThemeData.colorThemeId = colorTheme.id;
  return fixLevelStyleInColorThemeFinalThemeData(
    fixQuickStyleInColorThemeFinalThemeData(finalThemeData, colorTheme),
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fixQuickStyleInColorThemeFinalThemeData(finalThemeData, colorTheme) {
  const finalThemeDataCopy = JSON.parse(JSON.stringify(finalThemeData));
  // for cross out
  if (finalThemeDataCopy[constant.CLASS_TYPE.EXPIRED_TOPIC]) {
    Object.keys(
      finalThemeDataCopy[constant.CLASS_TYPE.EXPIRED_TOPIC].properties,
    ).forEach((styleKey) => {
      const isColorThemeStyleKey =
        constant.TOPIC_COLOR_STYLE_KEY_LIST.includes(styleKey);
      if (!isColorThemeStyleKey) {
        return;
      }
      delete finalThemeDataCopy[constant.CLASS_TYPE.EXPIRED_TOPIC].properties[
        styleKey
      ];
    });
  }
  return finalThemeDataCopy;
}
function fixLevelStyleInColorThemeFinalThemeData(finalThemeData) {
  const finalThemeDataCopy = JSON.parse(JSON.stringify(finalThemeData));
  traverseLevelStyleInFinalThemeData(
    finalThemeDataCopy,
    constant.TOPIC_COLOR_STYLE_KEY_LIST,
    (levelClassName, styleKey) => {
      if (styleKey === constant.STYLE_KEYS.FILL_COLOR) {
        const subTopicFillColor =
          finalThemeDataCopy[constant.CLASS_TYPE.SUB_TOPIC].properties[
            styleKey
          ];
        if (!subTopicFillColor) {
          delete finalThemeDataCopy[levelClassName].properties[styleKey];
        } else {
          finalThemeDataCopy[levelClassName].properties[styleKey] =
            subTopicFillColor;
        }
      }
    },
  );
  return finalThemeDataCopy;
}
export function combineSkeletonTheme(oldThemeData, skeletonTheme, options) {
  const finalThemeData = combineThemeData(
    oldThemeData,
    skeletonTheme.theme,
    skeletonThemeDynamicStyleKeyList,
  );
  finalThemeData.skeletonThemeId = skeletonTheme.id;
  let currentColorTheme = null;
  const currentColorThemeId =
    options?.temporaryColorThemeId ?? oldThemeData.colorThemeId;
  if (currentColorThemeId) {
    currentColorTheme = getColorThemeDataById(currentColorThemeId);
  }
  // the fill property final status follows new skeleton
  constant.TOPIC_CLASS_TYPE_LIST.forEach((classType) => {
    if (!skeletonTheme.theme[classType]) {
      return;
    }
    treatFillColor();
    function treatFillColor() {
      // treat fill color
      const skeletonFillColor =
        skeletonTheme.theme[classType].properties[
          constant.STYLE_KEYS.FILL_COLOR
        ];
      if (skeletonFillColor === "none") {
        return (finalThemeData[classType].properties[
          constant.STYLE_KEYS.FILL_COLOR
        ] = "none");
      }
      const originalFillColor =
        finalThemeData[classType].properties[constant.STYLE_KEYS.FILL_COLOR];
      if (originalFillColor && originalFillColor !== "none") {
        return;
      }
      if (originalFillColor === "none") {
        delete finalThemeData[classType].properties[
          constant.STYLE_KEYS.FILL_COLOR
        ];
      }
      const colorThemeFillColor =
        currentColorTheme === null || currentColorTheme === undefined
          ? undefined
          : currentColorTheme.theme[classType].properties[
              constant.STYLE_KEYS.FILL_COLOR
            ];
      if (colorThemeFillColor) {
        finalThemeData[classType].properties[constant.STYLE_KEYS.FILL_COLOR] =
          colorThemeFillColor;
      }
    }
  });
  if (options?.temporaryColorThemeId) {
    delete finalThemeData.colorThemeId;
  }
  return fixGlobalStyleInSkeletonFinalThemeData(
    fixQuickStyleInSkeletonFinalThemeData(
      fixLevelStyleInSkeletonFinalThemeData(finalThemeData),
      skeletonTheme,
    ),
  );
}
function fixQuickStyleInSkeletonFinalThemeData(finalThemeData, skeletonTheme) {
  const finalThemeDataCopy = JSON.parse(JSON.stringify(finalThemeData));
  // clear skeleton data in quick style result
  constant.QUICK_TOPIC_CLASS_TYPE_LIST.forEach((classType) => {
    if (!finalThemeDataCopy[classType]) {
      return;
    }
    Object.keys(finalThemeDataCopy[classType].properties).forEach(
      (styleKey) => {
        let _a;
        const isSkeletonStyleKey =
          constant.TOPIC_SKELETON_STYLE_KEY_LIST.includes(styleKey);
        if (!isSkeletonStyleKey) {
          return;
        }
        const newStyleValue =
          (_a = skeletonTheme.theme[classType]) === null || _a === undefined
            ? undefined
            : _a.properties[styleKey];
        if (styleKey === constant.STYLE_KEYS.FILL_COLOR) {
          // do nothing
        } else if (!newStyleValue) {
          delete finalThemeDataCopy[classType].properties[styleKey];
        }
      },
    );
  });
  return finalThemeDataCopy;
}
function fixLevelStyleInSkeletonFinalThemeData(finalThemeData) {
  const finalThemeDataCopy = JSON.parse(JSON.stringify(finalThemeData));
  traverseLevelStyleInFinalThemeData(
    finalThemeDataCopy,
    constant.TOPIC_SKELETON_STYLE_KEY_LIST,
    (levelClassName, styleKey) => {
      if (styleKey === constant.STYLE_KEYS.FILL_COLOR) {
        // treatFillColor
        (function () {
          // treat fill color
          const subTopicFillColor =
            finalThemeDataCopy[constant.CLASS_TYPE.SUB_TOPIC].properties[
              styleKey
            ];
          if (subTopicFillColor === "none") {
            return (finalThemeDataCopy[levelClassName].properties[styleKey] =
              "none");
          }
          const originalFillColor =
            finalThemeDataCopy[levelClassName].properties[styleKey];
          if (originalFillColor && originalFillColor !== "none") {
            return;
          }
          if (originalFillColor === "none") {
            delete finalThemeDataCopy[levelClassName].properties[styleKey];
          }
          if (subTopicFillColor) {
            finalThemeDataCopy[levelClassName].properties[styleKey] =
              subTopicFillColor;
          }
        })();
      }
    },
  );
  return finalThemeDataCopy;
}
function fixGlobalStyleInSkeletonFinalThemeData(finalThemeData) {
  const finalThemeDataCopy = JSON.parse(JSON.stringify(finalThemeData));
  [
    constant.STYLE_KEYS.LINE_WIDTH,
    constant.STYLE_KEYS.FONT_FAMILY,
    constant.STYLE_KEYS.LINE_TAPERED,
  ].forEach((styleKey) => {
    let _a;
    if (
      (_a = finalThemeDataCopy[constant.PRESET_GLOBAL_STYLE_CLASS]) === null ||
      _a === undefined
    ) {
      // do nothing
    } else {
      delete _a.properties[styleKey];
    }
  });
  return finalThemeDataCopy;
}
export function combineSkeletonStructureStyleToContent(content, skeletonTheme) {
  const newContent = JSON.parse(JSON.stringify(content));
  const skeletonStructureStyle = skeletonTheme.structureStyle;
  // add skeleton style to sheet provider
  const skeletonStructureProvider = "org.xmind.ui.skeleton.structure.style";
  const skeletonStructureExtension = {
    provider: skeletonStructureProvider,
    content: skeletonStructureStyle,
  };
  if (Array.isArray(newContent.extensions)) {
    newContent.extensions.push(skeletonStructureExtension);
  } else {
    newContent.extensions = [skeletonStructureExtension];
  }
  // add skeleton central topic structure to central topic data
  newContent.rootTopic.structureClass =
    skeletonStructureStyle[constant.CLASS_TYPE.CENTRAL_TOPIC];
  return newContent;
}
