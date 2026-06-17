import Figure from "./figure";
import * as utils from "../utils/index";

export class SelectBoxFigure extends Figure {
  transparent: boolean;
  transparentDirty: boolean;
  selectBoxAttrs: any;
  selectBoxAttrsToPack: any;
  selectBoxAttrsDirty: boolean;
  selectBoxOneAttrs: any;
  selectBoxOneAttrsToPack: any;
  selectBoxOneAttrsDirty: boolean;
  selectBoxTwoAttrs: any;
  selectBoxTwoAttrsToPack: any;
  selectBoxTwoAttrsDirty: boolean;
  dragHandlerAreaOneAttrs: any;
  dragHandlerAreaOneAttrsToPack: any;
  dragHandlerAreaOneAttrsDirty: boolean;
  dragHandlerAreaTwoAttrs: any;
  dragHandlerAreaTwoAttrsToPack: any;
  dragHandlerAreaTwoAttrsDirty: boolean;
  addTitleButtonAttrs: any;
  addTitleButtonAttrsToPack: any;
  addTitleButtonAttrsDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.transparent = false;
    this.transparentDirty = false;
    this.selectBoxAttrs = {};
    this.selectBoxAttrsToPack = {};
    this.selectBoxAttrsDirty = false;
    this.selectBoxOneAttrs = {};
    this.selectBoxOneAttrsToPack = {};
    this.selectBoxOneAttrsDirty = false;
    this.selectBoxTwoAttrs = {};
    this.selectBoxTwoAttrsToPack = {};
    this.selectBoxTwoAttrsDirty = false;
    this.dragHandlerAreaOneAttrs = {};
    this.dragHandlerAreaOneAttrsToPack = {};
    this.dragHandlerAreaOneAttrsDirty = false;
    this.dragHandlerAreaTwoAttrs = {};
    this.dragHandlerAreaTwoAttrsToPack = {};
    this.dragHandlerAreaTwoAttrsDirty = false;
    this.addTitleButtonAttrs = {};
    this.addTitleButtonAttrsToPack = {};
    this.addTitleButtonAttrsDirty = false;
    this.isVisible = false;
  }
  setTransparent(transparent) {
    if (this.transparent !== transparent) {
      this.transparent = transparent;
      this.transparentDirty = true;
      this.invalidatePaint();
    }
  }
  setSelectBoxAttrs(attrs) {
    const dr = utils.subtract(this.selectBoxAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.selectBoxAttrsDirty = true;
      Object.assign(this.selectBoxAttrs, dr);
      Object.assign(this.selectBoxAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setSelectBoxOneAttrs(attrs) {
    const dr = utils.subtract(this.selectBoxOneAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.selectBoxOneAttrsDirty = true;
      Object.assign(this.selectBoxOneAttrs, dr);
      Object.assign(this.selectBoxOneAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setSelectBoxTwoAttrs(attrs) {
    const dr = utils.subtract(this.selectBoxTwoAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.selectBoxTwoAttrsDirty = true;
      Object.assign(this.selectBoxTwoAttrs, dr);
      Object.assign(this.selectBoxTwoAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setDragHandlerAreaOneAttrs(attrs) {
    const dr = utils.subtract(this.dragHandlerAreaOneAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.dragHandlerAreaOneAttrsDirty = true;
      Object.assign(this.dragHandlerAreaOneAttrs, dr);
      Object.assign(this.dragHandlerAreaOneAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setDragHandlerAreaTwoAttrs(attrs) {
    const dr = utils.subtract(this.dragHandlerAreaTwoAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.dragHandlerAreaTwoAttrsDirty = true;
      Object.assign(this.dragHandlerAreaTwoAttrs, dr);
      Object.assign(this.dragHandlerAreaTwoAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setAddTitleButtonAttrs(attrs) {
    const dr = utils.subtract(this.addTitleButtonAttrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.addTitleButtonAttrsDirty = true;
      Object.assign(this.addTitleButtonAttrs, dr);
      Object.assign(this.addTitleButtonAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
}
