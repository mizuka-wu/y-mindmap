import { BRANCHCONNECTION } from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as js_utils from "../utils/index";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import structuresUtil from "./helper/structuresutil";

import underscore from "underscore";
import * as boundutils from "../utils/boundutils";
import { AbstractStructure } from "./abstractstructure";

/**
 *  给treeLeft和treeRight继承的structure
 *
 */

const treeleftandright_PADDING = layoutConstant.PADDING;
const BOUNDARYGAP = layoutConstant.BOUNDARYGAP;
const sortBoundaries = structuresUtil.sortBoundaries;
const leftAndRight = underscore.extend({}, AbstractStructure, {
  isSpecialLineShape(lineShape) {
    return (
      lineShape === BRANCHCONNECTION.STRAIGHT ||
      lineShape === BRANCHCONNECTION.CURVE ||
      lineShape === BRANCHCONNECTION.FOLD ||
      lineShape === BRANCHCONNECTION.ROUNDEDFOLD
    );
  },
  calAttachedChildrenPos(branch, newBounds, isRight) {
    const attachedChildrenBranches = branch.getChildrenBranchesByType();
    const spacingMajor = BOUNDARYGAP; //保证多边形boundary的边界能包裹连接线的拐点
    const spacingMinor = parseInt(branch.figure.minorSpacing || 0);
    const lineWidth = parseInt(branch.topicView.figure.borderWidth || 0);
    const centerPadding = 30; // 为center topic 增加变量.
    let childrenX = 0;
    let childrenY = 0;
    let endPointLineOffset = 0;
    if (branch.boundaries.length) {
      sortBoundaries(branch.boundaries);
    }
    const lineGap = Object(js_utils.getLineEndSpacingPatchGap)(branch);
    if (attachedChildrenBranches.length) {
      const connectionLineShape = branch.getConnectionView().getLineShape();
      if (!branch.isCentralBranch()) {
        endPointLineOffset = 15;
      }
      if (isRight) {
        childrenX =
          spacingMajor +
          endPointLineOffset +
          (branch.isCentralBranch() ? centerPadding : 0) +
          lineGap;
      } else {
        childrenX =
          -spacingMajor -
          endPointLineOffset -
          (branch.isCentralBranch() ? centerPadding : 0) -
          lineGap;
      }
      childrenY = newBounds.y + newBounds.height + treeleftandright_PADDING * 2;
      const maxOffset = attachedChildrenBranches.reduce(
        (res, branch) =>
          isRight
            ? Math.max(res, branch.topicView.bounds.x - branch.boundaryBounds.x)
            : Math.max(
                res,
                branch.boundaryBounds.x +
                  branch.boundaryBounds.width -
                  branch.topicView.bounds.x -
                  branch.topicView.bounds.width,
              ),
        Number.MIN_SAFE_INTEGER,
      );
      if (this.isSpecialLineShape(connectionLineShape)) {
        const triangleOffset =
          Math.tan((Math.PI * 30) / 180) *
          (Math.abs(childrenX) + Math.abs(maxOffset));
        const halfOfFirstChildHeight =
          attachedChildrenBranches[0].topicView.bounds.height / 2;
        if (triangleOffset > halfOfFirstChildHeight) {
          childrenY += triangleOffset - halfOfFirstChildHeight;
        }
      }
      attachedChildrenBranches.forEach((childBranch) => {
        const posX = isRight
          ? childrenX - childBranch.topicView.bounds.x + maxOffset
          : childrenX + childBranch.topicView.bounds.x - maxOffset;
        const posY = isRight
          ? childrenY - childBranch.boundaryBounds.y
          : childrenY - childBranch.boundaryBounds.y;
        childBranch.setPosition(posX, posY);
        childrenY +=
          childBranch.boundaryBounds.height + spacingMinor + lineWidth;
      });
      const childrenSize = this.getChildrenSize(branch);
      Object.assign(
        newBounds,
        Object(boundutils.getUnionBoundingBox)(newBounds, childrenSize),
      );
    }
  },

  drawAttachedConnectLine(
    parentBranch,
    childBranch,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index = childBranch.branchIndex(),
  ) {
    const { isLineTapered } = structuresUtil;
    const topicLineStyle = parentBranch.getConnectionView().getLineShape();
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
    if (this.isSpecialLineShape(topicLineStyle)) {
      ctrlPt.y = endPt.y - getCurrentColPosY(30);
    } else if (topicLineStyle === BRANCHCONNECTION.ROUNDEDELBOW) {
      ctrlPt.y = startPt.y;
    } else {
      ctrlPt.y = endPt.y;
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
/* harmony default export */
export const treeLeftAndRight = leftAndRight;
