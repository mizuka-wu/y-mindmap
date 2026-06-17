import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
} from "../common/constants/index";
import * as utils from "../figures/renderengine/svg/topicshapes/utils";
import * as js_utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import structuresUtil from "./helper/structuresutil";

import underscore from "underscore";
import * as boundutils from "../utils/boundutils";
import * as common_utils from "../common/utils/index";
import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";
// @flow
/**
 * structrue -- timelineHorizontal
 */
export const timelineHorizontal = underscore.extend({}, AbstractStructure, {
  STRUCTURECLASS: STRUCTURECLASS.TIMELINEHORIZONTAL,
  isAttachedChildrenStructureImmutable: true,
  getTopicSpacing(parentBranch) {
    const className = styleManager.getClassName(parentBranch);
    const designSpacing = 100;
    const styleSpacing = parseInt(
      styleManager.getStyleValue(parentBranch, STYLE_KEYS.SPACING_MAJOR),
    );
    const defaultSpacing = parseInt(
      defaultStyles.getStyleValue(className, STYLE_KEYS.SPACING_MAJOR),
    );
    const lineEndSpacing = Object(js_utils.getLineEndSpacingPatchGap)(
      parentBranch,
    );
    return (styleSpacing * designSpacing) / defaultSpacing + lineEndSpacing;
  },
  calAttachedChildrenPos(parentBranchView, newBounds) {
    const attachedChildren = parentBranchView.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    const CHILDREN_PADDING = this.getTopicSpacing(parentBranchView);
    const directionList = Object(js_utils.getFinalTimelineChildDirection)(
      parentBranchView,
    );
    let lastUpBranch = parentBranchView;
    let lastDownBranch = parentBranchView;
    const parentTopicShape = Object(js_utils.getTopicShape)(parentBranchView);
    const parentShapeOffsetY = Object(common_utils.addPoint)(
      parentTopicShape.getBasePoint(parentBranchView, DIRECTION.RIGHT),
      parentTopicShape.getPointOffset(parentBranchView, DIRECTION.RIGHT),
    ).y;
    attachedChildren.forEach((child, i) => {
      const isUp = directionList[i] === DIRECTION.UP;
      const prevBranch = i > 0 ? attachedChildren[i - 1] : parentBranchView;
      const prevPosX =
        prevBranch === parentBranchView
          ? 0
          : attachedChildren[i - 1].position.x;
      const prevShape = Object(js_utils.getTopicShape)(prevBranch);
      const childShape = Object(js_utils.getTopicShape)(child);
      const { x: prevShapeOffsetX } = Object(common_utils.addPoint)(
        prevShape.getBasePoint(prevBranch, DIRECTION.RIGHT),
        prevShape.getPointOffset(prevBranch, DIRECTION.RIGHT),
      );
      const { x: currShapeOffsetX, y: currShapeOffsetY } =
        childShape.getBasePoint(child, DIRECTION.LEFT);
      const posXByPrevBranchTopicShape =
        prevPosX + prevShapeOffsetX + CHILDREN_PADDING - currShapeOffsetX;
      const sameDirBranch = isUp ? lastUpBranch : lastDownBranch;
      const sameDirBranchPosX =
        sameDirBranch !== parentBranchView ? sameDirBranch.position.x : 0;
      const { x: sameDirBranchBoundsX, width: sameDirBranchBoundsWidth } =
        sameDirBranch !== parentBranchView
          ? sameDirBranch.boundaryBounds
          : sameDirBranch.topicView.shapeBounds;
      const posXBySameDirBranch =
        sameDirBranchPosX +
        sameDirBranchBoundsWidth +
        sameDirBranchBoundsX +
        CHILDREN_PADDING / 2 -
        child.boundaryBounds.x;
      // only in this case, position should be computed by boundary bounds of previous branch
      let posXByPrevBranchBounds = 0;
      if (
        i > 0 &&
        Object(js_utils.isInBoundary)(prevBranch) &&
        !this.isInSameRange(parentBranchView, i) &&
        directionList[i] !== directionList[i - 1]
      ) {
        const { x: prevBoundaryBoundsX, width: prevBoundaryBoundsWidth } =
          prevBranch.boundaryBounds;
        posXByPrevBranchBounds =
          prevPosX +
          prevBoundaryBoundsWidth +
          prevBoundaryBoundsX +
          CHILDREN_PADDING / 2 -
          currShapeOffsetX;
      }
      child.setPosition({
        x: Math.max(
          posXByPrevBranchTopicShape,
          posXBySameDirBranch,
          posXByPrevBranchBounds,
        ),
        y: parentShapeOffsetY - currShapeOffsetY,
      });
      if (isUp) {
        lastUpBranch = child;
      } else {
        lastDownBranch = child;
      }
    });
    const childrenSize = this.getChildrenSize(parentBranchView);
    Object.assign(
      newBounds,
      Object(boundutils.getUnionBoundingBox)(newBounds, childrenSize),
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  drawAttachedConnectLine: function (parentBranch, childBranch, childBefore) {
    const children = parentBranch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    const index = children.indexOf(childBranch);
    if (index === -1) {
      return;
    }
    const prevBranch = index > 0 ? children[index - 1] : parentBranch;
    const topicLineStyle = childBranch.getConnectionView().getLineShape();
    const lineRenderer = getTopicLineStyle(topicLineStyle);
    const prevShape = Object(js_utils.getTopicShape)(prevBranch);
    const childShape = Object(js_utils.getTopicShape)(childBranch);
    const startPt = Object(utils.relativePositionToRealPosition)(
      Object(common_utils.addPoint)(
        prevShape.getBasePoint(prevBranch, DIRECTION.RIGHT),
        prevShape.getPointOffset(prevBranch, DIRECTION.RIGHT),
      ),
      prevBranch,
    );
    const endPt = childShape.getEndAnchorPosition(
      STRUCTURECLASS.TIMELINEHORIZONTAL,
      childBranch,
    );
    lineRenderer(
      childBranch,
      {
        startPt,
        ctrlPt: startPt,
        endPt,
      },
      false,
      false,
    );
  },
  //branch的成长方向
  getRangeGrowthDirection: function () {
    return DIRECTION.RIGHT;
  },
  getSummaryDirection(branch, index) {
    return Object(js_utils.getFinalTimelineChildDirection)(branch, index);
  },
  getChildStructure(structure, index, branch) {
    if (
      Object(js_utils.getFinalTimelineChildDirection)(branch, index) ===
      DIRECTION.UP
    ) {
      return STRUCTURECLASS.TIMELINEHORIZONTALUP;
    } else {
      return STRUCTURECLASS.TIMELINEHORIZONTALDOWN;
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getChildTargetOrientation: (parent, childIndex) => {
    return DIRECTION.LEFT;
  },
  getCalloutStructure: function () {
    return this.STRUCTURECLASS;
  },
  checkCalloutPosition: function (callout, position) {
    return structuresUtil.restrictCalloutToLeft(callout, position);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return [];
  },
});
