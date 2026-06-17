import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

import * as common_utils from "../../../../common/utils/index";
const CONNECTION_POINT_OFFSET_RATIO_HOR = 0.04;
const CONNECTION_POINT_OFFSET_RATIO_BOT = 0.15;
const options = {
  containerAreaAspectRatio: 1.082,
  contentAreaAspectRatio: 1.6,
  containerWidthContentWidthRatio: 1.483,
  contentAreaOffsetY: -0.05,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width, height }) => ({
        x: width * 0.01,
        y: height * -0.18,
      }),
      [constants.DIRECTION.RIGHT]: ({ width, height }) => ({
        x: width * -0.01,
        y: height * -0.18,
      }),
    },
  },
};
export class HeartTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const originTo = (xPercent, yPercent) =>
      Object(common_utils.addPoint)(
        {
          x,
          y,
        },
        {
          x: xPercent * width,
          y: yPercent * height,
        },
      );
    // Key points
    const midTop = originTo(0.5, 0.151);
    const leftStep1 = originTo(0.272, 0);
    const rightStep1 = originTo(0.728, 0);
    const leftStep2 = originTo(0, 0.3264);
    const rightStep2 = originTo(1, 0.3264);
    const bottomLeft = originTo(0.491, 0.994);
    const bottomRight = originTo(0.509, 0.994);
    // Control points
    const midTopCPLeftTop = originTo(0.449, 0.06);
    const midTopCPRightTop = originTo(0.5509999999999999, 0.06);
    const leftStep1CPLeft = originTo(0.111, 0);
    const leftStep1CPRight = originTo(0.372, 0);
    const rightStep1CPLeft = originTo(0.628, 0);
    const rightStep1CPRight = originTo(0.889, 0);
    const leftStep2CPTop = originTo(0, 0.142);
    const leftStep2CPBottom = originTo(0, 0.623);
    const rightStep2CPTop = originTo(1, 0.142);
    const rightStep2CPBottom = originTo(1, 0.623);
    const bottomLeftCP = originTo(0.4206, 0.946);
    const bottomRightCP = originTo(0.5794, 0.946);
    const bottomCP = originTo(0.5, 1);
    return `M ${midTop.x} ${midTop.y} C ${midTopCPLeftTop.x} ${midTopCPLeftTop.y}, ${leftStep1CPRight.x} ${leftStep1CPRight.y}, ${leftStep1.x} ${leftStep1.y} C ${leftStep1CPLeft.x} ${leftStep1CPLeft.y}, ${leftStep2CPTop.x} ${leftStep2CPTop.y}, ${leftStep2.x} ${leftStep2.y} C ${leftStep2CPBottom.x} ${leftStep2CPBottom.y}, ${bottomLeftCP.x} ${bottomLeftCP.y}, ${bottomLeft.x} ${bottomLeft.y} Q ${bottomCP.x} ${bottomCP.y}, ${bottomRight.x} ${bottomRight.y}C ${bottomRightCP.x} ${bottomRightCP.y}, ${rightStep2CPBottom.x} ${rightStep2CPBottom.y}, ${rightStep2.x} ${rightStep2.y} C ${rightStep2CPTop.x} ${rightStep2CPTop.y}, ${rightStep1CPRight.x} ${rightStep1CPRight.y}, ${rightStep1.x} ${rightStep1.y} C ${rightStep1CPLeft.x} ${rightStep1CPLeft.y}, ${midTopCPRightTop.x} ${midTopCPRightTop.y}, ${midTop.x} ${midTop.y} Z`;
    // left part (anti-clockwise)

    // smooth curve of bottom

    // right part (anti-clockwise)
  }
  getExtConnectionOffset(branchView) {
    const { width, height } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.RIGHT:
      case constants.DIRECTION.LEFT:
        return CONNECTION_POINT_OFFSET_RATIO_HOR * width;
      case constants.DIRECTION.DOWN:
        return CONNECTION_POINT_OFFSET_RATIO_BOT * height;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  _getCommonPointOffset(branch, direction) {
    const isMapLike = branch.isMapLike();
    const { width, height } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        if (isMapLike) {
          return {
            x: width * 0.24,
            y: 0,
          };
        } else {
          return {
            x: CONNECTION_POINT_OFFSET_RATIO_HOR * width,
            y: 0,
          };
        }
      case constants.DIRECTION.RIGHT:
        if (isMapLike) {
          return {
            x: width * -0.24,
            y: 0,
          };
        } else {
          return {
            x: -CONNECTION_POINT_OFFSET_RATIO_HOR * width,
            y: 0,
          };
        }
      case constants.DIRECTION.UP:
        return {
          x: 0,
          y: CONNECTION_POINT_OFFSET_RATIO_BOT * height,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
