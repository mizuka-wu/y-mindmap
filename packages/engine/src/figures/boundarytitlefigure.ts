import { TitleFigure } from "./titlefigure";
export class BoundaryTitleFigure extends TitleFigure {
  fillPattern: any;
  fillPatternDirty: boolean;
  bgFillColor: any;
  bgFillColorDirty: boolean;
  setFillPattern(fillPattern) {
    if (this.fillPattern !== fillPattern) {
      this.fillPattern = fillPattern;
      this.fillPatternDirty = true;
      this.invalidatePaint();
    }
  }
  setBoundaryTitleBGFillColor(bgFillColor) {
    if (this.bgFillColor !== bgFillColor) {
      this.bgFillColor = bgFillColor;
      this.bgFillColorDirty = true;
      this.invalidatePaint();
    }
  }
  setVisible(isVisible, paintOrLayout) {
    super.setVisible(isVisible, paintOrLayout);
    if (this.isVisibleDirty) {
      this.viewController.parent().figure.invalidateLayout();
    }
  }
}
