import { action, makeObservable, observable } from "mobx";
import { ARROW_CLASS } from "../common/constants/index";

import { TitleAbleFigure } from "./titleablefigure";

export class RelationshipFigure extends TitleAbleFigure {
  lineWidth: number;
  lineWidthDirty: boolean;
  lineColor: string;
  lineColorDirty: boolean;
  beginArrowClass: string;
  beginArrowClassDirty: boolean;
  endArrowClass: string;
  endArrowClassDirty: boolean;
  linePatternDirty: boolean;
  lineStyle: any;
  lineStyleDirty: boolean;
  linePattern: any;
  posInfo: any;
  posInfoDirty: boolean;
  relationshipMaskD: any;
  relationshipMaskDirty: boolean;
  maskVisible: any;
  maskVisibleDirty: boolean;
  relationshipPath: any;
  relationshipPathDirty: boolean;
  controlLine1Path: any;
  controlLine1PathDirty: boolean;
  controlLine2Path: any;
  controlLine2PathDirty: boolean;
  startPoint1Radius: any;
  startPoint1RadiusDirty: boolean;
  startPoint2Radius: any;
  startPoint2RadiusDirty: boolean;
  controlPoint1Radius: any;
  controlPoint1RadiusDirty: boolean;
  controlPoint2Radius: any;
  controlPoint2RadiusDirty: boolean;
  controlPointGroupVisible: any;
  controlPointGroupVisibleDirty: boolean;
  pointerEventsNone: any;
  pointerEventsNoneDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.lineWidth = 0;
    this.lineWidthDirty = true;
    this.lineColor = "";
    this.lineColorDirty = true;
    this.beginArrowClass = ARROW_CLASS.NONE;
    this.beginArrowClassDirty = true;
    this.endArrowClass = ARROW_CLASS.NONE;
    this.endArrowClassDirty = true;
    Object(makeObservable)(this, {
      lineColor: observable,
      setLineColor: action,
      beginArrowClass: observable,
      setBeginArrowClass: action,
      endArrowClass: observable,
      setEndArrowClass: action,
    });
  }
  setLineWidth(lineWidth) {
    lineWidth = parseInt(`${lineWidth}`);
    if (this.lineWidth !== lineWidth) {
      this.lineWidth = lineWidth;
      this.lineWidthDirty = true;
      this.linePatternDirty = true;
      this.invalidatePaint();
      this.invalidateLayout();
    }
  }
  setLineColor(lineColor) {
    if (this.lineColor !== lineColor) {
      this.lineColor = lineColor;
      this.lineColorDirty = true;
      this.invalidatePaint();
    }
  }
  setLineStyle(lineStyle) {
    if (this.lineStyle !== lineStyle) {
      this.lineStyle = lineStyle;
      this.lineStyleDirty = true;
      this.invalidatePaint();
      this.invalidateLayout();
    }
  }
  setLinePattern(linePattern) {
    if (this.linePattern !== linePattern) {
      this.linePattern = linePattern;
      this.linePatternDirty = true;
      this.invalidatePaint();
      this.invalidateLayout();
    }
  }
  setPosInfo(posInfo) {
    this.posInfo = posInfo;
    this.posInfoDirty = true;
    this.invalidatePaint();
  }
  setRelationshipMaskD(d) {
    if (this.relationshipMaskD !== d) {
      this.relationshipMaskD = d;
      this.relationshipMaskDirty = true;
      this.invalidatePaint();
    }
  }
  setMaskVisible(maskVisible) {
    if (this.maskVisible !== maskVisible) {
      this.maskVisible = maskVisible;
      this.maskVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setRelationshipPath(relationshipPath) {
    if (this.relationshipPath !== relationshipPath) {
      this.relationshipPath = relationshipPath;
      this.relationshipPathDirty = true;
      this.invalidatePaint();
    }
  }
  setControlLine1Path(controlLine1Path) {
    if (this.controlLine1Path !== controlLine1Path) {
      this.controlLine1Path = controlLine1Path;
      this.controlLine1PathDirty = true;
      this.invalidatePaint();
    }
  }
  setControlLine2Path(controlLine2Path) {
    if (this.controlLine2Path !== controlLine2Path) {
      this.controlLine2Path = controlLine2Path;
      this.controlLine2PathDirty = true;
      this.invalidatePaint();
    }
  }
  setStartPoint1Radius(radius) {
    if (
      !this.startPoint1Radius ||
      radius.rx !== this.startPoint1Radius.rx ||
      radius.ry !== this.startPoint1Radius.ry
    ) {
      this.startPoint1Radius = radius;
      this.startPoint1RadiusDirty = true;
      this.invalidatePaint();
    }
  }
  setStartPoint2Radius(radius) {
    if (
      !this.startPoint2Radius ||
      radius.rx !== this.startPoint2Radius.rx ||
      radius.ry !== this.startPoint2Radius.ry
    ) {
      this.startPoint2Radius = radius;
      this.startPoint2RadiusDirty = true;
      this.invalidatePaint();
    }
  }
  setControlPoint1Radius(radius) {
    if (
      !this.controlPoint1Radius ||
      radius.rx !== this.controlPoint1Radius.rx ||
      radius.ry !== this.controlPoint1Radius.ry
    ) {
      this.controlPoint1Radius = radius;
      this.controlPoint1RadiusDirty = true;
      this.invalidatePaint();
    }
  }
  setControlPoint2Radius(radius) {
    if (
      !this.controlPoint2Radius ||
      radius.rx !== this.controlPoint2Radius.rx ||
      radius.ry !== this.controlPoint2Radius.ry
    ) {
      this.controlPoint2Radius = radius;
      this.controlPoint2RadiusDirty = true;
      this.invalidatePaint();
    }
  }
  setControlPointGroupVisible(controlPointGroupVisible) {
    if (this.controlPointGroupVisible !== controlPointGroupVisible) {
      this.controlPointGroupVisible = controlPointGroupVisible;
      this.controlPointGroupVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setPointerEventsNone(pointerEventsNone) {
    if (this.pointerEventsNone !== pointerEventsNone) {
      this.pointerEventsNone = pointerEventsNone;
      this.pointerEventsNoneDirty = true;
      this.invalidatePaint();
    }
  }
  setBeginArrowClass(beginArrowClass) {
    if (this.beginArrowClass !== beginArrowClass) {
      this.beginArrowClass = beginArrowClass;
      this.beginArrowClassDirty = true;
      this.invalidatePaint();
      this.invalidateLayout();
    }
  }
  setEndArrowClass(endArrowClass) {
    if (this.endArrowClass !== endArrowClass) {
      this.endArrowClass = endArrowClass;
      this.endArrowClassDirty = true;
      this.invalidatePaint();
      this.invalidateLayout();
    }
  }
}
