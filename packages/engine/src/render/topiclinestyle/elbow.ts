import { STRUCTURECLASS } from "../../common/constants/index";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

// EXTERNAL MODULE: ./js/util.ts
/* harmony default export */
export const elbow = Object(
  topicLineStyleUtils.lineStyleTemplateWithStructureConfig,
)([
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
      verticalBrush: brushes.elbowVertical,
      horizonBrush: brushes.elbowHorizon,
      taperedHorizonBrush: (linePositions, lineWidth) =>
        Object(brushes.taperedElbowHorizon)(linePositions, lineWidth, true),
      taperedVerticalBrush: (linePositions, lineWidth) =>
        Object(brushes.taperedElbowVertical)(linePositions, lineWidth, true),
    },
  },
  // default
  {
    isDefault: true,
    test: () => true,
    brush: {
      verticalBrush: brushes.elbowVertical,
      horizonBrush: brushes.elbowHorizon,
      taperedHorizonBrush: brushes.taperedElbowHorizon,
      taperedVerticalBrush: brushes.taperedElbowVertical,
    },
  },
]);
