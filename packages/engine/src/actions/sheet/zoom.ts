import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ZoomAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ZOOM;
  }
  doExecute({ scale, isAnimation }: any = {}) {
    if (scale !== undefined) {
      this._context.getSVGView().setScale(scale, isAnimation);
    }
  }
}
