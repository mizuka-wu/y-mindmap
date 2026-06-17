import * as lib from "../../../../lib/index";

export class MarkerRenderWorker {
  figure: any;
  svg: any;
  s$Select: any;
  s$Icon: any;
  s$Border: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G();
    this.s$Select = new lib.SVG.Path();
    this.s$Icon = new lib.SVG.Image();
    this.svg.add(this.s$Select);
    this.svg.add(this.s$Icon);
    this.s$Border = new lib.SVG.Ellipse().fill("none").stroke("#fff");
    this.svg.add(this.s$Border);
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.iconUrlDirty) {
      this.s$Icon.load(this.figure.iconUrl);
      this.figure.iconUrlDirty = false;
    }
    if (this.figure.sizeDirty) {
      const iconSize = this.figure.size.width;
      this.s$Icon.size(iconSize, iconSize);
      this.s$Border
        .size(iconSize + 1, iconSize + 1)
        .cx(iconSize / 2)
        .cy(iconSize / 2);
      this.figure.sizeDirty = false;
      const borderWidth = iconSize / 12;
      this.s$Border.attr("stroke-width", borderWidth);
    }
    if (this.figure.needToForward) {
      this.svg.forward();
      this.figure.needToForward = false;
    }
    if (this.figure.needToBackward) {
      this.svg.backward();
      this.figure.needToBackward = false;
    }
    if (this.figure.selectionAttrDirty) {
      this.s$Select.attr(this.figure.selectionAttrToPack);
      this.figure.selectionAttrToPack = {};
      this.figure.selectionAttrDirty = false;
    }
    if (this.figure.positionDirty) {
      this.svg.x(this.figure.position.x).y(this.figure.position.y);
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
    parentFigure.renderWorker.appendChild("marker", this.svg);
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
