import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as js_utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import structuresUtil from "./helper/structuresutil";

import underscore from "underscore";
import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";

/**
 * structrue -- timelineHorizontalDown
 */

export const timelineHorizontalDown = underscore.extend({}, AbstractStructure, {
  STRUCTURECLASS: STRUCTURECLASS.TIMELINEHORIZONTALDOWN,
  getChildrenSize(branch) {
    const self = branch;
    let childrenHeight = 0;
    let childrenWidth = 0;
    const attachedChildrenBranches = self.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    const PADDING = this.getTopicSpacing(branch);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    underscore.each(attachedChildrenBranches, (childBranch, i) => {
      childrenHeight += childBranch.boundaryBounds.height + PADDING;
      childrenWidth = Math.max(childrenWidth, childBranch.boundaryBounds.width);
    });
    if (childrenHeight > 0) {
      childrenHeight -= PADDING;
    }
    return {
      height: childrenHeight,
      width: childrenWidth,
    };
  },
  getTopicSpacing(parentBranch) {
    const className = styleManager.getClassName(parentBranch);
    const designSpacing = layoutConstant.PADDING;
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
  calAttachedChildrenPos(branch, newBounds) {
    const self = branch;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const childrenSize = that.getChildrenSize(self);
    const attachedChildrenBranches = self.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    // var PADDING = 20;
    if (attachedChildrenBranches.length) {
      const PADDING = this.getTopicSpacing(branch);
      const siblingsBranchViewList = branch
        .parent()
        .getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
      const currentIndex = siblingsBranchViewList.indexOf(branch);
      const nextBrotherBranchView = siblingsBranchViewList[currentIndex + 1];
      let nextBrotherExtendHeight = 0;
      if (nextBrotherBranchView) {
        const currentTopicViewHeight = branch.topicView.bounds.height;
        const nextTopicViewHeight =
          nextBrotherBranchView.topicView.bounds.height;
        if (currentTopicViewHeight < nextTopicViewHeight) {
          nextBrotherExtendHeight =
            (nextTopicViewHeight - currentTopicViewHeight) / 2;
        }
      }
      const childrenX = newBounds.x + newBounds.width + newBounds.x + PADDING;
      let childrenY =
        newBounds.y + newBounds.height + PADDING + nextBrotherExtendHeight;
      const maxBottom = Math.max(
        newBounds.y + newBounds.height,
        childrenY + childrenSize.height,
      );
      newBounds.y = Math.min(newBounds.y, childrenY);
      newBounds.height = maxBottom - newBounds.y + nextBrotherExtendHeight;
      const childrenAreaWidth = PADDING + childrenSize.width;
      if (childrenAreaWidth >= newBounds.width / 2) {
        newBounds.width = newBounds.width / 2 + childrenAreaWidth;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      underscore.each(attachedChildrenBranches, (childBranch, index) => {
        childBranch.setPosition(
          childrenX - childBranch.boundaryBounds.x,
          childrenY - childBranch.boundaryBounds.y,
        );
        childrenY += childBranch.boundaryBounds.height + PADDING;
      });
    }
  },
  getSummaryDirection: function () {
    return DIRECTION.RIGHT;
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.DOWN;
  },
  getChildTargetOrientation: () => DIRECTION.LEFT,
  getChildStructure: function () {
    return STRUCTURECLASS.LOGICRIGHT;
  },
  checkCalloutPosition: function (callout, position) {
    const result1 = structuresUtil.restrictCalloutToLeft(callout, position);
    const result2 = structuresUtil.restrictCalloutToTop(callout, position);
    return structuresUtil.mergeCalloutOffset(result1, result2);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return [];
  },
  drawAttachedConnectLine(parentBranch, childBranch) {
    const { isLineTapered } = structuresUtil;
    const topicLineStyle = childBranch.getConnectionView().figure.lineShape;
    const startPt = getTopicShape(
      parentBranch.topicView.topicShapeStyle,
    ).getStartAnchorPosition(parentBranch, childBranch);
    const ctrlPt = Object.assign(
      {},
      getTopicShape(parentBranch.topicView.topicShapeStyle).getControlPosition(
        parentBranch,
        childBranch,
      ),
    );
    const endPt = getTopicShape(
      childBranch.topicView.topicShapeStyle,
    ).getEndAnchorPosition(this, childBranch);
    const getCurrentColPosY = (deg) =>
      Math.abs(endPt.x - ctrlPt.x) * Math.tan((deg * Math.PI) / 180);
    if (topicLineStyle === BRANCHCONNECTION.BIGHT) {
      ctrlPt.y = endPt.y;
    } else {
      ctrlPt.y = endPt.y - getCurrentColPosY(30);
    }
    getTopicLineStyle(topicLineStyle)(
      childBranch,
      {
        startPt,
        ctrlPt,
        endPt,
      },
      isLineTapered(parentBranch),
      false,
    );
  },
});
