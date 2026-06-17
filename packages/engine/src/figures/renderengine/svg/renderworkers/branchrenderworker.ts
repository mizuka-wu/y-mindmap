import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";
export class BranchRenderWorker {
  figure: any;
  svg: any;
  s$connectionMask: any;
  s$maskRegion: any;
  s$cutRegion: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "branch");
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.positionDirty) {
      const realPosition = Object.assign({}, this.figure.position);
      this.svg.translate(realPosition.x, realPosition.y);
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
    if (this.figure.sizeDirty) {
      this.figure.sizeDirty = false;
    }
    if (this.figure.opacityDirty) {
      this.svg.attr("opacity", this.figure.opacity);
      this.figure.opacityDirty = false;
    }
    if (this.figure.connectionMasked) {
      this.addConnectionMask();
      this.updateConnectionMaskClipPath();
    } else {
      this.removeConnectionMask();
    }
    if (this.figure.connectionMaskDirty && this.figure.connectionMasked) {
      this.updateConnectionMaskClipPath();
      this.figure.connectionMaskDirty = false;
    }
    parentFigure.renderWorker.appendChild("branch", this.svg);
  }
  appendChild(type, childNode, options) {
    const sheetView = this.figure.viewController.sheetView;
    if (!sheetView) {
      return;
    }
    const sheetRenderWorker = sheetView.figure.renderWorker;
    switch (type) {
      case "branch":
      case "connection":
      case "connectionmask":
      case "boundary":
      case "selectbox":
      case "topicselectbox":
      case "treetablecell":
      case "fishboneheadline":
      case "fishbonemainline":
        sheetRenderWorker.appendChild(type, childNode, options);
        break;
      case "topic":
      case "collapseextend":
      // case "fishbonemainline":
      // eslint-disable-next-line no-fallthrough
      case "timelinemainline":
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode);
        }
        break;
      default:
        break;
    }
  }
  getContent() {
    return this.svg;
  }
  addConnectionMask() {
    if (this.s$connectionMask) {
      return;
    }
    const svgView = this.figure.viewController.getContext().getSVGView();
    this.s$connectionMask = svgView.svg.mask();
    this.s$connectionMask.attr({
      maskUnits: "userSpaceOnUse",
      x: "-1000%",
      y: "-1000%",
      width: "2000%",
      height: "2000%",
    });
    this.s$maskRegion = new lib.SVG.Rect().attr({
      fill: "white",
      x: "-1000%",
      y: "-1000%",
      width: "2000%",
      height: "2000%",
    });
    this.s$cutRegion = new lib.SVG.Path().attr({
      fill: "black",
    });
    this.s$connectionMask.add(this.s$maskRegion);
    this.s$connectionMask.add(this.s$cutRegion);
    this.figure
      .getParent()
      .renderWorker.appendChild("connectionmask", this.s$connectionMask, {
        connectionSubContainerId: this.figure.viewController.model.getId(),
      });
  }
  updateConnectionMaskClipPath() {
    const maskClipAttr = Object(utils.getMaskAttr)(this.figure.viewController);
    this.s$cutRegion.attr(maskClipAttr);
  }
  removeConnectionMask() {
    if (this.s$connectionMask) {
      this.s$connectionMask.remove();
      this.s$connectionMask = null;
    }
  }
  dispose() {
    this.removeConnectionMask();
    this.svg.remove();
  }
}
