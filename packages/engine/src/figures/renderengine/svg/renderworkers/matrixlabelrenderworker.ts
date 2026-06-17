import { FIGURE_TYPE } from "../../../../common/constants/index";

import * as lib from "../../../../lib/index";
import { TitleRenderWorker } from "./titlerenderworker";

export class MatrixLabelRenderWorker extends TitleRenderWorker {
  constructor(figure) {
    super(figure);
    this.figure = figure;
    this.svg = new lib.SVG.G();
    this.svg.add(this.titleText);
    this.figure.viewController.setElement(this.svg.node);
  }
  getContent() {
    return this.svg;
  }
  work() {
    super.work();
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    const matrixRenderWorker = parentFigure.renderWorker;
    matrixRenderWorker.appendChild(FIGURE_TYPE.MATRIX_LABEL, this.svg);
  }
  dispose() {
    this.svg.remove();
  }
}
