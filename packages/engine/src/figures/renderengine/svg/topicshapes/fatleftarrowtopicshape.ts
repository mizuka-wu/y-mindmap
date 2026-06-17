import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";
const options = {
  containerAreaAspectRatio: 1.378,
  contentAreaAspectRatio: 1.6,
  containerWidthContentWidthRatio: 1.4,
  contentAreaOffsetX: 0.1,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width }) => ({
        x: width * 0.05,
        y: 0,
      }),
    },
  },
};
const BODY_LENGTH_PERCENT = 0.57;
const ARROW_INDENT_PERCENT = 0.15;
export class FatLeftArrowTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const ltRect = {
      x: x + (1 - BODY_LENGTH_PERCENT) * width,
      y: y + height * ARROW_INDENT_PERCENT,
    };
    const lbRect = {
      x: ltRect.x,
      y: y + height * (1 - ARROW_INDENT_PERCENT),
    };
    const rtRect = {
      x: x + width,
      y: ltRect.y,
    };
    const rbRect = {
      x: x + width,
      y: lbRect.y,
    };
    const rtTriangle = {
      x: ltRect.x,
      y,
    };
    const rbTriangle = {
      x: ltRect.x,
      y: y + height,
    };
    const leftTriangle = {
      x,
      y: y + height * 0.5,
    };
    return `M ${rtRect.x} ${rtRect.y} L ${ltRect.x} ${ltRect.y} L ${rtTriangle.x} ${rtTriangle.y} L ${leftTriangle.x} ${leftTriangle.y} L ${rbTriangle.x} ${rbTriangle.y} L ${lbRect.x} ${lbRect.y} L ${rbRect.x} ${rbRect.y} Z`;
  }
  getExtConnectionOffset(branchView) {
    const { height } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.UP:
      case constants.DIRECTION.DOWN:
        return ARROW_INDENT_PERCENT * height;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  _getCommonPointOffset(branch, direction) {
    const isMapLike = branch.isMapLike();
    const { width, height } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: (isMapLike ? 0.3 : 0) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.1 : 0) * width,
          y: 0,
        };
      case constants.DIRECTION.UP:
        return {
          x: 0,
          y: ARROW_INDENT_PERCENT * height,
        };
      case constants.DIRECTION.DOWN:
        return {
          x: 0,
          y: -ARROW_INDENT_PERCENT * height,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
