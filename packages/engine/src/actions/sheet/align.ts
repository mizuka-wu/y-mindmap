import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_DETACHED,
} from "../../common/constants/index";
import BaseAction from "../action";
import { TopicAlignment } from "../../utils/business/topicalignment";

export class AlignAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ALIGN;
  }
  /**
   * @param direction - {top|middle|bottom|left|center|right}
   */
  doExecute({ direction, targets }: any) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const topicAlignment = new TopicAlignment();
    topicAlignment.align(direction, targets);
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    // requirement: 选中两个及以上 topic, 并且至少有一个 floating topic
    if (targets.length < 2) {
      return ACTION_STATUS.DISABLE;
    } else if (targets.some((target) => target.type !== VIEW_TYPE.BRANCH)) {
      return ACTION_STATUS.DISABLE;
    } else if (
      targets.some((target) => target.model.type() === TOPIC_DETACHED)
    ) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
