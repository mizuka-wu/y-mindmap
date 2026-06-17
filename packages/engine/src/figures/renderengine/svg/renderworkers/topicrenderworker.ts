import * as lib from "../../../../lib/index";
import * as utils from "../../../../utils/index";
import Util from "../../../../util";
import { patternConfigurations } from "../../../../utils/patternmanager/configurations";

export class TopicRenderWorker {
  figure: any;
  svg: any;
  topicShapeGroup: any;
  topicShapeShallowFill: any;
  topicShapeFill: any;
  topicShape: any;
  topicContent: any;
  s$topicInnerElementGroup: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "topic");
    this.topicShapeGroup = new lib.SVG.G().data("name", "topic-shape-group");
    this.topicShapeShallowFill = this.topicShapeGroup
      .put(this.protectedCreateTopicShapeFill())
      .data("name", "topic-shape-shallow-fill");
    this.topicShapeFill = this.topicShapeGroup
      .put(this.protectedCreateTopicShapeFill())
      .data("name", "topic-shape-fill");
    this.topicShape = this.topicShapeGroup
      .put(new lib.SVG.Path())
      .data("name", "topic-shape")
      .attr("fill", "none");
    this.topicContent = this.topicShapeGroup.put(
      new lib.SVG.G().data("name", "topic-content"),
    );
    this.s$topicInnerElementGroup = this.topicContent.put(
      new lib.SVG.G().data("name", "inner-element-group"),
    );
    this.svg.put(this.topicShapeGroup);
    this.figure.viewController.setElement(this.svg.node);
  }
  protectedCreateTopicShapeFill() {
    return new lib.SVG.Path();
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    const branch = this.figure.viewController.parent();
    const svgView = branch.editDomain();
    if (this.figure.topicShapeMaskDirty) {
      this.figure.topicShapeMaskDirty = false;
    }
    if (
      (svgView && this.figure.fillColorDirty) ||
      this.figure.fillGradientDirty ||
      this.figure.isGradientColorDirty
    ) {
      this.updateFillStyle();
      this.figure.fillColorDirty = false;
      this.figure.fillGradientDirty = false;
      this.figure.isGradientColorDirty = false;
    }
    // border line color
    if (this.figure.borderColorDirty) {
      this.topicShape.attr({
        fill: "none",
        stroke: this.figure.borderColor,
      });
      this.figure.borderColorDirty = false;
    }
    // border line width
    if (this.figure.borderWidthDirty) {
      this.topicShape.attr({
        "stroke-width": this.figure.borderWidth,
      });
      this.figure.borderWidthDirty = false;
    }
    if (this.figure.borderLinePatternDirty) {
      this.updateLineAttr();
      this.figure.borderLinePatternDirty = false;
    }
    if (this.figure.shapeClassDirty || this.figure.sizeDirty) {
      this.updateFillPattern();
      this.updateLineAttr();
      this.figure.shapeClassDirty = false;
      this.figure.sizeDirty = false;
    }
    if (this.figure.topicShapePathDirty) {
      this.updateLineAttr();
      this.figure.topicShapePathDirty = false;
    }
    if (this.figure.topicShapeFillPathDirty) {
      this.updateFillPattern();
      this.figure.topicShapeFillPathDirty = false;
    }
    if (this.figure.fillPatternDirty) {
      this.updateFillPattern();
      this.figure.fillPatternDirty = false;
    }
    if (this.figure.topicShapeGroupPositionDirty) {
      this.topicShapeGroup.translate(
        this.figure.topicShapeGroupPosition.x,
        this.figure.topicShapeGroupPosition.y,
      );
      this.figure.topicShapeGroupPositionDirty = false;
    }
    if (this.figure.topicContentPositionDirty) {
      this.topicContent.translate(
        this.figure.topicContentPosition.x,
        this.figure.topicContentPosition.y,
      );
      this.figure.topicContentPositionDirty = false;
    }
    if (this.figure.topicInnerElementPositionDirty) {
      this.s$topicInnerElementGroup.translate(
        this.figure.topicInnerElementPosition.x,
        this.figure.topicInnerElementPosition.y,
      );
      this.figure.topicInnerElementPositionDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    parentFigure.renderWorker.appendChild("topic", this.svg);
  }
  updateLineAttr() {
    this.topicShape.attr(
      Object(utils.getComplexLinePatternAttr)(this.figure.borderLinePattern, {
        lineWidth: this.figure.borderWidth,
        linePath: this.figure.topicShapePath,
        isBorderLinePatten: true,
        figure: this.figure,
      }),
    );
  }
  updateFillPattern() {
    const { topicShapeFillPath, fillPattern } = this.figure;
    const branch = this.figure.viewController.parent();
    const attr = Object(utils.getFillPatternAttr)(fillPattern, {
      fillPath: topicShapeFillPath,
      isForceHandDrawnSolid: branch.isCalloutBranch(),
    });
    this.topicShapeFill.attr(attr);
    this.updateFillStyle();
  }
  updateFillStyle() {
    const branch = this.figure.viewController.parent();
    const svgView = branch.editDomain();
    if (!svgView) {
      return;
    }
    const { fillPattern: fillPattern, fillColor, fillGradient } = this.figure;
    if (Object(utils.isNoneFillPattern)(fillPattern, fillColor)) {
      this.topicShapeFill.attr({
        opacity: 0,
      });
    } else if (
      Object(utils.isSolidFillPattern)(fillPattern) ||
      branch.isCalloutBranch()
    ) {
      Util.setFillColor(svgView, this.topicShapeFill, fillColor, fillGradient);
      this.topicShapeFill.attr({
        opacity: 1,
        stroke: "none",
        "stroke-width": 0,
      });
    } else {
      this.topicShapeFill.attr({
        opacity: 1,
        fill: "none",
        stroke: fillColor,
        "stroke-width":
          patternConfigurations.getCurrentHandDrawnDefaultFillWidth(
            fillPattern,
          ),
      });
    }
    this.figure.getParent().updateConnectionMask();
    this.topicShapeShallowFill.attr({
      d: this.figure.topicShapeFillPath,
      fill: "white",
      opacity: 0,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    let _a;
    switch (type) {
      case "collapseextend":
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode);
        }
        break;
      case "labels":
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode, 0);
        }
        break;
      case "title":
        if (childNode.parent !== this.s$topicInnerElementGroup) {
          this.s$topicInnerElementGroup.add(childNode);
        }
        break;
      case "numbering":
        if (childNode.parent !== this.s$topicInnerElementGroup) {
          this.s$topicInnerElementGroup.add(childNode);
        }
        break;
      case "image":
        if (childNode.parent !== this.topicContent) {
          this.topicContent.add(childNode);
        }
        break;
      case "mathjax":
        if (childNode.parent !== this.topicContent) {
          this.topicContent.add(childNode);
        }
        break;
      case "markers":
        if (childNode.parent !== this.s$topicInnerElementGroup) {
          this.s$topicInnerElementGroup.add(childNode);
        }
        break;
      case "information":
        if (childNode.parent !== this.s$topicInnerElementGroup) {
          this.s$topicInnerElementGroup.add(childNode);
        }
        break;
      case "inner":
        if (childNode.parent !== this.s$topicInnerElementGroup) {
          this.s$topicInnerElementGroup.add(childNode);
        }
        break;
      case "topicselectbox":
        if ((_a = this.figure.getParent()) === null || _a === undefined) {
          // do nothing
        } else {
          _a.renderWorker.appendChild("topicselectbox", childNode);
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
    const fillGradient = this.topicShapeFill.remember("fillGradient");
    if (fillGradient) {
      fillGradient.remove();
    }
    this.svg.remove();
  }
}
