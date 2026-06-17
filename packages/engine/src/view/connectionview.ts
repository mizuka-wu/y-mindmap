import figures from "../figures/index";

import {
  VIEW_TYPE,
  FIGURE_TYPE,
  ARROW_CLASS,
  LINE_PATTERN,
  STYLE_KEYS,
  LINETAPERED,
  MODULE_NAME,
  UI_STATUS,
  FILTER_MODE_OPACITY,
  TOPIC_TYPE,
} from "../common/constants/index";

import SvgComponentView from "./svgcomponentview";

import BranchView from "./branchview";

import styleManager from "../utils/business/stylemanager/index";
import * as utils from "../utils/index";
export class ConnectionView extends SvgComponentView {
  shouldHide: boolean;
  isVisible: boolean;
  _isForcedInvisible: boolean;
  endBranch: any;
  figure: any;
  arrowSelector: utils.ArrowSelector;
  constructor(branchView) {
    super();
    this.shouldHide = false;
    this.isVisible = true;
    this._isForcedInvisible = false;
    this.endBranch = branchView;
    this.parent(this.endBranch);
    this.figure = figures.createFigure(this);
    this.arrowSelector = new utils.ArrowSelector(
      this,
      this.figure.renderWorker.getContent()
    );
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.CONNECTION;
  }
  get figureType() {
    return FIGURE_TYPE.CONNECTION;
  }
  // @ts-ignore
  get isForcedInvisible() {
    return this._isForcedInvisible;
  }
  set isForcedInvisible(invisible) {
    this._isForcedInvisible = invisible;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  initEventsListener() {
    const parentBranchView = this.parent();
    if (!parentBranchView) {
      return;
    }
    if (Object(utils.isSummaryBranch)(parentBranchView)) {
      this.initSummaryConnectionEventListener();
    } else if (Object(utils.isCalloutBranch)(parentBranchView)) {
      this.initCalloutConnectionEventListener();
    } else {
      this.initNormalConnectionEventListener();
    }
    this.addAutoRun(() => {
      this.figure.setLineTapered(this.getLineTapered());
    });
    this.listenTo(parentBranchView.topicView, "topicviewboundschange", () => {
      this.figure.invalidatePaint();
    });
    this.listenTo(parentBranchView, "afterRealPosChange", () => {
      this.figure.invalidatePaint();
      if (Object(utils.isSummaryBranch)(parentBranchView)) {
        const realPosition = parentBranchView.getRealPosition();
        const position = Object.assign({}, parentBranchView.position);
        this.figure.setPosition({
          x: realPosition.x - position.x,
          y: realPosition.y - position.y,
        });
      }
    });
  }
  initSummaryConnectionEventListener() {
    const parentBranchView = this.parent();
    this.addAutoRun(() => {
      this.figure.setLineShape(parentBranchView.figure.summaryLineShape);
      this.figure.setLineColor(parentBranchView.figure.summaryLineColor);
      this.figure.setLineWidth(parentBranchView.figure.summaryLineWidth);
      this.figure.setLinePattern(parentBranchView.figure.summaryLinePattern);
    });
  }
  initCalloutConnectionEventListener() {
    const parentBranchView = this.parent();
    this.addAutoRun(() => {
      this.figure.setLineTapered(true);
      this.figure.setLineColor(parentBranchView.topicView.figure.fillColor);
      this.figure.setLineWidth(parentBranchView.figure.lineWidth);
      this.figure.setLinePattern(parentBranchView.figure.linePattern);
    });
  }
  initNormalConnectionEventListener() {
    const parentBranchView = this.parent();
    const startBranchView = parentBranchView.parent();
    if (startBranchView && startBranchView instanceof BranchView) {
      this.addAutoRun(() => {
        const isLineTapered = this.getLineTapered();
        const endArrowClass = isLineTapered
          ? ARROW_CLASS.NONE
          : startBranchView.figure.endArrowClass;
        this.figure.setEndArrowClass(endArrowClass);
        const startBranchLinePattern = startBranchView.figure.linePattern;
        const linePattern =
          isLineTapered &&
          !Object(utils.isHandDrawnLinePattern)(startBranchLinePattern)
            ? LINE_PATTERN.SOLID
            : startBranchLinePattern;
        this.figure.setLinePattern(linePattern);
        this.figure.setLineShape(startBranchView.figure.lineShape);
        this.figure.setLineWidth(startBranchView.figure.lineWidth);
        this.figure.setLineColor(parentBranchView.figure.lineColor);
        this.figure.setLineTapered(isLineTapered);
      });
    }
  }
  getLineShape() {
    return styleManager.getStyleValue(this.parent(), STYLE_KEYS.LINE_CLASS);
  }
  getLineWidth() {
    return parseInt(
      `${styleManager.getStyleValue(this.parent().parent(), STYLE_KEYS.LINE_WIDTH) || 1}`
    );
  }
  getLineTapered() {
    let _a;
    const isSheetTapered =
      this.getContext().getSheetView().figure.lineTapered ===
      LINETAPERED.TAPERED;
    return (
      isSheetTapered &&
      Object(utils.isCentralBranch)(
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent()
      ) &&
      !Object(utils.isSummaryBranch)(this.parent()) &&
      !Object(utils.isTimeLineMainBranch)(this.parent())
    );
  }
  /** @deprecated */
  setPathDirty() {
    this.figure.invalidatePath();
    if (
      this.getContext()
        .getModule(MODULE_NAME.SEMAPHORE)
        .isStatusActive(UI_STATUS.FILTER_MODE)
    ) {
      this.figure.setOpacity(FILTER_MODE_OPACITY);
    }
  }
  /** @deprecated */
  attr(args) {
    //should pass in a obj.
    if (arguments.length > 1) {
      throw "Dont use this way";
    }
    // if (_.isObject(args) && args.d !== undefined) {
    //   this.figure.connectionPathTransform({ x: 0, y: 0 }, true)
    // }
    // fix bug about stroke-width: 0
    // while setting stroke-width to 0, the summary connect line still visible.
    if (
      args["stroke-width"] === "0" &&
      this.endBranch.model.type() !== TOPIC_TYPE.CALLOUT
    ) {
      args.d = "";
    }
    this.figure.connectionPathAttr(args);
    let lw = parseInt(args["stroke-width"]);
    if (isNaN(lw)) {
      lw = undefined;
    } else {
      lw += 5;
    }
    this.figure.connectionSelectBoxAttr(
      Object.assign({}, args, {
        "stroke-width": lw,
        opacity: undefined,
      })
    );
    return this;
  }
  //悬浮在summary topic上，或者被选中时
  activate(transparent) {
    this.figure.connectionSelectBoxAttr({
      opacity: transparent ? "0.2" : "0.5",
    });
  }
  //取消选中状态，去掉遮罩
  deactivate() {
    this.figure.connectionSelectBoxAttr({
      opacity: "0",
    });
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.arrowSelector.dispose();
    this.clearReactions();
    this.parent(null);
    return this;
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this._isForcedInvisible);
  }
  getSvg() {
    return this.figure.getContent();
  }
}

export default ConnectionView;
