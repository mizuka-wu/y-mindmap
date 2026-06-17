import * as constants from "../../../../common/constants/index";

import { AbstractFixedAspectRatioTopicShape } from "./abstractfixedaspectratiotopicshape";

const options = {
  containerAreaAspectRatio: 1,
  contentAreaAspectRatio: 1,
  containerWidthContentWidthRatio: 1.6,
};
export class CircleTopicShape extends AbstractFixedAspectRatioTopicShape {
  constructor() {
    super(options);
  }
  calcTopicShapePath(bounds) {
    const {
      x,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      y,
      width,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      height,
    } = bounds;
    const r = x + width;
    return `M ${-r} 0 A ${r}, ${r} 0 1 , 0 ${r} , 0 A ${r}, ${r} 0 1 , 0 ${-r} , 0 Z`;
  }
  _getCommonPointOffset(branch, direction) {
    const { width } = branch.topicView.shapeBounds;
    const isMapLike = branch.isMapLike();
    switch (direction) {
      case constants.DIRECTION.LEFT:
        return {
          x: (isMapLike ? 0.07 : -0.01) * width,
          y: 0,
        };
      case constants.DIRECTION.RIGHT:
        return {
          x: (isMapLike ? -0.07 : 0.01) * width,
          y: 0,
        };
      default:
        return super._getCommonPointOffset(branch, direction);
    }
  }
}
