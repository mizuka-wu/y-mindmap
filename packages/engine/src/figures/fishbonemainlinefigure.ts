import Figure from "./figure";
import { action, makeObservable, observable } from "mobx";
import { LINE_PATTERN, ARROW_CLASS } from "../common/constants/index";
import * as utils from "../utils/index";

export class FishBoneMainLineFigure extends Figure {
  styleWidth: number;
  lineColor: string;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
  lineTapered: boolean;
  linePattern: string;
  endArrowClass: string;
  constructor(viewController) {
    super(viewController);
    this.styleWidth = 0;
    this.lineColor = "";
    this.startPosition = {
      x: 0,
      y: 0,
    };
    this.endPosition = {
      x: 0,
      y: 0,
    };
    this.lineTapered = false;
    this.linePattern = LINE_PATTERN.SOLID;
    this.endArrowClass = ARROW_CLASS.NONE;
    Object(makeObservable)(this, {
      lineColor: observable,
      setLineColor: action,
      endArrowClass: observable,
      setEndArrowClass: action,
    });
  }
  setStartPosition(startPosition) {
    if (Object(utils.isSame)(this.startPosition, startPosition)) {
      return;
    }
    this.startPosition = startPosition;
    this.invalidatePaint();
  }
  setEndPosition(endPosition) {
    if (Object(utils.isSame)(this.endPosition, endPosition)) {
      return;
    }
    this.endPosition = endPosition;
    this.invalidatePaint();
  }
  setLineTapered(lineTapered) {
    if (this.lineTapered === lineTapered) {
      return;
    }
    this.lineTapered = lineTapered;
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
  setLinePattern(linePattern) {
    if (this.linePattern === linePattern) {
      return;
    }
    this.linePattern = linePattern;
    this.invalidatePaint();
  }
  setEndArrowClass(arrowClass) {
    if (!arrowClass) {
      arrowClass = ARROW_CLASS.NONE;
    }
    this.endArrowClass = arrowClass;
    this.invalidatePaint();
  }
}
