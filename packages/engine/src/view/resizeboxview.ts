import { VIEW_TYPE, FIGURE_TYPE } from "../common/constants/index";

import figures from "../figures/index";
import SvgComponentView from "./svgcomponentview";
import MathjaxView from "./mathjaxview";
import ImageView from "./imageview";
import ResizeBoxDrag from "../modules/svgdraggable/resizebox";

export class ResizeBoxView extends SvgComponentView {
  isActive: boolean;
  width: number;
  height: number;
  x: number;
  y: number;
  lockRatio: boolean;
  refView: any;
  figure: any;
  anchors: any;
  originImage: any;
  constructor(refView) {
    super();
    this.isActive = false;
    this.width = 0;
    this.height = 0;
    this.x = 0;
    this.y = 0;
    this.lockRatio = true;
    this.refView = refView;
    this.initOriginImage();
    this.figure = figures.createFigure(this);
    this.anchors = this.figure.renderWorker.anchors;
  }
  get type() {
    return VIEW_TYPE.RESIZE_BOX;
  }
  get figureType() {
    return FIGURE_TYPE.RESIZE_BOX;
  }
  get _style() {
    return {
      fullBox: {
        "stroke-width": "2",
        stroke: "#2ebdff",
      },
      fullBox__show: {
        fill: "#2ebdff",
        "fill-opacity": "0.3",
      },
      fullBox__active: {
        fill: "none",
      },
      anchor: {
        stroke: "#2ebdff",
        "stroke-width": 2,
        opacity: "0",
        // 'cursor': 'crosshair'
      },
      anchor__active: {
        fill: "#FFF",
        stroke: "#2ebdff",
        opacity: "1",
      },
      avatarImage: {
        opacity: "0.5",
      },
    };
  }
  initOriginImage() {
    if (this.refView instanceof ImageView) {
      this.originImage = (this.refView as any).image;
    } else if (this.refView instanceof MathjaxView) {
      this.originImage = (this.refView as any).s$mathJaxOutPutNestedSVG;
    }
  }
  size(width, height) {
    this.width = width;
    this.height = height;
    this.figure.setSize({
      width,
      height,
    });
  }
  translate(x, y) {
    this.x = x;
    this.y = y;
    this.figure.setPosition({
      x,
      y,
    });
  }
  /**
   * 三种状态，1 hover的时候show，2 点击的时候active，此时可拖拽 3 点击其他地方是hide
   */
  show() {
    this.figure.setHover();
  }
  active() {
    this.isActive = true;
    this.figure.setActive();
  }
  hide() {
    this.isActive = false;
    this.figure.setHide();
  }
  showAvatar() {
    this.figure.setAvatarDisplay(true);
  }
  hideAvatar() {
    this.figure.setAvatarDisplay(false);
  }
  setAvatarSize(avatarSize) {
    this.figure.setAvatarSize(avatarSize);
  }
  setLockRatio(lockRatio) {
    this.lockRatio = lockRatio;
    this.figure.setLockRatio(lockRatio);
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.parent(null);
    return this;
  }
  initSVGDraggable() {
    new ResizeBoxDrag().init(this);
  }
}
export default ResizeBoxView;
