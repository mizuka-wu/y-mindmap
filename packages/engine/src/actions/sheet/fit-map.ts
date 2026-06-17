import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

/**
 * 使map缩放至视口范围内
 */
export class FitMapAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.FIT_MAP;
  }
  doExecute() {
    this._context.getSVGView().getCanvasControl().fitMap();
  }
}
