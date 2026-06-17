import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
  RIGHT_EXPOSED_STRUCTURE,
  LEFT_EXPOSED_STRUCTURE,
} from "../common/constants/index";
import * as js_utils from "../utils/index";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";

function getParentFishBoneStructureClass(currentStructureClass) {
  if (
    currentStructureClass === STRUCTURECLASS.LEFTHEADTOPBONE ||
    currentStructureClass === STRUCTURECLASS.LEFTHEADBOTTOMBONE
  ) {
    return STRUCTURECLASS.FISHBONELEFTHEADED;
  }
  if (
    currentStructureClass === STRUCTURECLASS.RIGHTHEADTOPBONE ||
    currentStructureClass === STRUCTURECLASS.RIGHTHEADBOTTOMBONE
  ) {
    return STRUCTURECLASS.FISHBONERIGHTHEADED;
  }
}
function getMainBonePaddingVertical(mainBoneInfo) {
  return (
    (parseInt(mainBoneInfo.externalInfo.parentSpacingMajor) *
      js_utils.layoutConstant.FISH_BONE.BONE_PADDING_VERTICAL) /
    parseInt(
      defaultStyles.getStyleValue(
        mainBoneInfo.externalInfo.parentClassType,
        STYLE_KEYS.SPACING_MAJOR,
      ),
    )
  );
}
function getSubBonePaddingVertical(mainBoneInfo) {
  return (
    (parseInt(mainBoneInfo.style[STYLE_KEYS.SPACING_MINOR]) *
      js_utils.layoutConstant.FISH_BONE.SUB_BONE_PADDING_VERTICAL) /
    parseInt(
      defaultStyles.getStyleValue(
        mainBoneInfo.classType,
        STYLE_KEYS.SPACING_MINOR,
      ),
    )
  );
}
export const FishBoneBaseMainBone = Object.assign({}, AbstractStructure, {
  newLayout: true,
  branchLayoutTreeInfo: {},
  startLayout(branchLayoutTreeInfo) {
    this.branchLayoutTreeInfo = branchLayoutTreeInfo;
    this._calcAttachedChildrenPositiconAndSelfBounds();
  },
  _calcAttachedChildrenPositiconAndSelfBounds() {
    const branchLayoutTreeInfo = this.branchLayoutTreeInfo;
    const childrenInfoList = branchLayoutTreeInfo.children[TOPIC_TYPE.ATTACHED];
    if (!childrenInfoList?.length) {
      branchLayoutTreeInfo.bounds = branchLayoutTreeInfo.topicBounds;
      return;
    }
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const isTopSideMultiplicationParam =
      this.getRangeGrowthDirection() === DIRECTION.DOWN ? 1 : -1;
    const bonePaddingVertical =
      getMainBonePaddingVertical(branchLayoutTreeInfo);
    const subBonePaddingVertical =
      getSubBonePaddingVertical(branchLayoutTreeInfo);
    // for calc children position
    let baseX = 0;
    let baseY =
      (branchLayoutTreeInfo.topicBounds.height / 2 + bonePaddingVertical) *
      isTopSideMultiplicationParam;
    // for calc self bounds
    let boundsMinX = branchLayoutTreeInfo.topicBounds.x;
    let boundsMaxX = Math.abs(boundsMinX);
    let boundsHeight =
      branchLayoutTreeInfo.topicBounds.height + bonePaddingVertical;
    childrenInfoList.forEach((childInfo) => {
      const lineSpacing = branchLayoutTreeInfo.externalInfo.lineSpacing;
      const childXToBaseXDistance =
        isToRightMultiplicationParam === 1
          ? Math.abs(childInfo.boundaryBounds.x) + lineSpacing
          : -(
              childInfo.boundaryBounds.width +
              childInfo.boundaryBounds.x +
              lineSpacing
            );
      let childX = baseX + childXToBaseXDistance;
      const childYToBaseYDistance =
        isTopSideMultiplicationParam === 1
          ? Math.abs(childInfo.boundaryBounds.y)
          : Math.abs(
              childInfo.boundaryBounds.height + childInfo.boundaryBounds.y,
            );
      const childY =
        baseY + childYToBaseYDistance * isTopSideMultiplicationParam;
      // optimize baseX for similar structure fishbone
      if (
        getParentFishBoneStructureClass(this.STRUCTURECLASS) ===
        childInfo.currentBranchStructure
      ) {
        childX =
          childX -
          (childYToBaseYDistance /
            js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN) *
            isToRightMultiplicationParam;
      }
      childInfo.position = {
        x: childX,
        y: childY,
      };
      const childDistanceY =
        (childInfo.boundaryBounds.height + subBonePaddingVertical) *
        isTopSideMultiplicationParam;
      // update self bounds calc params
      boundsMinX = Math.min(
        boundsMinX,
        childX - Math.abs(childInfo.boundaryBounds.x),
      );
      boundsMaxX = Math.max(
        boundsMaxX,
        childX + (childInfo.boundaryBounds.width + childInfo.boundaryBounds.x),
      );
      boundsHeight = boundsHeight + Math.abs(childDistanceY);
      baseX =
        baseX -
        (Math.abs(childDistanceY) /
          js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN) *
          isToRightMultiplicationParam;
      baseY = baseY + childDistanceY;
    });
    // update self bounds
    const boundsWidth = Math.abs(boundsMaxX - boundsMinX);
    boundsHeight = boundsHeight - subBonePaddingVertical;
    const boundsY =
      isTopSideMultiplicationParam === 1
        ? branchLayoutTreeInfo.topicBounds.y
        : -(boundsHeight - branchLayoutTreeInfo.topicBounds.height / 2);
    branchLayoutTreeInfo.bounds = {
      width: boundsWidth,
      height: boundsHeight,
      x: boundsMinX,
      y: boundsY,
    };
  },
  // todo draw main head connection
  drawAttachedConnectLine(parent, child) {
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const isTopSideMultiplicationParam =
      this.getRangeGrowthDirection() === DIRECTION.DOWN ? 1 : -1;
    const parentRealPosition = parent.getRealPosition();
    const parentLayoutInfo = parent.getLayoutInfo();
    if (!parentLayoutInfo) {
      return;
    }
    const mainlineStartRealPosition = {
      x: parentRealPosition.x,
      y:
        parentRealPosition.y +
        (parentLayoutInfo.topicBounds.height / 2) *
          isTopSideMultiplicationParam,
    };
    const endPos = getTopicShape(
      child.topicView.topicShapeStyle,
    ).getEndAnchorPosition(this, child);
    const connectionlineWidth =
      Math.abs(endPos.y - mainlineStartRealPosition.y) /
      js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN;
    const startPos = {
      x:
        mainlineStartRealPosition.x -
        connectionlineWidth * isToRightMultiplicationParam,
      y: endPos.y,
    };
    const postions = {
      startPt: startPos,
      ctrlPt: Object.assign({}, startPos),
      endPt: endPos,
    };
    getTopicLineStyle(BRANCHCONNECTION.STRAIGHT)(child, postions, false, false);
    // remove line cap
    child.getConnectionView().attr({
      "stroke-linecap": "",
    });
  },
  layoutExtendCollapse(branch) {
    if (!branch.getChildrenBranchesByType().length) {
      return;
    }
    if (!branch.collapseExtendView || branch.collapseExtendView.isHide()) {
      return;
    }
    const { EXT_RADIUS, COL_RADIUS, EXT_GAP, COL_GAP } =
      js_utils.layoutConstant;
    const isCollapse = branch.model.isCollapse();
    const gap = isCollapse ? EXT_GAP : COL_GAP;
    const r = isCollapse ? EXT_RADIUS : COL_RADIUS;
    let collpaseViewPositionX = 0;
    let collpaseViewPositionY = 0;
    const topicBounds = Object.assign({}, branch.topicView.shapeBounds);
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    switch (this.getSourceOrientation()) {
      case DIRECTION.DOWN:
        collpaseViewPositionX =
          -r -
          (gap / js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN) *
            isToRightMultiplicationParam;
        collpaseViewPositionY = topicBounds.y + topicBounds.height + gap - r;
        break;
      case DIRECTION.UP:
        collpaseViewPositionX =
          -r -
          (gap / js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN) *
            isToRightMultiplicationParam;
        collpaseViewPositionY = topicBounds.y - r - gap;
        break;
    }
    branch.collapseExtendView.move(
      collpaseViewPositionX,
      collpaseViewPositionY,
    );
    branch.collapseExtendView.drawConnection({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
    });
    branch.collapseExtendView.renderHoverArea();
  },
  calcPolygons(branchView) {
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const topicBounds = Object.assign({}, branchView.bounds);
    const fishBoneMainLineView = branchView.getFishBoneMainLineView();
    const { startPosition, endPosition } = fishBoneMainLineView.figure;
    const branchViewRealPosition = branchView.getRealPosition();
    const startRelativePosition = Object(js_utils.diff)(
      branchViewRealPosition,
      startPosition,
    );
    const endRelativePosition = Object(js_utils.diff)(
      branchViewRealPosition,
      endPosition,
    );
    const p1 = Object.assign({}, startRelativePosition);
    const p2 = {
      x: (topicBounds.width / 2) * isToRightMultiplicationParam,
      y: p1.y,
    };
    const p3 = Object.assign({}, endRelativePosition);
    const p4 = {
      x: p2.x,
      y: p3.y,
    };
    return [
      {
        pointList: [p1, p2, p4, p3],
        relatedBranchViewList: branchView.getChildrenBranchesByType(),
        side: null,
      },
    ];
  },
  getAvailableChildStructure() {
    if (this.direction === DIRECTION.RIGHT) {
      return RIGHT_EXPOSED_STRUCTURE;
    } else {
      return LEFT_EXPOSED_STRUCTURE;
    }
  },
});
