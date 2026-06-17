import {
  MODULE_NAME,
  TOPIC_MAX_CUSTOM_WIDTH,
  UI_STATUS,
  ACTION_NAMES,
} from "../../common/constants/index";
import { getTopicShape } from "../../figures/renderengine/svg/topicshapes/index";

export class TopicSelectBoxDrag {
  _topicSelectBoxView: any;
  _topicView: any;
  leftBarSvg: any;
  rightBarSvg: any;
  SIDE: any;
  _minTopicWidth: any;
  _startTopicWidth: any;
  constructor(topicSelectBoxView) {
    this._topicSelectBoxView = topicSelectBoxView;
    this._topicView = this._topicSelectBoxView.refView;
    this.leftBarSvg = this._topicSelectBoxView.leftBarSvg;
    this.rightBarSvg = this._topicSelectBoxView.rightBarSvg;
    this.SIDE = this._topicSelectBoxView.SIDE;
  }
  init() {
    const svgDraggableModule = this._topicView.getModule(
      MODULE_NAME.SVG_DRAGGABLE,
    );
    const draggableList = [
      {
        svg: this.leftBarSvg,
        side: this.SIDE.LEFT,
        target: "bar",
      },
      // { svg: this.leftCircleSvg, side: SIDE.LEFT, target: 'circle' },
      {
        svg: this.rightBarSvg,
        side: this.SIDE.RIGHT,
        target: "bar",
      },
      // { svg: this.rightCircleSvg, side: SIDE.RIGHT, target: 'circle' },
    ];
    draggableList.forEach((item) => {
      const register =
        svgDraggableModule === null || svgDraggableModule === undefined
          ? undefined
          : svgDraggableModule.draggable(item.svg);
      if (register === null || register === undefined) {
        // do nothing;
      } else {
        register
          .dragStart(this._onDragStart(item, register).bind(this))
          .dragMove(this._onDragMove(item).bind(this))
          .dragEnd(this._onDragEnd(item).bind(this));
      }
    });
  }
  _onDragStart(
    {
      side,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      target,
    },
    register,
  ) {
    return () => {
      const { _topicView } = this;
      this._minTopicWidth = _topicView.figure.minimumWidth || 100;
      this._startTopicWidth = _topicView.shapeBounds.width;
      let constraintMaxX;
      let constraintMinX;
      if (side === this.SIDE.LEFT) {
        constraintMaxX = this._startTopicWidth / 2 - this._minTopicWidth;
        constraintMinX = this._startTopicWidth / 2 - TOPIC_MAX_CUSTOM_WIDTH;
      } else {
        constraintMaxX = TOPIC_MAX_CUSTOM_WIDTH - this._startTopicWidth / 2;
        constraintMinX = this._minTopicWidth - this._startTopicWidth / 2;
      }
      register.updateConstraint({
        x: true,
        y: false,
        maxX: constraintMaxX,
        minX: constraintMinX,
      });
      this._topicView
        .getModule(MODULE_NAME.SEMAPHORE)
        .increase(UI_STATUS.DRAG_TOPIC_SELECT_BOX);
    };
  }
  _onDragMove({ side }) {
    return (info) => {
      const { _topicView, _minTopicWidth } = this;
      const delta = side === this.SIDE.LEFT ? -info.deltaX : info.deltaX;
      let width = this._startTopicWidth + delta;
      if (width > TOPIC_MAX_CUSTOM_WIDTH) {
        width = TOPIC_MAX_CUSTOM_WIDTH;
      } else if (width < _minTopicWidth) {
        width = _minTopicWidth;
      }
      const ts = getTopicShape(_topicView.figure.shapeClass);
      const bounds = this._topicSelectBoxView.getDrawBounds(width);
      if (side === this.SIDE.LEFT) {
        const actualDeltaX = width - this._startTopicWidth;
        bounds.x += -actualDeltaX;
      }
      ts.setTopicShapeSelectBox(_topicView, bounds);
    };
  }
  _onDragEnd({
    side,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    target,
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (info, e) => {
      const delta = side === this.SIDE.LEFT ? -info.deltaX : info.deltaX;
      const width = this._startTopicWidth + delta;
      const topicModel = this._topicView.model;
      let applyWidth = width;
      if (width > TOPIC_MAX_CUSTOM_WIDTH) {
        applyWidth = TOPIC_MAX_CUSTOM_WIDTH;
      } else if (width < this._minTopicWidth) {
        applyWidth = this._minTopicWidth;
      }
      // if the topic is floating, drag the bar should change its position.
      if (topicModel.isDetached()) {
        const actualDelta = applyWidth - this._startTopicWidth;
        const pos = this._topicSelectBoxView.getNewPositionAfterChangeWidth(
          side,
          actualDelta,
        );
        topicModel.changePosition({
          x: pos.x,
          y: pos.y,
        });
      }
      this._topicView
        .getContext()
        .execAction(ACTION_NAMES.CHANGE_TOPIC_CUSTOM_WIDTH, {
          customWidth: applyWidth,
          targets: [this._topicView.parent()],
        });
      this._topicView
        .getModule(MODULE_NAME.SEMAPHORE)
        .decrease(UI_STATUS.DRAG_TOPIC_SELECT_BOX);
      this._topicView
        .getContext()
        .afterRender()
        .then(() => {
          let _a;
          const ts = getTopicShape(this._topicView.figure.shapeClass);
          ts.setTopicShapeSelectBox(this._topicView, this._topicView.bounds);
          if (
            (_a = this._topicView.topicShapeSelectBox) === null ||
            _a === undefined
          ) {
            // do nothing
          } else {
            _a.renderCustomWidthControlBar(true);
          }
        });
    };
  }
}
