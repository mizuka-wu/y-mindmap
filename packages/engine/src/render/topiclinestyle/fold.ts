import { STRUCTURECLASS } from "../../common/constants/index";
import * as js_utils from "../../utils/index";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

// EXTERNAL MODULE: ./js/util.ts

const TREE_SE_RATIO = 0.5;
const fold_targetStructureArr = [
  STRUCTURECLASS.TREELEFT,
  STRUCTURECLASS.TREERIGHT,
  STRUCTURECLASS.TIMELINEHORIZONTALUP,
  STRUCTURECLASS.TIMELINEHORIZONTALDOWN,
  STRUCTURECLASS.TIMELINEVERTICAL,
  STRUCTURECLASS.TREESIDED,
];
export const fold = Object(
  topicLineStyleUtils.lineStyleTemplateWithStructureConfig,
)([
  {
    test: (structureClass, _, parentBranch) => {
      if (Object(js_utils.isCentralBranch)(parentBranch)) {
        return false;
      }
      return fold_targetStructureArr.includes(structureClass);
    },
    brush: {
      verticalBrush: brushes.skewElbowVertical,
      horizonBrush: (lp) => Object(brushes.skewElbowHorizon)(lp, TREE_SE_RATIO),
      taperedVerticalBrush: brushes.taperedSkewElbowVertical,
      taperedHorizonBrush: (lp, lw) =>
        Object(brushes.taperedSkewElbowHorizon)(lp, lw, TREE_SE_RATIO),
    },
  },
  // default
  {
    isDefault: true,
    test: () => true,
    brush: {
      verticalBrush: brushes.skewElbowVertical,
      horizonBrush: brushes.skewElbowHorizon,
      taperedHorizonBrush: brushes.taperedSkewElbowHorizon,
      taperedVerticalBrush: brushes.taperedSkewElbowVertical,
    },
  },
]);
