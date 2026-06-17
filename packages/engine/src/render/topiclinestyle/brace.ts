import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";
export const brace = Object(topicLineStyleUtils.braceLineStyleTemplate)({
  verticalBrush: brushes.braceVertical,
  fullVerticalBrush: brushes.fullBraceVertical,
  taperedVerticalBrush: brushes.taperedBraceVertical,
  fullTaperedVerticalBrush: brushes.fullTaperedBraceVertical,
});
