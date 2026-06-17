import { BranchRebuildManager } from "../../utils/dragutils";
function isNotSiblingTopic(branchViewList) {
  const isNotSameParent = branchViewList.some(
    (branch) => branch.parent() !== branchViewList[0].parent(),
  );
  if (isNotSameParent) {
    return true;
  }
  let isNotContinuous;
  isNotContinuous = branchViewList.some((branch, index) => {
    if (index === branchViewList.length - 1) {
      return;
    }
    return branch.branchIndex() + 1 !== branchViewList[index + 1].branchIndex();
  });
  if (isNotContinuous) {
    return true;
  }
  const parentBranchView = branchViewList[0].parent();
  const parentStructureClass = parentBranchView.getStructureClass();
  if (
    parentStructureClass === STRUCTURECLASS.MAP ||
    parentStructureClass === STRUCTURECLASS.MAPUNBALANCED
  ) {
    const rightNumber = getMapRightNumber(parentBranchView);
    if (
      branchViewList[0].branchIndex() < rightNumber &&
      branchViewList[branchViewList.length - 1].branchIndex() >= rightNumber
    ) {
      isNotContinuous = true;
    }
  }
  if (isNotContinuous) {
    return true;
  }
}
function getMapRightNumber(branchView) {
  if (branchView.getStructureClass() === STRUCTURECLASS.MAP) {
    return branchView.figure.balanceRightNumber;
  }
  if (branchView.getStructureClass() === STRUCTURECLASS.MAPUNBALANCED) {
    return branchView.figure.unbalanceRightNumber;
  }
}
const viewIsBranch = (view) => view.type === VIEW_TYPE.BRANCH;
const viewIsNotCallout = (view) =>
  !viewIsBranch(view) ||
  styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC;
const viewIsNotSummary = (view) =>
  !viewIsBranch(view) ||
  styleManager.getClassName(view) !== CLASS_TYPE.SUMMARY_TOPIC;
const viewIsNotCentralBranch = (view) =>
  !viewIsBranch(view) || !view.isCentralBranch();
import {
  VIEW_TYPE,
  ACTION_NAMES,
  ACTION_STATUS,
  TOPIC_TYPE,
  CLASS_TYPE,
  STRUCTURECLASS,
  DIRECTION,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

/**
 * @description 通过`Alt / Option + 方向键`移动 topic
 */
export class ExchangeSiblingTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.EXCHANGE_SIBLING_TOPIC;
  }
  doExecute({ direction, targets = [], toEdge }) {
    const sortedTargetBranchViewList =
      this.getFinalSelectedBranchViewList(targets);
    const parentBranch = sortedTargetBranchViewList[0].parent();
    const allbranchViewList = parentBranch.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    const targetIndex = getTargetIndex();
    if (targetIndex === -1) {
      return;
    }
    const branchRebuildManager = new BranchRebuildManager(
      this._context,
      {
        selections: [...sortedTargetBranchViewList],
      },
      {
        rememberSibilingRange: true,
      },
    );
    let addToRight;
    if (parentBranch.getStructureClass() === STRUCTURECLASS.MAPUNBALANCED) {
      const rightNumber = getMapRightNumber(parentBranch);
      if (sortedTargetBranchViewList[0].branchIndex() < rightNumber) {
        addToRight = true;
      }
    }
    sortedTargetBranchViewList.forEach((branch) => {
      branch.model.removeSelf();
    });
    branchRebuildManager.mountAsAttach(parentBranch, {
      at: targetIndex,
      addToRight,
    });
    // ------ functions ------
    function getTargetIndex() {
      let targetIndex = -1;
      const firstSortedListIndex = sortedTargetBranchViewList[0].branchIndex();
      const lastSortedListIndex =
        sortedTargetBranchViewList[
          sortedTargetBranchViewList.length - 1
        ].branchIndex();
      // for normal structure
      if (direction === DIRECTION.UP || direction === DIRECTION.LEFT) {
        if (firstSortedListIndex === 0) {
          targetIndex = -1;
        } else if (toEdge) {
          targetIndex = 0;
        } else {
          targetIndex = firstSortedListIndex - 1;
        }
      }
      if (direction === DIRECTION.DOWN || direction === DIRECTION.RIGHT) {
        if (lastSortedListIndex === allbranchViewList.length - 1) {
          targetIndex = -1;
        } else if (toEdge) {
          targetIndex =
            allbranchViewList.length - sortedTargetBranchViewList.length;
        } else {
          targetIndex = firstSortedListIndex + 1;
        }
      }
      // for normal structure end
      const parentStructureClass = parentBranch.getStructureClass();
      if (parentStructureClass === STRUCTURECLASS.MAP) {
        const rightNumber = getMapRightNumber(parentBranch);
        const isRightHand = firstSortedListIndex < rightNumber;
        if (direction === DIRECTION.UP || direction === DIRECTION.LEFT) {
          if (isRightHand) {
            // use line 69's logic
          } else if (firstSortedListIndex === rightNumber) {
            targetIndex = -1;
          } else if (toEdge) {
            targetIndex = rightNumber;
          } else {
            targetIndex = firstSortedListIndex - 1;
          }
        }
        if (direction === DIRECTION.DOWN || direction === DIRECTION.RIGHT) {
          if (isRightHand) {
            if (lastSortedListIndex === rightNumber - 1) {
              targetIndex = -1;
            } else if (toEdge) {
              targetIndex = rightNumber - sortedTargetBranchViewList.length;
            } else {
              targetIndex = firstSortedListIndex + 1;
            }
          } else {
            // use line 79's logic
          }
        }
      }
      if (parentStructureClass === STRUCTURECLASS.MAPUNBALANCED) {
        const rightNumber = getMapRightNumber(parentBranch);
        const isRightHand = firstSortedListIndex < rightNumber;
        if (direction === DIRECTION.UP || direction === DIRECTION.LEFT) {
          if (isRightHand) {
            // use line 69's logic
          } else if (lastSortedListIndex === allbranchViewList.length - 1) {
            targetIndex = -1;
          } else if (toEdge) {
            targetIndex =
              allbranchViewList.length - sortedTargetBranchViewList.length;
          } else {
            targetIndex = firstSortedListIndex + 1;
          }
        }
        if (direction === DIRECTION.DOWN || direction === DIRECTION.RIGHT) {
          if (isRightHand) {
            if (lastSortedListIndex === rightNumber - 1) {
              targetIndex = -1;
            } else if (toEdge) {
              targetIndex = rightNumber - sortedTargetBranchViewList.length;
            } else {
              targetIndex = firstSortedListIndex + 1;
            }
          } else if (firstSortedListIndex === rightNumber) {
            targetIndex = -1;
          } else if (toEdge) {
            targetIndex = rightNumber;
          } else {
            targetIndex = firstSortedListIndex - 1;
          }
        }
      }
      return targetIndex;
    }
  }
  getFinalSelectedBranchViewList(targets) {
    const sortedTargets = this.getFilterBranchViewList(targets).filter(
      (target) => {
        return (
          viewIsNotCallout(target) &&
          viewIsNotSummary(target) &&
          viewIsNotCentralBranch(target) &&
          !target.isInMatrix()
        );
      },
    );
    if (!sortedTargets.length) {
      return sortedTargets;
    }
    sortedTargets.sort((a, b) => a.branchIndex() - b.branchIndex());
    if (isNotSiblingTopic(sortedTargets)) {
      return [];
    }
    return sortedTargets;
  }
  queryStatus({ targets = [] }: any = {}) {
    if (this.getFinalSelectedBranchViewList(targets).length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
