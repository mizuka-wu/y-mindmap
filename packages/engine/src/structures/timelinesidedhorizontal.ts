import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
  CLASS_TYPE,
} from "../common/constants/index";
import * as js_utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import underscore from "underscore";
import * as boundutils from "../utils/boundutils";
import * as common_utils from "../common/utils/index";
import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";

import * as timelineUtils from "../utils/timeline";
export const TimelineSidedHorizontal = underscore.extend(
  {},
  AbstractStructure,
  {
    STRUCTURECLASS: STRUCTURECLASS.TIMELINESIDEDHORIZONTAL,
    getChildStructure(structure, index, branch) {
      if (
        Object(timelineUtils.getFinalTimelineChildDirection)(branch, index) ===
        DIRECTION.UP
      ) {
        return STRUCTURECLASS.TIMELINEHORIZONTALUP;
      } else {
        return STRUCTURECLASS.TIMELINEHORIZONTALDOWN;
      }
    },
    getSummaryDirection(branch, index) {
      return Object(timelineUtils.getFinalTimelineChildDirection)(
        branch,
        index,
      );
    },
    getRangeGrowthDirection: () => DIRECTION.RIGHT,
    getChildTargetOrientation: (parent, childIndex) => {
      return Object(js_utils.getReverseDir)(
        Object(timelineUtils.getFinalTimelineChildDirection)(
          parent,
          childIndex,
        ),
      );
    },
    getSourceOrientation: () => DIRECTION.RIGHT,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAvailableChildStructure(parentBranch, child) {
      return [];
    },
    getMainlineSpacing(parentBranch) {
      const className = styleManager.getClassName(parentBranch);
      const designPadding = className === CLASS_TYPE.CENTRAL_TOPIC ? 18 : 10;
      const lineEndSpacing = Object(js_utils.getLineEndSpacingPatchGap)(
        parentBranch,
      );
      return (
        (parseInt(
          styleManager.getStyleValue(parentBranch, STYLE_KEYS.SPACING_MAJOR),
        ) *
          designPadding) /
          parseInt(
            defaultStyles.getStyleValue(className, STYLE_KEYS.SPACING_MAJOR),
          ) +
        lineEndSpacing
      );
    },
    getTopicSpacing(parentBranch) {
      const className = styleManager.getClassName(parentBranch);
      const designPadding = className === CLASS_TYPE.CENTRAL_TOPIC ? 20 : 10;
      return (
        (parseInt(
          styleManager.getStyleValue(parentBranch, STYLE_KEYS.SPACING_MINOR),
        ) *
          designPadding) /
        parseInt(
          defaultStyles.getStyleValue(className, STYLE_KEYS.SPACING_MINOR),
        )
      );
    },
    calAttachedChildrenPos(parentBranchView, parentBranchBounds) {
      const attachedChildren = parentBranchView.getChildrenBranchesByType(
        TOPIC_TYPE.ATTACHED,
      );
      const MAIN_LINE_PADDING = this.getMainlineSpacing(parentBranchView);
      const CHILDREN_PADDING = this.getTopicSpacing(parentBranchView);
      const directionList = Object(
        timelineUtils.getFinalTimelineChildDirection,
      )(parentBranchView);
      let lastUpBranch = parentBranchView;
      let lastDownBranch = parentBranchView;
      const maxBoundaryOffsetY = attachedChildren.reduce(
        (res, child, i) => {
          if (directionList[i] === DIRECTION.UP) {
            return Object.assign(Object.assign({}, res), {
              up: Math.min(
                res.up,
                child.topicView.bounds.height +
                  child.topicView.bounds.y -
                  (child.boundaryBounds.height + child.boundaryBounds.y),
              ),
            });
          } else {
            return Object.assign(Object.assign({}, res), {
              down: Math.max(
                res.down,
                child.topicView.bounds.y - child.boundaryBounds.y,
              ),
            });
          }
        },
        {
          up: 0,
          down: 0,
        },
      );
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
        const prevShapeOffsetX = Object(js_utils.getTopicShape)(
          prevBranch,
        ).getBasePoint(prevBranch, DIRECTION.RIGHT).x;
        const childShape = Object(js_utils.getTopicShape)(child);
        const { x: currShapeOffsetX } = childShape.getBasePoint(
          child,
          DIRECTION.LEFT,
        );
        const { y: currShapeOffsetY } = childShape.getBasePoint(
          child,
          isUp ? DIRECTION.DOWN : DIRECTION.UP,
        );
        const posXByPrevBranch =
          prevPosX +
          prevShapeOffsetX +
          (prevBranch === parentBranchView ? 1.5 : 1) * CHILDREN_PADDING +
          -currShapeOffsetX;
        const sameDirBranch = isUp ? lastUpBranch : lastDownBranch;
        const sameDirBranchPosX =
          sameDirBranch !== parentBranchView ? sameDirBranch.position.x : 0;
        const { width: sameDirBranchBoundsWidth, x: sameDirBranchBoundsX } =
          sameDirBranch === parentBranchView
            ? sameDirBranch.topicView.shapeBounds
            : sameDirBranch.boundaryBounds;
        const posXBySameDirBranch =
          sameDirBranchPosX +
          sameDirBranchBoundsWidth +
          sameDirBranchBoundsX +
          MAIN_LINE_PADDING +
          -child.boundaryBounds.x;
        child.setPosition({
          x: Math.max(posXByPrevBranch, posXBySameDirBranch),
          y:
            parentShapeOffsetY +
            (isUp
              ? -(MAIN_LINE_PADDING * 3 + currShapeOffsetY) +
                maxBoundaryOffsetY.up
              : MAIN_LINE_PADDING * 3 -
                currShapeOffsetY +
                maxBoundaryOffsetY.down),
        });
        if (isUp) {
          lastUpBranch = child;
        } else {
          lastDownBranch = child;
        }
      });
      const childrenSize = this.getChildrenSize(parentBranchView);
      Object.assign(
        parentBranchBounds,
        Object(boundutils.getUnionBoundingBox)(
          parentBranchBounds,
          childrenSize,
        ),
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    drawAttachedConnectLine(parentBranch, childBranch, childBefore) {
      const { y: startY } = Object(js_utils.getTopicShape)(
        parentBranch,
      ).getStartAnchorPosition(parentBranch, childBranch);
      const endPt = Object(js_utils.getTopicShape)(
        childBranch,
      ).getEndAnchorPosition(
        STRUCTURECLASS.TIMELINESIDEDHORIZONTAL,
        childBranch,
      );
      const startPt = {
        x: endPt.x,
        y: startY,
      };
      const lineRenderer = getTopicLineStyle(BRANCHCONNECTION.HORIZONTAL);
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
  },
);
