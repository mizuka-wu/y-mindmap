import AbstractTopicShape from "./abstracttopicshape";
import * as utils from "./utils";
import * as brushes from "./brushes";
import mommonFuncs from "../../../../mommonfuncs";

export class AbstractSymbolLikeTopicShape extends AbstractTopicShape {
  _padding: any;
  constructor(options?: any) {
    super();
    this._padding = options?.padding ?? 4;
  }
  /**
   * Symbol-like shape needs a gap between connection line and
   * path, implement this method (but not calcTopicShapePath())
   * to calculate shape path within shrinked bounds.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _calcShapePathWithPaddingBounds(paddingBounds, topicView) {
    return "";
  }
  calcTopicShapePath(bounds, topicView) {
    const { x, y, width, height } = bounds;
    const borderWidth = Object(utils.getBorderWidth)(topicView.parent());
    const padding = Math.max(this._padding, borderWidth);
    const paddingBounds = {
      x: x + padding,
      y: y + padding,
      width: width - padding * 2,
      height: height - padding * 2,
    };
    return this._calcShapePathWithPaddingBounds(paddingBounds, topicView);
  }
  _render(topicView) {
    const { shapeBounds } = topicView;
    const topicShapePath = this.calcTopicShapePath(shapeBounds, topicView);
    topicView.setTopicShapePath(topicShapePath);
    const fillPath = Object(brushes.rect)(shapeBounds);
    topicView.setTopicShapeFillPath(fillPath);
    Object(utils.setTopicShapeScale)(topicView, 0, 0);
    const topicSelectBoxPath = mommonFuncs.generateRect(shapeBounds, 0);
    topicView.setTopicShapeSelectBoxPath(topicSelectBoxPath);
  }
}

export default AbstractSymbolLikeTopicShape;
