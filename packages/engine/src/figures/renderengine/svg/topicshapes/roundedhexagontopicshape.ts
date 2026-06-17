import * as topicShapesUtils from "./utils";
import * as brushes from "./brushes";

import AbstractTopicShape from "./abstracttopicshape";

const verScale = 0.1;
export class RoundedHexagonTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    let peak = Math.min(size.height * 0.5, size.width * 0.2);
    peak = Math.round(peak);
    const topicMargins = super.getTopicMargins(branchView);
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const fontSize = Object(topicShapesUtils.getFontSize)(branchView);
    return {
      top: Math.max(topicMargins.top, peak + borderWidth) + fontSize * verScale,
      left: topicMargins.left,
      bottom:
        Math.max(topicMargins.bottom, peak + borderWidth) + fontSize * verScale,
      right: topicMargins.right,
    };
  }
  calcTopicShapePath(bound) {
    return brushes.peakrect(bound);
  }
}
