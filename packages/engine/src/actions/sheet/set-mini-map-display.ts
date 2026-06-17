import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class SetMiniMapDisplayAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_MINI_MAP_DISPLAY;
  }
  /**
   * @description 切换minimap的显示与隐藏
   * @param {bool} [show] show or hide minimap
   * @param {Object} [options]
   * @param {string} [options.wrapperClassName]
   */
  doExecute({ show, options }: any = {}) {
    const miniMap = this._context.getModule(MODULE_NAME.MINI_MAP);
    if (miniMap) {
      miniMap.setMiniMapDisplay(
        this._context,
        show,
        Object.assign({}, options),
      );
    }
  }
}
