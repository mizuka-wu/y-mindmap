import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class InsertHrefOnNewTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.INSERT_HREF_ON_NEW_TOPIC;
  }
  doExecute({ link, title = "", targets = [] }: any = {}) {
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
      model.addChildTopic(
        model.createEmptyTopic({
          href: link,
          title,
          titleUnedited: true,
        }),
      );
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
