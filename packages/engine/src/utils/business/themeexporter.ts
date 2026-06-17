import {
  TOPIC_COLOR_STYLE_KEYS,
  CALLOUT_TOPIC_COLOR_STYLE_KEYS,
  TOPIC_SKELETON_STYLE_KEYS,
  CALLOUT_TOPIC_SKELETON_STYLE_KEYS,
  CALLOUT_TOPIC_STYLE_KEYS,
  CLASS_TYPE,
  SUMMARY_COLOR_STYLE_KEYS,
  SUMMARY_SKELETON_STYLE_KEYS,
  SUMMARY_STYLE_KEYS,
  BOUNDARY_COLOR_STYLE_KEYS,
  BOUNDARY_SKELETON_STYLE_KEYS,
  BOUNDARY_STYLE_KEYS,
  RELATIONSHIP_COLOR_STYLE_KEYS,
  RELATIONSHIP_SKELETON_STYLE_KEYS,
  RELATIONSHIP_STYLE_KEYS,
  MAP_COLOR_STYLE_KEYS,
  MAP_SKELETON_STYLE_KEYS,
  MAP_STYLE_KEYS,
  TOPIC_CLASS_TYPES,
  PRESET_QUICK_STYLE_CLASS_TYPES,
  DYNAMIC_STYLE_KEYS,
  STYLE_KEYS,
  BRACE_BRANCH_CONNECTION,
  BRANCHCONNECTION,
  TOPICSHAPE,
  TABLE_LIKE_STRUCTURE_LIST,
  TOPIC_TYPE,
  MODULE_NAME,
} from "../../common/constants/index";
import styleManager from "./stylemanager/index";

import defaultStyles from "./stylemanager/defaultstyles";

import * as commonUtils from "../../common/utils/index";
/* harmony import */
import * as utils from "../index";
function hasValueInMap(map, value) {
  return Object.keys(map).some((key) => map[key] === value);
}
function getTopicTargetStyleKeyList(targetClassType, exportOptions) {
  let preFilterKeyList;
  if (exportOptions.toColorTheme) {
    preFilterKeyList = [TOPIC_COLOR_STYLE_KEYS, CALLOUT_TOPIC_COLOR_STYLE_KEYS];
  } else if (exportOptions.toSkeletonTheme) {
    preFilterKeyList = [
      TOPIC_SKELETON_STYLE_KEYS,
      CALLOUT_TOPIC_SKELETON_STYLE_KEYS,
    ];
  } else {
    preFilterKeyList = [
      [...TOPIC_COLOR_STYLE_KEYS, ...TOPIC_SKELETON_STYLE_KEYS],
      CALLOUT_TOPIC_STYLE_KEYS,
    ];
  }
  return preFilterKeyList[targetClassType === CLASS_TYPE.CALLOUT_TOPIC ? 1 : 0];
}

function getNormalTargetStyleKeyList(targetClassType, exportOptions) {
  const normalClassTypeToStyleKeyListMap = {
    [CLASS_TYPE.SUMMARY]: [
      SUMMARY_COLOR_STYLE_KEYS,
      SUMMARY_SKELETON_STYLE_KEYS,
      SUMMARY_STYLE_KEYS,
    ],
    [CLASS_TYPE.BOUNDARY]: [
      BOUNDARY_COLOR_STYLE_KEYS,
      BOUNDARY_SKELETON_STYLE_KEYS,
      BOUNDARY_STYLE_KEYS,
    ],
    [CLASS_TYPE.RELATIONSHIP]: [
      RELATIONSHIP_COLOR_STYLE_KEYS,
      RELATIONSHIP_SKELETON_STYLE_KEYS,
      RELATIONSHIP_STYLE_KEYS,
    ],
    [CLASS_TYPE.MAP]: [
      MAP_COLOR_STYLE_KEYS,
      MAP_SKELETON_STYLE_KEYS,
      MAP_STYLE_KEYS,
    ],
  };
  const index = exportOptions.toColorTheme
    ? 0
    : exportOptions.toSkeletonTheme
      ? 1
      : 2;
  // @ts-ignore
  return normalClassTypeToStyleKeyListMap[targetClassType][index];
}
export class ThemeExporter {
  firstTargetMap: any;
  sheetEditor: any;
  constructor(sheetEditor /*View.SheetEditor*/) {
    this.firstTargetMap = {};
    this.sheetEditor = sheetEditor;
  }

