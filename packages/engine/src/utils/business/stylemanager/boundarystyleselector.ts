import {
  STYLE_KEYS,
  CLASS_TYPE,
  STYLE_PARENT_GROUP,
  BOUNDARY_COLOR_STYLE_KEYS,
  BOUNDARY_SKELETON_STYLE_KEYS,
} from "../../../common/constants/index";
import { MindMapStyleSelector } from "./mindmapstyleselector";
import { styleSelectors } from "./styleselectors";

class boundarystyleselector_BoundaryStyleSelector extends MindMapStyleSelector {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getClassName(target, options = {}) {
    return CLASS_TYPE.BOUNDARY;
  }
  protectedFindStyleSelector(target) {
    return styleSelectors(target);
  }
  protectedParentStyleValue(target, level, key) {
    const superValue = super.protectedParentStyleValue(target, level, key, {});
    if (superValue) {
      return superValue;
    }
    if (level === STYLE_PARENT_GROUP.BEFORE_THEME_GROUP) {
      switch (key) {
        case STYLE_KEYS.TEXT_COLOR:
          return this.getThemeStyleValue(target, key);
      }
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedGetComputedStyleKeys(target) {
    return [...BOUNDARY_COLOR_STYLE_KEYS, ...BOUNDARY_SKELETON_STYLE_KEYS];
  }
  getDefaultStyleKeysToBeFixByTheme() {
    return [
      STYLE_KEYS.TEXT_COLOR,
      STYLE_KEYS.TEXT_ALIGN,
      STYLE_KEYS.TEXT_BACKGROUND_COLOR,
      STYLE_KEYS.TEXT_BULLET,
      STYLE_KEYS.TEXT_DECORATION,
      STYLE_KEYS.TEXT_TRANSFORM,
      STYLE_KEYS.SHAPE_CLASS,
      STYLE_KEYS.LINE_CORNER,
      STYLE_KEYS.LINE_COLOR,
      STYLE_KEYS.LINE_CLASS,
      STYLE_KEYS.LINE_WIDTH,
      STYLE_KEYS.LINE_PATTERN,
      STYLE_KEYS.OPACITY,
      STYLE_KEYS.FILL_COLOR,
      STYLE_KEYS.FILL_GRADIENT,
      STYLE_KEYS.BORDER_GRADIENT,
    ];
  }
}
/* harmony default export */
export const boundaryStyleSelector =
  new boundarystyleselector_BoundaryStyleSelector();
export default boundaryStyleSelector;
