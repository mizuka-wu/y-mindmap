import Figure from "./figure";
import * as utils from "../utils/index";

export class MarkerFigure extends Figure {
  selectionAttr: any;
  selectionAttrToPack: any;
  iconUrl: any;
  iconUrlDirty: boolean;
  needToForward: boolean;
  needToBackward: boolean;
  selectionAttrDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.selectionAttr = {};
    this.selectionAttrToPack = {};
  }
  setIconUrl(iconUrl) {
    if (this.iconUrl !== iconUrl) {
      this.iconUrl = iconUrl;
      this.iconUrlDirty = true;
      this.invalidateLayout();
    }
  }
  setNeedToForward() {
    this.needToForward = true;
  }
  setNeedToBackward() {
    this.needToBackward = true;
  }
  setSelectionArr(selectionAttr) {
    const dr = utils.subtract(this.selectionAttr, selectionAttr);
    if (Object.keys(dr).length > 0) {
      this.selectionAttrDirty = true;
      Object.assign(this.selectionAttr, dr);
      Object.assign(this.selectionAttrToPack, dr);
      this.invalidatePaint();
    }
  }
}
