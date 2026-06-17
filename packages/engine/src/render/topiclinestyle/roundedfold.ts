import { STRUCTURECLASS } from "../../common/constants/index";
import * as js_utils from "../../utils/index";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

const TREE_HO_RATIO = 0.4;
const roundedfold_targetStructureArr = [
  STRUCTURECLASS.TREELEFT,
  STRUCTURECLASS.TREERIGHT,
  STRUCTURECLASS.TIMELINEHORIZONTALUP,
  STRUCTURECLASS.TIMELINEHORIZONTALDOWN,
  STRUCTURECLASS.TIMELINEVERTICAL,
  STRUCTURECLASS.TREESIDED,
];

export const roundedfold = Object(
  topicLineStyleUtils.lineStyleTemplateWithStructureConfig,
)([
  {
    test: (structureClass, _, parentBranch) => {
      if (Object(js_utils.isCentralBranch)(parentBranch)) {
        return false;
      }
      return roundedfold_targetStructureArr.includes(structureClass);
    },
    brush: {
      verticalBrush: brushes.hornVertical,
      horizonBrush: (lp) => Object(brushes.hornHorizon)(lp, TREE_HO_RATIO),
      taperedVerticalBrush: brushes.taperedHornVertical,
      taperedHorizonBrush: (lp, lw) =>
        Object(brushes.taperedHornHorizon)(lp, lw, TREE_HO_RATIO),
    },
  },
  // default
  {
    isDefault: true,
    test: () => true,
    brush: {
      verticalBrush: brushes.hornVertical,
      horizonBrush: brushes.hornHorizon,
      taperedHorizonBrush: brushes.taperedHornHorizon,
      taperedVerticalBrush: brushes.taperedHornVertical,
    },
  },
]);
