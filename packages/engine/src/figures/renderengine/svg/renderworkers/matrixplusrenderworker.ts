import { FIGURE_TYPE } from "../../../../common/constants/index";
import { layoutConstant } from "../../../../utils/layoutconstant";

import * as lib from "../../../../lib/index";

const FILL_COLOR = "rgb(94, 187, 254)";
const SYMBOL_GAP = 5;
const RADIUS = layoutConstant.MATRIX_PLUS_RADIUS;
export class MatrixPlusRenderWorker {
  figure: any;
  svg: any;
  constructor(figure) {
    this.figure = figure;
    this._initSVGStructure();
  }
  _initSVGStructure() {
    this.svg = new lib.SVG.G().style("cursor", "pointer").attr({
      "data-name": "matrix-plus-box",
    });
    this.svg.circle(RADIUS * 2).fill(FILL_COLOR);
    this.svg.circle(RADIUS * 2).attr({
      fill: "none",
      stroke: "#fff",
    });
    const innerPathD = `M ${SYMBOL_GAP},${RADIUS} L${
      RADIUS * 2 - SYMBOL_GAP
    },${RADIUS}M ${RADIUS},${SYMBOL_GAP} L${RADIUS},${RADIUS * 2 - SYMBOL_GAP}`;
    this.svg.put(
      new lib.SVG.Path().attr({
        d: innerPathD,
        stroke: "#fff",
        "stroke-linecap": "round",
      }),
    );
    // 扩大的点击相应区域
    this.svg
      .circle(RADIUS * 4)
      .fill("none")
      .x(-RADIUS)
      .y(-RADIUS)
      .style({
        pointerEvents: "visible",
      });
    const matrixPlusView = this.figure.viewController;
    const { x, y } = matrixPlusView.bounds;
    this.svg.translate(x, y).hide();
    matrixPlusView.setElement(this.svg.node);
  }
  getContent() {
    return this.svg;
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.visibleDirty) {
      if (this.figure.visible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.visibleDirty = false;
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
    matrixRenderWorker.appendChild(FIGURE_TYPE.MATRIX_PLUS, this.svg);
  }
  dispose() {
    this.svg.remove();
  }
}
