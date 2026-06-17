import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const VERTICAL_LENGTH = 28.85;
const HORIZONTAL_LENGTH = 15.11;
export class SquareQuoteTopicShape extends AbstractSymbolLikeTopicShape {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTopicMargins(branchView) {
    return {
      top: VERTICAL_LENGTH * 0.8,
      bottom: VERTICAL_LENGTH * 0.8,
      left: HORIZONTAL_LENGTH * 2,
      right: HORIZONTAL_LENGTH * 2,
    };
  }
  _calcShapePathWithPaddingBounds(bounds) {
    const { x, y, width, height } = bounds;
    return `M ${x + HORIZONTAL_LENGTH} ${y} L ${x} ${y} L ${x} ${
      y + VERTICAL_LENGTH
    } M ${x + width - HORIZONTAL_LENGTH} ${y + height} L ${x + width} ${
      y + height
    } L ${x + width} ${y + height - VERTICAL_LENGTH}`;
  }
}
