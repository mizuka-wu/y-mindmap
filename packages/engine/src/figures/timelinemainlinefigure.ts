import Figure from "./figure";
import * as utils from "../utils/index";

export class TimelineMainlineFigure extends Figure {
  lineWidth: number;
  lineWidthDirty: boolean;
  lineColorDirty: boolean;
  lineStepPointsDirty: boolean;
  linePattern: any;
  linePatternDirty: boolean;
  direction: any;
  lineColor: any;
  startPosition: any;
  endPosition: any;
  lineStepPoints: any;
  constructor(viewController) {
    super(viewController);
    this.isVisible = true;
    this.isVisibleDirty = false;
    // line style
    this.lineWidth = utils.layoutConstant.TIMELINE.MAIN_LINE_WIDTH;
    this.lineWidthDirty = false;
    this.lineColorDirty = false;
    this.lineStepPointsDirty = false;
    this.linePattern = {};
    this.linePatternDirty = false;
  }
  setDirection(direction) {
    this.direction = direction;
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.isVisibleDirty = true;
    this.invalidatePaint();
  }
  setLineColor(lineColor) {
    this.lineColor = lineColor;
    this.lineColorDirty = true;
    this.invalidatePaint();
  }
  setLineWidth(lineWidth) {
    this.lineWidth = lineWidth;
    this.lineWidthDirty = true;
    this.invalidatePaint();
  }
  setStartPosition(position) {
    if (
      this.startPosition &&
      Object(utils.isSame)(position, this.startPosition)
    ) {
      return;
    }
    this.startPosition = position;
    this.invalidatePaint();
  }
  setEndPosition(position) {
    if (this.endPosition && Object(utils.isSame)(position, this.endPosition)) {
      return;
    }
    this.endPosition = position;
    this.invalidatePaint();
  }
  setLineStepPoints(points) {
    if (
      this.lineStepPoints &&
      Object(utils.isSame)(points, this.lineStepPoints)
    ) {
      return;
    }
    this.lineStepPoints = points;
    this.lineStepPointsDirty = true;
    this.invalidatePaint();
  }
  setLinePattern(linePattern) {
    if (
      this.linePattern &&
      Object(utils.isSame)(linePattern, this.linePattern)
    ) {
      return;
    }
    this.linePattern = linePattern;
    this.linePatternDirty = true;
    this.invalidatePaint();
  }
}
