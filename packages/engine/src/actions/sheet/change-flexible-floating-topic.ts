import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class change_flexible_floating_topic_ChangeFlexibleFloatingTopic extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_FLOATING_TOPIC_FLEXIBLE;
  }
  /**
   * @description 改变 Sheet 的 FlexibleFloatingTopic 设定
   * @param {string} value - "flex" or "sticky"
   */
  doExecute({ value }) {
    switch (value) {
      case "flex":
        this._context.model.toggleFloatingTopicFlexible(true);
        break;
      case "sticky":
        this._context.model.toggleFloatingTopicFlexible(false);
        break;
    }
  }
}
