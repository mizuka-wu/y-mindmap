import { FIGURE_TYPE } from "../../../../common/constants/index";

import * as lib from "../../../../lib/index";
import { TitleRenderWorker } from "./titlerenderworker";

export class NumberingRenderWorker extends TitleRenderWorker {
  constructor(figure) {
    super(figure);
    this.svg = new lib.SVG.G().data("name", "numbering-class");
    this.svg.put(this.titleText);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (
      parentFigure.viewController.figureType === FIGURE_TYPE.PLACE_HOLDER_TOPIC
    ) {
      return;
    }
    super.work();
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    parentFigure.renderWorker.appendChild("numbering", this.svg);
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
