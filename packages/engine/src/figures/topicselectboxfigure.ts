import Figure from "./figure";
import * as utils from "../utils/index";

const DISPLAY_STYLE = {
  HOVER: "hover",
  ACTIVE: "active",
  HIDE: "hide",
  DEFOCUS: "defocus",
  INTERSECT: "intersect",
};
export class TopicSelectBoxFigure extends Figure {
  topicSelectBoxAttr: any;
  topicSelectBoxAttrToPack: any;
  leftBarAttr: any;
  leftBarAttrToPack: any;
  rightBarAttr: any;
  rightBarAttrToPack: any;
  displayStyle: any;
  displayStyleDirty: boolean;
  displayState: any;
  displayStateDirty: boolean;
  barDisplayState: any;
  barDisplayStateDirty: boolean;
  topicSelectBoxPath: any;
  topicSelectBoxPathDirty: boolean;
  topicSelectBoxAttrDirty: boolean;
  leftBarAttrDirty: boolean;
  rightBarAttrDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.topicSelectBoxAttr = {};
    this.topicSelectBoxAttrToPack = {};
    this.leftBarAttr = {};
    this.leftBarAttrToPack = {};
    this.rightBarAttr = {};
    this.rightBarAttrToPack = {};
  }
  setHover() {
    this.setDisplayStyle(DISPLAY_STYLE.HOVER);
    this.setDisplayState(true);
    this.setBarDisplayState(false);
  }
  setActive() {
    this.setDisplayStyle(DISPLAY_STYLE.ACTIVE);
    this.setDisplayState(true);
    this.setBarDisplayState(true);
  }
  setHide() {
    this.setDisplayStyle(DISPLAY_STYLE.HIDE);
    this.setDisplayState(false);
    this.setBarDisplayState(false);
  }
  setDefocus() {
    this.setDisplayStyle(DISPLAY_STYLE.DEFOCUS);
    this.setDisplayState(true);
    this.setBarDisplayState(false);
  }
  /**
   * @description 图片拖拽进入时候的样式改变
   * */
  setIntersect() {
    this.setDisplayStyle(DISPLAY_STYLE.INTERSECT);
    this.setDisplayState(true);
    this.setBarDisplayState(false);
  }
  setDisplayStyle(displayStyle) {
    if (this.displayStyle !== displayStyle) {
      this.displayStyle = displayStyle;
      this.displayStyleDirty = true;
      this.invalidatePaint();
    }
  }
  setDisplayState(displayState) {
    if (this.displayState !== displayState) {
      this.displayState = displayState;
      this.displayStateDirty = true;
      this.invalidatePaint();
    }
  }
  setBarDisplayState(barDisplayState) {
    if (this.barDisplayState !== barDisplayState) {
      this.barDisplayState = barDisplayState;
      this.barDisplayStateDirty = true;
      this.invalidatePaint();
    }
  }
  setTopicSelectBoxPath(topicSelectBoxPath) {
    if (this.topicSelectBoxPath !== topicSelectBoxPath) {
      this.topicSelectBoxPath = topicSelectBoxPath;
      this.topicSelectBoxPathDirty = true;
      this.invalidatePaint();
    }
  }
  setTopicSelectBoxAttr(attr) {
    const dr = utils.subtract(this.topicSelectBoxAttr, attr);
    if (Object.keys(dr).length > 0) {
      this.topicSelectBoxAttrDirty = true;
      Object.assign(this.topicSelectBoxAttr, dr);
      Object.assign(this.topicSelectBoxAttrToPack, dr);
      this.invalidatePaint();
    }
  }
  setLeftBarAttr(attr, force) {
    const dr = utils.subtract(this.leftBarAttr, attr);
    if (force || Object.keys(dr).length > 0) {
      this.leftBarAttrDirty = true;
      Object.assign(this.leftBarAttr, force ? attr : dr);
      Object.assign(this.leftBarAttrToPack, force ? attr : dr);
      this.invalidatePaint();
    }
  }
  setRightBarAttr(attr, force) {
    const dr = utils.subtract(this.rightBarAttr, attr);
    if (force || Object.keys(dr).length > 0) {
      this.rightBarAttrDirty = true;
      Object.assign(this.rightBarAttr, force ? attr : dr);
      Object.assign(this.rightBarAttrToPack, force ? attr : dr);
      this.invalidatePaint();
    }
  }
}
