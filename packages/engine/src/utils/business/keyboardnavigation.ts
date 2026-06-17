import {
  DIRECTION,
  STRUCTURECLASS,
  VIEW_TYPE,
  TOPIC_TYPE,
  CLASS_TYPE,
} from "../../common/constants";
import * as utils_branch from "../../utils/branch";
import { getReverseDir } from "../../utils/geometry";
import { styleManager } from "./stylemanager/index";
import { getStructure } from "../../structures/helper/allstructures";
import * as js_utils from "../../utils/index";

const mapDirectionToAttr = {
  [DIRECTION.UP]: {
    mainAxis: "cy",
    crossAxis: "cx",
    edge: "height",
  },
  [DIRECTION.DOWN]: {
    mainAxis: "cy",
    crossAxis: "cx",
    edge: "height",
  },
  [DIRECTION.LEFT]: {
    mainAxis: "cx",
    crossAxis: "cy",
    edge: "width",
  },
  [DIRECTION.RIGHT]: {
    mainAxis: "cx",
    crossAxis: "cy",
    edge: "width",
  },
};
const isFishBoneHeadBoneStructure = (branchView) => {
  const structure = branchView.getStructureClass();
  const fishBoneStructureList = [
    STRUCTURECLASS.FISHBONELEFTHEADED,
    STRUCTURECLASS.FISHBONERIGHTHEADED,
  ];
  return fishBoneStructureList.indexOf(structure) !== -1;
};
const isFishBoneMainBoneStructure = (branchView) => {
  const structure = branchView.getStructureClass();
  const fishBoneStructureList = [
    STRUCTURECLASS.LEFTHEADTOPBONE,
    STRUCTURECLASS.LEFTHEADBOTTOMBONE,
    STRUCTURECLASS.RIGHTHEADTOPBONE,
    STRUCTURECLASS.RIGHTHEADBOTTOMBONE,
  ];
  return fishBoneStructureList.indexOf(structure) !== -1;
};
const isFishBoneFirstLevelSubBone = (branchView) => {
  const parentMainBoneBranchView = branchView.parent();
  if (!Object(js_utils.isBranch)(parentMainBoneBranchView)) {
    return;
  }
  if (!isFishBoneMainBoneStructure(parentMainBoneBranchView)) {
    return;
  }
  return true;
};
const isTreeSidedMainTopicStructure = (branchView) => {
  const structure = branchView.getStructureClass();
  return [STRUCTURECLASS.TREELEFT, STRUCTURECLASS.TREERIGHT].includes(
    structure,
  );
};
const commonSearchChain = [
  getBrotherBranchNearby,
  getParentBranchNearby,
  getChildBranchNearby,
  getBranchNearby,
];
const fishBoneHeadBoneSearchChain = [
  getFishBoneHeadBoneNearestChildBranchView,
  ...commonSearchChain,
];
const fishBoneMainBoneSearchChain = [
  getFishBoneMianBoneNearestChildBranchView,
  getFishBoneMainBoneNearestBrotherBranchView,
  getParentBranchNearby,
  getBranchNearby,
];
const fishBoneSubBoneSearchChain = [
  getFishBoneSubBoneNextBranchView,
  getChildBranchNearby,
];
const treeSidedSearchChain = [
  getTreeSidedNextSideNearestBrotherBranch,
  getChildBranchNearby,
  getBrotherBranchNearby,
  getBranchNearby,
  getParentBranchNearby,
];
const timelineSidedSearchChain = [
  getTimelineSidedNearestBrotherBranch,
  ...commonSearchChain,
];
const treetableSearchChain = [
  getTreeTableNearestCellBranch,
  ...commonSearchChain,
];
const _getBranchRect = (branch) => {
  const bounds = Object.assign({}, branch.topicView.bounds);
  const position = branch.getRealPosition();
  return {
    cx: position.x,
    cy: position.y,
    width: bounds.width,
    height: bounds.height,
  };
};
/**
 * @private
 * @description find out the nearest branch of `base` in targetArr.
 * @param {*} baseBranchView
 * @param {*} targetBranchViewList
 * @param {*} direction
 */
