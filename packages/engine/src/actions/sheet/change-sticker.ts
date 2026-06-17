import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

const change_sticker_branchFilter = (view) => view.type === VIEW_TYPE.BRANCH;
export class ChangeStickerAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_STICKER;
  }
  /**
   * @param {string | Object} imageInfo
   * @param {string} imageInfo.src
   * @param {number} imageInfo.width
   * @param {number} imageInfo.height
   * @param {Array} targets
   **/
  doExecute({ imageInfo, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(change_sticker_branchFilter);
    targets.forEach((target) => {
      const imageModel = target.model.getImageModel();
      if (!imageModel || !imageModel.getSrc()) {
        this._context.execAction(ACTION_NAMES.ADD_IMAGE, {
          imageInfo: imageInfo,
          targets: [target],
          prue: true,
        });
      } else {
        this._context.execAction(ACTION_NAMES.CHANGE_IMAGE, {
          imageData: imageInfo,
          targets: [target],
          prue: true,
        });
      }
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(change_sticker_branchFilter);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
