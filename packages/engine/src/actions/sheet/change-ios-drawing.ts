import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeIOSDrawingAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_IOS_DRAWING;
  }
  doExecute({ targets = [], iOSDrawingData, imageSrc }) {
    targets = this.getFilterBranchViewList(targets);
    const centralTopicModel = this._context
      .getSheetView()
      .getCentralBranchView().model;
    centralTopicModel.updateIOSDrawing(iOSDrawingData);
    // update target's image source
    this._context.execAction(ACTION_NAMES.ADD_IMAGE, {
      imageInfo: imageSrc,
      targets,
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
