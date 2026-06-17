import * as lib from "../lib/index";

import { MODULE_NAME, UI_STATUS } from "../common/constants/index";

import backbone from "backbone";

import jquery from "jquery";

/**
 * @fileOverview 管理预添加floating topic的操作流程 / manage adding floating topic operator flow
 * */

/**
 * @description 流程具体处理的位置
 * */
export class PreAddFloatingTopic {
  status: {
    /** 鼠标移动中的状态 */
    movingMouse: boolean;
  };
  fakeFloatingTopicView: any;
  context: any;
  ownerSvgNode: any;
  onMouseMove: (e: any) => any;
  onESCPress: (e: any) => false | void;
  onMouseDown: (e: any) => void;
  static identifier: string;

  constructor() {
    /** @public */
    this.status = {
      /** 鼠标移动中的状态 */
      movingMouse: false,
    };
    /** @private */
    this.fakeFloatingTopicView = null;
    /** @private */
    this.context = null;
    /** @type {HTMLElement} @private */
    this.ownerSvgNode = null;
  }
  /**
   * @description 开始floating topic预添加流程
   * @param {SheetEditor} context
   * @param {Object} [options]
   * @param {position} [options.position]
   * @public
   * */
  startProcess(context, options) {
    context
      .getModule(MODULE_NAME.SEMAPHORE)
      .increase(UI_STATUS.ADD_FLOATINGTOPIC);
    this.context = context;
    this.fakeFloatingTopicView = new FakeFloatingTopicView(context, options);
    this.ownerSvgNode = context.getSheetView().svg.node.ownerSVGElement;
    this.onMouseMove = (e) => this.fakeFloatingTopicView.onMouseMove(e);
    this.onESCPress = (e) => e.keyCode === 27 && this.reset();
    this.onMouseDown = (e) => this.finish(e);
    this.initEventsListener();
    this.status.movingMouse = true;
  }
  /** @private */
  initEventsListener() {
    const $ownerSvgNode = jquery(this.ownerSvgNode);
    $ownerSvgNode.on("mousemove", this.onMouseMove);
    $ownerSvgNode.on("mousedown", this.onMouseDown);
    jquery("body").on("keydown", this.onESCPress);
  }
  /**
   * @param {MouseEvent} e
   * @private
   * */
  finish(e) {
    const rootTopic = this.context.getSheetModel().rootTopic();
    const topicModel = rootTopic.createEmptyTopic({
      title: this.context.getTranslatedText("DEFAULT_FLOATING_TOPIC_TITLE"),
      titleUnedited: true,
    });
    /** @type {position} */
    const realPosition = this.context
      .getSVGView()
      .getCoordinateTransfer()
      .viewportToMindMap({
        x: e.clientX,
        y: e.clientY,
      });
    topicModel.set("position", realPosition);
    rootTopic.addChildTopic(topicModel, {
      type: "detached",
    });
    this.reset();
  }
  /** @private */
  reset() {
    this.status.movingMouse = false;
    this.fakeFloatingTopicView.removeSelf();
    this.fakeFloatingTopicView = null;
    const $ownerSvgNode = jquery(this.ownerSvgNode);
    $ownerSvgNode.off("mousemove", this.onMouseMove);
    $ownerSvgNode.off("mousedown", this.onMouseDown);
    jquery("body").off("keydown", this.onESCPress);
    this.context
      .getModule(MODULE_NAME.SEMAPHORE)
      .decrease(UI_STATUS.ADD_FLOATINGTOPIC);
  }
}
PreAddFloatingTopic.identifier = MODULE_NAME.PRE_ADD_FLOATING_TOPIC;
const fakeFTWidth = 104;
const fakeFTHeight = 36;
const radius = 5;
/**
 * @description 鼠标移动过程中需要显示的虚拟floating topic view
 * */
const FakeFloatingTopicView = backbone.View.extend({
  /**
   * @param {SheetEditor} context
   * @param {Object} [options]
   * @param {position} [options.position]
   * @private
   *  */
  initialize(context, options) {
    /** @private */
    this.context = context;
    /** @private */
    this.sheetContainer = context.getSheetView().svg;
    this.initSVGStructure(options);
  },
  /**
   * @param {Object} [options]
   * @param {position} [options.position]
   * @private
   * */
  initSVGStructure(options: any = {}) {
    /** @private */
    this.container = new lib.SVG.G();
    this.container.attr({
      cursor: "pointer",
    });
    // set shape
    const shape = new lib.SVG.Rect()
      .width(fakeFTWidth)
      .height(fakeFTHeight)
      .radius(radius);
    shape.attr({
      fill: "#cacaca",
      stroke: "none",
      transform: `translate(${-fakeFTWidth / 2} ${-fakeFTHeight / 2})`,
    });
    // set text
    // fixme 暂时写死text的y偏移
    const text = new lib.SVG.Text()
      .text(this.context.getTranslatedText("DEFAULT_FLOATING_TOPIC_TITLE"))
      .y(-16);
    text.attr({
      stroke: "#fff",
      fill: "#fff",
      "text-anchor": "middle",
    });
    this.container.add(shape);
    this.container.add(text);
    this.setPosition(options.position);
    // add view into svg container
    this.sheetContainer.add(this.container);
  },
  /**
   * @param {position} position
   * @private
   * */
  setPosition(
    position = {
      x: 0,
      y: 0,
    },
  ) {
    this.container.attr("transform", `translate(${position.x} ${position.y})`);
  },
  /**
   * @param {MouseEvent} e
   * @public
   * */
  onMouseMove(e) {
    /** @type {position} */
    // const realPosition = this.context.callService(SERVICE_NAME.CLIENT_POS_TO_REAL_POS, e.clientX, e.clientY);
    const realPosition = this.context
      .getSVGView()
      .getCoordinateTransfer()
      .viewportToMindMap({
        x: e.clientX,
        y: e.clientY,
      });
    this.setPosition(realPosition);
  },
  /** @public */
  removeSelf() {
    this.container.remove();
  },
});

export default PreAddFloatingTopic;
