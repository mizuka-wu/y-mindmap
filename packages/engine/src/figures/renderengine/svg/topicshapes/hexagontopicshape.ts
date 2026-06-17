import * as topicShapesUtils from "./utils";

import AbstractTopicShape from "./abstracttopicshape";

import * as brushes from "./brushes";

const scale = 1 / 7;
const verScale = 0.1;
export class HexagonTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    const horizonPadding = Math.round(scale * size.width);
    const topicMargins = super.getTopicMargins(branchView);
    const fontSize = Object(topicShapesUtils.getFontSize)(branchView);
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    return {
      top: topicMargins.top + fontSize * verScale,
      left: Math.max(horizonPadding + borderWidth, topicMargins.left),
      bottom: topicMargins.bottom + fontSize * verScale,
      right: Math.max(horizonPadding + borderWidth, topicMargins.right),
    };
  }
  calcTopicShapePath(bound) {
    return brushes.hexagon(bound);
  }
}
