import { action, makeObservable, observable } from "mobx";
import { LINE_PATTERN, FILL_PATTERN } from "../common/constants/index";

import { TitleAbleFigure } from "./titleablefigure";

export class TopicFigure extends TitleAbleFigure {
  borderWidth: number;
  borderWidthDirty: boolean;
  borderColor: string;
  borderColorDirty: boolean;
  fillColor: string;
  fillColorDirty: boolean;
  originalFillColor: string;
  visualFillColor: string;
  forceAlignmentWidth: null;
  forceAlignmentWidthDirty: boolean;
  fillPattern: string;
  borderLinePattern: string;
  borderLinePatternDirty: boolean;
  lineCorner: any;
  lineCornerDirty: boolean;
  marginTop: any;
  marginLeft: any;
  marginRight: any;
  marginBottom: any;
  minimumWidth: any;
  fillPatternDirty: boolean;
  fillGradient: any;
  fillGradientDirty: boolean;
  isGradientColor: any;
  isGradientColorDirty: boolean;
  shapeClass: any;
  shapeClassDirty: boolean;
  topicShapePath: any;
  topicShapePathDirty: boolean;
  topicShapeFillPath: any;
  topicShapeFillPathDirty: boolean;
  topicShapeMaskAttrD: any;
  topicShapeMaskDirty: boolean;
  topicShapeGroupPosition: any;
  topicShapeGroupPositionDirty: boolean;
  topicContentPosition: any;
  topicContentPositionDirty: boolean;
  topicInnerElementPosition: any;
  topicInnerElementPositionDirty: boolean;
  customWidth: any;
  constructor(viewController) {
    super(viewController);
    this.borderWidth = 0;
    this.borderWidthDirty = true;
    this.borderColor = "";
    this.borderColorDirty = true;
    this.fillColor = "";
    this.fillColorDirty = true;
    // @link https://gitlab.xmind.cn/xmind/snowbrush/issues/1050
    this.originalFillColor = "";
    this.visualFillColor = "";
    this.forceAlignmentWidth = null;
    this.forceAlignmentWidthDirty = true;
    this.fillPattern = FILL_PATTERN.SOLID;
    this.borderLinePattern = LINE_PATTERN.SOLID;
    this.borderLinePatternDirty = false;
    Object(makeObservable)(this, {
      borderColor: observable,
      setBorderColor: action,
      borderWidth: observable,
      setBorderWidth: action,
      fillColor: observable,
      setFillColor: action,
      originalFillColor: observable,
      setOriginalFillColor: action,
      visualFillColor: observable,
      setVisualFillColor: action,
      fillPattern: observable,
      setFillPattern: action,
      borderLinePattern: observable,
      setBorderLinePattern: action,
    });
  }
  setLineCorner(lineCorner) {
    if (this.lineCorner !== lineCorner) {
      this.lineCorner = lineCorner;
      this.lineCornerDirty = true;
    }
  }
  setMarginTop(marginTop) {
    if (this.marginTop !== marginTop) {
      this.marginTop = marginTop;
      this.invalidateLayout();
    }
  }
  setMarginLeft(marginLeft) {
    if (this.marginLeft !== marginLeft) {
      this.marginLeft = marginLeft;
      this.invalidateLayout();
    }
  }
  setMarginRight(marginRight) {
    if (this.marginRight !== marginRight) {
      this.marginRight = marginRight;
      this.invalidateLayout();
    }
  }
  setMarginBottom(marginBottom) {
    if (this.marginBottom !== marginBottom) {
      this.marginBottom = marginBottom;
      this.invalidateLayout();
    }
  }
  setMinimumWidth(minimumWidth) {
    this.minimumWidth = minimumWidth;
  }
  setBorderColor(borderColor) {
    if (this.borderColor !== borderColor) {
      this.borderColor = borderColor;
      this.borderColorDirty = true;
      this.invalidatePaint();
    }
  }
  setBorderWidth(borderWidth) {
    borderWidth = parseInt(`${borderWidth}`);
    if (this.borderWidth !== borderWidth) {
      this.borderWidth = borderWidth;
      this.borderLinePatternDirty = true;
      this.borderWidthDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setBorderLinePattern(linePattern) {
    if (this.borderLinePattern !== linePattern) {
      this.borderLinePattern = linePattern;
      this.borderLinePatternDirty = true;
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
  setOriginalFillColor(fillColor) {
    this.originalFillColor = fillColor;
  }
  setVisualFillColor(fillColor) {
    this.visualFillColor = fillColor;
  }
  setFillPattern(fillPattern) {
    if (this.fillPattern !== fillPattern) {
      this.fillPattern = fillPattern;
      this.fillPatternDirty = true;
      this.invalidatePaint();
    }
  }
  setFillGradient(fillGradient) {
    if (this.fillGradient !== fillGradient) {
      this.fillGradient = fillGradient;
      this.fillGradientDirty = true;
      this.invalidatePaint();
    }
  }
  setGradientColor(isGradientColor) {
    if (this.isGradientColor !== isGradientColor) {
      this.isGradientColor = isGradientColor;
      this.isGradientColorDirty = true;
      this.invalidatePaint();
    }
  }
  setShapeClass(shapeClass) {
    if (this.shapeClass !== shapeClass) {
      this.shapeClass = shapeClass;
      this.shapeClassDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setTopicShapePath(topicShapePath) {
    if (this.topicShapePath !== topicShapePath) {
      this.topicShapePath = topicShapePath;
      this.topicShapePathDirty = true;
      this.invalidatePaint();
    }
  }
  setTopicShapeFillPath(topicShapeFillPath) {
    if (this.topicShapeFillPath !== topicShapeFillPath) {
      this.topicShapeFillPath = topicShapeFillPath;
      this.topicShapeFillPathDirty = true;
      this.invalidatePaint();
    }
  }
  setTopicShapeMaskAttrD(d) {
    if (this.topicShapeMaskAttrD !== d) {
      this.topicShapeMaskAttrD = d;
      this.topicShapeMaskDirty = true;
      this.invalidatePaint();
    }
  }
  setTopicShapeGroupPosition(topicShapeGroupPosition) {
    const newPositionDirty =
      !this.topicShapeGroupPosition ||
      this.topicShapeGroupPosition.x !== topicShapeGroupPosition.x ||
      this.topicShapeGroupPosition.y !== topicShapeGroupPosition.y;
    if (newPositionDirty) {
      this.topicShapeGroupPositionDirty = newPositionDirty;
    }
    this.topicShapeGroupPosition = Object.assign({}, topicShapeGroupPosition);
    if (this.topicShapeGroupPositionDirty) {
      this.invalidatePaint();
    }
  }
  setTopicContentPosition(topicContentPosition) {
    const newPositionDirty =
      !this.topicContentPosition ||
      this.topicContentPosition.x !== topicContentPosition.x ||
      this.topicContentPosition.y !== topicContentPosition.y;
    if (newPositionDirty) {
      this.topicContentPositionDirty = newPositionDirty;
    }
    this.topicContentPosition = Object.assign({}, topicContentPosition);
    if (this.topicContentPositionDirty) {
      this.invalidatePaint();
    }
  }
  setTopicInnerElementPosition(topicInnerElementPosition) {
    const newPositionDirty =
      !this.topicInnerElementPosition ||
      this.topicInnerElementPosition.x !== topicInnerElementPosition.x ||
      this.topicInnerElementPosition.y !== topicInnerElementPosition.y;
    if (newPositionDirty) {
      this.topicInnerElementPositionDirty = newPositionDirty;
    }
    this.topicInnerElementPosition = Object.assign(
      {},
      topicInnerElementPosition,
    );
    if (this.topicInnerElementPositionDirty) {
      this.invalidatePaint();
    }
  }
  setCustomWidth(customWidth) {
    if (this.customWidth !== customWidth) {
      this.customWidth = customWidth;
      this.invalidateLayout();
    }
  }
  setForceAlignmentWidth(forceAlignmentWidth) {
    if (this.forceAlignmentWidth !== forceAlignmentWidth) {
      this.forceAlignmentWidth = forceAlignmentWidth;
      this.manuallyLayout();
    }
  }
}
