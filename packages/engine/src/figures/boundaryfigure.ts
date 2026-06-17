import { action, makeObservable, observable } from "mobx";
import * as commonUtils from "../common/utils/index";

import { TitleAbleFigure } from "./titleablefigure";

export class BoundaryFigure extends TitleAbleFigure {
  lineColor: string;
  boundaryShapeSize: { width: number; height: number };
  lineColorDirty: boolean;
  linePattern: any;
  linePatternDirty: boolean;
  fillColor: any;
  fillColorDirty: boolean;
  borderWidth: any;
  borderWidthDirty: boolean;
  fillOpacity: any;
  fillOpacityDirty: boolean;
  shapeClass: any;
  shapeClassDirty: boolean;
  boundaryShapeSizeDirty: boolean;
  boundaryPath: any;
  boundaryPathDirty: boolean;
  boundaryFillPath: any;
  boundaryFillPathDirty: boolean;
  fillPattern: any;
  fillPatternDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.lineColor = "";
    this.boundaryShapeSize = {
      width: -1,
      height: -1,
    };
    this.isVisible = false;
    Object(makeObservable)(this, {
      lineColor: observable,
      setLineColor: action,
    });
  }
  setLineColor(lineColor) {
    if (this.lineColor !== lineColor) {
      this.lineColor = lineColor;
      this.lineColorDirty = true;
      this.invalidatePaint();
    }
  }
  setLinePattern(linePattern) {
    if (this.linePattern !== linePattern) {
      this.linePattern = linePattern;
      this.linePatternDirty = true;
      this.invalidatePaint();
    }
  }
  setFillColor(fillColor) {
    if (this.fillColor !== fillColor) {
      this.fillColor = fillColor;
      this.fillColorDirty = true;
      this.invalidatePaint();
    }
  }
  setBorderWidth(borderWidth) {
    borderWidth = parseInt(`${borderWidth}`);
    if (this.borderWidth !== borderWidth) {
      this.borderWidth = borderWidth;
      this.borderWidthDirty = true;
      this.linePatternDirty = true;
      this.invalidateLayout();
    }
  }
  setFillOpacity(fillOpacity) {
    if (this.fillOpacity !== fillOpacity) {
      this.fillOpacity = fillOpacity;
      this.fillOpacityDirty = true;
      this.invalidatePaint();
    }
  }
  setShapeClass(shapeClass) {
    if (this.shapeClass !== shapeClass) {
      this.shapeClass = shapeClass;
      this.shapeClassDirty = true;
      this.invalidatePaint();
    }
  }
  setBoundaryShapeSize(shapeSize) {
    const newSizeDirty =
      !this.boundaryShapeSize ||
      !Object(commonUtils.isSameSize)(this.boundaryShapeSize, shapeSize);
    if (!newSizeDirty) {
      return;
    }
    this.boundaryShapeSizeDirty = true;
    this.boundaryShapeSize = Object.assign({}, shapeSize);
    this.invalidateLayout();
    this.invalidatePaint();
  }
  setBoundaryPath(boundaryPath) {
    if (this.boundaryPath !== boundaryPath) {
      this.boundaryPath = boundaryPath;
      this.boundaryPathDirty = true;
      this.invalidatePaint();
    }
  }
  setBoundaryFillPath(boundaryFillPath) {
    if (this.boundaryFillPath !== boundaryFillPath) {
      this.boundaryFillPath = boundaryFillPath;
      this.boundaryFillPathDirty = true;
      this.invalidatePaint();
    }
  }
  setFillPattern(fillPattern) {
    if (this.fillPattern !== fillPattern) {
      this.fillPattern = fillPattern;
      this.fillPatternDirty = true;
      this.invalidatePaint();
    }
  }
}
