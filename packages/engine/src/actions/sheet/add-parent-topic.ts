import * as lazyrunner from "../../figures/lazyrunner/index";

import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

export class AddParentTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_PARENT_TOPIC;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view: any) =>
        view.type === VIEW_TYPE.BRANCH &&
        view.model.type() !== TOPIC_TYPE.CALLOUT,
    );
    const parent = this.findCommonParent(targets);
    const branchType = targets[0].model.type();
    this.mergeTopics(parent, targets, branchType);
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        view.model.type() !== TOPIC_TYPE.CALLOUT,
    );
    if (!targets || targets.length < 1) {
      return ACTION_STATUS.DISABLE;
    }
    const parent = this.findCommonParent(targets);
    if (parent) {
      //Show Branch Only mode
      const atBranchView = this._context.getSheetView().activatedTopBranchView;
      if (atBranchView && targets.includes(atBranchView)) {
        return ACTION_STATUS.DISABLE;
      }
      const branchType = targets[0].model.type();
      if (
        branchType === TOPIC_TYPE.SUMMARY ||
        !targets.every((branch) => branch.model.type() === branchType)
      ) {
        return ACTION_STATUS.DISABLE;
      }
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  findCommonParent(branches) {
    const parent = branches[0].parent();
    const isAllDetached = branches.every((branch) => branch.isDetachedBranch());
    const hasSameParent = branches.every(
      (branch) => branch.isAttachedBranch() && branch.parent() === parent,
    );
    if (isAllDetached || hasSameParent) {
      return parent;
    } else {
      return undefined;
    }
  }
  mergeTopics(parent, branches, type) {
    const subBranches = [...branches].sort(
      (a, b) => a.branchIndex() - b.branchIndex(),
    );
    const parentModel = parent.model;
    const newIndex = subBranches[0].branchIndex();
    const oldTopics = subBranches.map((topic) => topic.model);
    this._rebuildRelationshipsAfterLayout(subBranches);
    //Set isStartDrag to true, to prevent select any other branch when currently selected branches are removed.(New selection will cause viewport auto moving)
    // oldTopics.forEach(topic => topic.removeSelf({isStartDrag: true}));
    const SM = parent.getContext().getModule(MODULE_NAME.SELECTION);
    SM.disable();
    oldTopics.forEach((topic) => topic.removeSelf());
    SM.enable();
    let newTopic;
    if (type === TOPIC_TYPE.ATTACHED) {
      newTopic = parentModel.createEmptyTopic({
        title: parent.getChildDefaultTitle(),
        titleUnedited: true,
      });
      parentModel.addChildTopic(newTopic, {
        at: newIndex,
        noAnimation: true,
      });
    } else {
      newTopic = parentModel.createEmptyTopic({
        title: this._context.getTranslatedText("DEFAULT_FLOATING_TOPIC_TITLE"),
        titleUnedited: true,
      });
      newTopic.set(
        "position",
        Object.assign({}, subBranches[0].model.get("position")),
      );
      parentModel.addChildTopic(newTopic, {
        type,
        noAnimation: true,
      });
    }
    oldTopics.forEach((topic) => {
      newTopic.addChildTopic(topic, {
        noAnimation: true,
      });
    });
    lazyrunner.lazyRunner.work(lazyrunner.runnerConstants.PRIORITY.AFTER_EACH, {
      execute: () => {
        SM.selectSingle(this._context.getComponentViewById(newTopic.id));
      },
    });
  }
  /**
   * Relationships will be deleted while related topic
   * has been removed. So we need rebuild it manually
   * after new parent topic inserted.
   */
  _rebuildRelationshipsAfterLayout(branches) {
    const topicIdSet = new Set(branches.map((topic) => topic.model.id));
    const sheet = branches[0].model.ownerSheet();
    const relationshipsWillDelete = sheet
      .relationships()
      .filter(
        (rel) =>
          topicIdSet.has(rel.get("end1Id")) ||
          topicIdSet.has(rel.get("end2Id")),
      );
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.AFTER_LAYOUT,
      {
        execute: () => {
          relationshipsWillDelete.forEach((rel) => {
            sheet.addRelationship(rel.toJSON());
          });
        },
      },
    );
  }
}
