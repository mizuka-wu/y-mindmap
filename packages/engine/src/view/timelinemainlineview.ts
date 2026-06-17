import {
  VIEW_TYPE,
  FIGURE_TYPE,
  TOPIC_TYPE,
  STYLE_KEYS,
  DIRECTION,
} from "../common/constants/index";
import figures from "../figures/index";
import SvgComponentView from "./svgcomponentview";
import * as utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";
import { getStructure } from "../structures/helper/allstructures";
import * as commonUtils from "../common/utils/index";
export class TimelineMainLineView extends SvgComponentView {
  isVisible: boolean;
  timelineView: any;
  figure: any;

  constructor(parentView) {
    super();
    this.isVisible = true;
    this.timelineView = parentView;
    this.parent(parentView);
    this.figure = figures.createFigure(this);
    this._initEventListener();
    this._updateVisible();
    if (this.isVisible) {
      this._updateLineColor();
      this._updatePosition();
      this._updateLineWidth();
      this._updateLinePattern();
    }
  }
  get type() {
    return VIEW_TYPE.TIMELINE_MAIN_LINE;
  }
  get figureType() {
    return FIGURE_TYPE.TIMELINE_MAIN_LINE;
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible);
  }
  _initEventListener() {
    this.listenTo(this.timelineView, "refreshLineColor", this._updateLineColor);
    this.listenTo(this.timelineView, "refreshLineWidth", this._updateLineWidth);
    this.listenTo(
      this.timelineView,
      "refreshLinePattern",
      this._updateLinePattern,
    );
    this.listenTo(
      this.timelineView,
      "afterRealPosChange",
      this._updatePosition,
    );
    this.listenTo(this.timelineView, "refreshView", () => {
      this._updatePosition();
      this._updateVisible();
    });
  }
  _updateVisible() {
    this.isVisible =
      !this.timelineView.model.isCollapse() &&
      this.timelineView.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED).length >
        0;
    this.setVisible(this.isVisible);
  }
  _updateLineColor() {
    const multiLineColor = styleManager.getStyleValue(
      this.getContext().getSheetView(),
      STYLE_KEYS.MULTI_LINE_COLORS,
    );
    let lineColor;
    if (multiLineColor && multiLineColor !== "none") {
      const children = this.timelineView.getChildrenBranchesByType(
        TOPIC_TYPE.ATTACHED,
      );
      lineColor = styleManager.getStyleValue(
        children[children.length - 1] ?? this.timelineView,
        STYLE_KEYS.LINE_COLOR,
      );
    } else {
      lineColor = styleManager.getStyleValue(
        this.timelineView,
        STYLE_KEYS.LINE_COLOR,
      );
    }
    this.figure.setLineColor(lineColor);
  }
  _updateLinePattern() {
    const lineWidth = parseInt(
      styleManager.getStyleValue(this.timelineView, STYLE_KEYS.LINE_WIDTH),
    );
    const linePatternType = styleManager.getStyleValue(
      this.timelineView,
      STYLE_KEYS.LINE_PATTERN,
    );
    const linePattern = Object(utils.getLinePattenAttr)(
      linePatternType,
      lineWidth,
    );
    this.figure.setLinePattern(linePattern);
  }
  _updateLineWidth() {
    const lineWidth = styleManager.getStyleValue(
      this.timelineView,
      STYLE_KEYS.LINE_WIDTH,
    );
    this.figure.setLineWidth(parseInt(lineWidth));
  }
  _calcStartPosition(direction) {
    const timelineViewShape = Object(utils.getTopicShape)(this.timelineView);
    return Object(commonUtils.addPoint)(
      timelineViewShape.getBasePoint(this.timelineView, direction),
      timelineViewShape.getPointOffset(this.timelineView, direction),
    );
  }
  _calcEndPosition(startPos, direction) {
    const children = this.timelineView.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    let endPosX = 0;
    let endPosY = 0;
    if (direction === DIRECTION.RIGHT) {
      // for timeline sided horizontal
      const rightMostPosOffsetX =
        children.reduce(
          (offsetX, { position, boundaryBounds }) =>
            Math.max(
              offsetX,
              position.x + boundaryBounds.width + boundaryBounds.x,
            ),
          0,
        ) -
        this.timelineView.topicView.shapeBounds.width / 2;
      endPosX = startPos.x + rightMostPosOffsetX;
      endPosY = startPos.y;
    }
    return {
      x: endPosX,
      y: endPosY,
    };
  }
  _calcStepPoints(startPos, direction) {
    const { x: startPosX, y: startPosY } = startPos;
    const childrenDirectionsList = Object(utils.getFinalTimelineChildDirection)(
      this.timelineView,
    );
    return this.timelineView
      .getChildrenBranchesByType(TOPIC_TYPE.ATTACHED)
      .map((childBranch, i) => {
        const childInDirection = Object(utils.getReverseDir)(
          childrenDirectionsList[i],
        );
        const { x: childShapeOffsetX, y: childShapeOffsetY } = Object(
          utils.getTopicShape,
        )(childBranch).getBasePoint(childBranch, childInDirection);
        if (direction === DIRECTION.RIGHT) {
          return {
            x: childBranch.position.x + childShapeOffsetX,
            y: startPosY,
          };
        } else if (direction === DIRECTION.DOWN) {
          return {
            x: startPosX,
            y: childBranch.position.y + childShapeOffsetY,
          };
        } else {
          return {
            x: 0,
            y: 0,
          };
        }
      });
  }
  _updatePosition() {
    const direction = getStructure(
      this.timelineView.getStructureClass(),
    ).getRangeGrowthDirection();
    const children = this.timelineView.getChildrenBranchesByType(
      TOPIC_TYPE.ATTACHED,
    );
    if (children.length > 0) {
      const startPos = this._calcStartPosition(direction);
      const endPos = this._calcEndPosition(startPos, direction);
      const stepPoints = this._calcStepPoints(startPos, direction);
      this.figure.setStartPosition(startPos);
      this.figure.setEndPosition(endPos);
      this.figure.setLineStepPoints(stepPoints);
    }
  }
  remove() {
    this.figure.dispose();
    this.stopListening();
    this.parent(null);
    return this;
  }
}

export default TimelineMainLineView;