const getNearestBranch = (baseBranchView, targetBranchViewList, direction) => {
  // what this function do:
  // according to the `direction`,
  // find out the `nearest` branch for `base` in the `targetArr`.
  if (targetBranchViewList.length === 0 || !direction) {
    return;
  }
  const { mainAxis, crossAxis, edge } = mapDirectionToAttr[direction];
  const baseRbox = _getBranchRect(baseBranchView);
  const calMainAxisDist = (target) => {
    const targetRbox = _getBranchRect(target);
    return (
      Math.abs(baseRbox[mainAxis] - targetRbox[mainAxis]) -
      (baseRbox[edge] + targetRbox[edge]) / 2
    );
  };
  const calCrossAxisDist = (target) => {
    const targetRbox = _getBranchRect(target);
    return Math.abs(baseRbox[crossAxis] - targetRbox[crossAxis]);
  };
  let branch = targetBranchViewList[0];
  let distance = calMainAxisDist(branch);
  targetBranchViewList.forEach((target) => {
    const targetDist = calMainAxisDist(target);
    if (
      targetDist < distance ||
      (targetDist === distance &&
        calCrossAxisDist(target) < calCrossAxisDist(branch))
    ) {
      branch = target;
      distance = targetDist;
    }
  });
  return branch;
};
const isInRange = (baseBranchView, targetBranchView, direction) => {
  // up or down: abs(cx1 - cx2) <= (width1 + width2) / 2
  // left or right: abs(cy1 - cy2) <= (height1 + height2) / 2
  const { mainAxis, crossAxis } = mapDirectionToAttr[direction];
  // get the cross axis according to the `mainAxis`(main axis)
  const rangeAttr = mainAxis === "cx" ? "height" : "width";
  const baseRbox = _getBranchRect(baseBranchView);
  const targetRbox = _getBranchRect(targetBranchView);
  const range = (baseRbox[rangeAttr] + targetRbox[rangeAttr]) / 2;
  const distance = Math.abs(baseRbox[crossAxis] - targetRbox[crossAxis]);
  return distance <= range;
};
const isOnDirection = (baseBranchView, targetBranchView, direction) => {
  const { mainAxis } = mapDirectionToAttr[direction];
  const baseRbox = _getBranchRect(baseBranchView);
  const targetRbox = _getBranchRect(targetBranchView);
  if (direction === DIRECTION.UP || direction === DIRECTION.LEFT) {
    return targetRbox[mainAxis] < baseRbox[mainAxis];
  } else if (direction === DIRECTION.DOWN || direction === DIRECTION.RIGHT) {
    return targetRbox[mainAxis] > baseRbox[mainAxis];
  }
};
const isSameDirect = (dir1, dir2) => {
  if (dir1 === "UD") {
    return dir2 === DIRECTION.UP || dir2 === DIRECTION.DOWN || dir2 === "UD";
  } else if (dir1 === "LR") {
    return dir2 === DIRECTION.LEFT || dir2 === DIRECTION.RIGHT || dir2 === "LR";
  } else {
    return dir1 === dir2;
  }
};
const getParentDirection = (branch) => {
  const branchParent = branch.parent();
  if (
    !branchParent ||
    branchParent.type !== VIEW_TYPE.BRANCH ||
    branch.isDetachedBranch()
  ) {
    return;
  }
  const branchParentStructure = getStructure(branchParent.getStructureClass());
  const direction = branchParentStructure.getSourceOrientation();
  if (direction !== DIRECTION.NONE) {
    return getReverseDir(direction);
  } else {
    return branchParentStructure.getChildTargetOrientation(
      branchParent,
      branch.branchIndex(),
    );
  }
};
const getCentralBranch = (branch) => {
  return branch.getContext().getSheetView().getCentralBranchView();
};
const getAllBranchesByCentralBranch = (centralBranch) => [
  ...centralBranch.getDescendantBranchesByType(
    TOPIC_TYPE.ATTACHED,
    TOPIC_TYPE.DETACHED,
    TOPIC_TYPE.SUMMARY,
  ),
  centralBranch,
];
/**
 * @description according to the direction, return the branch nearby.
 */
