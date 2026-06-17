import {
  STYLE_KEYS,
  CLASS_TYPE,
  TOPIC_SKELETON_STYLE_KEYS,
  CALLOUT_TOPIC_COLOR_STYLE_KEYS,
  CALLOUT_TOPIC_SKELETON_STYLE_KEYS,
  TOPIC_COLOR_STYLE_KEYS,
  TOPIC_TYPE,
  STRUCTURECLASS,
  TOPICSHAPE,
  STYLE_PARENT_GROUP,
  VIEW_TYPE,
} from "../../../common/constants/index";
import { MindMapStyleSelector } from "./mindmapstyleselector";
import { styleSelectors } from "./styleselectors";
import * as utils from "../../index";

class TopicStyleSelector extends MindMapStyleSelector {
  protectedHandleKey(target, key, options) {
    if (key === STYLE_KEYS.SHAPE_CLASS) {
      const className = this.getClassName(target, options);
      if (className === CLASS_TYPE.CALLOUT_TOPIC) {
        key = STYLE_KEYS.CALLOUT_SHAPE_CLASS;
      }
    }
    return key;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedGetComputedStyleKeys(target, options?) {
    return [
      ...TOPIC_COLOR_STYLE_KEYS,
      ...TOPIC_SKELETON_STYLE_KEYS,
      ...CALLOUT_TOPIC_COLOR_STYLE_KEYS,
      ...CALLOUT_TOPIC_SKELETON_STYLE_KEYS,
    ];
  }
  getSuggestedClassName(target, options: any = {}) {
    const themeProvider = options.themeProvider
      ? options.themeProvider
      : this.getTheme(target);
    const layerNumber = target.getLayer();
    if (layerNumber === 1) {
      return CLASS_TYPE.CENTRAL_TOPIC;
    } else if (target.isSummaryBranch()) {
      return CLASS_TYPE.SUMMARY_TOPIC;
    } else if (target.isCalloutBranch()) {
      return CLASS_TYPE.CALLOUT_TOPIC;
    } else if (target.isDetachedBranch()) {
      if (themeProvider && themeProvider.hasClass(`level${layerNumber}`)) {
        return `level${layerNumber}`;
      } else {
        return CLASS_TYPE.FLOATING_TOPIC;
      }
    } else if (target.isAttachedBranch()) {
      if (themeProvider && themeProvider.hasClass(`level${layerNumber}`)) {
        return `level${layerNumber}`;
      } else if (layerNumber === 2) {
        return CLASS_TYPE.MAIN_TOPIC;
      } else {
        return CLASS_TYPE.SUB_TOPIC;
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getClassName(target, options = {}) {
    const layerNumber = target.getLayer();
    if (layerNumber === 1) {
      return CLASS_TYPE.CENTRAL_TOPIC;
    } else if (target.isSummaryBranch()) {
      return CLASS_TYPE.SUMMARY_TOPIC;
    } else if (target.isCalloutBranch()) {
      return CLASS_TYPE.CALLOUT_TOPIC;
    } else if (target.isDetachedBranch()) {
      return CLASS_TYPE.FLOATING_TOPIC;
    } else if (target.isAttachedBranch()) {
      if (layerNumber === 2) {
        return CLASS_TYPE.MAIN_TOPIC;
      } else {
        return CLASS_TYPE.SUB_TOPIC;
      }
    }
  }
  getDefaultStyleValue(target, key, options = {}) {
    const model = this.protectedGetModel(target);
    const type = model.type();
    if (
      type === TOPIC_TYPE.DETACHED &&
      key === STYLE_KEYS.SHAPE_CLASS &&
      model.getStructureClass() &&
      model.getStructureClass().search(STRUCTURECLASS.MAPFLOATING) === 0
    ) {
      return TOPICSHAPE.ELLIPSE;
    }
    return MindMapStyleSelector.prototype.getDefaultStyleValue.apply(this, [
      target,
      key,
      options,
    ]);
  }
  protectedParentStyleValue(target, level, key, options: any = {}) {
    const superValue = super.protectedParentStyleValue(
      target,
      level,
      key,
      options
    );
    if (superValue) {
      return superValue;
    }
    if (level === STYLE_PARENT_GROUP.BEFORE_CLASS_GROUP) {
      switch (key) {
        case STYLE_KEYS.LINE_WIDTH:
          return this.getGlobalStyleValue(target, key);
      }
    }
    if (level === STYLE_PARENT_GROUP.BEFORE_THEME_GROUP) {
      const parentBranchView = target.parent();
      switch (key) {
        case STYLE_KEYS.BORDER_LINE_COLOR:
          return (
            this.getThemeStyleValue(target, key, options) ||
            this.getStyleValue(target, STYLE_KEYS.LINE_COLOR, {
              ignoreDefault: true,
            }) ||
            (target.parent() &&
              Object(utils.isBranch)(parentBranchView) &&
              this.getStyleValue(parentBranchView, STYLE_KEYS.LINE_COLOR, {
                ignoreDefault: true,
              })) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, key)) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, STYLE_KEYS.LINE_COLOR))
          );
        case STYLE_KEYS.LINE_COLOR:
          return (
            this.getMultiLineColor(target) ||
            this.getThemeStyleValue(target, key) ||
            (target.parent() &&
              Object(utils.isBranch)(parentBranchView) &&
              this.getStyleValue(parentBranchView, key, {
                ignoreDefault: true,
              })) ||
            (!options.ignoreDefault && this.getDefaultStyleValue(target, key))
          );
        case STYLE_KEYS.BORDER_LINE_WIDTH:
          return (
            this.getThemeStyleValue(target, key) ||
            this.getStyleValue(target, STYLE_KEYS.LINE_WIDTH, {
              ignoreDefault: true,
            }) ||
            (target.parent() &&
              Object(utils.isBranch)(parentBranchView) &&
              this.getStyleValue(parentBranchView, STYLE_KEYS.LINE_WIDTH, {
                ignoreDefault: true,
              })) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, key)) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, STYLE_KEYS.LINE_WIDTH))
          );
        case STYLE_KEYS.BORDER_LINE_PATTERN:
          return (
            this.getThemeStyleValue(target, key) ||
            this.getStyleValue(target, STYLE_KEYS.LINE_PATTERN, {
              ignoreDefault: true,
            }) ||
            (target.parent() &&
              Object(utils.isBranch)(parentBranchView) &&
              this.getStyleValue(parentBranchView, STYLE_KEYS.LINE_PATTERN, {
                ignoreDefault: true,
              })) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, key)) ||
            (!options.ignoreDefault &&
              this.getDefaultStyleValue(target, STYLE_KEYS.LINE_PATTERN))
          );
        case STYLE_KEYS.LINE_WIDTH:
        case STYLE_KEYS.LINE_PATTERN:
        case STYLE_KEYS.ARROW_END_CLASS: {
          return (
            (this.getThemeStyleValue(target, key) !== "inherited" &&
              this.getThemeStyleValue(target, key)) ||
            (target.parent() &&
              utils.isBranch(parentBranchView) &&
              this.getStyleValue(parentBranchView, key, {
                ignoreDefault: true,
              })) ||
            (!options.ignoreDefault && this.getDefaultStyleValue(target, key))
          );
        }
        case STYLE_KEYS.ALIGNMENT_BY_LEVEL: {
          if (Object(utils.isBranch)(parentBranchView)) {
            return this.getStyleValue(parentBranchView, key, {
              ignoreDefault: true,
            });
          }
        }
        // eslint-disable-next-line no-fallthrough
        case STYLE_KEYS.FILL_COLOR:
        case STYLE_KEYS.TEXT_COLOR:
          // for update quick style
          return this.getThemeStyleValue(target, key);
      }
    }
  }
  getMultiLineColor(target) {
    if (target.isCentralBranch() || target.isDetachedBranch()) {
      return;
    }
    const sheetView = target.getContext().getSheetView();
    const multiLineColors = styleSelectors(sheetView).getStyleValue(
      sheetView,
      STYLE_KEYS.MULTI_LINE_COLORS
    );
    if (!multiLineColors || multiLineColors === "none") {
      return;
    }
    // Find mainBranch
    let ancestorBranch = target;
    while (this.getClassName(ancestorBranch) !== CLASS_TYPE.MAIN_TOPIC) {
      ancestorBranch = ancestorBranch.parent();
      if (ancestorBranch && ancestorBranch.type === VIEW_TYPE.BRANCH) {
        const firstLineColorOfParent =
          this.getUserStyleValue(ancestorBranch, STYLE_KEYS.LINE_COLOR) ||
          this.getUserClassValue(ancestorBranch, STYLE_KEYS.LINE_COLOR);
        if (firstLineColorOfParent) {
          return firstLineColorOfParent;
        }
      } else {
        return;
      }
    }
    const colors = multiLineColors.split(" ");
    let indexInParent = ancestorBranch.branchIndex();
    if (indexInParent < 0) {
      indexInParent = 0;
    }
    return colors[indexInParent % colors.length];
  }
  protectedFindStyleSelector(target) {
    return styleSelectors(target);
  }
  fixUserStyle(branch, options) {
    super.fixUserStyle(branch, options);
    let structureClassValue = this.protectedFindStyleSelector(
      branch
    ).getUserClassValue(branch, STYLE_KEYS.STRUCTURE_CLASS);
    if (!structureClassValue) {
      structureClassValue = this.protectedFindStyleSelector(
        branch
      ).getThemeStyleValue(branch, STYLE_KEYS.STRUCTURE_CLASS);
    }
    if (branch.isCentralBranch() && structureClassValue) {
      this.protectedGetModel(branch).changeStructure(structureClassValue);
    }
    // fix custom width style if isn't change color theme (althrough it wasn't a 'style')
    if (!options.newColorTheme) {
      this.protectedGetModel(branch).customWidth(0);
    }
    // fix boundary
    if (Array.isArray(branch.boundaries)) {
      branch.boundaries.forEach((boundaryView) => {
        this.protectedFindStyleSelector(boundaryView).fixUserStyle(
          boundaryView,
          options
        );
      });
    }
    // fix summary
    if (Array.isArray(branch.summaries)) {
      branch.summaries.forEach((summaryView) => {
        this.protectedFindStyleSelector(summaryView).fixUserStyle(
          summaryView,
          options
        );
      });
    }
  }
  getDefaultStyleKeysToBeFixByTheme() {
    return [
      STYLE_KEYS.SHAPE_CLASS,
      STYLE_KEYS.FILL_COLOR,
      STYLE_KEYS.FILL_PATTERN,
      STYLE_KEYS.BORDER_LINE_COLOR,
      STYLE_KEYS.BORDER_LINE_WIDTH,
      STYLE_KEYS.TEXT_COLOR,
      STYLE_KEYS.TEXT_ALIGN,
      STYLE_KEYS.LINE_CORNER,
      STYLE_KEYS.LINE_COLOR,
      STYLE_KEYS.LINE_WIDTH,
      STYLE_KEYS.LINE_CLASS,
    ];
  }
}
/* harmony default export */
export const topicStyleSelector = new TopicStyleSelector();
export default topicStyleSelector;
