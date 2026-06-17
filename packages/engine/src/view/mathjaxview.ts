import { VIEW_TYPE, FIGURE_TYPE, MODULE_NAME } from "../common/constants/index";

import SvgComponentView from "./svgcomponentview";

import figures from "../figures/index";

import ResizeBoxView from "./resizeboxview";

import { layoutConstant } from "../utils/layoutconstant";

import * as lib from "../lib/index";

import * as utils from "../utils/index";

export class MathjaxView extends SvgComponentView {
  isSelected: boolean;
  figure: any;
  s$mathJaxOutPutNestedSVG: any;
  resizeBox: ResizeBoxView;
  constructor(mathJaxInfo) {
    let _b;
    super();
    this.isSelected = false;
    this.figure = figures.createFigure(this);
    const text =
      (_b = mathJaxInfo.content?.content) === null || _b === undefined
        ? undefined
        : _b.trim();
    if (text) {
      this.figure.setText(text);
    }
    this.s$mathJaxOutPutNestedSVG =
      this.figure.renderWorker.s$mathJaxOutPutNestedSVG;
    this.resizeBox = new ResizeBoxView(this);
    this.resizeBox.parent(this);
    if (mathJaxInfo.content?.width) {
      this.figure.setFinalWidth(mathJaxInfo.content.width);
    }
    if (mathJaxInfo.content?.align) {
      this.figure.setAlign(mathJaxInfo.content.align);
    }
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.MATH_JAX;
  }
  get figureType() {
    return FIGURE_TYPE.MATH_JAX;
  }
  initEventsListener() {
    this.listenTo(this.resizeBox, "resize", (size) => {
      let _a;
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.model.updateMathJaxWidth(size.width);
      }
    });
  }
  afterAncestorChange() {
    this.addAutoRun(() => {
      this.refreshColor();
    });
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
  }
  select() {
    this.isSelected = true;
    this.resizeBox.active();
  }
  deselect() {
    this.isSelected = false;
    this.resizeBox.hide();
  }
  refreshColor() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const textColor = parent.figure.textColor;
    if (textColor) {
      this.figure.setTextColor(textColor);
    }
  }
  refreshFinalWidth() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const newFinalWidth =
      parent.model.getMathJaxInfo()?.content?.width ??
      this.figure.originalSize.width;
    this.figure.setFinalWidth(newFinalWidth);
  }
  refreshAlign() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const newAlign = parent.model.getMathJaxInfo()?.content?.align;
    if (newAlign) {
      this.figure.setAlign(newAlign);
    }
  }
  getResizeMinWidth() {
    return (
      (this.figure.originalSize.width /
        layoutConstant.MATH_JAX_INIT_SIZE_PLUS_MULTIPLE) *
      0.5
    );
  }
  getRealPosition() {
    const realPosition = Object.assign({}, this.figure.position);
    const topic = this.parent();
    const branch =
      topic === null || topic === undefined ? undefined : topic.parent();
    const ts = branch && Object(utils.getTopicShape)(branch);
    const branchPosition =
      branch === null || branch === undefined
        ? undefined
        : branch.getRealPosition();
    const topicContentBounds = topic?.contentBounds;
    if (topicContentBounds) {
      realPosition.x += topicContentBounds.x;
      realPosition.y += topicContentBounds.y;
    }
    if (branchPosition) {
      realPosition.x += branchPosition.x;
      realPosition.y += branchPosition.y;
    }
    if (ts && ts.getRealContentAreaOffset) {
      const { x: offsetX, y: offsetY } = ts.getRealContentAreaOffset(branch);
      realPosition.x += offsetX;
      realPosition.y += offsetY;
    }
    return realPosition;
  }
  getClientRect() {
    const realPosition = this.getRealPosition();
    const clientPosition = this.getContext()
      .getSVGView()
      .getCoordinateTransfer()
      .mindMapToViewport(realPosition);
    const originalSize = this.figure.originalSize;
    return {
      x: clientPosition.x,
      y: clientPosition.y,
      width: this.figure.finalWidth,
      height:
        (this.figure.finalWidth * originalSize.height) / originalSize.width,
    };
  }
  createStandColorSVG(isInheritColor?) {
    let _a;
    let _c;
    const newSVGOutPut = new lib.SVG.Nested();
    newSVGOutPut.attr({
      xmlns: "http://www.w3.org/2000/svg",
      "xmlns:xlink": "http://www.w3.org/1999/xlink",
    });
    if (this.figure.errorCode !== 0) {
      newSVGOutPut.attr({
        viewBox: this.figure.SVGOutput.getAttribute("viewBox"),
        width: this.figure.size.width,
        height: this.figure.size.height,
      });
    } else {
      const viewBoxBaseVal = this.figure.SVGOutput.viewBox.baseVal;
      const paddingInOriginalSVG =
        (viewBoxBaseVal.width * layoutConstant.MATH_JAX_IMAGE_PADDING) /
        this.figure.size.width;
      const backgroundColor = isInheritColor
        ? (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.figure.fillColor
        : "#fff";
      const s$backGroundRect = new lib.SVG.Rect().attr({
        fill: backgroundColor,
        width: viewBoxBaseVal.width + paddingInOriginalSVG * 2,
        height: viewBoxBaseVal.height + paddingInOriginalSVG * 2,
        transform: `translate(${viewBoxBaseVal.x - paddingInOriginalSVG} ${viewBoxBaseVal.y - paddingInOriginalSVG})`,
      });
      const textColor = isInheritColor
        ? (_c = this.parent()?.titleView) === null || _c === undefined
          ? undefined
          : _c.figure.textColor
        : "#000";
      newSVGOutPut.attr({
        fill: textColor,
        viewBox: `${viewBoxBaseVal.x - paddingInOriginalSVG} ${viewBoxBaseVal.y - paddingInOriginalSVG} ${viewBoxBaseVal.width + paddingInOriginalSVG * 2} ${viewBoxBaseVal.height + paddingInOriginalSVG * 2}`,
        width:
          this.figure.size.width + layoutConstant.MATH_JAX_IMAGE_PADDING * 2,
        height:
          this.figure.size.height + layoutConstant.MATH_JAX_IMAGE_PADDING * 2,
      });
      newSVGOutPut.node.prepend(s$backGroundRect.node);
    }
    Array.from(this.figure.SVGOutput.children).forEach((childElem: any) => {
      newSVGOutPut.node.append(childElem.cloneNode(true));
    });
    return newSVGOutPut;
  }
  createDragView() {
    const cloneG = this.getContext().getSheetView().getDragViewContainer();
    cloneG.put(this.createStandColorSVG());
    const realPosition = this.getRealPosition();
    cloneG.move(realPosition.x, realPosition.y);
    return cloneG;
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    const selectionManager = this.getContext().getModule(MODULE_NAME.SELECTION);
    if (selectionManager) {
      selectionManager.removeFromSelection(this);
    }
    if (this.resizeBox) {
      this.resizeBox.remove();
    }
    this.clearReactions();
    this.parent(null);
    return this;
  }
}

export default MathjaxView;
