import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

// EXTERNAL MODULE: ./js/util.ts

export const fold2 = Object(topicLineStyleUtils.lineStyleTemplate)({
  verticalBrush: brushes.skewElbowVertical,
  horizonBrush: brushes.skewElbowHorizon,
  taperedHorizonBrush: brushes.taperedSkewElbowHorizon,
  taperedVerticalBrush: brushes.taperedSkewElbowVertical,
});
