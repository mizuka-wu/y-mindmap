import * as lib from "../../../../lib/index";

const CIRCLE_RADIUS = 5;
export class TimelineMainLineRenderWorker {
  figure: any;
  s$svg: any;
  s$line: any;
  s$steps: any;
  constructor(figure) {
    this.figure = figure;
    this.s$svg = new lib.SVG.G().data("name", "timeline-main-line-group");
    this.s$line = this.s$svg.put(
      new lib.SVG.Path().data("name", "timeline-main-line"),
    );
    this.s$steps = this.s$svg.put(
      new lib.SVG.G().data("name", "timeline-main-line-steps-group"),
    );
    this.figure
      .getParent()
      .renderWorker.appendChild("timelinemainline", this.s$svg);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.s$svg.show();
      } else {
        this.s$svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.startPosition && this.figure.endPosition) {
      const { x: x1, y: y1 } = this.figure.startPosition;
      const { x: x2, y: y2 } = this.figure.endPosition;
      const d = `M ${x1}, ${y1} L ${x2}, ${y2}`;
      this.s$line.attr("d", d);
    }
    if (this.figure.lineStepPointsDirty) {
      this.s$steps.clear();
      this.figure.lineStepPoints.forEach(({ x, y }) => {
        const circle = new lib.SVG.Ellipse();
        circle.data("name", "timeline-main-line-step").attr({
          cx: x,
          cy: y,
          rx: CIRCLE_RADIUS,
          ry: CIRCLE_RADIUS,
          fill: this.figure.lineColor,
        });
        this.s$steps.put(circle);
      });
      this.figure.lineStepPointsDirty = false;
    }
    if (this.figure.lineColorDirty) {
      this.s$line.attr("stroke", this.figure.lineColor);
      this.s$steps.children().forEach((step) =>
        step.attr({
          fill: this.figure.lineColor,
        }),
      );
      this.figure.lineColorDirty = false;
    }
    if (this.figure.linePatternDirty) {
      const linecap = this.figure.linePattern["stroke-linecap"];
      const dasharray = this.figure.linePattern["stroke-dasharray"];
      this.s$line.attr("stroke-linecap", linecap ?? "butt");
      this.s$line.attr("stroke-dasharray", dasharray ?? "none");
      this.figure.lineColorDirty = false;
    }
    this.s$line.attr("stroke-width", this.figure.lineWidth);
  }
  appendChild() {}
  dispose() {
    this.s$svg.remove();
  }
  getContent() {
    return this.s$line;
  }
}
