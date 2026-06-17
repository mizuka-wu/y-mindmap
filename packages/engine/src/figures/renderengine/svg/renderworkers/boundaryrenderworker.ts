import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";
import { boundaryshapes } from "../shapes/boundaryshapes";

export class BoundaryRenderWorker {
  figure: any;
  svg: any;
  boundaryPath: any;
  boundaryFillPath: any;
  boundaryActionPath: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data("name", "boundary-group");
    this.boundaryPath = new lib.SVG.Path()
      .data("name", "boundary-path")
      .attr("fill", "none");
    this.boundaryFillPath = new lib.SVG.Path().data(
      "name",
      "boundary-fill-path",
    );
    this.boundaryActionPath = new lib.SVG.Path()
      .data("name", "boundary-action-path")
      .attr("pointer-events", "fill");
    this.svg
      .add(this.boundaryPath)
      .add(this.boundaryFillPath)
      .add(this.boundaryActionPath);
    this.figure.viewController.setElement(this.svg.node);
    this.figure.viewController.style(
      this.boundaryActionPath,
      "boundaryActionPath",
    );
    this.svg.hide();
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.lineColorDirty) {
      this.boundaryPath.attr({
        stroke: this.figure.lineColor,
      });
      this.figure.lineColorDirty = false;
    }
    if (this.figure.fillOpacityDirty) {
      this.boundaryFillPath.attr({
        "fill-opacity": this.figure.fillOpacity,
      });
      this.figure.fillOpacityDirty = false;
    }
    if (this.figure.borderWidthDirty) {
      this.boundaryPath.attr({
        "stroke-width": this.figure.borderWidth,
      });
      this.boundaryActionPath.attr({
        "stroke-width": this.figure.borderWidth + 5,
      });
      this.figure.borderWidthDirty = false;
    }
    if (this.figure.linePatternDirty) {
      this.updateBoundaryLinePatten();
      this.figure.linePatternDirty = false;
    }
    if (this.figure.fillColorDirty) {
      let fillColor = this.figure.fillColor;
      const boundaryView = this.figure.viewController;
      const isGradient = boundaryView.editDomain().content().isGradient();
      if (isGradient) {
        const gradient = boundaryView
          .parent()
          .svg.gradient("linear", (stop) => {
            stop.at(0, "#fff");
            stop.at(1, this.figure.fillColor);
          });
        gradient.from(0, 0).to(0, 1);
        fillColor = gradient;
      }
      this.boundaryFillPath.attr({
        fill: fillColor,
        stroke: "none",
        opacity: 1,
      });
      this.figure.fillColorDirty = false;
    }
    // todo shape size dirty
    if (
      this.figure.shapeClassDirty ||
      this.figure.sizeDirty ||
      this.figure.boundaryShapeSizeDirty ||
      this.figure.positionDirty
    ) {
      boundaryshapes(this.figure.shapeClass)(
        this.figure.viewController,
        this.figure.boundaryShapeSize,
      );
      this.figure.shapeClassDirty = false;
      this.figure.sizeDirty = false;
      this.figure.boundaryShapeSizeDirty = false;
      const { position } = this.figure;
      this.svg.translate(position.x, position.y);
      this.figure.positionDirty = false;
    }
    if (this.figure.boundaryPathDirty) {
      this.updateBoundaryLinePatten();
      this.updateBoundaryBG();
      this.figure.boundaryPathDirty = false;
    }
    if (this.figure.fillPatternDirty) {
      this.updateBoundaryBG();
      this.figure.fillPatternDirty = false;
    }
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
    parentFigure.renderWorker.appendChild("boundary", this.svg);
  }
  updateBoundaryLinePatten() {
    const attr = Object(utils.getComplexLinePatternAttr)(
      this.figure.linePattern,
      {
        linePath: this.figure.boundaryPath,
        lineWidth: this.figure.borderWidth,
        isBoundary: true,
      },
    );
    this.boundaryPath.attr(attr);
    this.boundaryActionPath.attr({
      d: attr.d,
    });
  }
  updateBoundaryBG() {
    const attr = Object(utils.getFillPatternAttr)(this.figure.fillPattern, {
      fillPath: this.figure.boundaryFillPath,
      isForceHandDrawnSolid: true,
    });
    this.boundaryFillPath.attr(attr).back();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    const branchView = this.figure.viewController.parent();
    if (!branchView) {
      return;
    }
    const branchRenderWorker = branchView.figure.renderWorker;
    switch (type) {
      case "selectbox":
        branchRenderWorker.appendChild("selectbox", childNode);
        break;
      case "title":
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
  dispose() {
    this.svg.remove();
  }
}
