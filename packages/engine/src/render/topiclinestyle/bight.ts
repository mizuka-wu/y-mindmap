import { STRUCTURECLASS } from "../../common/constants/index";
import * as topicLineStyleUtils from "./utils";
import * as brushes from "../../render/brushes";

const targetStructureArr = [
  STRUCTURECLASS.TREELEFT,
  STRUCTURECLASS.TREERIGHT,
  STRUCTURECLASS.TIMELINEHORIZONTALDOWN,
  STRUCTURECLASS.TIMELINEVERTICAL,
  STRUCTURECLASS.TREESIDED,
];
export const bight = topicLineStyleUtils.fixBightTaperedPoint(
  Object(topicLineStyleUtils.lineStyleTemplateWithStructureConfig)([
    {
      test: (structureClass) =>
        structureClass === STRUCTURECLASS.TIMELINEHORIZONTALUP,
      brush: {
        // STRUCTURECLASS.TIMELINEHORIZONTALUP 方向向上所以要把 bightTreeHorizon 的方向翻转一下(第二个参数)
        horizonBrush: (lp) => Object(brushes.convexrect)(lp, true),
        verticalBrush: brushes.sinusVertical,
        taperedHorizonBrush: brushes.taperedBightTreeHorizon,
        taperedVerticalBrush: brushes.taperedSinusVertical,
      },
    },
    {
      test: (structureClass) => targetStructureArr.includes(structureClass),
      brush: {
        horizonBrush: brushes.convexrect,
        verticalBrush: brushes.sinusVertical,
        taperedHorizonBrush: brushes.taperedBightTreeHorizon,
        taperedVerticalBrush: brushes.taperedSinusVertical,
      },
    },
    // default
    {
      isDefault: true,
      test: () => true,
      brush: {
        horizonBrush: brushes.sinusHorizon,
        verticalBrush: brushes.sinusVertical,
        taperedHorizonBrush: brushes.taperedSinusHorizon,
        taperedVerticalBrush: brushes.taperedSinusVertical,
      },
    },
  ]),
);
