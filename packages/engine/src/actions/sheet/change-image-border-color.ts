import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeImageBorderColorAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_IMAGE_BORDER_COLOR;
  }
  /**
   * @param {Array} targets
   * @param {String} borderColor
   **/
  doExecute({ targets = [], borderColor }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    if (typeof borderColor !== "string") {
      return;
    }
    targets.forEach((target) => {
      const model =
        target.type === VIEW_TYPE.BRANCH ? target.model : target.parent().model;
      const imageModel = model.getImageModel();
      if (!imageModel || !imageModel.getSrc()) {
        return;
      }
      imageModel.changeBorderColor(borderColor);
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
