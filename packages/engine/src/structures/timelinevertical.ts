import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  TREE_RIGHT_EXPOSED_STRUCTURE,
  TREE_LEFT_EXPOSED_STRUCTURE,
} from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import * as js_utils from "../utils/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import structuresUtil from "./helper/structuresutil";

import underscore from "underscore";
import * as boundutils from "../utils/boundutils";
import { AbstractStructure } from "./abstractstructure";

import * as utils_branch from "../utils/branch";
/**
 * structrue -- timelineVertical
 */
const PADDING = layoutConstant.PADDING;
export const timelineVertical = underscore.extend({}, AbstractStructure, {
  STRUCTURECLASS: STRUCTURECLASS.TIMELINEVERTICAL,
  isAttachedChildrenStructureImmutable: true,
  getRightSide(branch) {
    const subbranches = branch.getChildrenBranchesByType();
    if (subbranches.length) {
      const rights = [0];
      subbranches[0].changeTag("right");
      let rightWards = true;
      let i;
      for (i = 1; i < subbranches.length; i++) {
        const sr = this.isInSameRange(branch, i);
        if (sr) {
          if (rightWards) {
            subbranches[i].changeTag("right");
            rights.push(i);
          } else {
            subbranches[i].changeTag("left");
          }
        } else if (rightWards) {
          rightWards = false;
          subbranches[i].changeTag("left");
        } else {
          rightWards = true;
          subbranches[i].changeTag("right");
          rights.push(i);
        }
      }
      return rights;
    }
  },
  calAttachedChildrenPos(branch, newBounds) {
    const attachedChildrenBranches = branch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    if (attachedChildrenBranches.length) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const childrenXR = newBounds.x + newBounds.width + newBounds.x + PADDING;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const childrenXL = newBounds.x + newBounds.width + newBounds.x - PADDING;
      const baseOffsetX = PADDING;
      // for alignment of children of same side
      const maxOffset = attachedChildrenBranches.reduce(
        (res, childBranch) => {
          if (childBranch.tag === "right") {
            return Object.assign(Object.assign({}, res), {
              right: Math.max(
                res.right,
                childBranch.topicView.bounds.x - childBranch.boundaryBounds.x,
              ),
            });
          } else {
            const { x: boundaryBoundsX, width: boundaryBoundsWidth } =
              childBranch.boundaryBounds;
            const { x: topicBoundsX, width: topicBoundsWidth } =
              childBranch.topicView.bounds;
            return Object.assign(Object.assign({}, res), {
              left: Math.max(
                res.left,
                boundaryBoundsX +
                  boundaryBoundsWidth -
                  (topicBoundsWidth + topicBoundsX),
              ),
            });
          }
        },
        {
          left: Number.MIN_VALUE,
          right: Number.MIN_VALUE,
        },
      );
      const offsetRatioOfStaticAngle =
        branch.figure.lineShape === BRANCHCONNECTION.STRAIGHT
          ? Math.tan((Math.PI * 30) / 180)
          : 0;
      const SPACING = PADDING * 1.5;
      let prevLeftBoundsEdgeY =
        branch.topicView.bounds.height + branch.topicView.bounds.y + SPACING;
      let prevRightBoundsEdgeY = prevLeftBoundsEdgeY;
      let prevEdgeY = prevLeftBoundsEdgeY;
      const lineGap = Object(js_utils.getLineEndSpacingPatchGap)(branch);
      attachedChildrenBranches.forEach((childBranch) => {
        const { y: childBoundaryBoundsY, height: childBoundaryBoundsHeight } =
          childBranch.boundaryBounds;
        const { x: childTopicBoundsX, width: childTopicBoundsWidth } =
          childBranch.topicView.bounds;
        if (childBranch.tag === "right") {
          const posX =
            baseOffsetX + maxOffset.right - childTopicBoundsX + lineGap;
          const yOffsetForStaticAngle =
            (baseOffsetX + maxOffset.right) * offsetRatioOfStaticAngle;
          const posY = Math.max(
            prevRightBoundsEdgeY -
              childBranch.boundaryBounds.y +
              yOffsetForStaticAngle,
            prevEdgeY + SPACING,
          );
          childBranch.setPosition(posX, posY);
          prevRightBoundsEdgeY =
            posY + childBoundaryBoundsY + childBoundaryBoundsHeight + SPACING;
          prevEdgeY = posY + SPACING;
        } else if (childBranch.tag === "left") {
          const posX =
            -baseOffsetX -
            maxOffset.left -
            (childTopicBoundsWidth + childTopicBoundsX) -
            lineGap;
          const yOffsetForStaticAngle =
            (baseOffsetX + maxOffset.left) * offsetRatioOfStaticAngle;
          const posY = Math.max(
            prevLeftBoundsEdgeY -
              childBranch.boundaryBounds.y +
              yOffsetForStaticAngle,
            prevEdgeY + SPACING,
          );
          childBranch.setPosition(posX, posY);
          prevLeftBoundsEdgeY =
            posY + childBoundaryBoundsY + childBoundaryBoundsHeight + SPACING;
          prevEdgeY = posY + SPACING;
        }
      });
      const childrenSize = this.getChildrenSize(branch);
      Object.assign(
        newBounds,
        boundutils.getUnionBoundingBox(newBounds, childrenSize),
      );
    }
  },
  getSummaryDirection(branch, index) {
    if (this.getRightSide(branch).indexOf(index) > -1) {
      return DIRECTION.RIGHT;
    } else {
      return DIRECTION.LEFT;
    }
  },
  //父branch的出发点 south north west east
  getSourceOrientation: function () {
    return DIRECTION.DOWN;
  },
  //子branch的接受点 south north west east
  getChildTargetOrientation(branch, index) {
    if (this.getRightSide(branch).indexOf(index) > -1) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.RIGHT;
    }
  },
  getChildStructure(structure, index, branch) {
    if (this.getRightSide(branch).indexOf(index) > -1) {
      return STRUCTURECLASS.TREERIGHT;
    } else {
      return STRUCTURECLASS.TREELEFT;
    }
  },
  getCalloutStructure() {
    return this.STRUCTURECLASS;
  },
  getAvailableChildStructure(branch, child) {
    const rights = this.getRightSide(branch);
    const index = child.branchIndex();
    const isRight = rights.indexOf(index) > -1;
    if (isRight) {
      return TREE_RIGHT_EXPOSED_STRUCTURE;
    } else {
      return TREE_LEFT_EXPOSED_STRUCTURE;
    }
  },
  drawAttachedConnectLine(parentBranch, childBranch) {
    const { isLineTapered } = structuresUtil;
    const parentTopicShape = Object(utils_branch.getTopicShape)(parentBranch);
    const topicLineStyle = childBranch.getConnectionView().figure.lineShape;
    const startPt = parentTopicShape.getStartAnchorPosition(
      parentBranch,
      childBranch,
    );
    const ctrlPt = Object.assign(
      {},
      parentTopicShape.getControlPosition(parentBranch, childBranch),
    );
    const endPt = Object(utils_branch.getTopicShape)(
      childBranch,
    ).getEndAnchorPosition(this, childBranch);
    const getCurrentColPosY = (deg) =>
      Math.abs(endPt.x - ctrlPt.x) * Math.tan((deg * Math.PI) / 180);
    if (topicLineStyle !== BRANCHCONNECTION.STRAIGHT) {
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
