import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";
export class AddCalloutTopicAction extends BaseAction {
  constructor(context: any) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_CALLOUT_TOPIC;
  }
  doExecute({ topicData, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets
      .filter((view) => view.type === VIEW_TYPE.BRANCH)
      .filter((view) => view.model.type() !== TOPIC_TYPE.CALLOUT)
      .filter((view) => !view.isCentralBranch())
      .filter((view) => {
        // 若已存在 callout，则不再添加
        const calloutChildrenList = view.getChildrenBranchesByType(
          TOPIC_TYPE.CALLOUT,
        );
        return calloutChildrenList.length === 0;
      });
    targets.forEach((target) => {
      const model = target.model;
      const topic = topicData
        ? model.createTopic(topicData)
        : model.ownerSheet().createComponent("topic", {
            title: this._context.getTranslatedText(
              "DEFAULT_CALLOUT_TOPIC_TITLE",
            ),
          });
      topic.set("titleUnedited", true);
      model.addChildTopic(topic, {
        type: TOPIC_TYPE.CALLOUT,
      });
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets
      .filter((view: any) => view.type === VIEW_TYPE.BRANCH)
      .filter((view: any) => view.model.type() !== TOPIC_TYPE.CALLOUT)
      .filter((view: any) => !view.isCentralBranch())
      .filter((view: any) => !Object(js_utils.isTreeTableCell)(view))
      .filter((view: any) => {
        // 若已存在 callout，则不再添加
        const calloutChildrenList = view.getChildrenBranchesByType(
          TOPIC_TYPE.CALLOUT,
        );
        return calloutChildrenList.length === 0;
      });
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
