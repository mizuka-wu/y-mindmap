import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeTopicOverlapAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_TOPIC_OVERLAP;
  }
  /**
   * @param {string} value - "overlap" or "none"
   */
  doExecute({ value }: any = {}) {
    this._context.model.changeOverlap(value);
  }
}
