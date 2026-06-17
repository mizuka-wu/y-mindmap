import * as lib from "../../../../lib/index";

export class LabelsRenderWorker {
  figure: any;
  svg: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data("name", "labels-card-group");
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.positionDirty) {
      this.svg.translate(this.figure.position.x, this.figure.position.y);
      this.figure.positionDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    parentFigure.renderWorker.appendChild("labels", this.svg);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    switch (type) {
      case "label":
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode);
        }
        break;
    }
  }
  getContent() {
    return this.svg;
  }
  dispose() {
    this.svg.remove();
  }
}
