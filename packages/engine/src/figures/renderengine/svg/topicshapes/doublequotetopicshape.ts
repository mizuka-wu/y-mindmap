import * as topicShapesUtils from "./utils";

import { AbstractSymbolLikeTopicShape } from "./abstractsymbolliketopicshape";

const VERTICAL_OFFSET_SCALE = 1; // adjust relative position of vertical direction of quotes
const HORIZONTAL_MIN_PADDING = 14;
export class DoubleQuoteTopicShape extends AbstractSymbolLikeTopicShape {
  _genQuotePath(startPoint, borderWidth, isOpenQuote) {
    const { x: outterStartX, y: outterStartY } = startPoint;
    const circleScale = 0.8; // range within [0.5 ~ 1]
    const innerStartX =
      outterStartX +
      (1 - circleScale) * (isOpenQuote ? borderWidth : -borderWidth);
    const innerStartY = outterStartY;
    const outterRadius = circleScale * borderWidth;
    const innerRadius = borderWidth / 2;
    const tailEndPoint = {
      x: outterStartX + (isOpenQuote ? borderWidth : -borderWidth) * 2,
      y: outterStartY + (isOpenQuote ? -borderWidth : borderWidth) * 3.4,
    };
    const tailControlPoint = {
      x: outterStartX + (isOpenQuote ? -borderWidth : borderWidth) * 0.2,
      y: tailEndPoint.y + (isOpenQuote ? borderWidth : -borderWidth) * 1,
    };
    const outterCircle = `M ${outterStartX} ${outterStartY} a ${outterRadius} ${outterRadius} 0 1 1 0 ${
      isOpenQuote ? "0.001" : "-0.001"
    } Z `;
    const innerCircle = `M ${innerStartX} ${innerStartY} a ${innerRadius} ${innerRadius} 0 1 1 0 ${
      isOpenQuote ? "0.001" : "-0.001"
    } Z `;
    const tail = `M ${outterStartX} ${outterStartY}Q ${tailControlPoint.x} ${tailControlPoint.y} ${tailEndPoint.x} ${tailEndPoint.y}`;
    return outterCircle + innerCircle + tail;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTopicMargins(branchView, size) {
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    const { top, bottom, left, right } = super.getTopicMargins(branchView);
    return {
      top,
      bottom,
      left: Math.max(HORIZONTAL_MIN_PADDING + borderWidth * 8, left),
      right: Math.max(HORIZONTAL_MIN_PADDING + borderWidth * 8, right),
    };
  }
  _calcShapePathWithPaddingBounds(bounds, topicView) {
    const { x, y, width, height } = bounds;
    const borderWidth = topicView.figure.borderWidth;
    const gap = borderWidth;
    // start points
    const l1 = {
      x,
      y: y + height * 0.5 + VERTICAL_OFFSET_SCALE * borderWidth,
    };
    const l2 = {
      x: l1.x + borderWidth * 2 + gap,
      y: l1.y,
    };
    const r1 = {
      x: x + width,
      y: y + height * 0.5 - VERTICAL_OFFSET_SCALE * borderWidth,
    };
    const r2 = {
      x: r1.x - borderWidth * 2 - gap,
      y: r1.y,
    };
    const l1Quote = this._genQuotePath(l1, borderWidth, true);
    const l2Quote = this._genQuotePath(l2, borderWidth, true);
    const r1Quote = this._genQuotePath(r1, borderWidth, false);
    const r2Quote = this._genQuotePath(r2, borderWidth, false);
    return `${l1Quote} ${l2Quote} ${r1Quote} ${r2Quote}`;
  }
}
