import * as topicShapesUtils from "./utils";

import AbstractTopicShape from "./abstracttopicshape";

const scale = 0.5;
const horScale = 0.5;
const verScale = 0.1;
function calcParallelogramByDir(branch, dir) {
  const { shapeBounds: bounds } = branch.topicView;
  const offsetX = -bounds.height / 4;
  const originPos = {
    x: 0,
    y: 0,
  };
  return Object(topicShapesUtils.addPositionByDirection)(
    originPos,
    dir,
    offsetX,
    0,
  );
}
export class ParallelogramTopicShape extends AbstractTopicShape {
  getPointOffset(branch, direction) {
    return calcParallelogramByDir(branch, direction);
  }
  getTopicMargins(branchView /*BranchView*/, size) {
    const topicMargins = super.getTopicMargins(branchView);
    const fontSize = Object(topicShapesUtils.getFontSize)(branchView);
    return {
      top: topicMargins.top + fontSize * verScale,
      left:
        topicMargins.left +
        Math.round(size.height * scale) +
        1 +
        fontSize * horScale,
      bottom: topicMargins.bottom + fontSize * verScale,
      right:
        topicMargins.right +
        Math.round(size.height * scale) +
        1 +
        fontSize * horScale,
    };
  }
  calcTopicShapePath(bounds) {
    return (
      "M " +
      (bounds.x + bounds.y + bounds.height) +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width) +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width + bounds.y) +
      " " +
      (bounds.y + bounds.height) +
      "L " +
      bounds.x +
      " " +
      (bounds.y + bounds.height) +
      "z"
    );
  }
}
