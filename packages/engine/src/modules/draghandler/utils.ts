import mommonFuncs from "../../mommonfuncs";

import {
  TOPIC_DETACHED,
  TOPIC_CALLOUT,
  TOPIC_SUMMARY,
  TOPIC_ATTACHED,
} from "../../common/constants/index";
/** @deprecated */
export const forEachBranchArray = (rootBranchArr, callback) => {
  for (const rootBranch of rootBranchArr) {
    const result = forEachBranch(rootBranch, callback);
    if (result === mommonFuncs.BREAK) {
      return mommonFuncs.BREAK;
    }
  }
};
/** @deprecated */
export const forEachBranch = (rootBranch, callback) => {
  return mommonFuncs.postorderIterate(
    rootBranch,
    [TOPIC_DETACHED, TOPIC_CALLOUT, TOPIC_SUMMARY, TOPIC_ATTACHED],
    (branch) => {
      if (!branch.shouldHide()) {
        const flag = callback(branch);
        if (flag) {
          return mommonFuncs.BREAK;
        }
      }
    },
  );
};
