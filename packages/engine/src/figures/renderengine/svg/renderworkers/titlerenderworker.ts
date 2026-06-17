import jquery from "jquery";

import * as lib from "../../../../lib/index";

const ANGHOR_MAP = {
  left: "start",
  center: "middle",
  right: "end",
};
export class TitleRenderWorker {
  figure: any;
  titleText: any;
  svg: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.titleText = new lib.SVG.Text();
    this.titleText.style("cursor", "default");
    this.svg = this.titleText;
  }
  work() {
    // child class invoke 'appendChild'
    // text MUST be invoked before attrs
    if (this.figure.textFnDirty) {
      this.titleText.text(this.figure.textFn);
      this.figure.textFnDirty = false;
      this.figure.textDirty = false;
    } else if (this.figure.textDirty) {
      this.titleText.text(this.figure.text || "");
      this.figure.textDirty = false;
    }
    // text color
    if (this.figure.textColorDirty) {
      this.setAttr({
        fill: this.figure.textColor,
      });
      this.figure.textColorDirty = false;
    }
    // text decoration
    if (this.figure.textDecorationDirty) {
      this.setAttr({
        "text-decoration": this.figure.textDecoration,
      });
      this.figure.textDecorationDirty = false;
    }
    // text transform
    if (this.figure.textTransformDirty) {
      // handled it when Layout
      this.figure.textTransformDirty = false;
    }
    // text align
    if (this.figure.textAlignDirty) {
      this.setAttr({
        "text-anchor": ANGHOR_MAP[this.figure.textAlign],
      });
      this.figure.textAlignDirty = false;
    }
    // font size
    if (this.figure.fontSizeDirty) {
      this.setAttr({
        "font-size": parseInt(this.figure.fontSize),
      });
      this.figure.fontSizeDirty = false;
    }
    // font family
    if (this.figure.fontFamilyDirty) {
      this.setAttr({
        "font-family": this.figure.fontFamily,
      });
      this.figure.fontFamilyDirty = false;
    }
    // font weight
    if (this.figure.fontWeightDirty) {
      this.setAttr({
        "font-weight": this.figure.fontWeight,
      });
      this.figure.fontWeightDirty = false;
    }
    // font style
    if (this.figure.fontStyleDirty) {
      this.setAttr({
        "font-style": this.figure.fontStyle,
      });
      this.figure.fontStyleDirty = false;
    }
    if (this.figure.textPositionDirty) {
      this.titleText.translate(
        this.figure.textPosition.x,
        this.figure.textPosition.y,
      );
      this.figure.textPositionDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {}
  getContent() {}
  dispose() {
    this.titleText.remove();
  }
  setAttr(attrObj) {
    Array.from(this.titleText.node.querySelectorAll("tspan")).forEach(
      (tspanNode) => {
        jquery(tspanNode).attr(attrObj);
      },
    );
    this.titleText.attr(attrObj);
    this.svg.attr(attrObj);
  }
}
