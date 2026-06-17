import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const CONNECTION_POINT_OFFSET_RATIO_HOR = 0.16;
const options = {
  containerAreaAspectRatio: 1.35,
  contentAreaAspectRatio: 1.52,
  containerWidthContentWidthRatio: 1.785,
  contentAreaOffsetY: -0.136,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.DIVER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width }) => ({
        x: width * 0.08,
        y: 0,
      }),
      [constants.DIRECTION.RIGHT]: ({ width }) => ({
        x: width * -0.08,
        y: 0,
      }),
    },
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width, height }) => ({
        x: width * 0.05,
        y: height * -0.24,
      }),
      [constants.DIRECTION.RIGHT]: ({ width, height }) => ({
        x: width * -0.05,
        y: height * -0.24,
      }),
    },
  },
};
export class CutDiamondTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  getExtConnectionOffset(branchView) {
    const { width } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.LEFT:
      case constants.DIRECTION.RIGHT:
        return CONNECTION_POINT_OFFSET_RATIO_HOR * width;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const leftTop = {
      x: x + width * 0.137,
      y,
    };
    const rightTop = {
      x: x + width * 0.863,
      y,
    };
    const leftMid = {
      x,
      y: y + height * 0.267,
    };
    const rightMid = {
      x: x + width,
      y: y + height * 0.267,
    };
    const bot = {
      x: x + width * 0.5,
      y: y + height,
    };
    return `M ${leftTop.x} ${leftTop.y} L ${rightTop.x} ${rightTop.y} L ${rightMid.x} ${rightMid.y} L ${bot.x} ${bot.y} L ${leftMid.x} ${leftMid.y} Z`;
  }
  _getCommonPointOffset(branch, direction) {
    const { width, height } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: CONNECTION_POINT_OFFSET_RATIO_HOR * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: -CONNECTION_POINT_OFFSET_RATIO_HOR * width,
          y: 0,
        };
      case constants.DIRECTION.UP:
        return {
          x: 0,
          y: height * 0.01,
        };
      case constants.DIRECTION.DOWN:
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
