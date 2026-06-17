import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class PreAddFloatingTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.PRE_ADD_FLOATING_TOPIC;
  }
  /**
   * @description 触发此方法之后，鼠标在sheet画布上所在位置会出现一个跟随的半透明floating topic
   */
  doExecute() {
    const preAddFloatingTopicModule = this._context.getModule(
      MODULE_NAME.PRE_ADD_FLOATING_TOPIC,
    );
    // 若正处于鼠标移动状态，返回
    if (preAddFloatingTopicModule.status.movingMouse) {
      return;
    }
    preAddFloatingTopicModule.startProcess(this._context);
  }
}
