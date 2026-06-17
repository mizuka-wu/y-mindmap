import { FIGURE_TYPE } from "../../../../common/constants/index";

import * as lib from "../../../../lib/index";

export class MatrixRenderWorker {
  figure: any;
  svg: any;
  _s$cells: any;
  constructor(figure) {
    this.figure = figure;
    this._initSVGStructure();
  }
  /** @private */
  _initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "matrix-group");
    this._s$cells = new lib.SVG.G().data("name", "matrix-cells-group");
    this.svg.put(this._s$cells);
    this.figure.viewController.setElement(this.svg.node);
  }
  getContent() {
    return this.svg;
  }
  getCells() {
    return this._s$cells;
  }
  dispose() {
    this.svg.remove();
  }
  work() {
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.opacityDirty) {
      this.svg.attr("opacity", this.figure.opacity);
      this.figure.opacityDirty = false;
    }
  }
  appendChild(type, childNode) {
    switch (type) {
      case FIGURE_TYPE.MATRIX_LABEL:
      case FIGURE_TYPE.MATRIX_PLUS: {
        if (this.svg !== childNode.parent) {
          this.svg.add(childNode);
        }
        break;
      }
      case FIGURE_TYPE.MATRIX_CELL: {
        if (this._s$cells !== childNode.parent) {
          this._s$cells.add(childNode);
        }
        break;
      }
    }
  }
}
