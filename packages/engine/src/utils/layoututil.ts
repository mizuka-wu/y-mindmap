import { ALL_TOPIC_TYPES } from "../common/constants/index";

import { getStructure } from "../structures/helper/allstructures";

import * as snowBrushRenderUtils from "./index";

import { layoutConstant } from "./layoutconstant";
/**
 * Temporary
 */
export const doLayoutBranch = (branch) => {
  const structure = branch.getStructureClass();
  if (branch.isLayout) {
    return;
  }
  if (branch.shouldHide()) {
    return;
  } // this line maybe remove later
  // 目前 layout 中包含 colExtView.move 的操作，
  // 所以必须在 layout 之前保证有 View
  branch._showOrHideCollapseExtendView();
  if (branch.shouldCollapse()) {
    branch.collapseBranch();
  }
  const structObj = getStructure(structure);
  branch.isLayout = true;
  calBoundsAndChildrenPos.call(structObj, branch);
};
function updatePositionAndBoundsToChildrenBranchView(
  parentBranchView,
  branchLayoutTreeInfo,
) {
  parentBranchView.updateLayoutInfo(branchLayoutTreeInfo);
  if (branchLayoutTreeInfo.stopFlag || parentBranchView.shouldCollapse()) {
    return;
  }
  ALL_TOPIC_TYPES.forEach((topicType) => {
    const childBranchInfoList = branchLayoutTreeInfo.children[topicType];
    if (!childBranchInfoList) {
      return;
    }
    parentBranchView
      .getChildrenBranchesByType(topicType)
      .forEach((childBranchView) => {
        const targetBranchInfo = childBranchInfoList.find(
          (branchInfo) => branchInfo.id === childBranchView.model.getId(),
        );
        childBranchView.setPosition(targetBranchInfo.position);
        childBranchView.bounds = targetBranchInfo.bounds;
        childBranchView.updateLayoutInfo(targetBranchInfo);
        updatePositionAndBoundsToChildrenBranchView(
          childBranchView,
          targetBranchInfo,
        );
      });
  });
}
function stopLayout(branchView) {
  function stopByNormalTreeCell() {
    let _a;
    const isNormalTreeCell =
      Object(snowBrushRenderUtils.isTreeTableCell)(branchView) &&
      !Object(snowBrushRenderUtils.isTreeTableHeadBranch)(branchView) &&
      Object(snowBrushRenderUtils.isTreeTableStructure)(branchView);
    if (!isNormalTreeCell) {
      return false;
    }
    const isHeadBranchHidden = !((_a = Object(
      snowBrushRenderUtils.getTreeTableHeadBranchView,
    )(branchView)) === null || _a === undefined
      ? undefined
      : _a.figure.isVisible);
    if (isHeadBranchHidden) {
      return false;
    }
    return true;
  }
  return stopByNormalTreeCell();
}
function calBoundsAndChildrenPos(branch) {
  const oldBounds = Object.assign({}, branch.bounds);
  const newBounds = Object.assign({}, branch.topicView.bounds);
  //在下面的函数中更新newBounds
  this.layoutExtendCollapse(branch, newBounds);
  // todo calc callout bounds separately
  this.calChildrenBounds(branch);
  if (!branch.shouldCollapse()) {
    // pure function layout process
    if (this.newLayout) {
      if (stopLayout(branch)) {
        return;
      }
      const branchLayoutTreeInfo = Object(
        snowBrushRenderUtils.getBranchLayoutTreeInfo,
      )(branch, {
        targetStructure: branch.getStructureClass(),
      });
      this.startLayout(branchLayoutTreeInfo);
      // update position to children branchview
      updatePositionAndBoundsToChildrenBranchView(branch, branchLayoutTreeInfo);
      // todo
      this.calDetachedChildrenPos(branch, branchLayoutTreeInfo.bounds);
      this.calSummaryChildrenPos(branch, branchLayoutTreeInfo.bounds);
      Object.assign(newBounds, branchLayoutTreeInfo.bounds);
    } else {
      this.calAttachedChildrenPos(branch, newBounds);
      this.specialDeal(branch, newBounds); //fishbone do someting
      this.calSummaryChildrenPos(branch, newBounds);
      this.calDetachedChildrenPos(branch, newBounds);
    }
  }
  // call out branch should be calculate in collapse branch
  if (!branch.isInMatrix()) {
    this.calCalloutChildrenPos(branch, newBounds);
  }
  branch.bounds = newBounds;
  if (!Object(snowBrushRenderUtils.isSame)(newBounds, oldBounds)) {
    branch.trigger("change:bounds", newBounds, branch);
  }
}
/*
 * @param: childrenSize: height or width depend on structure
 */
export function isNeedRedolayout(childBranches, offset, childrenSize) {
  const maxOffset = Math.min(
    layoutConstant.MAX_BRANCH_POSITION_REALIGN_OFFSET,
    childrenSize * layoutConstant.BRANCH_POSITION_REALIGN_RATIO,
  );
  return childBranches.length >= 3 && Math.abs(offset) < maxOffset;
}
