/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_DETACHED,
} from "../../common/constants/index";
import BaseAction from "../action";
import { TopicAlignment } from "../../utils/business/topicalignment";

export class DivideAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.DIVIDE;
  }
  /**
   * @param direction - 'horizon'|'vertical'
   */
  doExecute({ direction, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const topicAlignment = new TopicAlignment();
    topicAlignment.divide(direction, targets);
  }
  queryStatus({ direction, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    // 选取两个以上 floating topic, 忽略多余的选中
    if (targets.length < 3) {
      return ACTION_STATUS.DISABLE;
    }
    let floatingCnt = 0;
    for (let i = 0; i < targets.length; i++) {
      const view = targets[i];
      if (
        view.type === VIEW_TYPE.BRANCH &&
        view.model.type() === TOPIC_DETACHED
      ) {
        floatingCnt++;
      }
    }
    if (floatingCnt >= 3) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
