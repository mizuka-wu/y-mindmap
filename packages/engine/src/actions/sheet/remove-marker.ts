import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class RemoveMarkerAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_MARKER;
  }
  /**
   * remove all markers of certain group
   */
  doExecute({ markerId, targets = [] }: any = {}) {
    if (!markerId) {
      return;
    }
    this.getFilterBranchViewList(targets).forEach((target) => {
      target.model.removeMarker(markerId);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (this.getFilterBranchViewList(targets).length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
