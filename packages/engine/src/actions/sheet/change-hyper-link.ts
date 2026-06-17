import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeHyperLinkAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_HYPER_LINK;
  }
  doExecute({ link, targets = [] }: any = {}) {
    const filterTargets = this.getFilterBranchViewList(targets);
    filterTargets.forEach((target) => {
      target.model.changeHref(link);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  getFilterBranchViewList(targets) {
    return super.getFilterBranchViewList(targets).filter((branchView) => {
      return !branchView.model.getAudioNotes();
    });
  }
}
