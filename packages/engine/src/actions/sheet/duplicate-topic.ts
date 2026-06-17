import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";

import { parseTopic } from "../../utils/business/parsetopic";
import mommonFuncs from "../../mommonfuncs";

export class DuplicateTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.DUPLICATE_TOPIC;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = Object(js_utils.filterMultiSelectedBranches)(targets, [
      CLASS_TYPE.SUMMARY_TOPIC,
      CLASS_TYPE.CENTRAL_TOPIC,
    ]);
    targets.forEach((target) => {
      const index = target.branchIndex();
      const topicModel = JSON.parse(JSON.stringify(target.model.toJSON()));
      mommonFuncs.replaceId(topicModel, () => {
        return target.model.ownerSheet().generateComponentId();
      });
      if (target.model.type() === TOPIC_TYPE.DETACHED) {
        topicModel.position.y += target.topicView.bounds.height + 20;
      }
      target.model
        .parent()
        .addChildTopic(
          Object(parseTopic)(topicModel, target.model.ownerSheet()),
          {
            at: index + 1,
            type: target.model.type(),
            sourceIndex: index,
          },
        );
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets
      .filter((view) => view.type === VIEW_TYPE.BRANCH)
      .filter((view) => !view.isCentralBranch())
      .filter((view) => !view.isSummaryBranch());
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
