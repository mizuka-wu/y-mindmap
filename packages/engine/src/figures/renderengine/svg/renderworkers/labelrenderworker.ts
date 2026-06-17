import { COMMON_FONT_FAMILY } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

const labelFontFamily = COMMON_FONT_FAMILY;
const labelFontSize = 12;
const labelUnitHeight = 20;
const labelUnitMinWidth = 38;
const labelUnitRadius = 8;
const labelUnitFillColor = "rgba(255, 255, 255, 0.7)";
const labelUnitBorderColor = "rgba(0, 0, 0, 0.1)";
const labelUnitTextColor = "#434b54";
const labelUnitPaddingHorizon = 6;
export class LabelRenderWorker {
  figure: any;
  svg: any;
  s$labelUnitbackgound: any;
  s$labelUnitText: any;
  tooltip: SVGTitleElement;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().attr({
      data: "label-unit",
    });
    this.figure.viewController.setElement(this.svg.node);
    this.s$labelUnitbackgound = new lib.SVG.Rect()
      .radius(labelUnitRadius)
      .fill(labelUnitFillColor)
      .stroke(labelUnitBorderColor);
    this.s$labelUnitText = new lib.SVG.Text().style("white-space", "pre");
    this.svg.add(this.s$labelUnitbackgound);
    this.svg.add(this.s$labelUnitText);
    this.tooltip = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    this.svg.node.appendChild(this.tooltip);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.backgroudAttrDirty) {
      this.s$labelUnitbackgound.attr(this.figure.backgroudAttrToPack);
      this.figure.backgroudAttrToPack = {};
      this.figure.backgroudAttrDirty = false;
    }
    if (this.figure.textAttrDirty) {
      this.s$labelUnitText.attr(this.figure.textAttrToPack);
      this.figure.textAttrToPack = {};
      this.figure.textAttrDirty = false;
    }
    if (this.figure.sizeDirty) {
      this.s$labelUnitbackgound.size(
        Math.max(this.figure.size.width, labelUnitMinWidth),
        this.figure.size.height,
      );
      this.figure.sizeDirty = false;
    }
    if (this.figure.textDirty) {
      this.updateLabelFont();
      this.figure.textDirty = false;
    }
    if (this.figure.tooltipDirty) {
      this.tooltip.textContent = this.figure.tooltip;
      this.figure.tooltipDirty = false;
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
    parentFigure.renderWorker.appendChild("label", this.svg);
  }
  updateLabelFont() {
    const currentLabelFont = labelFontFamily;
    const labelTextSize = Object(utils.getTextSize)(this.figure.text, {
      fontSize: labelFontSize,
      fontFamily: currentLabelFont,
    }).width;
    const unitWidth = labelTextSize + labelUnitPaddingHorizon * 2;
    const offsetX =
      unitWidth <= labelUnitMinWidth
        ? (labelUnitMinWidth - labelTextSize) / 2
        : labelUnitPaddingHorizon;
    this.s$labelUnitText
      .plain(this.figure.text)
      .attr({
        "font-size": labelFontSize,
        "font-family": currentLabelFont,
        "alignment-baseline": "middle",
      })
      .fill(labelUnitTextColor)
      .translate(offsetX, labelUnitHeight / 2 + 1);
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
