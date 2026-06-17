import * as topicShapesUtils from "./utils";

import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const OFFSET_X = 9.04;
const GAP = 10;
const MIN_HEIGHT = 50;
const MAX_HEIGHT = 95;
export class DoubleBookQuoteTopicShape extends AbstractSymbolLikeTopicShape {
  getTopicMargins(branchView, size) {
    const { height } = size;
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const paddingHor = GAP * 2.5 + Math.min(2, height / MAX_HEIGHT) * GAP;
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
    const leftDoubleQuote = `M ${x + OFFSET_X} ${topY} L ${x} ${midY} L ${
      x + OFFSET_X
    } ${botY} M ${x + OFFSET_X + GAP} ${topY} L ${x + GAP} ${midY} L ${
      x + OFFSET_X + GAP
    } ${botY}`;
    const rightDoubleQuote = `M ${x + width - OFFSET_X} ${topY} L ${
      x + width
    } ${midY} L ${x + width - OFFSET_X} ${botY}M ${
      x + width - OFFSET_X - GAP
    } ${topY} L ${x + width - GAP} ${midY} L ${
      x + width - OFFSET_X - GAP
    } ${botY}`;
    return `${leftDoubleQuote} ${rightDoubleQuote}`;
  }
}
