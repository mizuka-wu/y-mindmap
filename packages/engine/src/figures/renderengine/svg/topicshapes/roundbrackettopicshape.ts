import * as topicShapesUtils from "./utils";

import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const MIN_HEIGHT = 50;
const MAX_HEIGHT = 150;
const HOR_PADDING_RATIO = 16;
const indentX = 8;
const outdentY = 12;
const xRadius = indentX * 9;
export class RoundBracketTopicShape extends AbstractSymbolLikeTopicShape {
  constructor() {
    super();
  }
  getTopicMargins(branchView, size) {
    const { height } = size;
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const paddingHor =
      indentX * 2 + Math.min(2, height / MAX_HEIGHT) * HOR_PADDING_RATIO;
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
    const leftBracket = `M ${x + indentX} ${topY} A ${xRadius} ${
      drawHeight + outdentY
    } 0 0 0 ${x + indentX} ${botY} `;
    const rightBracket = `M ${x + width - indentX} ${topY} A ${xRadius} ${
      drawHeight + outdentY
    } 0 0 1 ${x + width - indentX} ${botY} `;
    return leftBracket + rightBracket;
  }
}
