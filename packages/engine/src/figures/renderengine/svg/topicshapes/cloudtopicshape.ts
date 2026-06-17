import * as topicShapesUtils from "./utils";
import mommonFuncs from "../../../../mommonfuncs";

import AbstractTopicShape from "./abstracttopicshape";

export class CloudTopicShape extends AbstractTopicShape {
  innerElementsSize: { width: number; height: number };
  constructor() {
    super();
    this.innerElementsSize = {
      width: 0,
      height: 0,
    };
  }
  getTopicMargins(branchView /*BranchView*/, innerElementsSize) {
    const scaleLeft = 0.17;
    const scaleRight = 0.16;
    const scaleTop = 0.22;
    const scaleBottom = 0.27;
    const scaleWidth = 1 - scaleLeft - scaleRight;
    const scaleHeight = 1 - scaleTop - scaleBottom;
    this.innerElementsSize = innerElementsSize;
    const topicMargins = super.getTopicMargins(branchView);
    return {
      top:
        ((topicMargins.top + innerElementsSize.height) / scaleHeight) *
        scaleTop,
      left:
        ((topicMargins.left + innerElementsSize.width) / scaleWidth) *
        scaleLeft,
      bottom:
        ((topicMargins.bottom + innerElementsSize.height) / scaleHeight) *
        scaleBottom,
      right:
        ((topicMargins.right + innerElementsSize.width) / scaleWidth) *
        scaleRight,
    };
  }
  _render(topicView /*TopicView*/) {
    let _a;
    let _b;
    const parentBranchView = topicView.parent();
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(
      parentBranchView,
    );
    const bounds = this.getDrawBounds(topicView.shapeBounds, borderWidth);
    const d = `M229.823,73.419c2.342-4.322,3.641-9.058,3.641-14.028
                c0-20.24-21.44-36.649-47.887-36.649c-4.902,0-9.632,0.566-14.085,1.614C165.82,10.213,149.615,0,130.496,0
                c-19.97,0-36.765,11.141-41.694,26.266c-5.084-1.629-10.577-2.519-16.31-2.519c-26.075,0-47.212,18.393-47.212,41.082
                c0,3.175,0.428,6.262,1.211,9.231C11.567,79.329,1,92.346,1,107.581c0,19.898,18.017,36.028,40.243,36.028
                c2.364,0,4.676-0.192,6.928-0.543c-0.261,1.574-0.408,3.177-0.408,4.807c0,19.952,20.131,36.127,44.964,36.127
                c15.491,0,29.151-6.295,37.237-15.874c7.448,4.606,16.745,7.347,26.836,7.347c23.002,0,41.903-14.215,44.077-32.398
                c2.337,0.346,4.734,0.535,7.182,0.535c23.715,0,42.941-16.878,42.941-37.698C251,92.067,242.493,79.973,229.823,73.419z`;
    topicView.setTopicShapePath(d);
    topicView.setTopicShapeFillPath(d);
    const scaleX = (this.innerElementsSize.width / 250) * 1.5;
    const scaleY = (this.innerElementsSize.height / 184) * 2;
    Object(topicShapesUtils.setTopicShapeScale)(
      topicView,
      scaleX,
      scaleY,
      "cloud",
    );
    // Ray: set topicShape, topicShapeFill to center
    const { x: mX, y: mY } = bounds;
    topicView.topicShape.translate(mX, mY);
    topicView.topicShapeFill.translate(mX, mY);
    if (
      (_a = topicView.handDrawnTopicShapeBackground) === null ||
      _a === undefined
    ) {
      // do nothing;
    } else {
      _a.translate(mX, mY);
    }
    if (
      (_b = topicView.handDrawnTopicShapeBackgroundMask) === null ||
      _b === undefined
    ) {
      // do nothing;
    } else {
      _b.translate(mX, mY);
    }
    const topicShapeSelectBoxD = mommonFuncs.generateRect(bounds, borderWidth);
    topicView.setTopicShapeSelectBoxPath(topicShapeSelectBoxD);
  }
}
