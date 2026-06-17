import { STRUCTURECLASS } from "../../common/constants/index";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

export const roundedelbow = Object(
  topicLineStyleUtils.lineStyleTemplateWithStructureConfig,
)(
  [
    {
      test: (structureClass) => {
        const allowedClassList = [
          STRUCTURECLASS.MAPUNBALANCED,
          STRUCTURECLASS.MAPCLOCKWISE,
          STRUCTURECLASS.MAP,
          STRUCTURECLASS.ORGCHARTDOWN,
          STRUCTURECLASS.ORGCHARTUP,
          STRUCTURECLASS.LOGICRIGHT,
          STRUCTURECLASS.LOGICLEFT,
          STRUCTURECLASS.TREERIGHT,
          STRUCTURECLASS.TREELEFT,
        ];
        return allowedClassList.includes(structureClass);
      },
      brush: {
        verticalBrush: brushes.roundedElbowVertical,
        horizonBrush: brushes.roundedElbowHorizon,
        taperedHorizonBrush: (linePositions, lineWidth, corner) =>
          Object(brushes.taperedRoundedElbowHorizon)(
            linePositions,
            lineWidth,
            corner,
            true,
          ),
        taperedVerticalBrush: (linePositions, lineWidth, corner) =>
          Object(brushes.taperedRoundedElbowVertical)(
            linePositions,
            lineWidth,
            corner,
            true,
          ),
      },
    },
    // default
    {
      isDefault: true,
      test: () => true,
      brush: {
        verticalBrush: brushes.roundedElbowVertical,
        horizonBrush: brushes.roundedElbowHorizon,
        taperedHorizonBrush: brushes.taperedRoundedElbowHorizon,
        taperedVerticalBrush: brushes.taperedRoundedElbowVertical,
      },
    },
  ],
  (childBranch) => {
    return [parseInt(`${childBranch.topicView.figure.lineCorner || 0}`)]; // corner
  },
);