  export(exportOptions: any = {}) {
    this.prepareFirstTargetMap();
    const resultThemeData = {
      id: Object(commonUtils.UUID)(),
    };
    TOPIC_CLASS_TYPES.forEach((topicClass) => {
      let targetTopic = this.firstTargetMap[topicClass];
      if (exportOptions.toSkeletonTheme) {
        resultThemeData.id = this.sheetEditor.model.getId();
        if (topicClass === CLASS_TYPE.FLOATING_TOPIC && !targetTopic) {
          targetTopic = this.firstTargetMap[CLASS_TYPE.MAIN_TOPIC];
        }
        if (!targetTopic) {
          return;
        }
      }
      const properties = this.exportTopicTheme(
        this.firstTargetMap[topicClass],
        topicClass,
        exportOptions,
      );
      if (Object.keys(properties).length !== 0) {
        resultThemeData[topicClass] = {
          properties,
          id: Object(commonUtils.UUID)(),
        };
      }
    });
    const normalComponentClassList = [
      CLASS_TYPE.BOUNDARY,
      CLASS_TYPE.SUMMARY,
      CLASS_TYPE.RELATIONSHIP,
      CLASS_TYPE.MAP,
    ];
    normalComponentClassList.forEach((normalComponentClass) => {
      const properties = this.exportNormalComponentTheme(
        this.firstTargetMap[normalComponentClass],
        normalComponentClass,
        exportOptions,
      );
      resultThemeData[normalComponentClass] = {
        properties,
        id: Object(commonUtils.UUID)(),
      };
    });
    return this.wrapColorThemeAndSkeletonThemeInfo(
      this.validateThemeInSpecialStructure(
        resultThemeData,
        this.firstTargetMap[CLASS_TYPE.CENTRAL_TOPIC],
      ),
      exportOptions,
    );
  }
  exportTopicTheme(targetTopic, targetClassType, exportOptions) {
    const result = {};
    const targetStyleKeyList = getTopicTargetStyleKeyList(
      targetClassType,
      exportOptions,
    );
    const isQuickStyleClass =
      PRESET_QUICK_STYLE_CLASS_TYPES.includes(targetClassType);
    const shouldIncludeDefault =
      (exportOptions.toColorTheme || exportOptions.toSkeletonTheme) &&
      targetClassType === CLASS_TYPE.CENTRAL_TOPIC;
    targetStyleKeyList.forEach((styleKey) => {
      let styleValue;
      let isDynamicStyleKey = DYNAMIC_STYLE_KEYS.includes(styleKey);
      if (
        targetClassType === CLASS_TYPE.CENTRAL_TOPIC &&
        styleKey === STYLE_KEYS.BORDER_LINE_WIDTH
      ) {
        isDynamicStyleKey = false;
      }
      if (targetTopic) {
        // all special treat:
        // dynamic style should ignore parent
        // quick style should ignore theme and default
        styleValue = styleManager.getStyleValue(targetTopic, styleKey, {
          ignoreSpecialHandle: true,
          ignoreParent: isDynamicStyleKey,
          ignoreLayeredBeforeTheme: isDynamicStyleKey,
          ignoreTheme: isQuickStyleClass,
          // for ignore default in mindmapstyleselector.getStyleValue process
          ignoreDefault:
            !shouldIncludeDefault && (isQuickStyleClass || isDynamicStyleKey),
          ignoreLayeredBeforeUser:
            Object(utils.isTreeTableCell)(targetTopic) &&
            styleKey === STYLE_KEYS.FILL_COLOR,
          ignoreCompatibilityFix: true,
        });
      } else {
        const themeStyleValue = this.getClassThemeStyleValue(
          targetClassType,
          styleKey,
        );
        const defaultStyleValue = this.getClassDefaultStyleValue(
          targetClassType,
          styleKey,
        );
        if (isDynamicStyleKey || isQuickStyleClass) {
          if (themeStyleValue) {
            styleValue = themeStyleValue;
          }
        } else if (themeStyleValue || defaultStyleValue) {
          styleValue = themeStyleValue || defaultStyleValue;
        }
      }
      const resultStyleValue = this.validateSpecialStyleValue(
        styleKey,
        styleValue,
      );
      if (exportOptions.toSkeletonTheme) {
        // fix fill color and border line color in export skeleton theme situation
        if (
          styleKey === STYLE_KEYS.FILL_COLOR ||
          styleKey === STYLE_KEYS.BORDER_LINE_COLOR
        ) {
          if (resultStyleValue !== "none") {
            return;
          }
        }
      }
      if (resultStyleValue) {
        result[styleKey] = resultStyleValue;
      }
    });
    return result;
  }
  exportNormalComponentTheme(targetView, targetClassType, exportOptions) {
    const result = {};
    getNormalTargetStyleKeyList(targetClassType, exportOptions).forEach(
      (styleKey) => {
        let styleValue;
        if (targetView) {
          styleValue = styleManager.getStyleValue(targetView, styleKey);
        } else {
          const themeStyleValue = this.getClassThemeStyleValue(
            targetClassType,
            styleKey,
          );
          const defaultStyleValue = this.getClassDefaultStyleValue(
            targetClassType,
            styleKey,
          );
          if (themeStyleValue || defaultStyleValue) {
            styleValue = themeStyleValue || defaultStyleValue;
          }
        }
        // fix fill color and border line color in export skeleton theme situation
        if (
          styleKey === STYLE_KEYS.FILL_COLOR ||
          styleKey === STYLE_KEYS.BORDER_LINE_COLOR
        ) {
          if (exportOptions.toSkeletonTheme && styleValue !== "none") {
            return;
          }
        }
        if (styleKey === STYLE_KEYS.LINE_TAPERED && !styleValue) {
          styleValue = "none";
        }
        if (styleValue) {
          result[styleKey] = styleValue;
        }
      },
    );
    if (exportOptions.toColorTheme && targetClassType === CLASS_TYPE.MAP) {
      result[STYLE_KEYS.COLOR_LIST] = `#ffffff #000000`;
    }
    return result;
  }
  getClassThemeStyleValue(classType, styleKey) {
    const theme = styleManager.getTheme(this.sheetEditor);
    if (!theme) {
      return;
    }
    return theme.getStyleValue(classType, styleKey);
  }
  getClassDefaultStyleValue(classType, styleKey) {
    return defaultStyles.getStyleValue(classType, styleKey);
  }
  getBranchViewQuickStyleClassName(branchView) {
    return styleManager.getClassList(branchView)[0];
  }
  validateSpecialStyleValue(styleKey, styleValue) {
    if (
      styleKey !== STYLE_KEYS.LINE_CLASS &&
      styleKey !== STYLE_KEYS.SHAPE_CLASS
    ) {
      return styleValue;
    }
    // for brace line
    if (hasValueInMap(BRACE_BRANCH_CONNECTION, styleValue)) {
      return BRANCHCONNECTION.ROUNDEDELBOW;
    }
    // for matrix
    if (styleValue === TOPICSHAPE.MATRIXMAIN) {
      return TOPICSHAPE.RECT;
    }
    // for tree table
    if (styleValue === TOPICSHAPE.TREETABLEMAIN) {
      return TOPICSHAPE.RECT;
    }
    return styleValue;
  }
  validateThemeInSpecialStructure(themeData, centralBranchView) {
    let presetThemeData = {};
    const structure = centralBranchView.getStructureClass();
    if (TABLE_LIKE_STRUCTURE_LIST.includes(structure)) {
      presetThemeData = {
        [CLASS_TYPE.CENTRAL_TOPIC]: {
          [STYLE_KEYS.SHAPE_CLASS]: TOPICSHAPE.RECT,
        },
        [CLASS_TYPE.MAIN_TOPIC]: {
          [STYLE_KEYS.SHAPE_CLASS]: TOPICSHAPE.RECT,
        },
        [CLASS_TYPE.SUB_TOPIC]: {
          [STYLE_KEYS.SHAPE_CLASS]: TOPICSHAPE.RECT,
        },
      };
    }
    Object.keys(presetThemeData).forEach((classType) => {
      if (themeData[classType]?.properties) {
        Object.assign(
          themeData[classType].properties,
          presetThemeData[classType],
        );
      }
    });
    return themeData;
  }
  prepareFirstTargetMap() {
    const centralBranchView = this.sheetEditor
      .getSheetView()
      .getCentralBranchView();
    const firstMainBranchView = centralBranchView
      .getChildrenBranchesByType()
      .find((childMainBranchView) => {
        const childBranchViewDefaultClassName =
          styleManager.getClassName(childMainBranchView);
        const childBranchViewQuickStyleClassName =
          this.getBranchViewQuickStyleClassName(childMainBranchView);
        const activedClassName =
          childBranchViewQuickStyleClassName || childBranchViewDefaultClassName;
        return activedClassName === CLASS_TYPE.MAIN_TOPIC;
      });
    const targetMap = {
      [CLASS_TYPE.CENTRAL_TOPIC]: null,
      [CLASS_TYPE.MAIN_TOPIC]: null,
      [CLASS_TYPE.SUB_TOPIC]: null,
      [CLASS_TYPE.CALLOUT_TOPIC]: null,
      [CLASS_TYPE.SUMMARY_TOPIC]: null,
      [CLASS_TYPE.FLOATING_TOPIC]: null,
      [CLASS_TYPE.IMPORTANT_TOPIC]: null,
      [CLASS_TYPE.MINOR_TOPIC]: null,
      [CLASS_TYPE.EXPIRED_TOPIC]: null,
      [CLASS_TYPE.SUMMARY]: null,
      [CLASS_TYPE.BOUNDARY]: null,
      [CLASS_TYPE.RELATIONSHIP]: null,
      [CLASS_TYPE.MAP]: null,
    };
    targetMap[CLASS_TYPE.CENTRAL_TOPIC] = centralBranchView;
    targetMap[CLASS_TYPE.MAIN_TOPIC] = firstMainBranchView;
    targetMap[CLASS_TYPE.MAP] = this.sheetEditor.getSheetView();
    const iterateFirstTarget = (targetParentBranchView) => {
      const childrenBranchViewList =
        targetParentBranchView.getChildrenBranchesByType([
          TOPIC_TYPE.ATTACHED,
          TOPIC_TYPE.CALLOUT,
        ]);
      // set summary branch view's position
      const childrenSummaryBranchViewList =
        targetParentBranchView.getChildrenBranchesByType(TOPIC_TYPE.SUMMARY);
      const summaryPositionList: any[] = [];
      childrenSummaryBranchViewList.forEach((summaryBranchView) => {
        const rangeEnd = summaryBranchView.summaryModel.rangeEnd;
        if (!summaryPositionList[rangeEnd]) {
          summaryPositionList[rangeEnd] = [];
        }
        summaryPositionList[rangeEnd].push(summaryBranchView);
      });
      // set boundary view's position
      const childrenBoundaryViewList = [...targetParentBranchView.boundaries];
      const boundaryPositionList: any[] = [];
      if (!targetMap[CLASS_TYPE.BOUNDARY]) {
        childrenBoundaryViewList.forEach((boundaryView) => {
          const rangeEnd = boundaryView.model.rangeEnd;
          if (!boundaryPositionList[rangeEnd]) {
            boundaryPositionList[rangeEnd] = [];
          }
          boundaryPositionList[rangeEnd].push(boundaryView);
        });
      }
      childrenBranchViewList.forEach((childBranchView, index) => {
        const childBranchViewDefaultClassName =
          styleManager.getClassName(childBranchView);
        const childBranchViewQuickStyleClassName =
          this.getBranchViewQuickStyleClassName(childBranchView);
        const activedClassName =
          childBranchViewQuickStyleClassName || childBranchViewDefaultClassName;
        if (!targetMap[activedClassName]) {
          targetMap[activedClassName] = childBranchView;
        }
        iterateFirstTarget(childBranchView);
        if (summaryPositionList[index]) {
          if (!targetMap[CLASS_TYPE.SUMMARY_TOPIC]) {
            targetMap[CLASS_TYPE.SUMMARY_TOPIC] = summaryPositionList[index][0];
            targetMap[CLASS_TYPE.SUMMARY] =
              summaryPositionList[index][0].summaryView;
          }
          summaryPositionList[index].forEach((summaryBranchView) =>
            iterateFirstTarget(summaryBranchView),
          );
        }
        if (!targetMap[CLASS_TYPE.BOUNDARY] && boundaryPositionList[index]) {
          targetMap[CLASS_TYPE.BOUNDARY] = boundaryPositionList[index][0];
        }
      });
    };
    iterateFirstTarget(centralBranchView);
    // find first floating topic
    const childrenFloatingBranchViewList =
      centralBranchView.getChildrenBranchesByType(TOPIC_TYPE.DETACHED);
    targetMap[CLASS_TYPE.FLOATING_TOPIC] = childrenFloatingBranchViewList[0];
    // find first relationship
    const relationshipViewList = [
      ...this.sheetEditor.getSheetView().relationships,
    ];
    targetMap[CLASS_TYPE.RELATIONSHIP] = relationshipViewList[0];
    this.firstTargetMap = targetMap;
  }
  wrapColorThemeAndSkeletonThemeInfo(themeData, exportOptions) {
    if (exportOptions.toSkeletonTheme) {
      const skeletonTheme: any = {
        id: themeData.id,
      };
      // todo generate new skeleton theme id in user custom process

      skeletonTheme.structureStyle = {
        [CLASS_TYPE.CENTRAL_TOPIC]:
          this.firstTargetMap[
            CLASS_TYPE.CENTRAL_TOPIC
          ].model.getStructureClass(),
      };
      [CLASS_TYPE.MAIN_TOPIC, CLASS_TYPE.SUB_TOPIC].forEach((classType) => {
        if (!this.firstTargetMap[classType]) {
          return;
        }
        if (!this.firstTargetMap[classType].model.getStructureClass()) {
          return;
        }
        skeletonTheme.structureStyle[classType] =
          this.firstTargetMap[classType].model.getStructureClass();
      });
      skeletonTheme.theme = themeData;
      return skeletonTheme;
    } else if (exportOptions.toColorTheme) {
      const colorTheme: any = {};
      colorTheme.id = Object(commonUtils.UUID)();
      colorTheme.theme = themeData;
      combineUserColorThemeWithDefaultColorTheme(colorTheme);
      colorTheme.tags = [];
      return colorTheme;
    } else {
      return themeData;
    }
  }
}
function combineUserColorThemeWithDefaultColorTheme(userColorTheme) {
  const { snowballConstant, getColorThemeDataById } = Object(
    utils.getInjectModule,
  )(MODULE_NAME.SNOWBALL);
  const snowballDefaultColorTheme = getColorThemeDataById(
    snowballConstant.DEFAULT_COLOR_THEME_ID,
  );
  // for primary topic's fill color
  [
    CLASS_TYPE.CENTRAL_TOPIC,
    CLASS_TYPE.MAIN_TOPIC,
    CLASS_TYPE.SUB_TOPIC,
    CLASS_TYPE.IMPORTANT_TOPIC,
    CLASS_TYPE.MINOR_TOPIC,
  ].forEach((classType) => {
    if (!userColorTheme.theme[classType]) {
      userColorTheme.theme[classType] = {
        properties: {
          [STYLE_KEYS.FILL_COLOR]: "none",
        },
        id: Object(commonUtils.UUID)(),
      };
    }
    if (
      userColorTheme.theme[classType].properties[STYLE_KEYS.FILL_COLOR] ===
      "none"
    ) {
      userColorTheme.theme[classType].properties[STYLE_KEYS.FILL_COLOR] =
        snowballDefaultColorTheme.theme[classType].properties[
          STYLE_KEYS.FILL_COLOR
        ];
    }
  });
  return userColorTheme;
}
/* harmony default export */
export default ThemeExporter;
