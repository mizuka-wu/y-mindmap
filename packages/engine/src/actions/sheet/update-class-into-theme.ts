import BranchView from "../../view/branchview";
import RelationshipView from "../../view/relationshipview";
import BoundaryView from "../../view/boundaryview";
import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  CLASS_TYPE,
  PRESET_QUICK_STYLE_CLASS_TYPES,
  TOPIC_CLASS_TYPES,
  FONT_STYLE_KEYS,
  TOPIC_STYLE_KEYS,
  RELATIONSHIP_STYLE_KEYS,
  BOUNDARY_STYLE_KEYS,
  SUMMARY_STYLE_KEYS,
  ALL_TOPIC_TYPES,
  PRESET_GLOBAL_STYLE_CLASS,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class UpdateClassIntoThemeAction extends BaseAction {
  userStyleKeyList: any[];
  summaryClassData: any;
  targets: any[];
  className: any;
  classData: any;
  targetView: any;
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.UPDATE_CLASS_INTO_THEME;
    this.userStyleKeyList = [];
    this.summaryClassData = null;
    this.targets = [];
  }
  /**
   * @param className accept TOPIC_CLASS_TYPES | CLASS_TYPE.BOUNDARY, CLASS_TYPE.RELATIONSHIP, level{number}
   */
  doExecute({ className, classData, targets = [] }: any = {}) {
    // initial privates
    this.className = className;
    this.classData = classData;
    this.targets = targets;
    this.summaryClassData = null;
    this.userStyleKeyList = [];
    if (!this.targets || this.targets.length < 1) {
      // get target views from selections if not provides
      this.targets = this._context
        .getModule(MODULE_NAME.SELECTION)
        .getSelections();
    }
    // only choose first target for classData extraction
    this.targetView = this.targets[0];
    if (!this.className && this.targets.length) {
      const quickStyleClassName = styleManager.getClassList(this.targetView)[0];
      const defaultClassName = styleManager.getClassName(this.targetView);
      this.className = quickStyleClassName || defaultClassName;
      // no valid className
      if (!this.className) {
        return;
      }
    }
    if (!this.classData && this.targets.length) {
      const classProperties = this.getClassProperties();
      if (classProperties) {
        this.classData = {
          properties: classProperties,
        };
      }
      if (
        this.targetView.isSummaryBranch &&
        this.targetView.isSummaryBranch()
      ) {
        // special treat for Summary topic, which need extra properties
        const summaryClassProperties = this.getSummaryClassProperties();
        if (summaryClassProperties) {
          this.summaryClassData = {
            properties: summaryClassProperties,
          };
        }
      }
    }
    if (this.className === CLASS_TYPE.SUMMARY_TOPIC) {
      // treat summary topic standalone
      this.handleUpdateSummaryQuickStyles();
    } else if (PRESET_QUICK_STYLE_CLASS_TYPES.includes(this.className)) {
      // is preset quick styled topic
      this.handleUpdatePresetQuickStyle();
    } else if (TOPIC_CLASS_TYPES.includes(this.className)) {
      // update to all levels' topic based on className
      this.handleUpdateToAll();
    } else if (
      [CLASS_TYPE.BOUNDARY, CLASS_TYPE.RELATIONSHIP].includes(this.className)
    ) {
      // update to boundary & relationship
      this.handleUpdateBoundaryAndRelationshipQuickStyles();
    } else if (/level\d+/.test(this.className)) {
      // update to specific level, e.g. className equals level3
      this.handleUpdateByLevel();
    } else if (/priority-\d+/.test(this.className)) {
      // update to topics with same priority marker
      this.handleUpdateByPriorityMarker();
    } else if (this.classData) {
      // unknown className
      this.updateCLassToTheme(this.className, this.classData);
    }
    this.targets.forEach((target) => {
      let _a;
      if ((_a = target.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      }
    });
  }
  // privates
  getClassProperties() {
    if (this.targetView.type === VIEW_TYPE.IMAGE) {
      return null;
    }
    // model's classList only include quickStyleClass and only one quickStyleClass
    const classNames = styleManager.getClassList(this.targetView);
    const quickStyleClass =
      classNames.length &&
      PRESET_QUICK_STYLE_CLASS_TYPES.includes(classNames[0])
        ? classNames[0]
        : styleManager.getSuggestedClassName(this.targetView);
    if (!quickStyleClass) {
      return null;
    }
    let stylesKeys = [...FONT_STYLE_KEYS];
    if (this.targetView instanceof BranchView) {
      stylesKeys = stylesKeys.concat(TOPIC_STYLE_KEYS);
    } else if (this.targetView instanceof RelationshipView) {
      stylesKeys = stylesKeys.concat(RELATIONSHIP_STYLE_KEYS);
    } else if (this.targetView instanceof BoundaryView) {
      stylesKeys = stylesKeys.concat(BOUNDARY_STYLE_KEYS);
    }
    const targetStyles = this.collectAndCompareStylesData({
      styleClassName: quickStyleClass,
      targetView: this.targetView,
      stylesKeys: Array.from(new Set(stylesKeys)),
    });
    if (targetStyles.hasDifferentData) {
      return targetStyles.classData;
    } else {
      return null;
    }
  }
  getSummaryClassProperties() {
    // Summary Styles are standalone in theme, which named 'summary'
    const topicStyles = this.collectAndCompareStylesData({
      styleClassName: CLASS_TYPE.SUMMARY,
      targetView: this.targetView.summaryView,
      stylesKeys: SUMMARY_STYLE_KEYS,
    });
    if (topicStyles.hasDifferentData) {
      return topicStyles.classData;
    } else {
      return null;
    }
  }
  collectAndCompareStylesData(options) {
    const { styleClassName, targetView, stylesKeys } = options;
    const classData = {};
    let hasDifferentData = false;
    for (const styleKey of stylesKeys) {
      const oldValue = this._context.model
        .theme()
        .getStyleValue(styleClassName, styleKey);
      if (oldValue) {
        classData[styleKey] = oldValue;
      }
      const selfStyle = styleManager.getUserStyleValue(targetView, styleKey);
      if (selfStyle) {
        // collect user style keys, for add override prefix
        this.userStyleKeyList.push(styleKey);
        classData[styleKey] = selfStyle;
        hasDifferentData = true;
      }
    }
    return {
      classData,
      hasDifferentData,
    };
  }
  getViewsByThemeClassNames(className, excludeClassNames) {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    const collectedViews: any[] = [];
    // collect branchViews
    const branchViews =
      centralBranchView.getDescendantBranchesByType(ALL_TOPIC_TYPES);
    // collect boundaryViews
    const boundaryViews = branchViews
      .map((view) => view.boundaries)
      .reduce((output, current) => output.concat(current), []);
    // collect relationshipViews
    const relationshipViews = this._context.getSheetView().relationships;
    for (const view of [
      ...branchViews,
      ...boundaryViews,
      ...relationshipViews,
    ]) {
      const classList = [
        styleManager.getClassName(view),
        styleManager.getSuggestedClassName(view),
        ...styleManager.getClassList(view),
      ];
      if (
        classList.some((cls) => className === cls) &&
        classList.every((cls) => !excludeClassNames.includes(cls))
      ) {
        collectedViews.push(view);
      }
    }
    return collectedViews;
  }
  getViewsByMarker(markerId, excludeClassNames: string[] = []) {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    const collectedViews: any[] = [];
    // collect branchViews
    const branchViews =
      centralBranchView.getDescendantBranchesByType(ALL_TOPIC_TYPES);
    for (const view of branchViews) {
      const classList = [
        styleManager.getClassName(view),
        styleManager.getSuggestedClassName(view),
        ...styleManager.getClassList(view),
      ];
      const markers = view.topicView.markersView.markerIdList;
      if (
        markers.some((marker) => marker === markerId) &&
        classList.every((cls) => !excludeClassNames.includes(cls))
      ) {
        collectedViews.push(view);
      }
    }
    return collectedViews;
  }
  // updates
  _generalUpdate() {
    if (!this.classData) {
      return;
    }
    this.updateCLassToTheme(this.className, this.classData);
    // clear topics' user style by className
    this.getViewsByThemeClassNames(this.className, []).forEach((view) => {
      let _a;
      if ((_a = view.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      }
    });
  }
  handleUpdateToAll() {
    if (!this.classData) {
      return;
    }
    const targetViews = this.getViewsByThemeClassNames(
      this.className,
      PRESET_QUICK_STYLE_CLASS_TYPES,
    );
    // Collect any [Suggested ClassName] & [classList] used in [Views].
    // Note that Suggested classNames do not contain presetQuickStyleClassNames
    const classNameList: any[] = [];
    targetViews.forEach((view) => {
      classNameList.push(styleManager.getSuggestedClassName(view));
      classNameList.push(...styleManager.getClassList(view));
    });
    const toBeRemoveClassNameList = Array.from(
      new Set(classNameList.filter(Boolean)),
    ).filter((c) => c !== this.className);
    // Remove any [ClassName] from [Views].
    toBeRemoveClassNameList.forEach((className) => {
      targetViews.forEach((view) => {
        let _a;
        if ((_a = view.model) === null || _a === undefined) {
          // do nothing
        } else {
          _a.removeClass(className);
        }
      });
    });
    // Remove Theme ClassData corresponding to the removed [ClassName]
    styleManager.removeClassFromTheme(
      this._context.getSheetView(),
      toBeRemoveClassNameList,
    );
    // Add new [ClassData] named className
    this.updateCLassToTheme(this.className, this.classData);
    // Remove any user styles of [views], Exclude [views] who contains PRESET_QUICK_STYLES_CLASS_TYPES.
    this.getViewsByThemeClassNames(
      this.className,
      PRESET_QUICK_STYLE_CLASS_TYPES,
    ).forEach((view) => {
      let _a;
      if ((_a = view.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      }
    });
  }
  handleUpdateByLevel() {
    if (!this.classData) {
      return;
    }
    // update theme style by className
    this.updateCLassToTheme(this.className, this.classData);
    // remove user style & class from views have className exclude who contains PRESET_QUICK_STYLES_CLASS_TYPES
    this.getViewsByThemeClassNames(
      this.className,
      PRESET_QUICK_STYLE_CLASS_TYPES,
    ).forEach((view) => {
      let _a;
      styleManager.getClassList(view).forEach((cl) => {
        let _a;
        if ((_a = view.model) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.removeClass(cl);
        }
      });
      if ((_a = view.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      }
    });
  }
  handleUpdateSummaryQuickStyles() {
    if (!this.classData && !this.summaryClassData) {
      return;
    }
    if (this.classData) {
      // update summaryTopic classData into theme
      this.updateCLassToTheme(this.className, this.classData);
    }
    if (this.summaryClassData) {
      // update summary classData into theme, which is different with summaryTopic
      this.updateCLassToTheme(CLASS_TYPE.SUMMARY, this.summaryClassData);
    }
    this.getViewsByThemeClassNames(
      this.className,
      PRESET_QUICK_STYLE_CLASS_TYPES,
    ).forEach((view) => {
      let _a;
      let _b; // Clean all custom summary topic styles any summary styles
      if ((_a = view.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      }
      if ((_b = view.summaryModel) === null || _b === undefined) {
        // do nothing
      } else {
        _b.setStyleObj(null);
      }
      styleManager.getClassList(view).forEach((cl) => {
        let _a;
        if ((_a = view.model) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.removeClass(cl);
        }
      });
    });
  }
  handleUpdateBoundaryAndRelationshipQuickStyles() {
    this._generalUpdate();
  }
  handleUpdatePresetQuickStyle() {
    this._generalUpdate();
  }
  handleUpdateByPriorityMarker() {
    if (!this.classData) {
      return;
    }
    // markerId is className
    // target views include preset quick style topics
    const targetViews = this.getViewsByMarker(this.className);
    targetViews.forEach((view) => {
      let _a;
      let _b;
      if ((_a = view.model) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setStyleObj(null);
      } // clear class list
      styleManager.getClassList(view).forEach((cl) => {
        let _a;
        if ((_a = view.model) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.removeClass(cl);
        }
      });
      if ((_b = view.model) === null || _b === undefined) {
        // do nothing
      } else {
        _b.addClass(this.className);
      }
    });
    this.updateCLassToTheme(this.className, this.classData);
  }
  updateCLassToTheme(className, classData) {
    const sheetView = this._context.getSheetView();
    const externalProperties = this.collectDynamicPriorityPrefixProperties();
    Object.assign(classData.properties, externalProperties);
    styleManager.updateClassIntoTheme(sheetView, className, classData);
  }
  collectDynamicPriorityPrefixProperties() {
    const externalProperties = {};
    const theme = styleManager.getTheme(this._context);
    const dynamicPriorityStyleKeys = this._context
      .getModule(MODULE_NAME.OVERRIDE_STYLE)
      .getDynamicPriorityLayerStyleKeys();
    const globalStyleKeys = Object.keys(
      theme.getStyle(PRESET_GLOBAL_STYLE_CLASS) ?? {},
    );
    // add new priority flags
    for (const styleKey of this.userStyleKeyList) {
      // for dynamic priority flags
      for (const overrideId in dynamicPriorityStyleKeys) {
        const styleKeys = dynamicPriorityStyleKeys[overrideId];
        if (!styleKeys.includes(styleKey)) {
          continue;
        }
        externalProperties[`${overrideId}_${styleKey}`] = true;
      }
      // for global flags
      globalStyleKeys.forEach((globalStyleKey) => {
        if (globalStyleKey === styleKey) {
          externalProperties[`${PRESET_GLOBAL_STYLE_CLASS}_${styleKey}`] = true;
        }
      });
    }
    // add exsited dynamic priority and global flags
    Object.keys(theme.getStyle(this.className) ?? {}).forEach((styleKey) => {
      let isExsitedFlag = false;
      for (const overrideId in dynamicPriorityStyleKeys) {
        if (styleKey.startsWith(overrideId)) {
          isExsitedFlag = true;
        }
      }
      if (styleKey.startsWith(PRESET_GLOBAL_STYLE_CLASS)) {
        isExsitedFlag = true;
      }
      if (isExsitedFlag) {
        externalProperties[styleKey] = true;
      }
    });
    return externalProperties;
  }
}
