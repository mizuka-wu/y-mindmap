import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";
import { layoutConstant } from "../../../../utils/layoutconstant";
import { TitleRenderWorker } from "./titlerenderworker";

const boundaryTitleLayoutConstant = layoutConstant.BOUNDARY_TITLE;
export class BoundaryTitleRenderWorker extends TitleRenderWorker {
  boundaryTitleBG: any;
  constructor(figure) {
    super(figure);
    this.svg = new lib.SVG.G().data("name", "boundary-title-group");
    this.titleText.data("name", "boundary-title");
    this.boundaryTitleBG = new lib.SVG.Path().data("name", "boundary-title-bg");
    this.svg.add(this.boundaryTitleBG);
    this.svg.add(this.titleText);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.sizeDirty) {
      this.updateShapePath();
    }
    super.work();
    if (this.figure.bgFillColorDirty) {
      this.boundaryTitleBG.attr({
        fill: this.figure.bgFillColor,
      });
      this.figure.bgFillColorDirty = false;
    }
    if (this.figure.position) {
      this.svg.translate(this.figure.position.x, this.figure.position.y);
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    // attrs
    if (this.figure.attrsDirty) {
      this.svg.attr(this.figure.attrsToPack);
      this.figure.attrsToPack = {};
      this.figure.attrsDirty = false;
    }
    parentFigure.renderWorker.appendChild("title", this.svg);
  }
  getShapePath() {
    const { width, height } = this.figure.size;
    const bgPath = `M ${boundaryTitleLayoutConstant.TOP_LEFT_RADIUS} 0 L ${
      width - boundaryTitleLayoutConstant.TOP_RIGHT_RADIUS
    } 0 Q ${width} 0 ${width} ${
      boundaryTitleLayoutConstant.TOP_RIGHT_RADIUS
    } L ${width} ${
      height - boundaryTitleLayoutConstant.BOTTOM_RIGHT_RADIUS
    } Q ${width} ${height} ${
      width - boundaryTitleLayoutConstant.BOTTOM_RIGHT_RADIUS
    } ${height} L ${
      boundaryTitleLayoutConstant.BOTTOM_LEFT_RADIUS
    } ${height} Q 0 ${height} 0 ${
      height - boundaryTitleLayoutConstant.BOTTOM_LEFT_RADIUS
    } L 0 ${boundaryTitleLayoutConstant.TOP_LEFT_RADIUS} Q 0 0 ${
      boundaryTitleLayoutConstant.TOP_LEFT_RADIUS
    } 0 Z`;
    return bgPath;
  }
  updateShapePath() {
    const attr = utils.getFillPatternAttr(this.figure.fillPattern, {
      fillPath: this.getShapePath(),
      isForceHandDrawnSolid: true,
      isBoundaryTitle: true,
    });
    this.boundaryTitleBG.attr(attr);
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
