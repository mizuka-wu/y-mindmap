import Figure from "./figure";
import * as utils from "../utils/index";

export class InformationFigure extends Figure {
  textAttr: any;
  textAttrToPack: any;
  selectionAttr: any;
  selectionAttrToPack: any;
  textContent: any;
  textContentDirty: boolean;
  textAttrDirty: boolean;
  selectionAttrDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.textAttr = {};
    this.textAttrToPack = {};
    this.selectionAttr = {};
    this.selectionAttrToPack = {};
  }
  setTextContent(textContent) {
    if (this.textContent !== textContent) {
      this.textContent = textContent;
      this.textContentDirty = true;
      this.invalidatePaint();
    }
  }
  setTextAttr(textAttr) {
    const dr = utils.subtract(this.textAttr, textAttr);
    if (Object.keys(dr).length > 0) {
      this.textAttrDirty = true;
      Object.assign(this.textAttr, dr);
      Object.assign(this.textAttrToPack, dr);
      this.invalidatePaint();
    }
  }
  setSelectionAttr(selectionAttr) {
    const dr = utils.subtract(this.selectionAttr, selectionAttr);
    if (Object.keys(dr).length > 0) {
      this.selectionAttrDirty = true;
      Object.assign(this.selectionAttr, dr);
      Object.assign(this.selectionAttrToPack, dr);
      this.invalidatePaint();
    }
  }
}
