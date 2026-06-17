import { STYLE_LAYER, STYLE_KEYS, CLASS_TYPE, LINE_PATTERN, DASH_LINE_PATTERN } from '../../common/constants/index';

import styleManager from '../../utils/business/stylemanager/index';

import * as utils from '../../utils/index';

import type { BranchView } from '../../type.d';

const not = (test: (source: any) => boolean) => (m: any) => !test(m);
const and = (...args: ((source: any) => boolean)[]) => {
  return (m: any) => args.every(fn => fn(m));
};
const isType = (type: string) => (target: any) => styleManager.getClassName(target) === type;
function isOverrideStyleTreeTableCell(target: BranchView) {
  if (!Object(utils.isTreeTableCell)(target)) {
    return false;
  }
  if (Object(utils.isTreeTableHeadBranch)(target)) {
    return !(target.originBranchView ?? target).shouldCollapse();
  }
  return true;
}

export const fixedStyleDescriptor = {
  [STYLE_LAYER.BEFORE_USER]: [
    {
      type: STYLE_KEYS.BORDER_LINE_WIDTH,
      value: '0',
      test: and(isOverrideStyleTreeTableCell, not(utils.isTreeTableHeadBranch)),
    },
    {
      type: STYLE_KEYS.BORDER_LINE_WIDTH,
      value: '0',
      test: isType(CLASS_TYPE.CALLOUT_TOPIC),
    },
    {
      type: STYLE_KEYS.BORDER_LINE_PATTERN,
      value: (branchView: BranchView) => {
        const originalBorderLinePattern = styleManager.getStyleValue(branchView, STYLE_KEYS.BORDER_LINE_PATTERN, {
          ignoreLayeredBeforeUser: true,
          ignoreDynamicPriorityOverridedStyle: true,
        });
        // @ts-ignore
        if (Object.values(DASH_LINE_PATTERN).includes(originalBorderLinePattern)) {
          if (originalBorderLinePattern === LINE_PATTERN.HANDDRAWNDASH) {
            return LINE_PATTERN.HANDDRAWNSOLID;
          } else {
            return LINE_PATTERN.SOLID;
          }
        }
      },
      test: utils.isTreeTableHeadBranch,
    },
  ],
};
