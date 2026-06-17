import figures from "../figures/index";
import { VIEW_TYPE, FIGURE_TYPE, CONFIG } from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import SvgComponentView from "./svgcomponentview";
import * as utils from "../utils/index";
import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";
import { TopicSelectBoxDrag } from "../modules/svgdraggable/topicselectbox";

export class TopicSelectBoxView extends SvgComponentView {
  _padding: number;
  _selectboxWidth: number;
  SIDE: { LEFT: string; RIGHT: string };
  _topicSelectBoxDrag: any;
  refView: any;
  figure: any;
  leftBarSvg: any;
  rightBarSvg: any;
  _barWidth: number;
  constructor(refView) {
    super();
    this._padding = layoutConstant.TOPIC_SELECTBOX_PADDING; // SLECTBOX_CLICK_PADDING
    this._selectboxWidth = layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH; // topicShapeSelectBox.strokeWidth
    this.SIDE = {
      LEFT: "left",
      RIGHT: "right",
    };
    this._topicSelectBoxDrag = null;
    /* dom elements */
    this.refView = refView;
    this.figure = figures.createFigure(this);
    this.leftBarSvg = this.figure.renderWorker.leftBarSvg;
    this.rightBarSvg = this.figure.renderWorker.rightBarSvg;
    // 响应鼠标拖拽区域的宽度，区分不同平台
    this._barWidth = this.refView.getContext().isMobilePlatform() ? 21 : 7;
  }
  get type() {
    return VIEW_TYPE.TOPIC_SELECT_BOX;
  }
  get figureType() {
    return FIGURE_TYPE.TOPIC_SELECT_BOX;
  }
  get _style() {
    return {
      topicShapeSelectBox: {
        "stroke-width": layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH,
        stroke: "#2ebdff",
        fill: "none",
      },
      topicShapeSelectBox__mouseover: {
        "stroke-opacity": "0.5",
        stroke: "#2ebdff",
      },
      topicShapeSelectBox__selected: {
        "stroke-opacity": "1",
        fill: "none",
      },
      topicShapeSelectBox__deFocus: {
        "stroke-opacity": "1",
        stroke: "#9f9f9f",
        fill: "none",
      },
      topicShapeSelectBox__intersected: {
        "stroke-width": layoutConstant.TOPIC_SELECTBOX_STROKE_WIDTH,
        stroke: "#2ebdff",
        fill: "none",
      },
    };
  }
  size(width, height) {
    this.figure.setSize({
      width,
      height,
    });
  }
  path(path) {
    this.figure.setTopicSelectBoxPath(path);
    const enableDrag = !this.getContext().config(
      CONFIG.NO_TOPIC_CUSTOM_WIDTH_BTN,
    );
    const isNotStandinBranch = !this.refView.parent()?.originBranchView;
    if (enableDrag && isNotStandinBranch) {
      this.renderCustomWidthControlBar();
      if (!this._topicSelectBoxDrag) {
        this._topicSelectBoxDrag = new TopicSelectBoxDrag(this);
        this._topicSelectBoxDrag.init();
      }
    }
  }
  attr(name, value) {
    this.figure.setTopicSelectBoxAttr({
      [name]: value,
    });
  }
  hover() {
    this.figure.setHover();
  }
  active() {
    this.figure.setActive();
  }
  hide() {
    this.figure.setHide();
  }
  defocus() {
    this.figure.setDefocus();
  }
  /**
   * @description 图片拖拽进入时候的样式改变
   * */
  intersect() {
    this.figure.setIntersect();
  }
  renderCustomWidthControlBar(force?) {
    const { _barWidth, _padding, _selectboxWidth } = this;
    const topicView = this.refView;
    const lineWidth = topicView.figure.borderWidth || 0;
    const xyOffset = (lineWidth + _selectboxWidth) / 2;
    const forceSetAttr =
      force || Object(utils.isFixedAspectShapeBranch)(topicView.parent());
    const bounds = this.getDrawBounds();
    const barY = bounds.y - xyOffset - _padding + _selectboxWidth / 2;
    // const circleY = bounds.y + bounds.height / 2
    const leftX = bounds.x - xyOffset - _padding;
    const rightX = bounds.x + bounds.width + xyOffset + _padding;
    this.figure.setLeftBarAttr(
      {
        x: leftX - _barWidth / 2,
        y: barY,
        height: bounds.height + _padding * 2,
        width: _barWidth,
      },
      forceSetAttr,
    );
    this.figure.setRightBarAttr(
      {
        x: rightX - _barWidth / 2,
        y: barY,
        height: bounds.height + _padding * 2,
        width: _barWidth,
      },
      forceSetAttr,
    );
    // this.leftCircleSvg.attr({
    //   cx: leftX,
    //   cy: circleY,
    // })
    // this.rightCircleSvg.attr({
    //   cx: rightX,
    //   cy: circleY,
    // })
  }
  getDrawBounds(topicWidth?) {
    const topicView = this.refView;
    const lineWidth = topicView.figure.borderWidth || 0;
    const ts = getTopicShape(topicView.figure.shapeClass);
    const topicShapeBounds = Object.assign({}, topicView.shapeBounds);
    const applyBounds = topicShapeBounds;
    if (typeof topicWidth !== "undefined") {
      const deltaWidth = topicWidth - topicShapeBounds.width;
      applyBounds.width += deltaWidth;
    }
    const bounds = ts.getDrawBounds(applyBounds, lineWidth);
    return bounds;
  }
  getNewPositionAfterChangeWidth(side, deltaWidth) {
    const topicView = this.refView;
    const branchView = topicView.parent();
    const oldPosition =
      branchView === null || branchView === undefined
        ? undefined
        : branchView.getRealPosition();
    const svgView = topicView.getContext().getSVGView();
    const client = svgView
      .getCoordinateTransfer()
      .mindMapToViewport(oldPosition);
    if (side === this.SIDE.LEFT) {
      client.x -= (deltaWidth * svgView.currentScale) / 2;
    } else {
      client.x += (deltaWidth * svgView.currentScale) / 2;
    }
    const { x, y } = svgView.getCoordinateTransfer().viewportToMindMap(client);
    return {
      x,
      y,
    };
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.parent(null);
    return this;
  }
}

export default TopicSelectBoxView;
