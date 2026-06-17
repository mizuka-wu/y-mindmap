import * as topicShapesUtils from "./utils";

import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const OFFSET_X = 19.04;
const HOR_PADDING_RATIO = 16;
const MIN_HEIGHT = 30;
const MAX_HEIGHT = 90;
export class SingleBookQuoteTopicShape extends AbstractSymbolLikeTopicShape {
  getTopicMargins(branchView, size) {
    const { height } = size;
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const paddingHor =
      OFFSET_X * 1.2 + Math.min(2, height / MAX_HEIGHT) * HOR_PADDING_RATIO;
    const paddingVer = height < MIN_HEIGHT ? (MIN_HEIGHT - height) / 2 : 0;
    return {
      top: paddingVer + borderWidth / 2,
      bottom: paddingVer + borderWidth / 2,
      left: paddingHor + borderWidth / 2,
      right: paddingHor + borderWidth / 2,
    };
  }
  _calcShapePathWithPaddingBounds(bounds) {
    const { x, y, width, height } = bounds;
    let drawHeight;
    if (height < MIN_HEIGHT) {
      drawHeight = MIN_HEIGHT;
    } else if (height > MAX_HEIGHT) {
      drawHeight = MAX_HEIGHT;
    } else {
      drawHeight = height;
    }
    const midY = y + height * 0.5;
    const topY = midY - drawHeight * 0.5;
    const botY = midY + drawHeight * 0.5;
    return `M ${x + OFFSET_X} ${topY} L ${x} ${midY} L ${
      x + OFFSET_X
    } ${botY} M ${x + width - OFFSET_X} ${topY} L ${x + width} ${midY} L ${
      x + width - OFFSET_X
    } ${botY}`;
  }
}
