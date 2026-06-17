import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

import { patternConfigurations } from "../../../../utils/patternmanager/configurations";
export class TreeTableCellRenderWorker {
  figure: any;
  s$svg: any;
  s$treeTableFill: any;
  s$treeTableStroke: any;
  s$treeTableSelectBox: any;
  constructor(figure) {
    this.figure = figure;
    this.s$svg = new lib.SVG.G().data("name", "tree-map-cell");
    this.s$treeTableFill = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "tree-map-fill")
      .attr("opacity", "0");
    this.s$treeTableStroke = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "tree-map-stroke")
      .attr({
        fill: "none",
        "stroke-width": 0,
        stroke: "none",
      });
    this.s$treeTableSelectBox = this.s$svg
      .put(new lib.SVG.Path())
      .data("name", "tree-map-select-box")
      .attr({
        fill: "none",
        "stroke-width": 4,
        display: "none",
      });
    this.figure.viewController.setElement(this.s$svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.opacityDirty) {
      this.s$svg.attr("opacity", this.figure.opacity);
      this.figure.opacityDirty = true;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.s$svg.show();
      } else {
        this.s$svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.sizeDirty) {
      this.updateAllPath();
      this.figure.sizeDirty = false;
    }
    if (this.figure.fillPatternDirty) {
      this.updateAllPath();
      this.figure.fillPatternDirty = false;
    }
    if (this.figure.positionDirty || this.figure.cellBoundsPositionDirty) {
      const finalX =
        this.figure.position.x - Math.abs(this.figure.cellBoundsPosition.x);
      const finalY =
        this.figure.position.y - Math.abs(this.figure.cellBoundsPosition.y);
      this.s$svg.translate(finalX, finalY);
      this.figure.positionDirty = false;
      this.figure.cellBoundsPositionDirty = false;
    }
    if (this.figure.borderLineColorDirty) {
      this.s$treeTableStroke.attr("stroke", this.figure.borderLineColor);
      this.figure.borderLineColorDirty = false;
    }
    if (this.figure.borderLineWidthDirty) {
      this.s$treeTableStroke.attr("stroke-width", this.figure.borderLineWidth);
      this.figure.borderLineWidthDirty = false;
    }
    if (this.figure.borderLinePatternDirty) {
      this.updateAllPath();
      this.figure.borderLinePatternDirty = false;
    }
    if (this.figure.fillColorDirty) {
      this.updateFillStyle();
      this.figure.fillColorDirty = false;
    }
    if (this.figure.selectBoxAttrDirty) {
      this.s$treeTableSelectBox.attr(this.figure.selectBoxAttr);
      // in init process, s$svg has not been append to dom tree
      if (this.s$svg.node.parentNode) {
        if (this.s$treeTableSelectBox.attr("display") === "block") {
          this.s$svg.front();
        } else {
          this.s$svg.back();
        }
      }
      this.figure.selectBoxAttrDirty = false;
    }
    parentFigure.renderWorker.appendChild("treetablecell", this.s$svg, {
      treeTableHeadBranchViewId:
        this.figure.viewController.getTreeTableHeadBranchViewId(),
    });
  }
  updateAllPath() {
    const width = this.figure.size.width;
    const height = this.figure.size.height;
    const d = `M ${0} ${0} l ${width} 0 l 0 ${height} l ${-width} 0 Z`;
    const attr = Object(utils.getComplexLinePatternAttr)(
      this.figure.borderLinePattern,
      {
        lineWidth: this.figure.borderLineWidth,
        linePath: d,
      },
    );
    this.s$treeTableStroke.attr(
      Object(utils.getLinePattenAttr)(
        this.figure.borderLinePattern,
        this.figure.borderLineWidth,
      ),
    );
    [this.s$treeTableStroke, this.s$treeTableSelectBox].forEach((s$svg) => {
      s$svg.attr(attr);
    });
    this.s$treeTableFill.attr(
      Object(utils.getFillPatternAttr)(this.figure.fillPattern, {
        fillPath: d,
      }),
    );
    this.updateFillStyle();
  }
  updateFillStyle() {
    let attr = {};
    const { fillPattern, fillColor } = this.figure;
    if (Object(utils.isNoneFillPattern)(fillPattern, fillColor)) {
      attr = {
        opacity: 0,
      };
    } else if (Object(utils.isSolidFillPattern)(fillPattern)) {
      attr = {
        opacity: 1,
        fill: this.figure.fillColor,
        stroke: "none",
      };
    } else {
      attr = {
        opacity: 1,
        fill: "none",
        stroke: this.figure.fillColor,
        "stroke-width":
          patternConfigurations.getCurrentHandDrawnDefaultFillWidth(
            fillPattern,
          ),
      };
    }
    this.s$treeTableFill.attr(attr);
  }
  appendChild() {}
  dispose() {
    this.s$svg.remove();
  }
  getContent() {
    return this.s$svg;
  }
}
