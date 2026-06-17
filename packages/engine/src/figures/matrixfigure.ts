import Figure from "./figure";

export class MatrixFigure extends Figure {
  labelInfo: any[];
  constructor(viewController) {
    super(viewController);
    this.labelInfo = [];
  }
  setLabelInfo(labelInfo) {
    this.labelInfo = labelInfo;
  }
}
