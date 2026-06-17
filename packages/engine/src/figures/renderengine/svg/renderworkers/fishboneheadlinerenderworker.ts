import { DIRECTION } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

function calcHeadLineTaperedPath(bodyWidth, lineWidth, lineDiretion) {
  const isToRightMultiplicationParam =
    lineDiretion === DIRECTION.RIGHT ? 1 : -1;
  const p0 = {
    x: 0,
    y: -lineWidth * 2,
  };
  const p1 = {
    x: bodyWidth * isToRightMultiplicationParam,
    y: -lineWidth / 2,
  };
  const p2 = {
    x: p1.x,
    y: lineWidth / 2,
  };
  const p3 = {
    x: 0,
    y: lineWidth * 2,
  };
  return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`;
}
function calcHeadLinePath(bodyWidth, lineDiretion) {
  const isToRightMultiplicationParam =
    lineDiretion === DIRECTION.RIGHT ? 1 : -1;
  const p0 = {
    x: 0,
    y: 0,
  };
  const p1 = {
    x: bodyWidth * isToRightMultiplicationParam,
    y: 0,
  };
  return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
}
export class FishBoneHeadLineRenderWorker {
  figure: any;
  s$svg: any;
  s$fishBoneLine: any;
  constructor(figure) {
    this.figure = figure;
    this.s$svg = new lib.SVG.G().data("name", "fish-bone-head-line");
    this.s$fishBoneLine = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "line");
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    this.s$svg.attr("opacity", this.figure.opacity);
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.s$svg.show();
      } else {
        this.s$svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    let d;
    if (this.figure.lineTapered) {
      d = calcHeadLineTaperedPath(
        this.figure.bodyWidth,
        this.figure.styleWidth,
        this.figure.direction,
      );
    } else {
      d = calcHeadLinePath(this.figure.bodyWidth, this.figure.direction);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const useFill = this.figure.lineTapered;
    this.s$fishBoneLine.attr(
      Object(utils.getComplexLinePatternAttr)(this.figure.linePattern, {
        lineWidth: this.figure.styleWidth,
        linePath: d,
        lineColor: this.figure.lineColor,
        isTaperedLine: this.figure.lineTapered,
        isFishboneHeadbone: true,
      }),
    );
    // set position
    this.s$fishBoneLine.translate(
      this.figure.position.x,
      this.figure.position.y,
    );
    parentFigure.renderWorker.appendChild("fishboneheadline", this.s$svg, {
      fishBoneHeadBranchViewId: this.figure.viewController
        .parent()
        .model.getId(),
    });
  }
  appendChild() {}
  dispose() {
    this.s$svg.remove();
  }
  getContent() {
    return this.s$svg;
  }
}
