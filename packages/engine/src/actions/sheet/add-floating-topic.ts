import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class AddFloatingTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_FLOATING_TOPIC;
  }
  /**
   * @param {position} clientPosition 相对于当前视口左上角的位置
   */
  doExecute({ clientPosition }: any = {}) {
    const svgView = this._context.getSVGView();
    svgView.createFloatingTopic(clientPosition);
  }
  queryStatus({ clientPosition }: any = {}) {
    const sheetView = this._context.getSheetView();
    if (sheetView.activatedTopBranchView) {
      return ACTION_STATUS.DISABLE;
    }
    if (clientPosition && clientPosition.x && clientPosition.y) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
