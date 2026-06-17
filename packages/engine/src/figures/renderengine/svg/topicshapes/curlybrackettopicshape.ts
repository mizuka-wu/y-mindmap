import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";
const ARC_RADIUS = 4;
const EXTEND_WIDTH = 2.4;
const keyPointOffsetX = ARC_RADIUS + EXTEND_WIDTH;
export class CurlyBracketTopicShape extends AbstractSymbolLikeTopicShape {
  _genHalfBracketPath: (
    start: any,
    end: any,
    reverseX: any,
    reverseY: any,
  ) => string;
  constructor(options?: any) {
    super(options);
    this._genHalfBracketPath = (start, end, reverseX, reverseY) => {
      const arcPoint1 = {
        x: start.x + (reverseX ? keyPointOffsetX : -keyPointOffsetX),
        y: start.y + (reverseY ? -ARC_RADIUS : ARC_RADIUS),
      };
      const arcPoint2 = {
        x: end.x + (reverseX ? -keyPointOffsetX : keyPointOffsetX),
        y: end.y + (reverseY ? ARC_RADIUS : -ARC_RADIUS),
      };
      return `M ${start.x} ${start.y} L ${
        start.x + (reverseX ? EXTEND_WIDTH : -EXTEND_WIDTH)
      } ${start.y} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 ${
        reverseX === reverseY ? "0" : "1"
      } ${arcPoint1.x} ${arcPoint1.y} L ${arcPoint2.x} ${
        arcPoint2.y
      } A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 ${
        reverseX !== reverseY ? "0" : "1"
      } ${end.x + (reverseX ? -EXTEND_WIDTH : EXTEND_WIDTH)} ${end.y} L ${
        end.x + (reverseX ? -EXTEND_WIDTH : EXTEND_WIDTH) * 0.7
      } ${end.y}`;
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTopicMargins(branchView) {
    return {
      top: keyPointOffsetX * 2,
      bottom: keyPointOffsetX * 2,
      left: keyPointOffsetX * 4,
      right: keyPointOffsetX * 4,
    };
  }
  _calcShapePathWithPaddingBounds(bounds) {
    const { x, y, width, height } = bounds;
    const leftTop = {
      x: x + keyPointOffsetX * 2,
      y,
    };
    const leftMid = {
      x,
      y: y + height * 0.5,
    };
    const leftBot = {
      x: x + keyPointOffsetX * 2,
      y: y + height,
    };
    const rightTop = {
      x: x + width - keyPointOffsetX * 2,
      y,
    };
    const rightMid = {
      x: x + width,
      y: y + height * 0.5,
    };
    const rightBot = {
      x: x + width - keyPointOffsetX * 2,
      y: y + height,
    };
    const leftBracket = `${this._genHalfBracketPath(
      leftTop,
      leftMid,
      false,
      false,
    )} ${this._genHalfBracketPath(leftBot, leftMid, false, true)}`;
    const rightBracket = `${this._genHalfBracketPath(
      rightTop,
      rightMid,
      true,
      false,
    )} ${this._genHalfBracketPath(rightBot, rightMid, true, true)}`;
    return `${leftBracket} ${rightBracket}`;
  }
}
