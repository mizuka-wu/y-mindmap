import * as topicShapesUtils from "./utils";
import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const BASE_BRACKET_WIDTH = 10;
const MIN_VERTICAL_PADDING = 14;
export class SquareBracketTopicShape extends AbstractSymbolLikeTopicShape {
  _getExtendBracketWidth(contentSize) {
    return BASE_BRACKET_WIDTH + contentSize.height / 25;
  }
  getTopicMargins(branchView, size) {
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const {
      top,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      bottom,
      left,
      right,
    } = super.getTopicMargins(branchView);
    const bracketWidth = this._getExtendBracketWidth(size);
    return {
      top: Math.max(MIN_VERTICAL_PADDING, top + borderWidth / 2),
      bottom: Math.max(MIN_VERTICAL_PADDING, top + borderWidth / 2),
      left: left + bracketWidth,
      right: right + bracketWidth,
    };
  }
  _calcShapePathWithPaddingBounds(bounds, topicView) {
    const { x, y, width, height } = bounds;
    const bracketWidth = this._getExtendBracketWidth(topicView.contentBounds);
    const leftBracket = `M ${x + bracketWidth} ${y} L ${x} ${y} L ${x} ${
      y + height
    } L ${x + bracketWidth} ${y + height}`;
    const rightBracket = `M ${x + width - bracketWidth} ${y} L ${
      x + width
    } ${y} L ${x + width} ${y + height} L ${x + width - bracketWidth} ${
      y + height
    }`;
    return leftBracket + rightBracket;
  }
}
