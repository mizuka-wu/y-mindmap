import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

const branchFilter = (view) => view.type === VIEW_TYPE.BRANCH;
export class AddImageAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_IMAGE;
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
    targets = targets.filter(branchFilter);
    let imageSrc;
    let width;
    let height;
    if (typeof imageInfo === "string") {
      imageSrc = imageInfo;
    } else if (typeof imageInfo === "object") {
      imageSrc = imageInfo.src;
      width = imageInfo.width;
      height = imageInfo.height;
    }
    if (imageSrc) {
      const imageData: any = {
        src: imageSrc,
      };
      if (width) {
        imageData.width = width;
      }
      if (height) {
        imageData.height = height;
      }
      targets.forEach((view) => {
        view.model.addImage(Object.assign({}, imageData));
      });
    }
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(branchFilter);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
