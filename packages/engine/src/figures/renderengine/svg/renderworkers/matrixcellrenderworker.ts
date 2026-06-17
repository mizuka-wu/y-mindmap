import { FIGURE_TYPE } from "../../../../common/constants/index";

import * as lib from "../../../../lib/index";

const SELECT_STROKE_WIDTH = 4;
const SELECT_COLOR = "rgb(94, 187, 254)";
export class MatrixCellRenderWorker {
  figure: any;
  svg: any;
  _s$borderPath: any;
  _s$fillPath: any;
  _s$selectedPath: any;
  constructor(figure) {
    this.figure = figure;
    this._initSVGStructure();
  }
  /** @private */
  _initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "matrix-cell");
    const cellView = this.figure.viewController;
    const { x, y, width, height } = cellView.bounds;
    const d0 = `M 0 0 l ${width} 0 l 0 ${height} l ${-width} 0 Z`;
    this._s$borderPath = new lib.SVG.Path()
      .data("name", "matrix-cell-border-path")
      .attr({
        d: d0,
        fill: "none",
      });
    this._s$fillPath = new lib.SVG.Path()
      .data("name", "matrix-cell-fill-path")
      .attr({
        d: d0,
      });
    // 如果将 selectedPath 放在 matrixView
    // 则不需要在 hover 考虑 cellViews 之间的前后关系
    // 但是这样做的话，却会导致 hover cellView 的边框的时候触发鬼畜现象
    // 因为 selectedPath 放在 matrixView 代表它不属于 cellView 的了
    this._s$selectedPath = new lib.SVG.Path().attr({
      d: d0,
      display: "none",
      fill: "none",
      stroke: SELECT_COLOR,
      "data-name": "cell-select-box",
      "stroke-width": SELECT_STROKE_WIDTH,
    });
    this.svg
      .add(this._s$fillPath)
      .add(this._s$borderPath)
      .add(this._s$selectedPath);
    this.svg.translate(x, y);
    this.figure.viewController.setElement(this.svg.node);
  }
  getContent() {
    return this.svg;
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.fillColorDirty) {
      const color = this.figure.fillColor;
      const fillColorAttr =
        color === "none"
          ? {
              opacity: 0,
            }
          : {
              opacity: 1,
              fill: color,
            };
      this._s$fillPath.attr(fillColorAttr);
      this.figure.fillColorDirty = false;
    }
    if (this.figure.borderWidthDirty) {
      this._s$borderPath.attr({
        "stroke-width": this.figure.borderWidth,
      });
      this.figure.borderWidthDirty = false;
    }
    if (this.figure.borderColorDirty) {
      this._s$borderPath.attr({
        stroke: this.figure.borderColor,
      });
      this.figure.borderColorDirty = false;
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
    matrixRenderWorker.appendChild(FIGURE_TYPE.MATRIX_CELL, this.svg);
  }
  dispose() {
    this.svg.remove();
  }
}
