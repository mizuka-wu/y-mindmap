import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";
import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const CONNECTION_POINT_OFFSET_RATIO_HOR = 0.03;
const options = {
  containerAreaAspectRatio: 0.8358,
  contentAreaAspectRatio: 1,
  containerWidthContentWidthRatio: 1.45,
  contentAreaOffsetY: -0.05,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width, height }) => ({
        x: width * 0.02,
        y: height * -0.05,
      }),
      [constants.DIRECTION.RIGHT]: ({ width, height }) => ({
        x: width * -0.02,
        y: height * -0.05,
      }),
    },
  },
};
export class ShieldTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    // Key Points
    const top = {
      x: x + width / 2,
      y,
    };
    const topStepLeft = {
      x: top.x - width * 0.006,
      y: top.y + height * 0.0015,
    };
    const topStepRight = {
      x: top.x + width * 0.006,
      y: top.y + height * 0.0015,
    };
    const left = {
      x,
      y: y + height * 0.149,
    };
    const right = {
      x: x + width,
      y: y + height * 0.149,
    };
    const bottom = {
      x: x + width / 2,
      y: y + height,
    };
    const bottomStepLeft = {
      x: bottom.x - width * 0.124,
      y: bottom.y - height * 0.044,
    };
    const bottomStepRight = {
      x: bottom.x + width * 0.124,
      y: bottom.y - height * 0.044,
    };
    // Control Points
    const topCPLeft = {
      x: top.x - width * 0.003,
      y: top.y,
    };
    const topCPRight = {
      x: top.x + width * 0.003,
      y: top.y,
    };
    const topStepLeftCPRightTop = {
      x: topStepLeft.x + width * 0.0013,
      y: topStepLeft.y - height * 0.0007,
    };
    const topStepRightCPLeftTop = {
      x: topStepRight.x - width * 0.0013,
      y: topStepLeft.y - height * 0.0007,
    };
    const topStepLeftCPLeftBottom = {
      x: topStepLeft.x - width * 0.145,
      y: topStepLeft.y + height * 0.074,
    };
    const topStepRightCPRightBottom = {
      x: topStepLeft.x + width * 0.145,
      y: topStepLeft.y + height * 0.074,
    };
    const leftCPRightTop = {
      x: left.x + width * 0.14,
      y: left.y - height * 0.0206,
    };
    const rightCPLeftTop = {
      x: right.x - width * 0.14,
      y: left.y - height * 0.0206,
    };
    const leftCPBottom = {
      x: left.x,
      y: left.y + height * 0.6458,
    };
    const rightCPBottom = {
      x: right.x,
      y: right.y + height * 0.6458,
    };
    const bottomStepLeftCP = {
      x: bottom.x - width * 0.25,
      y: bottom.y - height * 0.086,
    };
    const bottomStepRightCP = {
      x: bottom.x + width * 0.25,
      y: bottom.y - height * 0.086,
    };
    return `M ${top.x} ${top.y} C ${topCPLeft.x} ${topCPLeft.y}, ${topStepLeftCPRightTop.x} ${topStepLeftCPRightTop.y}, ${topStepLeft.x} ${topStepLeft.y} C ${topStepLeftCPLeftBottom.x} ${topStepLeftCPLeftBottom.y}, ${leftCPRightTop.x} ${leftCPRightTop.y}, ${left.x} ${left.y} C ${leftCPBottom.x} ${leftCPBottom.y}, ${bottomStepLeftCP.x} ${bottomStepLeftCP.y}, ${bottomStepLeft.x} ${bottomStepLeft.y} L ${bottom.x} ${bottom.y} L ${bottomStepRight.x} ${bottomStepRight.y} C ${bottomStepRightCP.x} ${bottomStepRightCP.y}, ${rightCPBottom.x} ${rightCPBottom.y}, ${right.x} ${right.y} C ${rightCPLeftTop.x} ${rightCPLeftTop.y}, ${topStepRightCPRightBottom.x} ${topStepRightCPRightBottom.y}, ${topStepRight.x} ${topStepRight.y} C ${topStepRightCPLeftTop.x} ${topStepRightCPLeftTop.y}, ${topCPRight.x} ${topCPRight.y}, ${top.x} ${top.y} Z`;
    // left part (from top, anti-clockwise)

    // right part (from bottom, anti-clockwise)
  }
  getExtConnectionOffset(branchView) {
    const { width } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.RIGHT:
      case constants.DIRECTION.LEFT:
        return CONNECTION_POINT_OFFSET_RATIO_HOR * width;
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
          x: (isMapLike ? 0.15 : CONNECTION_POINT_OFFSET_RATIO_HOR) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.15 : -CONNECTION_POINT_OFFSET_RATIO_HOR) * width,
          y: 0,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
