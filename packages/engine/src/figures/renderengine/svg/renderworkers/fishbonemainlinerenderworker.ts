import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

// start position is near branch, end position is near head line
function calcMainLineTaperedPath({ startPosition, endPosition, lineWidth }) {
  const p0 = Object.assign({}, startPosition);
  const p3 = Object.assign({}, endPosition);
  const p1 = {
    x: p0.x - lineWidth / 2,
    y: p0.y,
  };
  const p2 = {
    x: p3.x - lineWidth * 2,
    y: p3.y,
  };
  const p4 = {
    x: p3.x + lineWidth * 2,
    y: p3.y,
  };
  const p5 = {
    x: p0.x + lineWidth / 2,
    y: p0.y,
  };
  return `M ${p0.x} ${p0.y} ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} L ${p5.x} ${p5.y} Z`;
}
function calcMainLinePath({ startPosition, endPosition, lineWidth }) {
  const toRight = startPosition.x > endPosition.x;
  const toTop = startPosition.y < endPosition.y;
  const halfLineWidth = lineWidth / 2;
  const dx = Math.pow(Math.cos(Math.PI / 6), 2) * halfLineWidth;
  const dy =
    Math.sin(Math.PI / 6) *
    Math.cos(Math.PI / 6) *
    halfLineWidth *
    (toRight ? -1 : 1);
  const p1 = {
    x: startPosition.x - dx,
    y: startPosition.y + (toTop ? dy : -dy),
  };
  const p2 = {
    x: endPosition.x - halfLineWidth,
    y: endPosition.y,
  };
  const p3 = {
    x: endPosition.x + halfLineWidth,
    y: endPosition.y,
  };
  const p4 = {
    x: startPosition.x + dx,
    y: startPosition.y + (toTop ? -dy : dy),
  };
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
}
function calcHandDrawnMainLinePath({ startPosition, endPosition, lineWidth }) {
  const halfLineWidth = lineWidth / 2;
  const p0 = Object.assign({}, startPosition);
  const p3 = Object.assign({}, endPosition);
  const p1 = {
    x: p0.x - halfLineWidth,
    y: p0.y,
  };
  const p2 = {
    x: p3.x - halfLineWidth,
    y: p3.y,
  };
  const p4 = {
    x: p3.x + halfLineWidth,
    y: p3.y,
  };
  const p5 = {
    x: p0.x + halfLineWidth,
    y: p0.y,
  };
  return `M ${p0.x} ${p0.y} ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} L ${p5.x} ${p5.y}`;
}
function calcMarkerLinePath({ startPosition, endPosition }) {
  return `M ${endPosition.x} ${endPosition.y} L ${startPosition.x} ${startPosition.y}`;
}
export class FishBoneMainLineRenderWorker {
  figure: any;
  s$svg: any;
  s$fishBoneLine: any;
  s$fishBoneMarkerLine: any;
  constructor(figure) {
    this.figure = figure;
    this.s$svg = new lib.SVG.G().data("name", "fish-bone-main-line");
    this.s$fishBoneLine = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "line");
    this.s$fishBoneMarkerLine = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "marker-line");
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
    const lineInfo = {
      startPosition: this.figure.startPosition,
      endPosition: this.figure.endPosition,
      lineWidth: this.figure.styleWidth,
    };
    let d = "";
    if (this.figure.lineTapered) {
      d = calcMainLineTaperedPath(lineInfo);
    } else if (Object(utils.isHandDrawnLinePattern)(this.figure.linePattern)) {
      d = calcHandDrawnMainLinePath(lineInfo);
    } else {
      d = calcMainLinePath(lineInfo);
    }
    this.s$fishBoneMarkerLine.attr({
      d: calcMarkerLinePath(lineInfo),
      "stroke-width": this.figure.styleWidth,
    });
    this.s$fishBoneLine.attr(
      utils.getComplexLinePatternAttr(this.figure.linePattern, {
        linePath: d,
        lineWidth: this.figure.styleWidth,
        lineColor: this.figure.lineColor,
        isTaperedLine: this.figure.lineTapered,
        isFishboneMainbone: true,
        startBranchPosition: lineInfo.startPosition,
        endBranchPosition: lineInfo.endPosition,
      })
    );
    parentFigure.renderWorker.appendChild("fishbonemainline", this.s$svg, {
      fishBoneHeadBranchViewId: this.figure.viewController
        .parent()
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
