import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

const CONNECTION_MASKING_ATTR = {
  maskUnits: "userSpaceOnUse",
  x: "-100%",
  y: "-100%",
  width: "200%",
  height: "200%",
};
const MASK_REGION_ATTR = {
  x: "-100%",
  y: "-100%",
  width: "200%",
  height: "200%",
};
export class IndicatorRenderWorker {
  figure: any;
  svg: any;
  line: any;
  box: any;
  connectionMasking: any;
  maskRegion: any;
  cutRegion: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "indicator");
    this.line = this.svg.put(new lib.SVG.Path().data("name", "indicator-line"));
    this.box = this.svg.put(new lib.SVG.Rect().data("name", "indicator-box"));
  }
  tryInitMask(svgView) {
    if (!this.connectionMasking) {
      this.connectionMasking = svgView.svg.mask();
      this.maskRegion = new lib.SVG.Rect().attr({
        fill: "white",
      });
      this.cutRegion = new lib.SVG.Path().attr({
        fill: "black",
      });
      this.connectionMasking.add(this.maskRegion);
      this.connectionMasking.add(this.cutRegion);
      this.connectionMasking.attr(CONNECTION_MASKING_ATTR);
      this.maskRegion.attr(MASK_REGION_ATTR);
      this.svg.maskWith(this.connectionMasking);
    }
  }
  removeMask() {
    if (this.connectionMasking) {
      this.connectionMasking.remove();
    }
    this.connectionMasking = null;
  }
  work() {
    // update svg display
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    // mount svg
    const view = this.figure.viewController;
    const sheetView = view.getSheetView();
    if (!sheetView) {
      return;
    }
    const sheetRenderWorker = sheetView.figure.renderWorker;
    sheetRenderWorker.appendChild("indicator", this.svg, {});
    // update svg attrs
    this.line.attr(this.figure.lineAttrs);
    this.box.attr(this.figure.boxAttrs);
    // update mask
    const { startBranch, isBranchDirty } = this.figure;
    if (isBranchDirty) {
      if (
        startBranch === null || startBranch === undefined
          ? undefined
          : startBranch.isMapLike()
      ) {
        this.tryInitMask(sheetView.editDomain());
        this.cutRegion.attr(Object(utils.getMaskAttr)(startBranch));
      } else {
        this.removeMask();
      }
      this.figure.isBranchDirty = false;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(childType, childNode, options) {}
  dispose() {
    this.removeMask();
    this.svg.remove();
  }
  getContent() {
    return this.svg;
  }
}
