import { TOPICSHAPE } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

const DISPLAY_STYLE = {
  HOVER: "hover",
  ACTIVE: "active",
  HIDE: "hide",
  DEFOCUS: "defocus",
  INTERSECT: "intersect",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const shapeCannotCustomWidth = [
  TOPICSHAPE.DIAMOND,
  TOPICSHAPE.ELLIPSE,
  TOPICSHAPE.CLOUD,
];
export class TopicSelectBoxRenderWorker {
  figure: any;
  svg: any;
  tsb: any;
  leftBarSvg: any;
  rightBarSvg: any;
  cwcb: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data("name", "topic-select-box-group").hide();
    this.tsb = new lib.SVG.Path().data("name", "topic-select-box");
    this.svg.put(this.tsb);
    this.figure.viewController.style(this.tsb, "topicShapeSelectBox");
    this._initCustomWidthControlBar();
    this.figure.viewController.setElement(this.svg.node);
  }
  _initCustomWidthControlBar() {
    this.leftBarSvg = _newBar();
    this.rightBarSvg = _newBar();
    // this.leftCircleSvg = _newCircle()
    // this.rightCircleSvg = _newCircle()
    this.cwcb = new lib.SVG.G().data(
      "name",
      "topic-custom-width-control-bar-group",
    );
    this.cwcb.put(this.leftBarSvg);
    this.cwcb.put(this.rightBarSvg);
    // this.cwcb.put(this.leftCircleSvg)
    // this.cwcb.put(this.rightCircleSvg)
    // this._hideCustomWidthControlBar()
    function _newBar() {
      return new lib.SVG.G()
        .rect()
        .data("name", "topic-custom-width-control-bar")
        .opacity(0)
        .style("cursor", "ew-resize");
    }
    // function _newCircle () {
    //   return (new SVG.G())
    //     .circle(8)
    //     .data('name', 'topic-custom-width-control-bar')
    //     .fill('#fff')
    //     .stroke({ color: '#2ebdff', opacity: 1, width: 2 })
    //     .style('cursor', 'ew-resize')
    // }
    this.svg.put(this.cwcb);
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
    if (this.figure.topicSelectBoxPathDirty) {
      this.tsb.attr({
        d: this.figure.topicSelectBoxPath,
      });
      this.figure.topicSelectBoxPathDirty = false;
    }
    if (this.figure.displayStyleDirty) {
      switch (this.figure.displayStyle) {
        case DISPLAY_STYLE.HOVER:
          this.figure.viewController.style(
            this.tsb,
            "topicShapeSelectBox__mouseover",
          );
          break;
        case DISPLAY_STYLE.ACTIVE:
          this.figure.viewController.style(
            this.tsb,
            "topicShapeSelectBox__selected",
          );
          break;
        case DISPLAY_STYLE.HIDE:
          break;
        case DISPLAY_STYLE.DEFOCUS:
          this.figure.viewController.style(
            this.tsb,
            "topicShapeSelectBox__deFocus",
          );
          break;
        case DISPLAY_STYLE.INTERSECT:
          this.figure.viewController.style(
            this.tsb,
            "topicShapeSelectBox__intersected",
          );
          break;
        default:
          break;
      }
      this.figure.displayStyleDirty = false;
    }
    if (this.figure.displayStateDirty) {
      if (this.figure.displayState) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.displayStateDirty = false;
    }
    if (this.figure.barDisplayStateDirty) {
      if (this.figure.barDisplayState) {
        if (
          !Object(utils.isPreventCustomWidthBranch)(
            this.figure.viewController.parent(),
          )
        ) {
          this.cwcb.show();
        } else {
          this.cwcb.hide();
        }
      } else {
        this.cwcb.hide();
      }
      this.figure.barDisplayStateDirty = false;
    }
    if (this.figure.topicSelectBoxAttrDirty) {
      this.tsb.attr(this.figure.topicSelectBoxAttrToPack);
      this.figure.topicSelectBoxAttrToPack = {};
      this.figure.topicSelectBoxAttrDirty = false;
    }
    if (this.figure.leftBarAttrDirty) {
      this.leftBarSvg.attr(this.figure.leftBarAttr);
      this.figure.leftBarAttrToPack = {};
      this.figure.leftBarAttrDirty = false;
    }
    if (this.figure.rightBarAttrDirty) {
      this.rightBarSvg.attr(this.figure.rightBarAttr);
      this.figure.rightBarAttrToPack = {};
      this.figure.rightBarAttrDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    parentFigure.renderWorker.appendChild("topicselectbox", this.svg);
  }
  dispose() {
    this.svg.remove();
  }
  getContent() {
    return this.svg;
  }
  appendChild() {}
}
