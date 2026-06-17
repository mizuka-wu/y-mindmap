import * as topicShapesUtils from "./utils";

import AbstractTopicShape from "./abstracttopicshape";

export class HandDrawnEllipseTopicShape extends AbstractTopicShape {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTopicMargins(branchView /*BranchView*/, size) {
    const fontSize = Object(topicShapesUtils.getFontSize)(branchView);
    const topicMargins = super.getTopicMargins(branchView);
    return {
      top: topicMargins.top + fontSize,
      left: topicMargins.left + fontSize,
      bottom: topicMargins.bottom + fontSize,
      right: topicMargins.right + fontSize,
    };
  }
  calcTopicShapePath(bounds) {
    const capOffset = bounds.height * 0.03;
    const capPoint = {
      x: bounds.x + bounds.width * 0.8,
      y: bounds.y + bounds.height * 0.05,
    };
    return `
        M ${capPoint.x} ${capPoint.y + capOffset}
        C ${bounds.x - bounds.width / 7} ${bounds.y - bounds.height / 4}, ${
          bounds.x - bounds.width / 4
        } ${bounds.y + bounds.height} , ${bounds.x + bounds.width / 2} ${
          bounds.y + bounds.height
        }
        C ${bounds.x + bounds.width * 1.1} ${bounds.y + bounds.height} , ${
          bounds.x + bounds.width * 1.1
        } ${bounds.y + bounds.height / 6} , ${capPoint.x} ${capPoint.y - capOffset}
      `;
  }
}
