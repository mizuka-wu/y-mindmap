import Figure from "./figure";
import * as commonUtils from "../common/utils/index";

import { layoutConstant } from "../utils/layoutconstant";

export class MathJaxFigure extends Figure {
  originalSize: { width: number; height: number };
  align: string;
  errorCode: number;
  errorMessage: string;
  text: any;
  textDirty: boolean;
  SVGOutput: any;
  SVGOutputDirty: boolean;
  finalWidth: any;
  alignDirty: boolean;
  textColor: any;
  textColorDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.originalSize = {
      width: 0,
      height: 0,
    };
    this.align = "top";
    this.errorCode = 0;
    this.errorMessage = "";
  }
  setText(text) {
    if (this.text !== text) {
      this.text = text;
      this.textDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setSVGOutput(SVGOutput) {
    if (SVGOutput) {
      this.SVGOutput = SVGOutput;
      this.SVGOutputDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setOriginalSize(originalSize) {
    const newSizeDirty =
      !this.originalSize ||
      !Object(commonUtils.isSameSize)(this.originalSize, originalSize);
    if (!newSizeDirty) {
      return;
    }
    this.originalSize = Object.assign({}, originalSize);
    if (!this.finalWidth) {
      this.setFinalWidth(originalSize.width);
    }
    this.invalidateLayout();
    this.invalidatePaint();
  }
  setFinalWidth(finalWidth) {
    if (this.finalWidth !== finalWidth) {
      this.finalWidth = Math.min(layoutConstant.MATH_JAX_MAX_WIDTH, finalWidth);
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setAlign(align) {
    if (this.align !== align) {
      this.align = align;
      this.alignDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setTextColor(textColor) {
    if (this.textColor !== textColor) {
      this.textColor = textColor;
      this.textColorDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setErrorCode(errorCode) {
    if (this.errorCode !== errorCode) {
      this.errorCode = errorCode;
    }
  }
  setErrorMessage(errorMessage) {
    if (this.errorMessage !== errorMessage) {
      this.errorMessage = errorMessage;
    }
  }
}
