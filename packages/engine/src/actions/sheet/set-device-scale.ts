import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class SetDeviceScaleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_DEVICE_SCALE;
  }
  //For brownie.
  doExecute({ scale }: any = {}) {
    this._context.getSVGView().setDeviceNativeScale(scale);
  }
}
