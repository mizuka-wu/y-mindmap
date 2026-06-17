import { TitleRenderWorker } from "./titlerenderworker";
export class RelationshipTitleRenderWorker extends TitleRenderWorker {
  constructor(figure) {
    super(figure);
    this.svg = this.titleText;
    this.titleText.data("name", "relationship-title").style({
      cursor: "default",
    });
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    super.work();
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.isDefaultTitleDirty) {
      this.svg.attr({
        "data-name": this.figure.isDefaultTitle
          ? "relationship-default-title"
          : "",
      });
      this.figure.isDefaultTitleDirty = false;
    }
    parentFigure.renderWorker.appendChild("title", this.svg);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {}
  getContent() {
    return this.svg;
  }
  dispose() {
    this.svg.remove();
  }
}
