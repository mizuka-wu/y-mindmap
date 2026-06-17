import * as topicShapesUtils from "./utils";

import AbstractTopicShape from "./abstracttopicshape";

export class DiamondTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    const horScale = 0.5;
    const verScale = 0.1;
    const fontSize = Math.min(
      50,
      Object(topicShapesUtils.getFontSize)(branchView),
    );
    const lw = Object(topicShapesUtils.getBorderWidth)(branchView);
    const w = size.width * 0.5;
    let h = size.height * 0.5;
    if (h <= 0) {
      h = fontSize / 2;
    }
    const d = Math.sqrt(h * w);
    const m = Math.round(d) + lw;
    return {
      top: m + lw + fontSize * verScale,
      left: m + lw + fontSize * horScale,
      bottom: m + lw + fontSize * verScale,
      right: m + lw + fontSize * horScale,
    };
  }
  calcTopicShapePath(topicBounds, topicView) {
    const bounds = Object.assign({}, topicBounds);
    const borderWidth = parseInt(`${topicView.figure.borderWidth || 0}`);
    if (borderWidth > 0) {
      const halfBorderWidth = topicView.figure.borderWidth / 2;
      const tmp = halfBorderWidth * (Math.abs(bounds.x) / Math.abs(bounds.y));
      const offset =
        (Math.sqrt(Math.pow(halfBorderWidth, 2) + Math.pow(tmp, 2)) -
          halfBorderWidth) /
        2;
      bounds.x -= offset;
    }
    return (
      "M " +
      (bounds.x + bounds.x + bounds.width) +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.y + bounds.height) +
      "L " +
      (bounds.x + bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.height) +
      "L " +
      bounds.x +
      " " +
      (bounds.y + bounds.y + bounds.height) +
      "z"
    );
  }
}
