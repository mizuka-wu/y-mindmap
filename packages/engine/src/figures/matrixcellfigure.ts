import Figure from "./figure";

export class MatrixCellFigure extends Figure {
  fillColor: any;
  fillColorDirty: boolean;
  borderWidth: any;
  borderWidthDirty: boolean;
  borderColor: any;
  borderColorDirty: boolean;
  constructor(viewController) {
    super(viewController);
  }
  /** @public */
  setFillColor(fillColor) {
    if (this.fillColor !== fillColor) {
      this.fillColor = fillColor;
      this.fillColorDirty = true;
      this.invalidatePaint();
    }
  }
  /** @public */
  setBorderWidth(borderWidth) {
    if (this.borderWidth !== borderWidth) {
      this.borderWidth = borderWidth;
      this.borderWidthDirty = true;
      this.invalidatePaint();
    }
  }
  /** @public */
  setBorderColor(borderColor) {
    if (this.borderColor !== borderColor) {
      this.borderColor = borderColor;
      this.borderColorDirty = true;
      this.invalidatePaint();
    }
  }
}
