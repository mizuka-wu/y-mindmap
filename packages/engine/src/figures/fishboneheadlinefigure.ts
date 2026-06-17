import Figure from "./figure";
import { LINE_PATTERN, DIRECTION } from "../common/constants/index";
import * as utils from "../utils/index";

export class FishBoneHeadLineFigure extends Figure {
  bodyWidth: number;
  styleWidth: number;
  lineColor: string;
  lineTapered: boolean;
  direction: string;
  linePattern: string;
  constructor(viewController) {
    super(viewController);
    this.bodyWidth =
      utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_MIN_BODY_WIDTH;
    this.styleWidth = 0;
    this.lineColor = "";
    this.lineTapered = false;
    this.direction = DIRECTION.RIGHT;
    this.linePattern = LINE_PATTERN.SOLID;
  }
  setBodyWidth(bodyWidth) {
    bodyWidth = Math.max(
      bodyWidth,
      utils.layoutConstant.FISH_BONE.HEAD_BONE_LINE_MIN_BODY_WIDTH,
    );
    if (bodyWidth === this.bodyWidth) {
      return;
    }
    this.bodyWidth = bodyWidth;
    this.invalidatePaint();
  }
  setStyleWidth(styleWidth) {
    if (this.styleWidth === styleWidth) {
      return;
    }
    this.styleWidth = styleWidth;
    this.invalidatePaint();
  }
  setLineColor(lineColor) {
    if (this.lineColor === lineColor) {
      return;
    }
    this.lineColor = lineColor;
    this.invalidatePaint();
  }
  setLineTapered(lineTapered) {
    if (this.lineTapered === lineTapered) {
      return;
    }
    this.lineTapered = lineTapered;
    this.invalidatePaint();
  }
  setDirection(direction) {
    if (this.direction === direction) {
      return;
    }
    this.direction = direction;
    this.invalidatePaint();
  }
  setLinePattern(linePattern) {
    if (this.linePattern === linePattern) {
      return;
    }
    this.linePattern = linePattern;
    this.invalidatePaint();
  }
}
