import process from "process";

import { layoutConstant } from "../../../../utils/layoutconstant";
import * as lib from "../../../../lib/index";
const { EXT_RADIUS, COL_RADIUS } = layoutConstant;
const SYMBOLGAP = 2;
const RADIUS = Math.max(EXT_RADIUS, COL_RADIUS);
const EXT_STROKE_WIDTH = 1;
export class CollapseExtendRenderWorker {
  figure: any;
  svg: any;
  foldG: any;
  circleFill: any;
  ecCircle: any;
  extG: any;
  path: any;
  connectPath: any;
  EcircleFill: any;
  EecCircle: any;
  _s$actionArea: any;
  Etext: any;
  _svgHoverArea: any;
  hoverAreaAttrToPack: any;

  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().style("cursor", "hand").hide();
    if (process.env.SELECT_BOX === "skip") {
      this.svg.data("immunity", "ecg");
    }
    this.figure.viewController.setElement(this.svg.node);
    // fold btn
    const d = `M ${SYMBOLGAP}, ${COL_RADIUS} L ${
      COL_RADIUS * 2 - SYMBOLGAP
    }, ${COL_RADIUS}`;
    this.foldG = this.svg.put(new lib.SVG.G());
    this.circleFill = this.foldG.circle(COL_RADIUS * 2); //白色的底色
    this.ecCircle = this.foldG.circle(COL_RADIUS * 2).fill("none"); //外轮廓
    this.path = this.foldG.put(new lib.SVG.Path()).attr({
      d,
    }); //内部的符号
    // ext btn
    this.extG = this.svg.put(new lib.SVG.G());
    this.connectPath = this.extG.put(new lib.SVG.Line(0, 0, -6, 9)).attr({
      "stroke-width": "0",
    });
    this.EcircleFill = this.extG.circle(EXT_RADIUS * 2); // 底色
    this.EecCircle = this.extG
      .circle(EXT_RADIUS * 2)
      .fill("none")
      .stroke({
        width: EXT_STROKE_WIDTH,
      }); // 外轮廓
    this.Etext = this.extG.put(new lib.SVG.Text()); // 数字
    // action area
    this._s$actionArea = this.svg
      .circle(RADIUS * 3)
      .data("name", "action-area")
      .fill("none");
    this._s$actionArea.node.style.pointerEvents = "visible";
    // hover area
    this._svgHoverArea = new lib.SVG.G()
      .rect(0, 0)
      .data("name", "collapse-extend-hover-area")
      .opacity(0);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.isCollapsedDirty) {
      if (this.figure.isCollapsed) {
        this.svg.data("name", "collapse-folded");
        this.extG.show();
        this._s$actionArea.x(-RADIUS / 2).y(-RADIUS / 2 - SYMBOLGAP / 2);
        if (this.figure.textDirty) {
          this.Etext.text(this.figure.text);
          this.figure.textDirty = false;
        }
        if (this.figure.textFontObjDirty) {
          this.Etext.attr(this.figure.textFontObjToPack);
          this.figure.textFontObjToPack = {};
          this.figure.textFontObjDirty = false;
        }
        this.Etext.translate(
          this.figure.textTranslatePosition.x,
          this.figure.textTranslatePosition.y,
        );
      } else {
        this.svg.data("name", "collapse-extended");
        this.extG.hide();
        this._s$actionArea.x(-RADIUS / 2).y(-RADIUS / 2);
        this._s$actionArea.show();
      }
      this.figure.isCollapsedDirty = false;
    }
    if (this.figure.backgroundColorDirty) {
      this.circleFill.fill(this.figure.backgroundColor);
      this.EcircleFill.fill(this.figure.backgroundColor);
      this.figure.backgroundColorDirty = false;
    }
    if (this.figure.lineColorDirty) {
      this.ecCircle.stroke(this.figure.lineColor);
      this.path.stroke(this.figure.lineColor);
      this.EecCircle.stroke(this.figure.lineColor);
      this.Etext.attr({
        fill: this.figure.lineColor,
      });
      this.connectPath.stroke(this.figure.lineColor);
      this.figure.lineColorDirty = false;
    }
    if (this.figure.lineWidthDirty) {
      this.connectPath.attr({
        "stroke-width": this.figure.lineWidth,
      });
      this.figure.lineWidthDirty = false;
    }
    if (this.figure.fillColorDirty) {
      this.ecCircle.attr({
        fill: this.figure.fillColor,
      });
      this.EecCircle.attr({
        fill: this.figure.fillColor,
      });
      this.figure.fillColorDirty = false;
    }
    if (this.figure.fillOpacityDirty) {
      this.ecCircle.attr({
        "fill-opacity": this.figure.fillOpacity,
      });
      this.EecCircle.attr({
        "fill-opacity": this.figure.fillOpacity,
      });
      this.figure.fillOpacityDirty = false;
    }
    if (this.figure.positionDirty) {
      this.svg.translate(this.figure.position.x, this.figure.position.y);
      this.figure.positionDirty = false;
    }
    if (this.figure.connectPathAttrDirty) {
      this.connectPath.attr(this.figure.connectPathAttrToPack);
      this.figure.connectPathAttrToPack = {};
      this.figure.connectPathAttrDirty = false;
    }
    if (this.figure.collapseExtendVisibleDirty) {
      if (this.figure.collapseExtendVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.collapseExtendVisibleDirty = false;
    }
    if (this.figure.collapseBtnVisibleDirty) {
      if (this.figure.collapseBtnVisible) {
        const duration = 120;
        this.foldG.animate(duration, "-").scale(1, 1).translate(0, 0);
        this._s$actionArea.show();
      } else {
        const duration = 1;
        this.foldG
          .animate(duration, "-")
          .scale(0.001, 0.001)
          .translate(COL_RADIUS, COL_RADIUS);
        if (!this.figure.isCollapsed) {
          this._s$actionArea.hide();
        }
      }
      this.figure.collapseBtnVisibleDirty = false;
    }
    if (this.figure.hoverAreaVisibleDirty) {
      if (this.figure.hoverAreaVisible) {
        this._svgHoverArea.show();
      } else {
        this._svgHoverArea.hide();
      }
      this.figure.hoverAreaVisibleDirty = false;
    }
    if (this.figure.hoverAreaAttrDirty) {
      this._svgHoverArea.attr(this.figure.hoverAreaAttrToPack);
      this.hoverAreaAttrToPack = {};
      this.figure.hoverAreaAttrDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    // for matrix branch view collapsed status
    if (parentFigure.viewController.parent().isMatrixBranch()) {
      if (!this.figure.isCollapsed) {
        this._s$actionArea.hide();
        this._svgHoverArea.hide();
      } else if (this.figure.collapseExtendVisible) {
        this._s$actionArea.show();
        this._svgHoverArea.show();
      }
    }
    const topicRenderWorker = parentFigure.renderWorker;
    topicRenderWorker.appendChild("collapseextend", this.svg);
    const branchFigure = parentFigure.getParent();
    if (branchFigure) {
      const branchRenderWorker = branchFigure.renderWorker;
      branchRenderWorker.appendChild("collapseextend", this._svgHoverArea);
      this._svgHoverArea.back();
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(childType, childNode, options) {}
  getContent() {
    return this.svg;
  }
  dispose() {
    this.svg.remove();
  }
}
export default CollapseExtendRenderWorker;
