import * as topicShapesUtils from "./utils";
import * as brushes from "./brushes";

import AbstractTopicShape from "./abstracttopicshape";

const scale = 1 / 4;
const verScale = 0.1;
export class EllipticRecTangleTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    let peak = Math.min(scale * size.height, size.width * 0.2);
    peak = Math.round(peak);
    const fontSize = Object(topicShapesUtils.getFontSize)(branchView);
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const topicMargins = super.getTopicMargins(branchView);
    return {
      top: Math.max(topicMargins.top, peak + borderWidth) + fontSize * verScale,
      left: topicMargins.left,
      bottom:
        Math.max(topicMargins.bottom, peak + borderWidth) + fontSize * verScale,
      right: topicMargins.right,
    };
  }
  calcTopicShapePath(bound) {
    return brushes.convexrect(bound);
  }
}
