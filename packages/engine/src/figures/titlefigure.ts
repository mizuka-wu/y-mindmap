import Figure from "./figure";

import * as utils from "../utils/index";
import * as commonUtils from "../common/utils/index";

import { makeObservable, observable, action } from "mobx";
export class TitleFigure extends Figure {
  textColor: string;
  textColorDirty: boolean;
  attrs: any;
  attrsToPack: any;
  textPosition: { x: number; y: number };
  textSize: { width: number; height: number };
  textDecoration: any;
  textDecorationDirty: boolean;
  textAlign: any;
  textAlignDirty: boolean;
  textTransform: any;
  textTransformDirty: boolean;
  fontSize: any;
  fontSizeDirty: boolean;
  fontWeight: any;
  fontWeightDirty: boolean;
  fontStyle: any;
  fontStyleDirty: boolean;
  fontFamily: any;
  fontFamilyDirty: boolean;
  text: any;
  textDirty: boolean;
  textFnDirty: boolean;
  textFn: any;
  attrsDirty: boolean;
  textPositionDirty: boolean;
  textSizeDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.textColor = "";
    this.textColorDirty = true;
    this.attrs = {};
    this.attrsToPack = {};
    this.textPosition = {
      x: 0,
      y: 0,
    };
    this.textSize = {
      width: 0,
      height: 0,
    };
    makeObservable(this, {
      textColor: observable,
      setTextColor: action,
    });
  }
  setTextColor(textColor) {
    if (this.textColor !== textColor) {
      this.textColor = textColor;
      this.textColorDirty = true;
      this.invalidatePaint();
    }
  }
  setTextDecoration(textDecoration) {
    if (this.textDecoration !== textDecoration) {
      this.textDecoration = textDecoration;
      this.textDecorationDirty = true;
      this.invalidatePaint();
    }
  }
  setTextAlign(textAlign) {
    if (this.textAlign !== textAlign) {
      this.textAlign = textAlign;
      this.textAlignDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setTextTransform(textTransform) {
    if (this.textTransform !== textTransform) {
      this.textTransform = textTransform;
      this.textTransformDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setFontSize(fontSize) {
    fontSize = parseInt(`${fontSize}`);
    if (this.fontSize !== fontSize) {
      this.fontSize = fontSize;
      this.fontSizeDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setFontWeight(fontWeight) {
    if (this.fontWeight !== fontWeight) {
      this.fontWeight = fontWeight;
      this.fontWeightDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setFontStyle(fontStyle) {
    if (this.fontStyle !== fontStyle) {
      this.fontStyle = fontStyle;
      this.fontStyleDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setFontFamily(fontFamily) {
    if (this.fontFamily !== fontFamily) {
      this.fontFamily = fontFamily;
      this.fontFamilyDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setText(text) {
    if (this.text !== text) {
      this.textDirty = true;
      this.text = text;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setTextFn(textFn) {
    this.textFnDirty = true;
    this.textFn = textFn;
    this.invalidateLayout();
    this.invalidatePaint();
  }
  attr(attrs) {
    const dr = utils.subtract(this.attrs, attrs);
    if (Object.keys(dr).length > 0) {
      this.attrsDirty = true;
      Object.assign(this.attrs, dr);
      Object.assign(this.attrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setTextPosition(textPosition) {
    const newPositionDirty =
      !this.textPosition ||
      this.textPosition.x !== textPosition.x ||
      this.textPosition.y !== textPosition.y;
    if (newPositionDirty) {
      this.textPositionDirty = newPositionDirty;
    }
    this.textPosition = Object.assign({}, textPosition);
    if (this.textPositionDirty) {
      this.invalidatePaint();
    }
  }
  setTextSize(textSize) {
    const newSizeDirty =
      !this.textSize ||
      !Object(commonUtils.isSameSize)(this.textSize, textSize);
    if (newSizeDirty) {
      this.textSizeDirty = newSizeDirty;
    }
    this.textSize = Object.assign({}, textSize);
    if (this.textSizeDirty) {
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
}

export default TitleFigure;
