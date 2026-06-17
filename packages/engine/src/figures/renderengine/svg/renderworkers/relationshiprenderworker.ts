import { RELATIONSHIPSHAPE } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";
import { getRelationshipLineType } from "../../../../render/relationshiplinetype";

const draggableCursorStyle = "cursor:crosshair;cursor:-webkit-grab;";
//Constants used for rendering.
const rectWidth = 4;
const rectHeight = 4;
const startPointR = 4;
const controlLineWidth = 2;
const shadowControlPointAttr = {
  rx: 20,
  ry: 20,
  fill: "transparent",
  x: 0,
  y: 0,
};
export class RelationshipRenderWorker {
  figure: any;
  svg: any;
  path: any;
  actionPath: any;
  s$shadowActionPath: any;
  controlPointGroup: any;
  controlLine1: any;
  startPoint1Package: any;
  startPoint1: any;
  controlPoint1Package: any;
  controlPoint1: any;
  controlLine2: any;
  startPoint2Package: any;
  startPoint2: any;
  controlPoint2Package: any;
  controlPoint2: any;
  relationshipTitleMaskPath: any;
  relationshipTitleMask: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "relationship");
    this.figure.viewController.setElement(this.svg.node);
    this.path = this.svg
      .put(new lib.SVG.Path())
      .data("name", "relationship-path");
    this.figure.viewController.style(this.path, "relationship");
    this.actionPath = this.svg
      .put(new lib.SVG.Path())
      .data("name", "relationship-action-path");
    this.figure.viewController.style(this.actionPath, "actionPath");
    this.s$shadowActionPath = this.svg
      .put(new lib.SVG.Path())
      .data("name", "relationship-shadow-action-path");
    this.figure.viewController.style(
      this.s$shadowActionPath,
      "relationshipShadowAction",
    );
    this.controlPointGroup = this.svg
      .put(new lib.SVG.G())
      .data("name", "controlPoint-group");
    // Control line 1
    this.controlLine1 = this.controlPointGroup
      .put(new lib.SVG.Path())
      .data("name", "controlLine-1");
    // Start Point 1
    this.startPoint1Package = this.controlPointGroup
      .put(new lib.SVG.G())
      .data("name", "startPoint-1-package")
      .attr("style", draggableCursorStyle);
    this.startPoint1 = this.startPoint1Package
      .put(new lib.SVG.Ellipse())
      .data("name", "startPoint-1")
      .attr("style", draggableCursorStyle);
    const extendShadowStartPoint1 = new lib.SVG.Ellipse()
      .data("name", "shadow-startPoint-1")
      .attr(shadowControlPointAttr);
    this.startPoint1Package.put(extendShadowStartPoint1);
    // Control Point 1
    this.controlPoint1Package = this.controlPointGroup
      .put(new lib.SVG.G())
      .data("name", "controlPoint-1-package")
      .attr("style", draggableCursorStyle);
    this.controlPoint1 = this.controlPoint1Package
      .put(new lib.SVG.Rect())
      .data("name", "controlPoint-1");
    const extendShadowControlPoint1 = new lib.SVG.Ellipse()
      .data("name", "shadow-controlPoint-1")
      .attr(shadowControlPointAttr);
    this.controlPoint1Package.put(extendShadowControlPoint1);
    // Control line 2
    this.controlLine2 = this.controlPointGroup
      .put(new lib.SVG.Path())
      .data("name", "controlLine-2");
    // Start Point 2
    this.startPoint2Package = this.controlPointGroup
      .put(new lib.SVG.G())
      .data("name", "startPoint-2-package")
      .attr("style", draggableCursorStyle);
    this.startPoint2 = this.startPoint2Package
      .put(new lib.SVG.Ellipse())
      .data("name", "startPoint-2")
      .attr("style", draggableCursorStyle);
    const extendShadowStartPoint2 = new lib.SVG.Ellipse()
      .data("name", "shadow-startPoint-2")
      .attr(shadowControlPointAttr);
    this.startPoint2Package.put(extendShadowStartPoint2);
    // Control Point 2
    this.controlPoint2Package = this.controlPointGroup
      .put(new lib.SVG.G())
      .data("name", "controlPoint-2-package")
      .attr("style", draggableCursorStyle);
    this.controlPoint2 = this.controlPoint2Package
      .put(new lib.SVG.Rect())
      .data("name", "controlPoint-2");
    const extendShadowControlPoint2 = new lib.SVG.Ellipse()
      .data("name", "shadow-controlPoint-2")
      .attr(shadowControlPointAttr);
    this.controlPoint2Package.put(extendShadowControlPoint2);
    this.relationshipTitleMaskPath = new lib.SVG.Path().attr({
      fill: "black",
      "clip-rule": "evenodd",
    });
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    const svgView = this.figure.viewController.editDomain();
    if (!this.relationshipTitleMask) {
      this.relationshipTitleMask = svgView.svg.clip();
    }
    if (
      svgView &&
      this.relationshipTitleMaskPath.parent !== this.relationshipTitleMask
    ) {
      this.relationshipTitleMask.add(this.relationshipTitleMaskPath);
      this.relationshipTitleMask.hide();
      this.path.clipWith(this.relationshipTitleMask);
    }
    if (this.figure.relationshipMaskDirty) {
      this.relationshipTitleMaskPath.attr({
        d: this.figure.relationshipMaskD,
      });
      this.figure.relationshipMaskDirty = false;
    }
    if (this.figure.maskVisibleDirty) {
      if (this.figure.maskVisible) {
        this.relationshipTitleMask.show();
      } else {
        this.relationshipTitleMask.hide();
      }
      this.figure.maskVisibleDirty = false;
    }
    if (this.figure.lineStyleDirty) {
      const {
        controlHandlerLine1,
        controlHandlerPoint1,
        controlHandlerLine2,
        controlHandlerPoint2,
      } = getRelationshipLineType(
        this.figure.lineStyle,
      ).getControlHandlerDisplayStatus();
      if (controlHandlerLine1) {
        this.controlLine1.show();
      } else {
        this.controlLine1.hide();
      }
      if (controlHandlerPoint1) {
        this.controlPoint1Package.show();
      } else {
        this.controlPoint1Package.hide();
      }
      if (controlHandlerLine2) {
        this.controlLine2.show();
      } else {
        this.controlLine2.hide();
      }
      if (controlHandlerPoint2) {
        this.controlPoint2Package.show();
      } else {
        this.controlPoint2Package.hide();
      }
      this.figure.lineStyleDirty = false;
    }
    if (this.figure.lineColorDirty) {
      this.path.attr({
        stroke: this.figure.lineColor,
      });
      this.figure.lineColorDirty = false;
    }
    if (this.figure.lineWidthDirty) {
      this.path.attr({
        "stroke-width": this.figure.lineWidth,
      });
      const actionWidth = this.figure.lineWidth + 5;
      this.actionPath.attr({
        "stroke-width": actionWidth,
      });
      const shadowActionWidth = actionWidth + 5;
      this.s$shadowActionPath.attr({
        "stroke-width": shadowActionWidth,
      });
      this.figure.lineWidthDirty = false;
    }
    if (this.figure.linePatternDirty) {
      this.updateLinePattern();
      this.figure.linePatternDirty = false;
    }
    if (this.figure.posInfoDirty) {
      this._forPos(this.figure.posInfo);
      if (this.figure.lineStyle === RELATIONSHIPSHAPE.ZIGZAG) {
        this.updateZigzagControlPointPosition();
      } else {
        this.resetControlPointPosition();
      }
      this.figure.posInfoDirty = false;
    }
    if (this.figure.relationshipPathDirty) {
      this.updateLinePattern();
      this.figure.relationshipPathDirty = false;
    }
    if (this.figure.controlLine1PathDirty) {
      const controlLine1Path = this.figure.controlLine1Path;
      this.controlLine1.attr({
        d: controlLine1Path,
      });
      this.figure.controlLine1PathDirty = false;
    }
    if (this.figure.controlLine2PathDirty) {
      const controlLine2Path = this.figure.controlLine2Path;
      this.controlLine2.attr({
        d: controlLine2Path,
      });
      this.figure.controlLine2PathDirty = false;
    }
    if (this.figure.startPoint1RadiusDirty) {
      this.startPoint1.attr({
        rx: this.figure.startPoint1Radius.rx,
        ry: this.figure.startPoint1Radius.ry,
      });
      this.figure.startPoint1RadiusDirty = false;
    }
    if (this.figure.startPoint2RadiusDirty) {
      this.startPoint2.attr({
        rx: this.figure.startPoint2Radius.rx,
        ry: this.figure.startPoint2Radius.ry,
      });
      this.figure.startPoint2RadiusDirty = false;
    }
    if (this.figure.controlPoint1RadiusDirty) {
      this.controlPoint1.attr({
        x: -this.figure.controlPoint1Radius.rx,
        y: -this.figure.controlPoint1Radius.ry,
        width: this.figure.controlPoint1Radius.rx * 2,
        height: this.figure.controlPoint1Radius.ry * 2,
      });
      this.figure.controlPoint1RadiusDirty = false;
    }
    if (this.figure.controlPoint2RadiusDirty) {
      this.controlPoint2.attr({
        x: -this.figure.controlPoint2Radius.rx,
        y: -this.figure.controlPoint2Radius.ry,
        width: this.figure.controlPoint2Radius.rx * 2,
        height: this.figure.controlPoint2Radius.ry * 2,
      });
      this.figure.controlPoint2RadiusDirty = false;
    }
    if (this.figure.controlPointGroupVisibleDirty) {
      if (this.figure.controlPointGroupVisible) {
        this.controlPointGroup.show();
      } else {
        this.controlPointGroup.hide();
      }
      this.figure.controlPointGroupVisibleDirty = false;
    }
    if (this.figure.pointerEventsNoneDirty) {
      if (this.figure.pointerEventsNone) {
        this.svg.style("pointer-events", "none");
      } else {
        this.svg.style("pointer-events", "auto");
      }
      this.figure.pointerEventsNoneDirty = false;
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
    parentFigure.renderWorker.appendChild("relationship", this.svg);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    switch (type) {
      case "title":
        if (childNode.parent !== this.svg) {
          const i = this.svg
            .children()
            .findIndex((child) => child === this.controlPointGroup);
          this.svg.add(childNode, i);
        }
        break;
      default:
        break;
    }
  }
  getContent() {
    return this.svg;
  }
  updateLinePattern() {
    const attr = Object(utils.getComplexLinePatternAttr)(
      this.figure.linePattern,
      {
        lineWidth: this.figure.lineWidth,
        linePath: this.figure.relationshipPath,
      },
    );
    this.path.attr(attr);
    this.actionPath.attr("d", attr.d);
    this.s$shadowActionPath.attr("d", attr.d);
  }
  updateZigzagControlPointPosition() {
    const { insectPoint1, insectPoint2, controlPoint1, controlPoint2 } =
      this.figure.posInfo;
    const { scp, tcp } = Object(getRelationshipLineType)(
      RELATIONSHIPSHAPE.ZIGZAG,
    ).calcPathParams(insectPoint1, insectPoint2, controlPoint1, controlPoint2);
    this.controlPoint1Package.translate(scp.x, scp.y);
    this.controlPoint2Package.translate(tcp.x, tcp.y);
  }
  resetControlPointPosition() {
    const { controlPoint1, controlPoint2 } = this.figure.posInfo;
    this.controlPoint1Package.translate(controlPoint1.x, controlPoint1.y);
    this.controlPoint2Package.translate(controlPoint2.x, controlPoint2.y);
  }
  dispose() {
    if (this.relationshipTitleMask) {
      this.relationshipTitleMask.remove();
      this.relationshipTitleMask = null;
    }
    this.svg.remove();
  }
  _forPos(posInfo) {
    const { insectPoint1, insectPoint2, controlPoint1, controlPoint2 } =
      posInfo;
    this.controlPoint1.attr({
      width: rectWidth * 2,
      height: rectHeight * 2,
      x: -rectWidth,
      y: -rectWidth,
      "stroke-width": 2,
    });
    this.figure.viewController.style(this.controlPoint1, "controlPoint");
    this.controlPoint1Package.translate(controlPoint1.x, controlPoint1.y);
    this.controlPoint2.attr({
      width: rectWidth * 2,
      height: rectHeight * 2,
      x: -rectWidth,
      y: -rectWidth,
      "stroke-width": 2,
    });
    this.figure.viewController.style(this.controlPoint2, "controlPoint");
    this.controlPoint2Package.translate(controlPoint2.x, controlPoint2.y);
    this.startPoint1.attr({
      rx: startPointR,
      ry: startPointR,
      "stroke-width": 1,
    });
    this.figure.viewController.style(this.startPoint1, "controlPoint");
    this.startPoint1Package.translate(insectPoint1.x, insectPoint1.y);
    this.startPoint2.attr({
      rx: startPointR,
      ry: startPointR,
      "stroke-width": 1,
    });
    this.figure.viewController.style(this.startPoint2, "controlPoint");
    this.startPoint2Package.translate(insectPoint2.x, insectPoint2.y);
    const controlLine1Path =
      "M " +
      insectPoint1.x +
      " " +
      insectPoint1.y +
      "L " +
      controlPoint1.x +
      " " +
      controlPoint1.y;
    this.controlLine1.attr({
      d: controlLine1Path,
      "stroke-width": controlLineWidth,
    });
    this.figure.viewController.style(this.controlLine1, "holder");
    const controlLine2Path =
      "M " +
      insectPoint2.x +
      " " +
      insectPoint2.y +
      "L " +
      controlPoint2.x +
      " " +
      controlPoint2.y;
    this.controlLine2.attr({
      d: controlLine2Path,
      "stroke-width": controlLineWidth,
    });
    this.figure.viewController.style(this.controlLine2, "holder");
    Object(getRelationshipLineType)(this.figure.lineStyle).updatePath(
      this.figure.viewController,
      insectPoint1,
      insectPoint2,
      controlPoint1,
      controlPoint2,
    );
  }
}
