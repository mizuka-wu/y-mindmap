import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const CONNECTION_POINT_OFFSET_RATIO_LEFT = 0.04;
const CONNECTION_POINT_OFFSET_RATIO_RIGHT = 0.07;
const options = {
  containerAreaAspectRatio: 1.624,
  contentAreaAspectRatio: 1.44,
  containerWidthContentWidthRatio: 1.82,
  contentAreaOffsetY: 0.1,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width, height }) => ({
        x: width * 0.02,
        y: height * 0.18,
      }),
      [constants.DIRECTION.RIGHT]: ({ width, height }) => ({
        x: width * -0.02,
        y: height * 0.18,
      }),
    },
  },
};
export class SimpleCloudTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    // Key points
    const bottomLeft = {
      x: x + width * 0.196,
      y: y + height,
    };
    const bottomRight = {
      x: x + width * 0.827,
      y: y + height,
    };
    const left = {
      x,
      y: y + height * 0.681,
    };
    const right = {
      x: x + width,
      y: y + height * 0.72,
    };
    const leftStep = {
      x: x + width * 0.207,
      y: y + height * 0.363,
    };
    const rightStep = {
      x: x + width * 0.809,
      y: y + height * 0.441,
    };
    const top = {
      x: x + width * 0.504,
      y,
    };
    // Control Points
    const bottomLeftCPLeft = {
      x: bottomLeft.x - width * 0.108,
      y: bottomLeft.y,
    };
    const leftCPBottom = {
      x: left.x,
      y: left.y + height * 0.176,
    };
    const leftCPTop = {
      x: left.x,
      y: left.y - height * 0.176,
    };
    const leftStepCPLeftTop = {
      x: leftStep.x - width * 0.1167,
      y: leftStep.y - height * 0.01,
    };
    const leftStepCPRightTop = {
      x: leftStep.x + width * 0.036,
      y: leftStep.y - height * 0.21,
    };
    const topCPLeft = {
      x: top.x - width * 0.14,
      y: top.y,
    };
    const topCPRight = {
      x: top.x + width * 0.158,
      y: top.y,
    };
    const rightStepCPLeftTop = {
      x: rightStep.x - width * 0.018,
      y: rightStep.y - height * 0.248,
    };
    const rightStepCPRightTop = {
      x: rightStep.x + width * 0.111,
      y: rightStep.y - height * 0.018,
    };
    const rightCPTop = {
      x: right.x,
      y: right.y - height * 0.15,
    };
    const rightCPBottom = {
      x: right.x,
      y: right.y + height * 0.16,
    };
    const bottomRightCPRight = {
      x: bottomRight.x + width * 0.095,
      y: bottomRight.y,
    };
    return `M ${bottomLeft.x} ${bottomLeft.y} C ${bottomLeftCPLeft.x} ${bottomLeftCPLeft.y}, ${leftCPBottom.x} ${leftCPBottom.y}, ${left.x} ${left.y} C ${leftCPTop.x} ${leftCPTop.y}, ${leftStepCPLeftTop.x} ${leftStepCPLeftTop.y}, ${leftStep.x} ${leftStep.y} C ${leftStepCPRightTop.x} ${leftStepCPRightTop.y}, ${topCPLeft.x} ${topCPLeft.y}, ${top.x} ${top.y} C ${topCPRight.x} ${topCPRight.y}, ${rightStepCPLeftTop.x} ${rightStepCPLeftTop.y}, ${rightStep.x} ${rightStep.y} C ${rightStepCPRightTop.x} ${rightStepCPRightTop.y}, ${rightCPTop.x} ${rightCPTop.y}, ${right.x} ${right.y} C ${rightCPBottom.x} ${rightCPBottom.y}, ${bottomRightCPRight.x} ${bottomRightCPRight.y}, ${bottomRight.x} ${bottomRight.y} Z`;
  }
  getExtConnectionOffset(branchView) {
    const { width } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.RIGHT:
        return CONNECTION_POINT_OFFSET_RATIO_LEFT * width;
      case constants.DIRECTION.LEFT:
        return CONNECTION_POINT_OFFSET_RATIO_RIGHT * width;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  _getCommonPointOffset(branch, direction) {
    const isMapLike = branch.isMapLike();
    const { width } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: (isMapLike ? 0.2 : CONNECTION_POINT_OFFSET_RATIO_LEFT) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.2 : -CONNECTION_POINT_OFFSET_RATIO_RIGHT) * width,
          y: 0,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
