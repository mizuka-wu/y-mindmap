import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as brushes from "./brushes";

import * as common_utils from "../../../../common/utils/index";

import AbstractTopicShape from "./abstracttopicshape";
import { UnderlineTopicShape } from "./underlinetopicshape";

export class DoubleUnderlineTopicShape extends UnderlineTopicShape {
  getBasePoint(branch, direction) {
    const needOffset = [
      constants.DIRECTION.LEFT,
      constants.DIRECTION.RIGHT,
    ].includes(direction);
    const ifFocusLine =
      Object(topicShapesUtils.getLineFocusType)(branch) ===
      topicShapesUtils.LINE_FOCUS_TYPE.FOCUS_LINE;
    const basePt = Object(topicShapesUtils.getJointPosition)(
      branch.topicView.shapeBounds,
      direction,
    );
    if (ifFocusLine && needOffset) {
      return Object(common_utils.addPoint)(basePt, calcDoubleUnderline(branch));
    } else {
      return basePt;
    }
  }
  // TODO 暂时修复 double underline 连线无法连接到 topic 的问题
  // 真正的原因可能是 topic 提供的 shapeBounds 有问题
  getPointOffset(branch, direction) {
    const borderWidth = branch.topicView.figure.borderWidth || 0;
    if (direction === constants.DIRECTION.LEFT) {
      return {
        x: borderWidth / 2,
        y: 0,
      };
    }
    return {
      x: 0,
      y: 0,
    };
  }
  _render(topicView) {
    AbstractTopicShape.prototype._render.call(this, topicView, true);
  }
  calcTopicShapePath(bounds) {
    return brushes.doubleUnderline(bounds);
  }
  getTopicMargins(branch) {
    const { lm, rm, tm, bm, lw } = Object(topicShapesUtils.getUnits)(branch);
    return {
      top: tm,
      left: lm,
      bottom: bm + lw,
      right: rm,
    };
  }
}
function calcDoubleUnderline(parentBranch) {
  const { shapeBounds: bounds } = parentBranch.topicView;
  return {
    x: 0,
    y: bounds.y + bounds.height,
  };
}
