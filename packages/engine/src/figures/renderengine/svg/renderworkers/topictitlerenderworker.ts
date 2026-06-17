import * as lib from "../../../../lib/index";

import { TitleRenderWorker } from "./titlerenderworker";
export class TopicTitleRenderWorker extends TitleRenderWorker {
  constructor(figure) {
    super(figure);
    this.svg = new lib.SVG.G().data("name", "topic-title-text-group");
    this.svg.put(this.titleText);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
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
    // attrs
    if (this.figure.attrsDirty) {
      this.svg.attr(this.figure.attrsToPack);
      this.figure.attrsToPack = {};
      this.figure.attrsDirty = false;
    }
    parentFigure.renderWorker.appendChild("title", this.svg);
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
