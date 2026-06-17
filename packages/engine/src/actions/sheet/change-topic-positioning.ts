import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeTopicPositioningAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_TOPIC_POSITIONING;
  }
  /**
   * @description 改变Sheet的FreePosition设定，这里的命名有些问题
   * @param {string} value - "free" or "fixed"
   */
  doExecute({ value }: any = {}) {
    this._context.model.toggleFreePosition(value === "free");
  }
}
