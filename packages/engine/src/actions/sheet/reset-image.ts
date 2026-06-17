import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ResetImageAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.RESET_IMAGE;
  }
  /**
   * @param {Array} targets
   **/
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets.forEach((target) => {
      const model =
        target.type === VIEW_TYPE.BRANCH ? target.model : target.parent().model;
      const imageModel = model.getImageModel();
      if (!imageModel || !imageModel.getSrc()) {
        return;
      }
      imageModel.resize({
        width: undefined,
        height: undefined,
      });
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const isBranchOrImage = (view) =>
      view.type === VIEW_TYPE.BRANCH || view.type === VIEW_TYPE.IMAGE;
    if (targets.every(isBranchOrImage)) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
