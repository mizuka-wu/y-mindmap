import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeMarkerAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_MARKER;
  }
  /**
   * @param {string} markerId
   * @param {BranchView} [targets] - target.type === VIEW_TYPE.BRANCH
   */
  doExecute({ markerId, targets = [] }: any = {}) {
    if (!markerId) {
      return;
    }
    this.getFilterBranchViewList(targets).forEach((target) => {
      target.model.changeMarker(markerId);
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
