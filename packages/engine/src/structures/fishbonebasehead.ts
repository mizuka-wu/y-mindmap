import {
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  TOPICSHAPE,
  STYLE_KEYS,
  ALL_DIRECTION,
} from "../common/constants/index";
import * as js_utils from "../utils/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import { dragAreaUtil } from "./helper/dragareautil";

import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";
function getBonePaddingVertical(mainBoneOrHeadBoneInfo, isHeadBoneInfo?) {
  const targetLayoutInfo = isHeadBoneInfo
    ? mainBoneOrHeadBoneInfo
    : mainBoneOrHeadBoneInfo.parentBranchLayoutInfo;
  return (
    (parseInt(targetLayoutInfo.style[STYLE_KEYS.SPACING_MAJOR]) *
      (js_utils.layoutConstant.FISH_BONE.BONE_PADDING_VERTICAL +
        targetLayoutInfo.externalInfo.lineSpacing)) /
    parseInt(
      defaultStyles.getStyleValue(
        targetLayoutInfo.classType,
        STYLE_KEYS.SPACING_MAJOR,
      ),
    )
  );
}
function getBonePaddingHorizon(headBoneInfo) {
  return (
    (parseInt(headBoneInfo.style[STYLE_KEYS.SPACING_MINOR]) *
      js_utils.layoutConstant.FISH_BONE.BONE_PADDING_HORIZON) /
    parseInt(
      defaultStyles.getStyleValue(
        headBoneInfo.classType,
        STYLE_KEYS.SPACING_MINOR,
      ),
    )
  );
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getFirstBoneConnectionDistance() {}
function getMainBoneConnectionWidth(mainBoneInfo) {
  const connectionHeight =
    mainBoneInfo.bounds.height -
    mainBoneInfo.topicBounds.height +
    getBonePaddingVertical(mainBoneInfo);
  return (
    connectionHeight / js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN
  );
}
function getMainBonePositionToBaseXDistance(mainBoneInfo) {
  const boneTopicWidth = mainBoneInfo.topicBounds.width;
  const boneConnectionWidth = getMainBoneConnectionWidth(mainBoneInfo);
  return Math.max(boneTopicWidth / 2, boneConnectionWidth);
}
function getHeadBoneConnectionStartAnchorPositionY(headBoneInfo) {
  if (headBoneInfo.style[STYLE_KEYS.SHAPE_CLASS] !== TOPICSHAPE.UNDERLINE) {
    return 0;
  }
  return (
    (headBoneInfo.topicBounds.height -
      parseInt(headBoneInfo.style[STYLE_KEYS.BORDER_LINE_WIDTH])) /
    2
  );
}
function checkIsLayoutFromTopBone(childrenGroup) {
  let isLayoutStartFromTopBone = true;
  const topBoneInfo = childrenGroup[0];
  const bottomBoneInfo = childrenGroup[1];
  if (bottomBoneInfo) {
    const firstBottomBoneConnectionWidth =
      getMainBoneConnectionWidth(bottomBoneInfo);
    const firstBottomBoneTopicHalfWidth = bottomBoneInfo.topicBounds.width / 2;
    // status 1
    if (firstBottomBoneConnectionWidth > firstBottomBoneTopicHalfWidth) {
      isLayoutStartFromTopBone = true;
    } else {
      const firstTopBoneConnectionWidth =
        getMainBoneConnectionWidth(topBoneInfo);
      const firstTopBoneTopicHalfWidth = topBoneInfo.topicBounds.width / 2;
      // status 2
      if (firstTopBoneConnectionWidth > firstTopBoneTopicHalfWidth) {
        isLayoutStartFromTopBone =
          firstBottomBoneTopicHalfWidth -
            firstTopBoneConnectionWidth -
            (firstTopBoneTopicHalfWidth - firstTopBoneConnectionWidth) <
          js_utils.layoutConstant.FISH_BONE.FIRST_BONE_CONNECTION_DISTANCE;
      }
      // status 3
      else {
        isLayoutStartFromTopBone =
          firstBottomBoneTopicHalfWidth - firstBottomBoneConnectionWidth <
          js_utils.layoutConstant.FISH_BONE.FIRST_BONE_CONNECTION_DISTANCE;
      }
    }
  }
  return isLayoutStartFromTopBone;
}
export const FishBoneBaseHead = Object.assign({}, AbstractStructure, {
  newLayout: true,
  branchLayoutTreeInfo: {},
  fishBoneSideSize: {
    topSide: {
      width: 0,
      height: 0,
    },
    bottomSide: {
      width: 0,
      height: 0,
    },
  },
  startLayout(branchLayoutTreeInfo) {
    this.branchLayoutTreeInfo = branchLayoutTreeInfo;
    branchLayoutTreeInfo.externalInfo.startAnchorPositionY =
      getHeadBoneConnectionStartAnchorPositionY(branchLayoutTreeInfo);
    this._calcAttachedChildrenPosition();
    this._calcBounds();
    this._reset();
  },
  _reset() {
    this.branchLayoutTreeInfo = {};
    this.fishBoneSideSize = {
      topSide: {
        width: 0,
        height: 0,
      },
      bottomSide: {
        width: 0,
        height: 0,
      },
    };
  },
  _calcAttachedChildrenPosition() {
    const branchLayoutTreeInfo = this.branchLayoutTreeInfo;
    const childrenInfoList = branchLayoutTreeInfo.children[TOPIC_TYPE.ATTACHED];
    if (!childrenInfoList?.length) {
      return;
    }
    const spiltChildrenGroupList = this._getSpiltChildrenGroupList();
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const bonePaddingHorizon = getBonePaddingHorizon(branchLayoutTreeInfo);
    let baseX =
      (branchLayoutTreeInfo.topicBounds.width / 2 + bonePaddingHorizon) *
      isToRightMultiplicationParam;
    const baseY = branchLayoutTreeInfo.externalInfo.startAnchorPositionY;
    spiltChildrenGroupList.forEach((childrenGroup) => {
      const topBoneInfo = childrenGroup[0];
      const bottomBoneInfo = childrenGroup[1];
      const topBoneToBaseXDistance =
        getMainBonePositionToBaseXDistance(topBoneInfo);
      const topBoneY =
        baseY -
        (getBonePaddingVertical(topBoneInfo) +
          topBoneInfo.bounds.height +
          topBoneInfo.bounds.y);
      if (!bottomBoneInfo) {
        topBoneInfo.position = {
          x: baseX + topBoneToBaseXDistance * isToRightMultiplicationParam,
          y: topBoneY,
        };
        if (isToRightMultiplicationParam === 1) {
          baseX =
            topBoneInfo.position.x +
            topBoneInfo.bounds.width +
            topBoneInfo.bounds.x +
            bonePaddingHorizon;
        } else {
          baseX =
            topBoneInfo.position.x + topBoneInfo.bounds.x - bonePaddingHorizon;
        }
        this._updateSideSize(baseX, topBoneInfo);
      } else {
        const topBoneTempX =
          topBoneToBaseXDistance * isToRightMultiplicationParam;
        const bottomBoneTempX =
          topBoneTempX +
          (getMainBoneConnectionWidth(bottomBoneInfo) +
            js_utils.layoutConstant.FISH_BONE.BONE_CONNECTION_DISTANCE -
            getMainBoneConnectionWidth(topBoneInfo)) *
            isToRightMultiplicationParam;
        const tempBaseXToRealBaseXDistance =
          Math.abs(bottomBoneTempX) - bottomBoneInfo.topicBounds.width / 2;
        const baseXFix =
          tempBaseXToRealBaseXDistance < 0 ? -tempBaseXToRealBaseXDistance : 0;
        topBoneInfo.position = {
          x: baseX + baseXFix * isToRightMultiplicationParam + topBoneTempX,
          y: topBoneY,
        };
        bottomBoneInfo.position = {
          x: baseX + baseXFix * isToRightMultiplicationParam + bottomBoneTempX,
          y:
            baseY +
            getBonePaddingVertical(bottomBoneInfo) +
            Math.abs(bottomBoneInfo.bounds.y),
        };
        // update baseX
        if (isToRightMultiplicationParam === 1) {
          const getRightBorderX = (boneInfo) =>
            boneInfo.position.x + boneInfo.bounds.width + boneInfo.bounds.x;
          baseX =
            Math.max(
              getRightBorderX(topBoneInfo),
              getRightBorderX(bottomBoneInfo),
            ) + bonePaddingHorizon;
        } else {
          const getLeftBorderX = (boneInfo) =>
            boneInfo.position.x + boneInfo.bounds.x;
          baseX =
            Math.min(
              getLeftBorderX(topBoneInfo),
              getLeftBorderX(bottomBoneInfo),
            ) - bonePaddingHorizon;
        }
        // update side size
        this._updateSideSize(baseX, topBoneInfo, bottomBoneInfo);
      }
    });
  },
  _getSpiltChildrenGroupList() {
    const childrenInfoList =
      this.branchLayoutTreeInfo.children[TOPIC_TYPE.ATTACHED];
    const spiltChildrenGroupList = [];
    childrenInfoList.forEach((childInfo, index) => {
      if (index % 2 !== 0) {
        return;
      }
      spiltChildrenGroupList.push([childInfo, childrenInfoList[index + 1]]);
    });
    return spiltChildrenGroupList;
  },
  _updateSideSize(baseX, topBoneInfo, bottomBoneInfo) {
    const branchLayoutTreeInfo = this.branchLayoutTreeInfo;
    const sideWidth =
      Math.abs(baseX) -
      getBonePaddingHorizon(branchLayoutTreeInfo) -
      branchLayoutTreeInfo.topicBounds.width / 2;
    this.fishBoneSideSize.topSide.width = sideWidth;
    this.fishBoneSideSize.bottomSide.width = sideWidth;
    this.fishBoneSideSize.topSide.height = Math.max(
      topBoneInfo.bounds.height + getBonePaddingVertical(topBoneInfo),
      this.fishBoneSideSize.topSide.height,
    );
    if (bottomBoneInfo) {
      this.fishBoneSideSize.bottomSide.height = Math.max(
        bottomBoneInfo.bounds.height + getBonePaddingVertical(bottomBoneInfo),
        this.fishBoneSideSize.bottomSide.height,
      );
    }
  },
  _calcBounds() {
    const maxSideWidth = Math.max(
      this.fishBoneSideSize.topSide.width,
      this.fishBoneSideSize.bottomSide.width,
    );
    let width = this.branchLayoutTreeInfo.topicBounds.width;
    if (maxSideWidth !== 0) {
      width += Math.max(
        maxSideWidth +
          js_utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_EXTEND_BODY_WIDTH,
        js_utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_MIN_BODY_WIDTH,
      );
    }
    const startAnchorPositionY =
      this.branchLayoutTreeInfo.externalInfo.startAnchorPositionY;
    const headTopicHalfHeight =
      this.branchLayoutTreeInfo.topicBounds.height / 2;
    const height =
      Math.max(
        headTopicHalfHeight + startAnchorPositionY,
        this.fishBoneSideSize.topSide.height,
      ) +
      Math.max(
        headTopicHalfHeight - startAnchorPositionY,
        this.fishBoneSideSize.bottomSide.height,
      );
    let x = this.branchLayoutTreeInfo.topicBounds.x;
    if (this.direction === DIRECTION.LEFT) {
      x = -(width - this.branchLayoutTreeInfo.topicBounds.width / 2);
    }
    const y = -Math.max(
      headTopicHalfHeight,
      this.fishBoneSideSize.topSide.height - startAnchorPositionY,
    );
    this.branchLayoutTreeInfo.bounds = {
      width,
      height,
      x,
      y,
    };
    this.branchLayoutTreeInfo.externalInfo.headLineWidth =
      width - this.branchLayoutTreeInfo.topicBounds.width;
  },
  calcPolygons(branchView) {
    if (
      !branchView.getChildrenBranchesByType().length ||
      branchView.shouldCollapse() ||
      !branchView.getLayoutInfo()
    ) {
      return AbstractStructure.calcPolygons.apply(this, [branchView]);
    } else {
      return this._calcChildrenPolygons(branchView);
    }
  },
  _getSideHeadPointList(branchView, side) {
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const isTopSideMultiplicationParam = side === ALL_DIRECTION.UP ? -1 : 1;
    const x =
      (branchView.topicView.bounds.width / 2) * isToRightMultiplicationParam;
    const y =
      (branchView.topicView.bounds.height / 2) * isTopSideMultiplicationParam;
    return [
      {
        x,
        y,
      },
      {
        x,
        y: 0,
      },
    ];
  },
  _calcChildrenPolygons(branchView) {
    const childrenList = branchView.getChildrenBranchesByType();
    // top side point list
    const topSideChildrenList = childrenList.filter(
      (child, index) => index % 2 === 0,
    );
    const topSidePointList = [
      ...this._getSideHeadPointList(branchView, ALL_DIRECTION.UP),
    ];
    topSideChildrenList.forEach((branchView) => {
      topSidePointList.push(
        ...dragAreaUtil.getCornerPoints(branchView, branchView.position),
      );
    });
    const bottomSideChildrenList = childrenList.filter(
      (child, index) => index % 2 !== 0,
    );
    const bottomSidePointList = [
      ...[...this._getSideHeadPointList(branchView, ALL_DIRECTION.DOWN)],
    ];
    bottomSideChildrenList.forEach((branchView) => {
      bottomSidePointList.push(
        ...dragAreaUtil.getCornerPoints(branchView, branchView.position),
      );
    });
    const bonePaddingVertical = getBonePaddingVertical(
      branchView.getLayoutInfo(),
      true,
    );
    const bonePaddingHorizon = getBonePaddingHorizon(
      branchView.getLayoutInfo(),
    );
    const pushFishTailPoints = (sideChildrenList, isTopSide) => {
      if (!sideChildrenList.length) {
        return;
      }
      const lastChildInSide = sideChildrenList[sideChildrenList.length - 1];
      const tailExtendWidth = bonePaddingHorizon;
      const tailExtendHeight = bonePaddingVertical * 2;
      let x;
      if (this.direction === DIRECTION.RIGHT) {
        x =
          lastChildInSide.position.x +
          lastChildInSide.bounds.width +
          lastChildInSide.bounds.x +
          tailExtendWidth;
      } else {
        x =
          lastChildInSide.position.x +
          lastChildInSide.bounds.x -
          tailExtendWidth;
      }
      const y = (isTopSide ? -1 : 1) * tailExtendHeight;
      (isTopSide ? topSidePointList : bottomSidePointList).push(
        {
          x,
          y,
        },
        {
          x,
          y: 0,
        },
      );
    };
    pushFishTailPoints(topSideChildrenList, true);
    pushFishTailPoints(bottomSideChildrenList, false);
    // fix bottom side points
    const topSideLastChild =
      topSideChildrenList[topSideChildrenList.length - 1];
    bottomSidePointList.push(
      {
        x: topSideLastChild.position.x,
        y: bonePaddingVertical,
      },
      {
        x: topSideLastChild.position.x,
        y: 0,
      },
    );
    return [
      {
        pointList: Object(js_utils.convexHull)(topSidePointList),
        relatedBranchViewList: topSideChildrenList,
        side: ALL_DIRECTION.UP,
      },
      {
        pointList: Object(js_utils.convexHull)(bottomSidePointList),
        relatedBranchViewList: bottomSideChildrenList,
        side: ALL_DIRECTION.DOWN,
      },
    ];
  },
  drawAttachedConnectLine(parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
  getAvailableChildStructure() {
    return [];
  },
});
/** @deprecated this is compact fishbone layout */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _FishBoneBaseHead = Object.assign({}, AbstractStructure, {
  newLayout: true,
  branchLayoutTreeInfo: {},
  fishBoneSideSize: {
    topSide: {
      width: 0,
      height: 0,
    },
    bottomSide: {
      width: 0,
      height: 0,
    },
  },
  startLayout(branchLayoutTreeInfo) {
    this.branchLayoutTreeInfo = branchLayoutTreeInfo;
    branchLayoutTreeInfo.externalInfo.startAnchorPositionY =
      getHeadBoneConnectionStartAnchorPositionY(branchLayoutTreeInfo);
    this._calcAttachedChildrenPosition();
    this._calcBounds();
    this._reset();
  },
  _calcAttachedChildrenPosition() {
    const childrenInfoList =
      this.branchLayoutTreeInfo.children[TOPIC_TYPE.ATTACHED];
    if (!childrenInfoList?.length) {
      return;
    }
    const isLayoutStartFromTopBone = checkIsLayoutFromTopBone([
      childrenInfoList[0],
      childrenInfoList[1],
    ]);
    if (childrenInfoList[1]) {
      this._calcSideBoneChilrenPosition(isLayoutStartFromTopBone, false);
    }
    this._calcSideBoneChilrenPosition(isLayoutStartFromTopBone, true);
  },
  _calcSideBoneChilrenPosition(isLayoutStartFromTopBone, isTopSide) {
    const branchLayoutTreeInfo = this.branchLayoutTreeInfo;
    const isToRightMultiplicationParam =
      this.direction === DIRECTION.RIGHT ? 1 : -1;
    const isTopSideMultiplicationParam = isTopSide ? -1 : 1;
    const bonePaddingVertical = getBonePaddingVertical(
      branchLayoutTreeInfo,
      true,
    );
    const bonePaddingHorizon = getBonePaddingHorizon(branchLayoutTreeInfo);
    let baseX =
      (branchLayoutTreeInfo.topicBounds.width / 2 + bonePaddingHorizon) *
      isToRightMultiplicationParam;
    const baseY =
      branchLayoutTreeInfo.externalInfo.startAnchorPositionY +
      bonePaddingVertical * isTopSideMultiplicationParam;
    const childrenInfoList = branchLayoutTreeInfo.children[TOPIC_TYPE.ATTACHED];
    // fix baseX if layout start from bottom side bone
    if (isTopSide && !isLayoutStartFromTopBone) {
      const firstTopBoneConnectionWidth = getMainBoneConnectionWidth(
        childrenInfoList[0],
      );
      const firstBottomBoneConnectionWidth = getMainBoneConnectionWidth(
        childrenInfoList[1],
      );
      baseX =
        baseX +
        (childrenInfoList[1].topicBounds.width / 2 -
          firstBottomBoneConnectionWidth -
          js_utils.layoutConstant.FISH_BONE.FIRST_BONE_CONNECTION_DISTANCE) *
          isToRightMultiplicationParam;
      if (
        firstTopBoneConnectionWidth <
        childrenInfoList[0].topicBounds.width / 2
      ) {
        baseX =
          baseX +
          (firstTopBoneConnectionWidth -
            childrenInfoList[0].topicBounds.width / 2) *
            isToRightMultiplicationParam;
      }
    }
    childrenInfoList.forEach((childInfo, index) => {
      if ((index % 2 === 0) !== isTopSide) {
        return;
      }
      let childX;
      if (index === 0 || index === 1) {
        childX =
          baseX +
          getMainBonePositionToBaseXDistance(childInfo) *
            isToRightMultiplicationParam;
      } else {
        const childXToCurrentBaseXDistance =
          isToRightMultiplicationParam === 1
            ? Math.abs(childInfo.bounds.x)
            : -(childInfo.bounds.width + childInfo.bounds.x);
        childX = baseX + childXToCurrentBaseXDistance;
      }
      const childY =
        baseY +
        (childInfo.bounds.height + childInfo.bounds.y) *
          isTopSideMultiplicationParam;
      childInfo.position = {
        x: childX,
        y: childY,
      };
      // update baseX
      const childXToNextBaseXDistance =
        isToRightMultiplicationParam === 1
          ? childInfo.bounds.width + childInfo.bounds.x + bonePaddingHorizon
          : -(Math.abs(childInfo.bounds.x) + bonePaddingHorizon);
      baseX = childX + childXToNextBaseXDistance;
      // update side size
      const targetSideSize = isTopSide
        ? this.fishBoneSideSize.topSide
        : this.fishBoneSideSize.bottomSide;
      targetSideSize.width =
        Math.abs(baseX) -
        bonePaddingHorizon -
        this.branchLayoutTreeInfo.topicBounds.width / 2;
      targetSideSize.height = Math.max(
        childInfo.bounds.height + bonePaddingVertical,
        targetSideSize.height,
      );
    });
  },
  _calcBounds() {
    const maxSideWidth = Math.max(
      this.fishBoneSideSize.topSide.width,
      this.fishBoneSideSize.bottomSide.width,
    );
    const width =
      this.branchLayoutTreeInfo.topicBounds.width +
      Math.max(
        maxSideWidth +
          js_utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_EXTEND_BODY_WIDTH,
        js_utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_MIN_BODY_WIDTH,
      );
    const startAnchorPositionY =
      this.branchLayoutTreeInfo.externalInfo.startAnchorPositionY;
    const headTopicHalfHeight =
      this.branchLayoutTreeInfo.topicBounds.height / 2;
    const height =
      Math.max(
        headTopicHalfHeight + startAnchorPositionY,
        this.fishBoneSideSize.topSide.height,
      ) +
      Math.max(
        headTopicHalfHeight - startAnchorPositionY,
        this.fishBoneSideSize.bottomSide.height,
      );
    let x = this.branchLayoutTreeInfo.topicBounds.x;
    if (this.direction === DIRECTION.LEFT) {
      x = -(width - this.branchLayoutTreeInfo.topicBounds.width / 2);
    }
    const y = -Math.max(
      headTopicHalfHeight,
      this.fishBoneSideSize.topSide.height - startAnchorPositionY,
    );
    this.branchLayoutTreeInfo.bounds = {
      width,
      height,
      x,
      y,
    };
    this.branchLayoutTreeInfo.externalInfo.headLineWidth =
      width - this.branchLayoutTreeInfo.topicBounds.width;
  },
  _reset() {
    this.branchLayoutTreeInfo = {};
    this.fishBoneSideSize = {
      topSide: {
        width: 0,
        height: 0,
      },
      bottomSide: {
        width: 0,
        height: 0,
      },
    };
  },
  drawAttachedConnectLine(parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
});
