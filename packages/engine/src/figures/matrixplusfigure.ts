import Figure from "./figure";

export class MatrixPlusFigure extends Figure {
  visible: boolean;
  visibleDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.visible = false;
  }
  setVisible(visible) {
    if (this.visible !== visible) {
      this.visible = visible;
      this.visibleDirty = true;
      this.invalidatePaint();
    }
  }
}
