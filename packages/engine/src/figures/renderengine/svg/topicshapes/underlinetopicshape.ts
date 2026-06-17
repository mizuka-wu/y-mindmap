import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import mommonFuncs from "../../../../mommonfuncs";
import * as brushes from "./brushes";

import * as common_utils from "../../../../common/utils/index";

import AbstractTopicShape from "./abstracttopicshape";

export class UnderlineTopicShape extends AbstractTopicShape {
  getBasePoint(branch, direction) {
    const needOffset = [
      constants.DIRECTION.LEFT,
      constants.DIRECTION.RIGHT,
    ].includes(direction);
    const ifFocusLine =
      Object(topicShapesUtils.getLineFocusType)(branch) ===
      topicShapesUtils.LINE_FOCUS_TYPE.FOCUS_LINE;
    const basePt = super.getBasePoint(branch, direction);
    if (ifFocusLine && needOffset) {
      return Object(common_utils.addPoint)(
        basePt,
        Object(topicShapesUtils.calcUnderline)(branch),
      );
    } else {
      return basePt;
    }
  }
  _render(topicView /*TopicView*/, isRenderOnTop) {
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(
      topicView.parent(),
    );
    const bounds = Object.assign({}, topicView.shapeBounds);
    bounds.height -= borderWidth / 2;
    if (isRenderOnTop) {
      bounds.y += borderWidth / 2;
    }
    let topicShapePath;
    if (isRenderOnTop) {
      topicShapePath =
        "M  " +
        bounds.x +
        " " +
        bounds.y +
        "L " +
        (bounds.x + bounds.width) +
        " " +
        bounds.y +
        "";
    } else {
      topicShapePath =
        "M  " +
        bounds.x +
        " " +
        (bounds.y + bounds.height) +
        "L " +
        (bounds.x + bounds.width) +
        " " +
        (bounds.y + bounds.height) +
        "";
    }
    topicView.setTopicShapePath(topicShapePath);
    const topicFillPath = brushes.rect(bounds);
    topicView.setTopicShapeFillPath(topicFillPath);
    Object(topicShapesUtils.setTopicShapeScale)(topicView, 0, 0);
    const topicSelectBoxPath = mommonFuncs.generateRect(bounds, borderWidth);
    topicView.setTopicShapeSelectBoxPath(topicSelectBoxPath);
  }
  getTopicMargins(branchView /*BranchView*/, size, isRenderOnTop) {
    const topicMargins = super.getTopicMargins(branchView);
    const borderWidth = Object(topicShapesUtils.getBorderWidth)(branchView);
    return {
      top: isRenderOnTop ? topicMargins.top : topicMargins.top - borderWidth,
      left: topicMargins.left,
      bottom: isRenderOnTop
        ? topicMargins.bottom - borderWidth
        : topicMargins.bottom,
      right: topicMargins.right,
    };
  }
  getEndAnchorPosition(structure, branchView) {
    const parent = branchView.parent();
    const dir = Object(topicShapesUtils.getEndDirection)(parent, branchView);
    const isBraceStructure = [
      constants.STRUCTURECLASS.BRACELEFT,
      constants.STRUCTURECLASS.BRACERIGHT,
    ].includes(structure.STRUCTURECLASS);
    const isSingleChild =
      branchView.branchIndex() === 0 &&
      parent.getChildrenBranchesByType().length === 1;
    const endOffset = this.getPointOffset(branchView, dir);
    const basePt =
      isBraceStructure && isSingleChild
        ? Object(topicShapesUtils.getJointPosition)(
            branchView.topicView.shapeBounds,
            dir,
          )
        : Object(common_utils.addPoint)(
            this.getBasePoint(branchView, dir),
            endOffset,
          );
    return Object(topicShapesUtils.relativePositionToRealPosition)(
      basePt,
      branchView,
    );
  }
}
