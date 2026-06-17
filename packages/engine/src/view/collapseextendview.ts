import {
  VIEW_TYPE,
  FIGURE_TYPE,
  EVENTS,
  MODULE_NAME,
  VISUAL_BACK_COLOR,
  CONFIG,
  UI_STATUS,
  TOPIC_TYPE,
  DIRECTION,
} from "../common/constants/index";
import * as lazyRunner from "../figures/lazyrunner/index";
import * as utils from "../utils/index";
import { layoutConstant } from "../utils/layoutconstant";
import { getStructure } from "../structures/helper/allstructures";
import figures from "../figures/index";
import SvgComponentView from "./svgcomponentview";
const { EXT_RADIUS, COL_RADIUS } = layoutConstant;
const RADIUS = Math.max(EXT_RADIUS, COL_RADIUS);
const BIGGEST_NUM = 99;
const FONT_INFO = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: 10,
  fontWeight: 300,
};
const ELLIP_FONT_FINO = {
  fontFamily: "Helvetica, Arial, sans-serif",
  fontSize: 12,
  fontWeight: 500,
};
export class CollapseExtendView extends SvgComponentView {
  bounds: { x: number; y: number; width: number; height: number };
  _hide: boolean;
  figure: any;
  model: any;
  constructor(model) {
    super({
      model,
    });
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this._hide = false;
    this.model = model;
    this.figure = figures.createFigure(this);
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.COLLAPSE_EXTEND;
  }
  get figureType() {
    return FIGURE_TYPE.COLLAPSE_EXTEND;
  }
  initEventsListener() {
    this.listenTo(this.model, "change:branch", () => {
      this.render();
    });
    this.listenTo(
      this.model,
      EVENTS.SE_BRANCH_COLLAPSE_TOGGLE,
      (isCollapse) => {
        let _a;
        const target = this.parent();
        if ((_a = this.getContext()) === null || _a === undefined) {
          // do nothing
        } else {
          _a.trigger(EVENTS.SE_BRANCH_COLLAPSE_TOGGLE, [
            {
              target,
              oldValue: !isCollapse,
              newValue: isCollapse,
            },
          ]);
        }
      },
    );
  }
  afterAncestorChange() {
    let _a;
    super.afterAncestorChange();
    const parentBranchView =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent();
    if (!parentBranchView) {
      return;
    }
    this.addAutoRun(() => {
      this.refreshBackground();
    });
    this.addAutoRun(() => {
      let _a;
      let _b;
      this.setLineColor(
        (_b =
          (_a = this.parent()) === null || _a === undefined
            ? undefined
            : _a.parent()) === null || _b === undefined
          ? undefined
          : _b.figure.lineColor,
      );
    });
    this.addAutoRun(() => {
      let _a;
      let _b;
      this.setLineWidth(
        ((_b =
          (_a = this.parent()) === null || _a === undefined
            ? undefined
            : _a.parent()) === null || _b === undefined
          ? undefined
          : _b.figure.lineWidth) ?? 0,
      );
    });
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  render() {
    // 展开收缩按钮被四个状态多重影响，故逻辑比较复杂：
    // 1. 若被 setExtColIconDisplay 接口设置了 this._hide，则隐藏`展开收缩`按钮，否则：
    // 2. this.topic.isCollapse() 若 topic 被收缩，则显示`展开`按钮，否则：
    // 3. this.config(CONFIG.HIDE_COLLAPSE_BTN) 是否隐藏`收缩`按钮，若否：
    // 4. 指定 topic 区域处于鼠标 hover 状态时，或 topic 被选中，则显示`收缩`按钮
    if (this.isHide()) {
      this.figure.setCollapseExtendVisible(false);
      return this;
    } else {
      this.figure.setCollapseExtendVisible(true);
    }
    const isCollapsed = this.model.isCollapse();
    if (isCollapsed) {
      this._renderExtBtn();
    } else {
      this._renderFoldBtn();
    }
    this.refreshStyles();
    return this;
  }
  /** @deprecated */
  refreshStyles() {}
  refreshBackground() {
    let _a;
    const backgroundCellBranchView = (
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent()
    )?.backGroundCellBranchView;
    if (
      backgroundCellBranchView &&
      backgroundCellBranchView.topicView &&
      !Object(utils.isTreeTableHeadBranch)(backgroundCellBranchView)
    ) {
      this.figure.setBackgroundColor(
        backgroundCellBranchView.topicView.figure.visualFillColor,
      );
    } else {
      if (!this.getContext()) {
        return;
      }
      const bgColor = this.getContext().getSheetView().figure.backgroundColor;
      const { snowballUtil } = Object(utils.getInjectModule)(
        MODULE_NAME.SNOWBALL,
      );
      this.figure.setBackgroundColor(
        snowballUtil.blendingColor(bgColor, VISUAL_BACK_COLOR),
      );
    }
  }
  _renderExtBtn() {
    let _a;
    this.setCollapseState(true);
    this.figure.setHoverAreaVisible(false);
    this.figure.setCollapseBtnVisible(false);
    // set Etext attr
    const branch =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent();
    if (!branch) {
      return;
    }
    const descendantNum =
      branch === null || branch === undefined
        ? undefined
        : branch.model.getDescendantList().length;
    let text;
    let fontInfo;
    if (descendantNum > BIGGEST_NUM) {
      text = "···";
      fontInfo = ELLIP_FONT_FINO;
    } else {
      text = descendantNum + "";
      fontInfo = FONT_INFO;
    }
    this.figure.setText(text);
    this.figure.setTextFontObj({
      "font-size": fontInfo.fontSize ?? 0,
      "font-family": fontInfo.fontFamily,
      "font-weight": fontInfo.fontWeight,
    });
    // cal position of Etext which is in the middle of ExtBtn
    const { width, height } = Object(utils.getTextSize)(text, fontInfo);
    const magicOffset = 0.5; // 基于美观设定的偏移值，并没有什么意义
    const x = (EXT_RADIUS * 2 - width) / 2;
    const y = EXT_RADIUS - height + magicOffset;
    this.figure.setTextTranslatePosition({
      x,
      y,
    });
  }
  _renderFoldBtn() {
    let _a;
    let _b;
    let _c;
    this.setCollapseState(false);
    const isHideCollapseBtn =
      this.config(CONFIG.HIDE_COLLAPSE_BTN) ||
      ((_b =
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent()) === null || _b === undefined
        ? undefined
        : _b.isUnableShowCollapseBtn());
    this.figure.setHoverAreaVisible(!isHideCollapseBtn);
    if (isHideCollapseBtn) {
      this.figure.setCollapseBtnVisible(false, true);
    } else {
      this.renderHoverArea();
      const branch =
        (_c = this.parent()) === null || _c === undefined
          ? undefined
          : _c.parent();
      if (branch) {
        this.figure.setCollapseBtnVisible(branch.isSelected);
      }
    }
  }
  setCollapseState(newState) {
    this.figure.setCollapseState(newState);
    if (this.figure.isCollapsedDirty && !newState) {
      const isDragging = this.getContext()
        .getActiveUIStatus()
        .includes(UI_STATUS.DRAG);
      if (!isDragging) {
        return;
      }
      lazyRunner.lazyRunner.work(
        lazyRunner.runnerConstants.PRIORITY.AFTER_EACH,
        {
          execute: () => {
            let _a;
            const parent =
              (_a = this.parent()) === null || _a === undefined
                ? undefined
                : _a.parent();
            if (parent) {
              const branchViewList = [parent];
              const allType = [
                TOPIC_TYPE.ATTACHED,
                TOPIC_TYPE.SUMMARY,
                TOPIC_TYPE.DETACHED,
                TOPIC_TYPE.CALLOUT,
              ];
              branchViewList.push(
                ...parent.getDescendantBranchesByType(...allType),
              );
              branchViewList.forEach((branchView) => {
                branchView.updatePolygon();
              });
            }
          },
        },
      );
    }
  }
  renderHoverArea() {
    let _a;
    const branch =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent();
    if (!branch) {
      return;
    }
    const topicShapeBounds = branch.topicView.shapeBounds;
    const structure = getStructure(branch.getStructureClass());
    const selectBoxPadding =
      layoutConstant.TOPIC_SELECTBOX_PADDING +
      layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH;
    const spacing = structure.calcSpacingMajor(branch) - selectBoxPadding;
    const orientation = structure.getSourceOrientation();
    let x;
    let y;
    let height;
    let width;
    if (orientation === DIRECTION.RIGHT) {
      x = topicShapeBounds.width / 2 + selectBoxPadding;
      y = -topicShapeBounds.height / 2;
      height = topicShapeBounds.height;
      width = spacing;
    } else if (orientation === DIRECTION.LEFT) {
      x = -topicShapeBounds.width / 2 - spacing - selectBoxPadding;
      y = -topicShapeBounds.height / 2;
      height = topicShapeBounds.height;
      width = spacing;
    } else if (orientation === DIRECTION.UP) {
      x = -topicShapeBounds.width / 2;
      y = -topicShapeBounds.height / 2 - spacing - selectBoxPadding;
      height = spacing;
      width = topicShapeBounds.width;
    } else if (orientation === DIRECTION.DOWN) {
      x = -topicShapeBounds.width / 2;
      y = topicShapeBounds.height / 2 + selectBoxPadding;
      height = spacing;
      width = topicShapeBounds.width;
    }
    this.figure.setHoverAreaAttr({
      x,
      y,
      height,
      width,
    });
  }
  setLineColor(color) {
    const { snowballUtil } = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBALL,
    );
    const lineColorRGBA = snowballUtil.hexStringToRgbObject(color);
    if (lineColorRGBA.a === 0) {
      delete lineColorRGBA.a;
    }
    this.figure.setLineColor(snowballUtil.rgbObjectToHexString(lineColorRGBA));
  }
  setLineWidth(newWidth) {
    this.figure.setLineWidth(Math.max(0, newWidth));
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
    const d = RADIUS * 2;
    this.bounds = {
      x,
      y,
      width: d,
      height: d,
    };
  }
  drawConnection(attr) {
    this.figure.setConnectPathAttr(attr);
  }
  show() {
    if (this.model.canCollapse() && !this.config(CONFIG.HIDE_COLLAPSE_BTN)) {
      this.figure.setCollapseExtendVisible(true);
      this._hide = false;
    }
  }
  hide() {
    this.figure.setCollapseExtendVisible(false);
    this._hide = true;
  }
  isHide() {
    return this._hide;
  }
  hover() {
    let _a;
    let _b;
    if (
      !this.isHide() &&
      !this.model.isCollapse() &&
      !this.config(CONFIG.HIDE_COLLAPSE_BTN) &&
      !((_b =
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent()) === null || _b === undefined
        ? undefined
        : _b.isUnableShowCollapseBtn())
    ) {
      this.figure.setCollapseBtnVisible(true);
    }
  }
  dehover() {
    if (!this.isHide() && !this.model.isCollapse()) {
      this.figure.setCollapseBtnVisible(false);
    }
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.clearReactions();
    this.parent(null);
    return this;
  }
}

export default CollapseExtendView;
