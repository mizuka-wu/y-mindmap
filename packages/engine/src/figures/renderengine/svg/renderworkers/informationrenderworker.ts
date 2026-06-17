import * as lib from "../../../../lib/index";
import mommonFuncs from "../../../../mommonfuncs";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SELECTBOX_RADIUS = 2;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SELECTBOX_CLICK_PADDING = 0;
const SELECTBOX_ATTR = {
  stroke: "rgb(46, 189, 255)",
  "stroke-width": "1px",
  fill: "rgb(46, 189, 255)",
  "fill-opacity": "0.3",
  display: "none",
};
const ICON_FONT_CLASS = "icon-information";
const ICON_FONT_FAMILY = "information-iconfont";
export class InformationRenderWorker {
  figure: any;
  svg: any;
  s$Select: any;
  s$Icon: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().attr("data", "information-group");
    this.s$Select = new lib.SVG.Path();
    this.s$Icon = new lib.SVG.Text();
    this.svg.add(this.s$Select);
    this.svg.add(this.s$Icon);
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.textContentDirty) {
      this.s$Icon.text(this.figure.textContent);
      this.figure.textContentDirty = false;
    }
    if (this.figure.sizeDirty) {
      const iconSize = this.figure.size.width;
      this.s$Icon
        .text(this.figure.textContent)
        .attr({
          "font-size": iconSize,
          "font-family": ICON_FONT_FAMILY,
          transform: `translate(0 ${(-iconSize / 12) * 5})`,
        })
        .addClass(ICON_FONT_CLASS);
      const d = mommonFuncs.generateRect(
        {
          x: 0,
          y: 0,
          width: iconSize,
          height: iconSize,
        },
        0,
      );
      this.s$Select.attr(
        Object.assign(
          {
            d,
          },
          SELECTBOX_ATTR,
        ),
      );
      this.figure.sizeDirty = false;
    }
    if (this.figure.textAttrDirty) {
      this.s$Icon.attr(this.figure.textAttrToPack);
      this.figure.textAttrToPack = {};
      this.figure.textAttrDirty = false;
    }
    if (this.figure.selectionAttrDirty) {
      this.s$Select.attr(this.figure.selectionAttrToPack);
      this.figure.selectionAttrToPack = {};
      this.figure.selectionAttrDirty = false;
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
    parentFigure.renderWorker.appendChild("information", this.svg);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    switch (type) {
      case "":
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
