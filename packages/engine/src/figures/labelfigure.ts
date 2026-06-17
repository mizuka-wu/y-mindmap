import Figure from "./figure";
import * as utils from "../utils/index";

export class LabelFigure extends Figure {
  backgroudAttr: any;
  backgroudAttrToPack: any;
  textAttr: any;
  textAttrToPack: any;
  text: any;
  textDirty: boolean;
  tooltip: any;
  tooltipDirty: boolean;
  backgroudAttrDirty: boolean;
  textAttrDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.backgroudAttr = {};
    this.backgroudAttrToPack = {};
    this.textAttr = {};
    this.textAttrToPack = {};
  }
  setText(text) {
    if (this.text !== text) {
      this.text = text;
      this.textDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setTooltip(tooltip) {
    if (this.tooltip !== tooltip) {
      this.tooltip = tooltip;
      this.tooltipDirty = true;
      this.invalidatePaint();
    }
  }
  setBackgroudAttr(bgAttr) {
    const dr = utils.subtract(this.backgroudAttr, bgAttr);
    if (Object.keys(dr).length > 0) {
      this.backgroudAttrDirty = true;
      Object.assign(this.backgroudAttr, dr);
      Object.assign(this.backgroudAttrToPack, dr);
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
}
