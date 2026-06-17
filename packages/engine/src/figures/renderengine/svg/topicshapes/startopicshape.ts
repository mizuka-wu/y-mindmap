import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import * as utils from "../../../../utils/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const CONNECTION_POINT_OFFSET_RATIO_HOR = 0.11;
const CONNECTION_POINT_OFFSET_RATIO_TOP = 0.02;
const CONNECTION_POINT_OFFSET_RATIO_BOT = 0.15;
const options = {
  containerAreaAspectRatio: 1,
  contentAreaAspectRatio: 1.142,
  containerWidthContentWidthRatio: 2.2,
  contentAreaOffsetY: 0.07,
  pointOffsetByLineFocusTypeAndDirection: {
    [topicShapesUtils.LINE_FOCUS_TYPE.DIVER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width }) => ({
        x: width * 0.1,
        y: 0,
      }),
      [constants.DIRECTION.RIGHT]: ({ width }) => ({
        x: width * -0.1,
        y: 0,
      }),
    },
    [topicShapesUtils.LINE_FOCUS_TYPE.ORDER_LINE]: {
      [constants.DIRECTION.LEFT]: ({ width, height }) => ({
        x: width * 0.08,
        y: height * -0.105,
      }),
      [constants.DIRECTION.RIGHT]: ({ width, height }) => ({
        x: width * -0.08,
        y: height * -0.105,
      }),
    },
  },
};
export class StarTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  getExtConnectionOffset(branchView) {
    const { width, height } = branchView.topicView.shapeBounds;
    const dir = Object(utils.getChildTargetOrientation)(branchView);
    switch (dir) {
      case constants.DIRECTION.RIGHT:
      case constants.DIRECTION.LEFT:
        return CONNECTION_POINT_OFFSET_RATIO_HOR * width;
      case constants.DIRECTION.UP:
        return CONNECTION_POINT_OFFSET_RATIO_BOT * height;
      case constants.DIRECTION.DOWN:
        return CONNECTION_POINT_OFFSET_RATIO_TOP * height;
      default:
        return super.getExtConnectionOffset(branchView);
    }
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const outerPoints = [
      {
        x: x + width * 0.5,
        y,
      },
      {
        x: x + width * 0.9998,
        y: y + height * 0.3804,
      },
      {
        x: x + width * 0.805,
        y: y + height,
      },
      {
        x: x + width * 0.195,
        y: y + height,
      },
      {
        x: x + width * 0.0002,
        y: y + height * 0.3804,
      },
    ];
    const curvePoints = [
      {
        prev: {
          x: x + width * 0.489,
          y: y + height * 0.016,
        },
        next: {
          x: x + width * 0.511,
          y: y + height * 0.016,
        },
      },
      {
        prev: {
          x: x + width * 0.978,
          y: y + height * 0.377,
        },
        next: {
          x: x + width * 0.988,
          y: y + height * 0.393,
        },
      },
      {
        prev: {
          x: x + width * 0.803,
          y: y + height * 0.977,
        },
        next: {
          x: x + width * 0.781,
          y: y + height * 0.986,
        },
      },
      {
        prev: {
          x: x + width * 0.219,
          y: y + height * 0.986,
        },
        next: {
          x: x + width * 0.197,
          y: y + height * 0.977,
        },
      },
      {
        prev: {
          x: x + width * 0.011,
          y: y + height * 0.393,
        },
        next: {
          x: x + width * 0.022,
          y: y + height * 0.377,
        },
      },
    ];
    const innerPoints = [
      {
        x: x + width * 0.666,
        y: y + height * 0.314,
      },
      {
        x: x + width * 0.761,
        y: y + height * 0.64,
      },
      {
        x: x + width * 0.5,
        y: y + height * 0.84,
      },
      {
        x: x + width * 0.239,
        y: y + height * 0.64,
      },
      {
        x: x + width * 0.333,
        y: y + height * 0.314,
      },
    ];
    return `M ${curvePoints[0].prev.x} ${curvePoints[0].prev.y} Q ${outerPoints[0].x} ${outerPoints[0].y} ${curvePoints[0].next.x} ${curvePoints[0].next.y} L ${innerPoints[0].x} ${innerPoints[0].y} L ${curvePoints[1].prev.x} ${curvePoints[1].prev.y} Q ${outerPoints[1].x} ${outerPoints[1].y} ${curvePoints[1].next.x} ${curvePoints[1].next.y} L ${innerPoints[1].x} ${innerPoints[1].y} L ${curvePoints[2].prev.x} ${curvePoints[2].prev.y} Q ${outerPoints[2].x} ${outerPoints[2].y} ${curvePoints[2].next.x} ${curvePoints[2].next.y} L ${innerPoints[2].x} ${innerPoints[2].y} L ${curvePoints[3].prev.x} ${curvePoints[3].prev.y} Q ${outerPoints[3].x} ${outerPoints[3].y} ${curvePoints[3].next.x} ${curvePoints[3].next.y} L ${innerPoints[3].x} ${innerPoints[3].y} L ${curvePoints[4].prev.x} ${curvePoints[4].prev.y} Q ${outerPoints[4].x} ${outerPoints[4].y} ${curvePoints[4].next.x} ${curvePoints[4].next.y} L ${innerPoints[4].x} ${innerPoints[4].y} Z`;
  }
  _getCommonPointOffset(branch, direction) {
    const isMapLike = branch.isMapLike();
    const { width, height } = branch.topicView.shapeBounds;
    switch (direction) {
      case constants.DIRECTION.LEFT:
        if (isMapLike) {
          return {
            x: width * 0.3,
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
            x: width * -0.3,
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
          y: CONNECTION_POINT_OFFSET_RATIO_TOP * height,
        };
      case constants.DIRECTION.DOWN:
        return {
          x: 0,
          y: -CONNECTION_POINT_OFFSET_RATIO_BOT * height,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
