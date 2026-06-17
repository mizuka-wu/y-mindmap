import AbstractTopicShape from "./abstracttopicshape";

export class EllipseRectTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    const { top: topMargin, bottom: bottomMargin } = super.getTopicMargins(
      branchView,
    );
    const borderWidth = parseInt(branchView.topicView.figure.borderWidth || 0);
    const newHeight = topMargin + size.height + bottomMargin;
    // the radius of the bezier curve
    const radius = newHeight / 2;
    return {
      top: topMargin,
      bottom: bottomMargin,
      left: borderWidth + radius,
      right: borderWidth + radius,
    };
  }
  calcTopicShapePath(bounds) {
    const { x, y, width, height } = bounds;
    const radius = bounds.height / 2;
    const x0 = x + radius;
    const x1 = x + width - radius;
    const y0 = y;
    const y1 = y + height;
    const bezierWidth = radius / 0.75;
    const outX0 = x0 - bezierWidth;
    const outX1 = x1 + bezierWidth;
    return `M ${x0} ${y0}
          C ${outX0} ${y0} ${outX0} ${y1} ${x0} ${y1}
          L ${x1} ${y1}
          C ${outX1} ${y1} ${outX1} ${y0} ${x1} ${y0}
          L ${x0} ${y0}
          Z
          `;
  }
}
