import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
  STRUCTURECLASS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { parseTopic } from "../../utils/business/parsetopic";

import * as js_utils from "../../utils/index";

import * as lazyrunner from "../../figures/lazyrunner/index";
function checkIsUnbalanceMainBranchView /*View.BranchView*/(branchView) {
  const parentStructureClass = branchView.parent().getStructureClass();
  return parentStructureClass === STRUCTURECLASS.MAPUNBALANCED;
}
export class DeleteSingleTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.DELETE_SINGLE_TOPIC;
  }
  doExecute({ targets = [] }: any = {}) {
    const targetBranchView = this.getFilterBranchViewList(targets)[0];
    const targetTopicModel = targetBranchView.model;
    const parentBranchView = targetBranchView.parent();
    const childrenTopicModelList = [...targetTopicModel.children()];
    const childrenBoundaryInfoList = targetTopicModel
      .boundaries()
      .map((boundaryModel) => {
        return {
          model: boundaryModel,
          rangeStart: boundaryModel.rangeStart,
          rangeEnd: boundaryModel.rangeEnd,
        };
      });
    const childrenSummaryInfoList = targetTopicModel
      .summaries()
      .map((summaryModel) => {
        return {
          model: summaryModel,
          rangeStart: summaryModel.rangeStart,
          rangeEnd: summaryModel.rangeEnd,
        };
      });
    const childrenSummaryTopicModelList = [
      ...targetTopicModel.children(TOPIC_TYPE.SUMMARY),
    ];
    const innerRelationshipModelList =
      this.getInnerRelationshipModelList(targetBranchView);
    const insertIndex = targetTopicModel.getIndexInParent();
    const parentTopicModel = targetTopicModel.parent();
    const parentBoundaryInfoList = this.getParentSelectAbleInfoList(
      targetTopicModel,
      true,
    );
    const parentSummaryInfoList = this.getParentSelectAbleInfoList(
      targetTopicModel,
      false,
    );
    const parentSummaryTopicModelList = [
      ...parentTopicModel.children(TOPIC_TYPE.SUMMARY),
    ];
    // do some special treat for unbalance map main topic single deleting
    const isUnbalanceMainBranchView =
      checkIsUnbalanceMainBranchView(targetBranchView);
    let oldUnbalanceRightNumber;
    let isTargetInUnbalanceRightSide;
    if (isUnbalanceMainBranchView) {
      oldUnbalanceRightNumber = parentBranchView.figure.unbalanceRightNumber;
      isTargetInUnbalanceRightSide = insertIndex < oldUnbalanceRightNumber;
      if (!isTargetInUnbalanceRightSide) {
        childrenTopicModelList.reverse();
        const childrenLength = childrenTopicModelList.length;
        childrenBoundaryInfoList.forEach((boundaryInfo) => {
          const newRangeStart = childrenLength - 1 - boundaryInfo.rangeEnd;
          const newRangeEnd = childrenLength - 1 - boundaryInfo.rangeStart;
          boundaryInfo.rangeStart = newRangeStart;
          boundaryInfo.rangeEnd = newRangeEnd;
        });
        childrenSummaryInfoList.forEach((summaryInfo) => {
          const newRangeStart = childrenLength - 1 - summaryInfo.rangeEnd;
          const newRangeEnd = childrenLength - 1 - summaryInfo.rangeStart;
          summaryInfo.rangeStart = newRangeStart;
          summaryInfo.rangeEnd = newRangeEnd;
        });
      }
    }
    // todo 优化：并不需要删除所有的 parent boundary 和 summary，只需要 reRange
    parentBoundaryInfoList.forEach((boundaryInfo) =>
      boundaryInfo.model.removeSelf(),
    );
    parentSummaryTopicModelList.forEach((summaryTopicModel) =>
      summaryTopicModel.removeSelf(),
    );
    childrenTopicModelList.forEach((childTopicModel) =>
      childTopicModel.removeSelf(),
    );
    targetTopicModel.removeSelf();
    const newChildrenTopicModelList = [...childrenTopicModelList];
    this.rebuildChildrenTopicList(
      parentTopicModel,
      newChildrenTopicModelList,
      insertIndex,
    );
    this.rebuildChildBoundaryList(
      parentTopicModel,
      childrenBoundaryInfoList,
      insertIndex,
    );
    this.rebuildChildSummaryList(
      parentTopicModel,
      childrenSummaryInfoList,
      childrenSummaryTopicModelList,
      insertIndex,
    );
    this.reRangeParentBoundaryList(
      parentTopicModel,
      parentBoundaryInfoList,
      newChildrenTopicModelList.length,
      insertIndex,
    );
    this.reRangeParentSummaryList(
      parentTopicModel,
      parentSummaryInfoList,
      parentSummaryTopicModelList,
      newChildrenTopicModelList.length,
      insertIndex,
    );
    this.rebuildRelationshipList(innerRelationshipModelList);
    if (isUnbalanceMainBranchView && isTargetInUnbalanceRightSide) {
      parentTopicModel.setUnBalancedInfoContent(
        oldUnbalanceRightNumber - 1 + newChildrenTopicModelList.length,
      );
    }
    this.selectNewChildrenBranchView(
      parentBranchView,
      newChildrenTopicModelList,
    );
  }
  getInnerRelationshipModelList(targetBranchView /*View.BranchView*/) {
    const allDescendantBranchViewList = Object(
      js_utils.getAllChildrenBranchViewList,
    )(targetBranchView);
    return this._context
      .getSheetView()
      .relationships.filter((relationshipView) => {
        const end1ViewInBranchTree = allDescendantBranchViewList.includes(
          relationshipView.end1View,
        );
        const end2ViewInBranchTree = allDescendantBranchViewList.includes(
          relationshipView.end2View,
        );
        return end1ViewInBranchTree || end2ViewInBranchTree;
      })
      .map((view) => view.model);
  }
  getParentSelectAbleInfoList(
    targetTopicModel /*Model.TopicModel*/,
    isBoundary,
  ) {
    const insertIndex = targetTopicModel.getIndexInParent();
    const parentTopicModel = targetTopicModel.parent();
    const allParentSelectAbleModelList = isBoundary
      ? parentTopicModel.boundaries()
      : parentTopicModel.summaries();
    return allParentSelectAbleModelList
      .filter((selectAbleModel) => {
        const isSingleWrappedModel =
          selectAbleModel.rangeStart === insertIndex &&
          selectAbleModel.rangeEnd === insertIndex;
        // check if there is full wrapped boundary for target's children
        let hasFullWrappedSelectAbleViewForChildren;
        if (isSingleWrappedModel) {
          const childrenSelectAbleModelList = isBoundary
            ? targetTopicModel.boundaries()
            : targetTopicModel.summaries();
          hasFullWrappedSelectAbleViewForChildren =
            childrenSelectAbleModelList.some((selectAbleModel) => {
              return (
                selectAbleModel.rangeStart === 0 &&
                selectAbleModel.rangeEnd ===
                  targetTopicModel.children().length - 1
              );
            });
        }
        return (
          !isSingleWrappedModel || !hasFullWrappedSelectAbleViewForChildren
        );
      })
      .map((model) => {
        return {
          model,
          rangeStart: model.rangeStart,
          rangeEnd: model.rangeEnd,
        };
      });
  }
  rebuildChildrenTopicList(
    parentTopicModel /*Model.TopicModel*/,
    childrenTopicModelList,
    insertIndex,
  ) {
    childrenTopicModelList.forEach((childTopicModel, index) => {
      parentTopicModel.addChildTopic(childTopicModel, {
        at: insertIndex + index,
      });
    });
  }
  rebuildChildBoundaryList(
    parentTopicModel /*Model.TopicModel*/,
    childrenBoundaryInfoList,
    insertIndex,
  ) {
    childrenBoundaryInfoList.forEach((boundaryInfo) => {
      const boundaryData = boundaryInfo.model.toJSON();
      boundaryData.range = `(${boundaryInfo.rangeStart + insertIndex},${
        boundaryInfo.rangeEnd + insertIndex
      })`;
      parentTopicModel.addBoundary(boundaryData);
    });
  }
  rebuildChildSummaryList(
    parentTopicModel /*Model.TopicModel*/,
    childrenSummaryInfoList,
    childrenSummaryTopicModelList,
    insertIndex,
  ) {
    childrenSummaryInfoList.forEach((summaryInfo) => {
      const summaryData = summaryInfo.model.toJSON();
      summaryData.range = `(${summaryInfo.rangeStart + insertIndex},${
        summaryInfo.rangeEnd + insertIndex
      })`;
      const targetSummaryTopicModel = childrenSummaryTopicModelList.find(
        (summaryTopicModel) =>
          summaryTopicModel.getId() === summaryData.topicId,
      );
      const newSummaryTopicModel = Object(parseTopic)(
        targetSummaryTopicModel.toJSON(),
        this._context.getSheetView().model,
      );
      parentTopicModel.addSummary(summaryData, false, newSummaryTopicModel);
    });
  }
  reRangeParentBoundaryList(
    parentTopicModel /*Model.TopicModel*/,
    parentBoundaryInfoList,
    insertedChildrenCount,
    insertIndex,
  ) {
    parentBoundaryInfoList.forEach((boundaryInfo) => {
      const rangeStart = boundaryInfo.rangeStart;
      const rangeEnd = boundaryInfo.rangeEnd;
      const newRangeStart =
        rangeStart <= insertIndex
          ? rangeStart
          : rangeStart + insertedChildrenCount - 1;
      const newRangeEnd =
        rangeEnd >= insertIndex
          ? rangeEnd + insertedChildrenCount - 1
          : rangeEnd;
      const newRange = `(${newRangeStart},${newRangeEnd})`;
      const boundaryData = boundaryInfo.model.toJSON();
      boundaryData.range = newRange;
      parentTopicModel.addBoundary(boundaryData);
    });
  }
  reRangeParentSummaryList(
    parentTopicModel /*Model.TopicModel*/,
    parentSummaryInfoList,
    parentSummaryTopicModelList,
    insertedChildrenCount,
    insertIndex,
  ) {
    parentSummaryInfoList.forEach((summaryInfo) => {
      const rangeStart = summaryInfo.rangeStart;
      const rangeEnd = summaryInfo.rangeEnd;
      const newRangeStart =
        rangeStart <= insertIndex
          ? rangeStart
          : rangeStart + insertedChildrenCount - 1;
      const newRangeEnd =
        rangeEnd >= insertIndex
          ? rangeEnd + insertedChildrenCount - 1
          : rangeEnd;
      const summaryData = summaryInfo.model.toJSON();
      summaryData.range = `(${newRangeStart},${newRangeEnd})`;
      const targetSummaryTopicModel = parentSummaryTopicModelList.find(
        (summaryTopicModel) =>
          summaryTopicModel.getId() === summaryData.topicId,
      );
      const newSummaryTopicModel = Object(parseTopic)(
        targetSummaryTopicModel.toJSON(),
        this._context.getSheetView().model,
      );
      parentTopicModel.addSummary(summaryData, false, newSummaryTopicModel);
    });
  }
  rebuildRelationshipList(innerRelationshipModelList) {
    innerRelationshipModelList.forEach((relationshipModel) => {
      this._context
        .getSheetView()
        .model.addRelationship(relationshipModel.toJSON());
    });
  }
  selectNewChildrenBranchView(
    newParentBranchView /*View.BranchView*/,
    newChildrenTopicModelList,
  ) {
    const childrenBranchViewList = newParentBranchView
      .getChildrenBranchesByType()
      .filter((childBranchView) => {
        return newChildrenTopicModelList.includes(childBranchView.model);
      });
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.SELECT_SELECTION,
      {
        execute: () => {
          const selectionManager = newParentBranchView
            .getContext()
            .getModule(MODULE_NAME.SELECTION);
          childrenBranchViewList.forEach((childBranchView) => {
            selectionManager.addSelection(childBranchView);
          });
        },
      },
    );
  }
  queryStatus({ targets = [] }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    if (
      targets.length !== 1 ||
      Object(js_utils.isRootBranch)(targets[0]) ||
      Object(js_utils.isDetachedBranch)(targets[0])
    ) {
      return ACTION_STATUS.DISABLE;
    } else {
      return ACTION_STATUS.NORMAL;
    }
  }
}
