import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class AddSubTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_SUB_TOPIC;
  }
  /**
   * @param options.isTitleEdited {bool}
   * */
  doExecute(
    { topicData, options = {}, targets = [] }: any = {
      options: {},
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    targets.forEach((target) => {
      const model = target.model;
      const opt = Object.assign({}, options);
      if (!topicData) {
        model.addChildTopic(
          model.createEmptyTopic({
            title: target.getChildDefaultTitle(),
            titleUnedited: !opt.isTitleEdited,
          }),
          opt,
        );
      } else {
        topicData.titleUnedited = !opt.isTitleEdited;
        model.addChildTopic(model.createTopic(topicData), opt);
      }
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
