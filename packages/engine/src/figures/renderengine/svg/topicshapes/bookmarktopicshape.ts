import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const MIDDLE_INDENT_PERCENT = 0.233;
const options = {
  containerAreaAspectRatio: 1.82,
  contentAreaAspectRatio: 1.5,
  containerWidthContentWidthRatio: 1.5,
  contentAreaOffsetX: 0.1,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.DIVER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width }) => ({
        x: width * 0.08,
        y: 0,
      }),
      [constants.DIRECTION.RIGHT]: ({ width }) => ({
        x: width * 0.1,
        y: 0,
      }),
    },
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width }) => ({
        x: MIDDLE_INDENT_PERCENT * width,
        y: 0,
      }),
      [constants.DIRECTION.RIGHT]: () => ({
        x: 0,
        y: 0,
      }),
    },
  },
};
export class BookmarkTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const leftTop = {
      x,
      y,
    };
    const leftMid = {
      x: x + MIDDLE_INDENT_PERCENT * width,
      y: y + height * 0.5,
    };
    const leftBot = {
      x,
      y: y + height,
    };
    const rightTop = {
      x: x + width,
      y,
    };
    const rightBot = {
      x: rightTop.x,
      y: y + height,
    };
    return `M ${leftTop.x} ${leftTop.y} L ${leftMid.x} ${leftMid.y} L ${leftBot.x} ${leftBot.y} L ${rightBot.x} ${rightBot.y} L ${rightTop.x} ${rightTop.y} Z`;
  }
  getExtConnectionOffset(branchView) {
    const { width } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.RIGHT:
        return MIDDLE_INDENT_PERCENT * width;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  _getCommonPointOffset(branch, direction) {
    const { width } = branch.topicView.shapeBounds;
    const isMapLike = branch.isMapLike();
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: MIDDLE_INDENT_PERCENT * width * (isMapLike ? 1.5 : 0.97),
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: isMapLike ? -MIDDLE_INDENT_PERCENT * width : width * 0.02,
          y: 0,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
