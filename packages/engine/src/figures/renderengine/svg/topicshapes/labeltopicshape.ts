import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const options = {
  containerAreaAspectRatio: 1.858,
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
const labeltopicshape_BODY_LENGTH_PERCENT = 0.77;
export class LabelTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const lt = {
      x,
      y,
    };
    const lb = {
      x,
      y: y + height,
    };
    const rt = {
      x: x + labeltopicshape_BODY_LENGTH_PERCENT * width,
      y,
    };
    const rm = {
      x: x + width,
      y: y + height * 0.5,
    };
    const rb = {
      x: rt.x,
      y: lb.y,
    };
    return `M ${lt.x} ${lt.y} L ${lb.x} ${lb.y} L ${rb.x} ${rb.y} L ${rm.x} ${rm.y} L ${rt.x} ${rt.y} Z`;
  }
  _getCommonPointOffset(branch, direction) {
    const isMapLike = branch.isMapLike();
    const { width } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: (isMapLike ? 0.15 : 0) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.2 : 0) * width,
          y: 0,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
