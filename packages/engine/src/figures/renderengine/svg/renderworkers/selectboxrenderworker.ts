import { MODULE_NAME } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";

import * as lib from "../../../../lib/index";

const boxStrokeColor = "#2ebdff";
const hoverOpacity = 0.5;
export class SelectBoxRenderWorker {
  figure: any;
  svg: any;
  selectBox: any;
  selectBoxOneG: any;
  selectBoxTwoG: any;
  selectBoxOne: any;
  selectBoxTwo: any;
  dragHandlerAreaOne: any;
  dragHandlerAreaTwo: any;
  addTitleButtonG: any;
  addTitleButtonIcon: any;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data("name", "select-box-group").hide();
    this.selectBox = this.svg
      .put(new lib.SVG.Path())
      .data("name", "select-box");
    this.selectBoxOneG = new lib.SVG.G().data("name", "select-box-one-g");
    this.selectBoxTwoG = new lib.SVG.G().data("name", "select-box-two-g");
    this.selectBoxOne = new lib.SVG.Path().data("name", "select-box-one");
    this.selectBoxTwo = new lib.SVG.Path().data("name", "select-box-two");
    this.dragHandlerAreaOne = new lib.SVG.Path().data(
      "name",
      "select-handler-area-one",
    );
    this.dragHandlerAreaTwo = new lib.SVG.Path().data(
      "name",
      "select-handler-area-two",
    );
    this.selectBoxOneG.add(this.dragHandlerAreaOne);
    this.selectBoxTwoG.add(this.dragHandlerAreaTwo); // handler area needs append first to make resize cursor of select box shows
    this.selectBoxOneG.add(this.selectBoxOne);
    this.selectBoxTwoG.add(this.selectBoxTwo);
    this.svg.add(this.selectBoxOneG).add(this.selectBoxTwoG);
    this.addTitleButtonG = new lib.SVG.G().data(
      "name",
      "select-box-add-title-button-g",
    );
    const branchView = this.figure.viewController.refView.context;
    if (branchView && !branchView.getContext().isMobileAppPlatform()) {
      const { addonModule } = Object(utils.getInjectModule)(
        MODULE_NAME.SNOWBIRD,
      );
      const addTitleButtonIconUrl = branchView
        .getContext()
        .getFileRealResource(addonModule.getBoundaryAddTitleButtonResource());
      this.addTitleButtonIcon = new lib.SVG.Image().load(addTitleButtonIconUrl);
      this.addTitleButtonG.add(this.addTitleButtonIcon);
    }
    this.svg.add(this.addTitleButtonG);
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.transparentDirty) {
      const opacity = this.figure.transparent ? hoverOpacity : "1";
      const stroke = this.figure.transparent
        ? `rgba(${boxStrokeColor}, ${hoverOpacity})`
        : null;
      this.svg.style("opacity", opacity);
      this.svg.style(
        "pointer-events",
        opacity === hoverOpacity ? "none" : "auto",
      );
      this.selectBox.style("stroke", stroke);
      this.figure.transparentDirty = false;
    }
    if (this.figure.selectBoxAttrsDirty) {
      this.selectBox.attr(this.figure.selectBoxAttrsToPack);
      this.figure.selectBoxAttrsToPack = {};
      this.figure.selectBoxAttrsDirty = false;
    }
    if (this.figure.selectBoxOneAttrsDirty) {
      this.selectBoxOne.attr(this.figure.selectBoxOneAttrsToPack);
      this.figure.selectBoxOneAttrsToPack = {};
      this.figure.selectBoxOneAttrsDirty = false;
    }
    if (this.figure.selectBoxTwoAttrsDirty) {
      this.selectBoxTwo.attr(this.figure.selectBoxTwoAttrsToPack);
      this.figure.selectBoxTwoAttrsToPack = {};
      this.figure.selectBoxTwoAttrsDirty = false;
    }
    if (this.figure.dragHandlerAreaOneAttrsDirty) {
      this.dragHandlerAreaOne.attr(this.figure.dragHandlerAreaOneAttrsToPack);
      this.figure.dragHandlerAreaOneAttrsToPack = {};
      this.figure.dragHandlerAreaOneAttrsDirty = false;
    }
    if (this.figure.dragHandlerAreaTwoAttrsDirty) {
      this.dragHandlerAreaTwo.attr(this.figure.dragHandlerAreaTwoAttrsToPack);
      this.figure.dragHandlerAreaTwoAttrsToPack = {};
      this.figure.dragHandlerAreaTwoAttrsDirty = false;
    }
    if (this.figure.addTitleButtonAttrsDirty) {
      this.addTitleButtonG.attr(this.figure.addTitleButtonAttrsToPack);
      this.figure.addTitleButtonAttrsToPack = {};
      this.figure.addTitleButtonAttrsDirty = false;
    }
    parentFigure.renderWorker.appendChild("selectbox", this.svg);
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
