import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class SetTransformAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_TRANSFORM;
  }
  /**
   * @param {x: Number, y: Number, scaleX: Number, scaleY: Number} transfrom
   */
  doExecute({ transform }: any = {}) {
    this._context.getSVGView().container.transform(transform);
  }
}
