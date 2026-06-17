import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeImageAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_IMAGE;
  }
  doExecute({ imageData, targets = [], flipAndRotateRecord }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    let imageSrc = "";
    let width = null;
    let height = null;
    if (typeof imageData === "string") {
      imageSrc = imageData;
    } else if (typeof imageData === "object") {
      imageSrc = imageData.src;
      width = imageData.width;
      height = imageData.height;
    }
    if (imageSrc) {
      const currImageData: { src: string; width?: number; height?: number } = {
        src: imageSrc,
      };
      if (width) {
        currImageData.width = width;
      }
      if (height) {
        currImageData.height = height;
      }
      targets.forEach((target) => {
        const model =
          target.type === VIEW_TYPE.BRANCH
            ? target.model
            : target.parent().model;
        const imageModel = model.getImageModel();
        if (!imageModel || !imageModel.getSrc()) {
          return;
        }
        imageModel.changeImageData(currImageData, flipAndRotateRecord || []);
      });
    }
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
