import {
  STYLE_KEYS,
  CLASS_TYPE,
  SUMMARY_COLOR_STYLE_KEYS,
  SUMMARY_SKELETON_STYLE_KEYS,
} from "../../../common/constants/index";

import { MindMapStyleSelector } from "./mindmapstyleselector";
import { styleSelectors } from "./styleselectors";

class SummaryStyleSelector extends MindMapStyleSelector {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getClassName(target, options = {}) {
    return CLASS_TYPE.SUMMARY;
  }
  protectedFindStyleSelector(target) {
    return styleSelectors(target);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protectedGetComputedStyleKeys(target) {
    return [...SUMMARY_COLOR_STYLE_KEYS, ...SUMMARY_SKELETON_STYLE_KEYS];
  }
  getDefaultStyleKeysToBeFixByTheme() {
    return [
      STYLE_KEYS.SHAPE_CLASS,
      STYLE_KEYS.LINE_CORNER,
      STYLE_KEYS.LINE_COLOR,
      STYLE_KEYS.LINE_CLASS,
      STYLE_KEYS.LINE_WIDTH,
      STYLE_KEYS.LINE_PATTERN,
      STYLE_KEYS.OPACITY,
    ];
  }
}
/* harmony default export */
export const summaryStyleSelector = new SummaryStyleSelector();
export default summaryStyleSelector;
