import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";
const options = {
  containerAreaAspectRatio: 1.378,
  contentAreaAspectRatio: 1.6,
  containerWidthContentWidthRatio: 1.4,
  contentAreaOffsetX: -0.1,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.RIGHT]: ({ width }) => ({
        x: width * -0.05,
        y: 0,
      }),
    },
  },
};
const fatrightarrowtopicshape_BODY_LENGTH_PERCENT = 0.57;
const fatrightarrowtopicshape_ARROW_INDENT_PERCENT = 0.15;
export class FatRightArrowTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const rectLeftTop = {
      x,
      y: y + height * fatrightarrowtopicshape_ARROW_INDENT_PERCENT,
    };
    const rectLeftBot = {
      x,
      y: y + height * (1 - fatrightarrowtopicshape_ARROW_INDENT_PERCENT),
    };
    const rectRightTop = {
      x: x + width * fatrightarrowtopicshape_BODY_LENGTH_PERCENT,
      y: rectLeftTop.y,
    };
    const rectRightBot = {
      x: rectRightTop.x,
      y: rectLeftBot.y,
    };
    const triangleLeftTop = {
      x: rectRightTop.x,
      y,
    };
    const triangleLeftBot = {
      x: rectRightTop.x,
      y: y + height,
    };
    const triangleRightMid = {
      x: x + width,
      y: y + height * 0.5,
    };
    return `M ${rectLeftTop.x} ${rectLeftTop.y} L ${rectRightTop.x} ${rectRightTop.y} L ${triangleLeftTop.x} ${triangleLeftTop.y} L ${triangleRightMid.x} ${triangleRightMid.y} L ${triangleLeftBot.x} ${triangleLeftBot.y} L ${rectRightBot.x} ${rectRightBot.y} L ${rectLeftBot.x} ${rectLeftBot.y} Z`;
  }
  getExtConnectionOffset(branchView) {
    const { height } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.UP:
      case constants.DIRECTION.DOWN:
        return fatrightarrowtopicshape_ARROW_INDENT_PERCENT * height;
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
          x: (isMapLike ? 0.1 : 0) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.3 : 0) * width,
          y: 0,
        };
      case constants.DIRECTION.UP:
        return {
          x: 0,
          y: fatrightarrowtopicshape_ARROW_INDENT_PERCENT * height,
        };
      case constants.DIRECTION.DOWN:
        return {
          x: 0,
          y: -fatrightarrowtopicshape_ARROW_INDENT_PERCENT * height,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
