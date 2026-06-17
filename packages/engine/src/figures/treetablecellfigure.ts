import Figure from "./figure";
import { LINE_PATTERN } from "../common/constants/index";
import * as utils from "../utils/index";

export class TreeTableCellFigure extends Figure {
  cellBoundsPosition: { x: number; y: number };
  cellBoundsPositionDirty: boolean;
  borderLineWidth: number;
  borderLineWidthDirty: boolean;
  borderLineColor: string;
  borderLineColorDirty: boolean;
  fillColor: string;
  fillColorDirty: boolean;
  fillPattern: string;
  fillPatternDirty: boolean;
  selectBoxAttr: any;
  selectBoxAttrDirty: boolean;
  borderLinePattern: string;
  borderLinePatternDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.size = {
      width: 0,
      height: 0,
    };
    this.sizeDirty = false;
    this.cellBoundsPosition = {
      x: 0,
      y: 0,
    };
    this.cellBoundsPositionDirty = false;
    this.borderLineWidth = 0;
    this.borderLineWidthDirty = false;
    this.borderLineColor = "";
    this.borderLineColorDirty = false;
    this.fillColor = "";
    this.fillColorDirty = false;
    this.fillPattern = "";
    this.fillPatternDirty = false;
    this.selectBoxAttr = {};
    this.selectBoxAttrDirty = false;
    this.borderLinePattern = LINE_PATTERN.SOLID;
    this.borderLinePatternDirty = false;
  }
  setSize(size) {
    const newSizeDirty = !this.size || !Object(utils.isSame)(this.size, size);
    if (!newSizeDirty) {
      return;
    }
    this.sizeDirty = true;
    this.size = Object.assign({}, size);
    this.invalidatePaint();
  }
  setCellBoundsPosition(position) {
    const positionDirty =
      !position ||
      this.cellBoundsPosition.x !== position.x ||
      this.cellBoundsPosition.y !== position.y;
    if (!positionDirty) {
      return;
    }
    this.cellBoundsPositionDirty = true;
    this.cellBoundsPosition = Object.assign({}, position);
    this.invalidatePaint();
  }
  setBorderLineWidth(borderLineWidth) {
    if (this.borderLineWidth === borderLineWidth) {
      return;
    }
    this.borderLineWidthDirty = true;
    this.borderLineWidth = borderLineWidth;
    this.invalidatePaint();
  }
  setBorderLineColor(borderLineColor) {
    if (this.borderLineColor === borderLineColor) {
      return;
    }
    this.borderLineColorDirty = true;
    this.borderLineColor = borderLineColor;
    this.invalidatePaint();
  }
  setBorderLinePattern(borderLinePattern) {
    if (this.borderLinePattern === borderLinePattern) {
      return;
    }
    this.borderLinePatternDirty = true;
    this.borderLinePattern = borderLinePattern;
    this.invalidatePaint();
  }
  setSelectBoxAttr(attr) {
    if (Object(utils.isSame)(this.selectBoxAttr, attr)) {
      return;
    }
    this.selectBoxAttr = attr;
    this.selectBoxAttrDirty = true;
    this.invalidatePaint();
  }
  setFillColor(fillColor) {
    if (this.fillColor === fillColor) {
      return;
    }
    this.fillColorDirty = true;
    this.fillColor = fillColor;
    this.invalidatePaint();
  }
  setFillPattern(fillPattern) {
    if (this.fillPattern === fillPattern) {
      return;
    }
    this.fillPatternDirty = true;
    this.fillPattern = fillPattern;
    this.invalidatePaint();
  }
}