function getBranchNearby(selectdBranchView, direction, filterFunc) {
  if (!selectdBranchView || !direction) {
    return;
  }
  if (typeof filterFunc !== "function") {
    filterFunc = () => true;
  }
  const otherBranches = getAllBranchesByCentralBranch(
    getCentralBranch(selectdBranchView),
  )
    .filter(filterFunc)
    .filter((branch) => isOnDirection(selectdBranchView, branch, direction))
    .filter((branch) => isInRange(selectdBranchView, branch, direction));
  return getNearestBranch(selectdBranchView, otherBranches, direction);
}
/**
 * @description according to the direction, return the parent branch nearby.
 * @param {*} selectedBranchView
 * @param {*} direction
 */
function getParentBranchNearby(selectedBranchView, direction) {
  if (!selectedBranchView || !direction) {
    return;
  }
  const parentBranch = selectedBranchView.parent();
  if (isSameDirect(getParentDirection(selectedBranchView), direction)) {
    return parentBranch;
  }
  return false;
}
/**
 * @description according to the direction, return the child branch nearby.
 * @param {*} selectedBranchView
 * @param {*} direction
 * @param {function} filterFunc
 */
function getChildBranchNearby(selectedBranchView, direction, filterFunc) {
  if (!selectedBranchView || !direction) {
    return;
  }
  if (typeof filterFunc !== "function") {
    filterFunc = () => true;
  }
  const selBranchStructure = getStructure(
    selectedBranchView.getStructureClass(),
  );
  const childDirection = selBranchStructure.getSourceOrientation();
  if (isSameDirect(childDirection, direction)) {
    const toSelectBranches = selectedBranchView
      .getChildrenBranchesByType()
      .filter(filterFunc);
    const result = getNearestBranch(
      selectedBranchView,
      toSelectBranches,
      direction,
    );
    if (result) {
      return result;
    }
  }
  if (childDirection === DIRECTION.NONE) {
    const toSelectBranches = selectedBranchView
      .getChildrenBranchesByType()
      .filter(filterFunc)
      .filter((branch) => isOnDirection(selectedBranchView, branch, direction));
    return getNearestBranch(selectedBranchView, toSelectBranches, direction);
  }
  return false;
}
function isOppositeDirection(directionA, directionB) {
  switch (directionA) {
    case DIRECTION.LEFT:
      return directionB === DIRECTION.RIGHT;
    case DIRECTION.RIGHT:
      return directionB === DIRECTION.LEFT;
    case DIRECTION.UP:
      return directionB === DIRECTION.DOWN;
    case DIRECTION.DOWN:
      return directionB === DIRECTION.UP;
    default:
      return false;
  }
}
function getFishBoneHeadBoneNearestChildBranchView(
  selectedBranchView,
  direction,
) {
  const headBoneStructureObject = getStructure(
    selectedBranchView.getStructureClass(),
  );
  if (isOppositeDirection(headBoneStructureObject.direction, direction)) {
    return;
  }
  const childrenBranchViewList = selectedBranchView.getChildrenBranchesByType();
  if (isToFindFirstChild()) {
    return childrenBranchViewList[0];
  }
  if (isToFindSecondChild()) {
    return childrenBranchViewList[1];
  }
  function isToFindFirstChild() {
    return (
      headBoneStructureObject.direction === direction ||
      direction === DIRECTION.UP
    );
  }
  function isToFindSecondChild() {
    return direction === DIRECTION.DOWN;
  }
}
function getFishBoneMianBoneNearestChildBranchView(
  selectedBranchView,
  direction,
  filterFunc,
) {
  const fishBoneMainBoneStructureObject = getStructure(
    selectedBranchView.getStructureClass(),
  );
  const rangeGrowthDirection =
    fishBoneMainBoneStructureObject.getRangeGrowthDirection();
  if (rangeGrowthDirection === direction) {
    const selfFirstChildBranchView =
      selectedBranchView.getChildrenBranchesByType()[0];
    // check self's child branch view
    if (filterFunc(selfFirstChildBranchView)) {
      return selfFirstChildBranchView;
    }
    // check brother's child branch view
    const brotherBranchViewList = selectedBranchView
      .parent()
      .getChildrenBranchesByType();
    let nextBrotherBranchView;
    if (direction === DIRECTION.UP) {
      nextBrotherBranchView =
        brotherBranchViewList[selectedBranchView.branchIndex() - 1];
    } else {
      nextBrotherBranchView =
        brotherBranchViewList[selectedBranchView.branchIndex() + 1];
    }
    if (!nextBrotherBranchView) {
      return;
    }
    const nexBrotherChildrenBranchViewList =
      nextBrotherBranchView.getChildrenBranchesByType();
    const brotherLastChildBranchView =
      nexBrotherChildrenBranchViewList[
        nexBrotherChildrenBranchViewList.length - 1
      ];
    if (filterFunc(brotherLastChildBranchView)) {
      return brotherLastChildBranchView;
    }
  }
}
function getFishBoneMainBoneNearestBrotherBranchView(
  selectedBranchView,
  direction,
) {
  const parentBranch = selectedBranchView.parent();
  const parentHeadBoneStructureObject = getStructure(
    parentBranch.getStructureClass(),
  );
  const brotherBranchViewList = parentBranch.getChildrenBranchesByType();
  // get left or right brother branchView
  if (parentHeadBoneStructureObject.direction === direction) {
    return brotherBranchViewList[selectedBranchView.branchIndex() + 1];
  }
  if (isOppositeDirection(parentHeadBoneStructureObject.direction, direction)) {
    return brotherBranchViewList[selectedBranchView.branchIndex() - 1];
  }
}
function getFishBoneSubBoneNextBranchView(selectedBranchView, direction) {
  const parentMainBoneBranchView = selectedBranchView.parent();
  const parentHeadBoneBranchView = parentMainBoneBranchView.parent();
  if (!parentHeadBoneBranchView) {
    return;
  }
  const fishBoneMainBoneStructureObject = getStructure(
    parentMainBoneBranchView.getStructureClass(),
  );
  const rangeGrowthDirection =
    fishBoneMainBoneStructureObject.getRangeGrowthDirection();
  const brotherBranchViewList =
    parentMainBoneBranchView.getChildrenBranchesByType();
  const mainBonebBranchViewList =
    parentHeadBoneBranchView.getChildrenBranchesByType();
  const selectedIndex = selectedBranchView.branchIndex();
  // for fist subbone
  if (selectedIndex === 0) {
    // to parent bone
    if (
      isOppositeDirection(rangeGrowthDirection, direction) ||
      isOppositeDirection(fishBoneMainBoneStructureObject.direction, direction)
    ) {
      return parentMainBoneBranchView;
    }
  }
  // for lasted subbone
  if (selectedIndex === brotherBranchViewList.length - 1) {
    // to target direction's mainbone branch's main bone or lasted subbone
    if (rangeGrowthDirection === direction) {
      const parentMainBoneIndex = parentMainBoneBranchView.branchIndex();
      let targetMainBoneBranchView;
      if (rangeGrowthDirection === DIRECTION.DOWN) {
        targetMainBoneBranchView =
          mainBonebBranchViewList[parentMainBoneIndex + 1];
      } else if (rangeGrowthDirection === DIRECTION.UP) {
        targetMainBoneBranchView =
          mainBonebBranchViewList[parentMainBoneIndex - 1];
      }
      if (targetMainBoneBranchView) {
        const subBoneListInTargetMainBoneBranchView =
          targetMainBoneBranchView.getChildrenBranchesByType();
        return (
          subBoneListInTargetMainBoneBranchView[
            subBoneListInTargetMainBoneBranchView.length - 1
          ] ?? targetMainBoneBranchView
        );
      }
    }
  }
  // for others
  let nextBrotherBranchView;
  if (rangeGrowthDirection === direction) {
    nextBrotherBranchView = brotherBranchViewList[selectedIndex + 1];
  } else if (isOppositeDirection(rangeGrowthDirection, direction)) {
    nextBrotherBranchView = brotherBranchViewList[selectedIndex - 1];
  }
  return nextBrotherBranchView;
}
function getTimelineSidedNearestBrotherBranch(selectedBranchView, direction) {
  if (
    selectedBranchView.isCentralBranch() ||
    selectedBranchView.type === TOPIC_TYPE.DETACHED
  ) {
    const firstChild = selectedBranchView.getChildrenBranchesByType()[0];
    if (
      firstChild &&
      (direction === DIRECTION.DOWN || direction === DIRECTION.RIGHT)
    ) {
      return firstChild;
    }
    return null;
  }
  const parent = selectedBranchView.parent();
  const children = parent.getChildrenBranchesByType();
  const structure = parent.getStructureClass();
  const isInTimelineSidedHorizontal =
    structure === STRUCTURECLASS.TIMELINESIDEDHORIZONTAL;
  if (isInTimelineSidedHorizontal) {
    let targetIndex = selectedBranchView.branchIndex();
    if (direction === DIRECTION.LEFT) {
      targetIndex -= 1;
    } else if (direction === DIRECTION.RIGHT) {
      targetIndex += 1;
    } else {
      return null;
    }
    if (targetIndex === -1) {
      return parent;
    }
    if (targetIndex > children.length - 1) {
      return null;
    }
    return children[targetIndex];
  }
}
function getTreeSidedNextSideNearestBrotherBranch(
  selectedBranchView,
  direction,
) {
  if (styleManager.getClassName(selectedBranchView) === CLASS_TYPE.MAIN_TOPIC) {
    const structureClass = selectedBranchView.getStructureClass();
    if (
      (structureClass === STRUCTURECLASS.TREERIGHT &&
        direction === DIRECTION.LEFT) ||
      (structureClass === STRUCTURECLASS.TREELEFT &&
        direction === DIRECTION.RIGHT)
    ) {
      return getNextOrPreBrother();
    }
  }
  function getNextOrPreBrother() {
    const parentBranchView = selectedBranchView.parent();
    const brotherBranchViewList = parentBranchView.getChildrenBranchesByType();
    const selectedBranchViewIndex =
      brotherBranchViewList.indexOf(selectedBranchView);
    return (
      brotherBranchViewList[selectedBranchViewIndex + 1] ||
      brotherBranchViewList[selectedBranchViewIndex - 1] ||
      null
    );
  }
}
function getTreeTableNearestCellBranch(selectedBranchView, direction) {
  const headCellBranch = Object(utils_branch.getTreeTableHeadBranchView)(
    selectedBranchView,
  );
  // Special case: head cell of top title tree table
  if (
    selectedBranchView === headCellBranch &&
    selectedBranchView.getStructureClass() ===
      STRUCTURECLASS.TOPTITLETREETABLE &&
    (direction === DIRECTION.LEFT || direction === DIRECTION.RIGHT)
  ) {
    return selectedBranchView;
  }
  const tableLayoutInfo = headCellBranch.getLayoutInfo().externalInfo.tableInfo;
  const model2View = headCellBranch.editDomain().model2View;
  const cellPos = getCellPosFromTreeTableLayoutTableInfo(
    tableLayoutInfo,
    selectedBranchView.model.id,
  );
  if (!cellPos) {
    return null;
  }
  let targetView;
  // when move from a merged cell, it might move more than 1 step to the right position, so we do this in a while loop
  while (true) {
    if (direction === DIRECTION.UP) {
      cellPos.row = cellPos.row - 1;
    }
    if (direction === DIRECTION.DOWN) {
      cellPos.row = cellPos.row + 1;
    }
    if (direction === DIRECTION.LEFT) {
      cellPos.col = cellPos.col - 1;
    }
    if (direction === DIRECTION.RIGHT) {
      cellPos.col = cellPos.col + 1;
    }
    const targetLayoutInfo = tableLayoutInfo[cellPos.row]?.[cellPos.col];
    targetView = model2View[targetLayoutInfo?.id] ?? null;
    if (targetView !== selectedBranchView) {
      break;
    }
  }
  // Special case: when navigate from a leaf cell, we must select a leaf cell too
  const fromLeafCell =
    selectedBranchView.getChildrenBranchesByType().length === 0;
  if (
    fromLeafCell &&
    (direction === DIRECTION.UP || direction === DIRECTION.DOWN)
  ) {
    const targetLayoutInfo =
      tableLayoutInfo[cellPos.row]?.[tableLayoutInfo[0].length - 1];
    return model2View[targetLayoutInfo?.id] ?? null;
  } else {
    return targetView;
  }
}
function getCellPosFromTreeTableLayoutTableInfo(tableLayoutInfo, targetId) {
  for (let row = 0; row < tableLayoutInfo.length; row++) {
    if (tableLayoutInfo[row]) {
      for (let col = 0; col < tableLayoutInfo[row].length; col++) {
        if (tableLayoutInfo[row][col].id === targetId) {
          return {
            row,
            col,
          };
        }
      }
    }
  }
  return null;
}
function getBrotherBranchNearby(selectedBranchView, direction, filterFunc) {
  if (!selectedBranchView || !direction) {
    return;
  }
  if (typeof filterFunc !== "function") {
    filterFunc = () => true;
  }
  const parentBranch = selectedBranchView.parent();
  if (
    parentBranch.type === VIEW_TYPE.BRANCH &&
    !selectedBranchView.isDetachedBranch() &&
    isSameDirect(selectedBranchView.getBrotherDirection(), direction)
  ) {
    const brothers = parentBranch
      .getChildrenBranchesByType(TOPIC_TYPE.ATTACHED)
      .filter(filterFunc)
      .filter((branch) => isOnDirection(selectedBranchView, branch, direction))
      .filter((branch) => isInRange(selectedBranchView, branch, direction));
    return getNearestBranch(selectedBranchView, brothers, direction);
  }
  return false;
}
/**
 * @description according to the direction, select / multiselect the branch nearby.
 * @param {*} direction - arrow key DIRECTION of UP, DOWN, LEFT, RIGHT
 * @param {*} selectionManager
 * @param {boolean} addNext - e.metaKey || e.ctrlKey, for multiselect
 */
