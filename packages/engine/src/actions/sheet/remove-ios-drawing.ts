import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class RemoveIOSDrawingAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_IOS_DRAWING;
  }
  doExecute({ targets = [], iOSDrawingData }: any) {
    targets = this.getFilterBranchViewList(targets);
    const centralTopicModel = this._context
      .getSheetView()
      .getCentralBranchView().model;
    centralTopicModel.updateIOSDrawing(iOSDrawingData);
    // update target's image source
    targets.forEach((branchView) => {
      branchView.model.removeImage();
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
}
