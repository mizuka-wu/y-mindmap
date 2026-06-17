import {
  STYLE_KEYS,
  COMPACT_LAYOUT_PARAMS,
} from "../../common/constants/index";

import * as sb_utils_index__WEBPACK_IMPORTED_MODULE_1__ from "../../utils/index";
import styleManager from "../../utils/business/stylemanager/index";
const mapCompactModeParamsToStyleDescriptor = () => {
  const styleKeyList = [
    STYLE_KEYS.MARGIN_LEFT,
    STYLE_KEYS.MARGIN_TOP,
    STYLE_KEYS.MARGIN_RIGHT,
    STYLE_KEYS.MARGIN_BOTTOM,
    STYLE_KEYS.SPACING_MAJOR,
    STYLE_KEYS.SPACING_MINOR,
  ];
  return styleKeyList.map((styleKey) => {
    return {
      type: styleKey,
      value: (branchView) => {
        const className = styleManager.getClassName(branchView);
        return COMPACT_LAYOUT_PARAMS[className][styleKey];
      },
      test: sb_utils_index__WEBPACK_IMPORTED_MODULE_1__.isBranch,
    };
  });
};
export const compactModeDescriptor = {
  beforeDefault: mapCompactModeParamsToStyleDescriptor(),
};

export default compactModeDescriptor;
