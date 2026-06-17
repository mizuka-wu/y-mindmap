import Figure from "./figure";
import { action, makeObservable, observable } from "mobx";
import { LINE_PATTERN, ARROW_CLASS } from "../common/constants/index";
import * as utils from "../common/utils/index";

export class ConnectionFigure extends Figure {
  pathAttrs: any;
  pathAttrsDirty: boolean;
  pathAttrsToPack: any;
  selectBoxAttrs: any;
  selectBoxAttrsDirty: boolean;
  selectBoxAttrsToPack: any;
  lineShape: string;
  lineShapeDirty: boolean;
  linePath: string;
  linePathDirty: boolean;
  lineColor: string;
  lineColorDirty: boolean;
  linePattern: string;
  linePatternDirty: boolean;
  lineWidth: number;
  lineTapered: boolean;
  pathDirty: boolean;
  clipDirty: boolean;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  endArrowClass: string;
  endArrowClassDirty: boolean;
  currentPath: string;
  connectionLineShape: any;
  constructor(viewController) {
    super(viewController);
    this.pathAttrs = {};
    this.pathAttrsDirty = true;
    this.pathAttrsToPack = {};
    this.selectBoxAttrs = {};
    this.selectBoxAttrsDirty = true;
    this.selectBoxAttrsToPack = {};
    this.lineShape = "";
    this.lineShapeDirty = true;
    this.linePath = "";
    this.linePathDirty = true;
    this.lineColor = "";
    this.lineColorDirty = true;
    this.linePattern = LINE_PATTERN.SOLID;
    this.linePatternDirty = true;
    this.lineWidth = 0;
    this.lineTapered = false;
    this.pathDirty = false;
    this.clipDirty = true;
    this.startPoint = {
      x: 0,
      y: 0,
    };
    this.endPoint = {
      x: 0,
      y: 0,
    };
    this.endArrowClass = ARROW_CLASS.NONE;
    this.endArrowClassDirty = true;
    this.currentPath = "";
    Object(makeObservable)(this, {
      lineColor: observable,
      setLineColor: action,
      lineWidth: observable,
      setLineWidth: action,
      lineShape: observable,
      setLineShape: action,
      endArrowClass: observable,
      setEndArrowClass: action,
      linePattern: observable,
      setLinePattern: action,
      linePath: observable,
      setLinePath: action,
    });
  }
  setLineShape(lineShape) {
    if (this.lineShape !== lineShape) {
      this.lineShape = lineShape;
      this.lineShapeDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setLinePath(linePath) {
    if (this.linePath !== linePath) {
      this.linePath = linePath;
      this.linePathDirty = true;
      this.invalidatePaint();
    }
  }
  setLineColor(lineColor) {
    if (this.lineColor !== lineColor) {
      this.lineColor = lineColor;
      this.lineColorDirty = true;
      this.invalidatePaint();
    }
  }
  setLinePattern(linePattern) {
    if (!linePattern) {
      linePattern = LINE_PATTERN.SOLID;
    }
    if (this.linePattern !== linePattern) {
      this.linePattern = linePattern;
      this.linePatternDirty = true;
      this.invalidatePaint();
    }
  }
  setLineWidth(lineWidth) {
    if (this.lineWidth !== lineWidth) {
      this.lineWidth = lineWidth;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setLineTapered(lineTapered) {
    if (this.lineTapered !== lineTapered) {
      this.lineTapered = lineTapered;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setEndArrowClass(arrowClass) {
    if (!arrowClass) {
      arrowClass = ARROW_CLASS.NONE;
    }
    if (this.endArrowClass !== arrowClass) {
      this.endArrowClass = arrowClass;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setStartPoint(startPoint) {
    this.startPoint = startPoint;
  }
  setEndPoint(endPoint) {
    this.endPoint = endPoint;
  }
  connectionPathAttr(attr) {
    const dr = utils.subtract(this.pathAttrs, attr) as any;
    if (Object.keys(dr).length > 0) {
      this.pathAttrsDirty = true;
      Object.assign(this.pathAttrs, dr);
      Object.assign(this.pathAttrsToPack, dr);
      if (typeof dr.d === "string") {
        this.currentPath = dr.d;
      }
      this.invalidatePaint();
    }
  }
  connectionSelectBoxAttr(attr) {
    const dr = utils.subtract(this.selectBoxAttrs, attr);
    if (Object.keys(dr).length > 0) {
      this.selectBoxAttrsDirty = true;
      Object.assign(this.selectBoxAttrs, dr);
      Object.assign(this.selectBoxAttrsToPack, dr);
      this.invalidatePaint();
    }
  }
  setConnectionLineShape(connectionLineShape) {
    this.connectionLineShape = connectionLineShape;
    this.invalidatePaint();
  }
  invalidatePath() {
    this.pathDirty = true;
    this.invalidatePaint();
  }
}