export function keyboardNav(direction, selectionManager, addNext) {
  const selection = selectionManager.getSelections();
  const branchArr = selection.filter(
    (branch) => branch.type === VIEW_TYPE.BRANCH,
  );
  if (branchArr.length === 0) {
    return;
  }
  // selBranch means `focused branch` in the selections,
  // which is usually the last branch user selected.
  const selectedBranchView =
    selectionManager.getLastSelectedBranch() || branchArr[branchArr.length - 1];
  if (isFishBoneHeadBoneStructure(selectedBranchView)) {
    // need to do some special
    executeSearchChain(fishBoneHeadBoneSearchChain);
  } else if (isFishBoneMainBoneStructure(selectedBranchView)) {
    executeSearchChain(fishBoneMainBoneSearchChain);
  } else if (isFishBoneFirstLevelSubBone(selectedBranchView)) {
    executeSearchChain(fishBoneSubBoneSearchChain);
  } else if (isTreeSidedMainTopicStructure(selectedBranchView)) {
    executeSearchChain(treeSidedSearchChain);
  } else if (Object(utils_branch.isChildOfTimelineBranch)(selectedBranchView)) {
    executeSearchChain(timelineSidedSearchChain);
  } else if (Object(utils_branch.isTreeTableStructure)(selectedBranchView)) {
    executeSearchChain(treetableSearchChain);
  } else {
    executeSearchChain(commonSearchChain);
  }
  function isSelectable(branch) {
    return !selectionManager.isUnselectable(branch);
  }
  // a function to select the result. return true to exit keyboardNavigation.
  function select(result) {
    if (!result) {
      return false;
    }
    if (addNext) {
      if (result.isSelected) {
        // if the branch on the direction is selected,
        // then deselect the selBranch and set result as LastSelectedBranch.
        selectionManager.toggleSelection(selectedBranchView);
        selectionManager.setLastSelectedBranch(result);
      } else {
        selectionManager.addSelection(result);
      }
    } else {
      selectionManager.selectSingle(result);
    }
    return true;
  }
  function executeSearchChain(searchChain) {
    for (const searchMethod of searchChain) {
      if (select(searchMethod(selectedBranchView, direction, isSelectable))) {
        break;
      }
    }
  }
}
