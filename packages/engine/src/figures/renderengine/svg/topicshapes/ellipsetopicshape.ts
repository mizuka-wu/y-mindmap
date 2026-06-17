import * as topicShapesUtils from "./utils";
import Util from "../../../../util";

import AbstractTopicShape from "./abstracttopicshape";

const PROPORTION = 1;
const CORNER_GAP = 2;
const SHRINKAGE = 10;
const ellipsetopicshape_horScale = 1;
const ellipsetopicshape_verScale = 0.5;
export class EllipseTopicShape extends AbstractTopicShape {
  getTopicMargins(branchView /*BranchView*/, size) {
    const w = size.width * 0.5 + CORNER_GAP;
    const h = size.height * 0.5 + CORNER_GAP;
    const k = PROPORTION;
    const a = 1;
    const b = ((k * w + h) * 2) / k;
    const c = (w * 4 * h) / k;
    const d = 0;
    const e = (-w * w * h * h) / (k * k);
    const l = Util.newton([a, b, c, d, e], w / 2);
    const t = k * l;
    const prefHeight = Math.round(t);
    const prefWidth = Math.round(l);
    const minHeight = Math.max(a, prefHeight - SHRINKAGE / 2);
    const minWidth = Math.max(a, prefWidth - SHRINKAGE);
    const topicMargins = super.getTopicMargins(branchView);
    const fontSize = Math.min(
      50,
      Object(topicShapesUtils.getFontSize)(branchView),
    );
    return {
      top: topicMargins.top + fontSize * ellipsetopicshape_verScale + minHeight,
      left:
        topicMargins.left + fontSize * ellipsetopicshape_horScale + minWidth,
      bottom:
        topicMargins.bottom + fontSize * ellipsetopicshape_verScale + minHeight,
      right:
        topicMargins.right + fontSize * ellipsetopicshape_horScale + minWidth,
    };
  }
  calcTopicShapePath(bounds) {
    return (
      "M " +
      bounds.x +
      " " +
      (bounds.y + bounds.y + bounds.height) +
      "A " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.height) +
      " 0 1 1 " +
      bounds.x +
      " " +
      (bounds.y + bounds.y + bounds.height + 0.001)
    );
  }
}
