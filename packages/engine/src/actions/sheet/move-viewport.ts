import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class MoveViewportAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.MOVE_VIEWPORT;
  }
  /**
   * @param {Number} deltaX - defalut 0
   * @param {Number} deltaY - default 0
   * @param {Object} option
   * @param {Boolean} option.animate - defalut false
   * @param {Function} option.finishToRun
   */
  doExecute({ deltaX = 0, deltaY = 0, option }: any = {}) {
    this._context
      .getModule(MODULE_NAME.MOVE_VIEW_PORT)
      .tryToMoveViewPort(deltaX, deltaY, option);
  }
}
