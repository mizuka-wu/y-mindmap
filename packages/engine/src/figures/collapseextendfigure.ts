import Figure from "./figure";
import * as utils from "../utils/index";

export class CollapseExtendFigure extends Figure {
  textFontObj: any;
  textFontObjToPack: any;
  connectPathAttr: any;
  connectPathAttrToPack: any;
  hoverAreaAttr: any;
  hoverAreaAttrToPack: any;
  isCollapsed: any;
  isCollapsedDirty: boolean;
  text: any;
  textDirty: boolean;
  textFontObjDirty: boolean;
  textTranslatePositionDirty: boolean;
  textTranslatePosition: any;
  lineColor: any;
  lineColorDirty: boolean;
  lineWidth: any;
  lineWidthDirty: boolean;
  backgroundColor: any;
  backgroundColorDirty: boolean;
  fillColor: any;
  fillColorDirty: boolean;
  fillOpacity: any;
  fillOpacityDirty: boolean;
  collapseExtendVisible: any;
  collapseExtendVisibleDirty: boolean;
  collapseBtnVisible: any;
  collapseBtnVisibleDirty: boolean;
  hoverAreaVisible: any;
  hoverAreaVisibleDirty: boolean;
  connectPathAttrDirty: boolean;
  hoverAreaAttrDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.textFontObj = {};
    this.textFontObjToPack = {};
    this.connectPathAttr = {};
    this.connectPathAttrToPack = {};
    this.hoverAreaAttr = {};
    this.hoverAreaAttrToPack = {};
  }
  setCollapseState(isCollapsed) {
    if (this.isCollapsed !== isCollapsed) {
      this.isCollapsed = isCollapsed;
      this.isCollapsedDirty = true;
      this.invalidatePaint();
    }
  }
  setText(text) {
    if (this.text !== text) {
      this.text = text;
      this.textDirty = true;
      this.invalidatePaint();
    }
  }
  setTextFontObj(textFontObj) {
    const dr = utils.subtract(this.textFontObj, textFontObj);
    if (Object.keys(dr).length > 0) {
      this.textFontObjDirty = true;
      Object.assign(this.textFontObj, dr);
      Object.assign(this.textFontObjToPack, dr);
      this.invalidatePaint();
    }
  }
  setTextTranslatePosition(textTranslatePosition) {
    this.textTranslatePositionDirty = true;
    this.textTranslatePosition = textTranslatePosition;
    this.invalidatePaint();
  }
  setLineColor(lineColor) {
    if (this.lineColor !== lineColor) {
      this.lineColor = lineColor;
      this.lineColorDirty = true;
      this.invalidatePaint();
    }
  }
  setLineWidth(lineWidth) {
    if (this.lineWidth !== lineWidth) {
      this.lineWidth = lineWidth;
      this.lineWidthDirty = true;
      this.invalidatePaint();
    }
  }
  setBackgroundColor(backgroundColor) {
    // for sheet background color unset case
    if (backgroundColor === "none") {
      backgroundColor = "#fff";
    }
    if (this.backgroundColor !== backgroundColor) {
      this.backgroundColor = backgroundColor;
      this.backgroundColorDirty = true;
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
  setFillOpacity(fillOpacity) {
    if (this.fillOpacity !== fillOpacity) {
      this.fillOpacity = fillOpacity;
      this.fillOpacityDirty = true;
      this.invalidatePaint();
    }
  }
  setCollapseExtendVisible(collapseExtendVisible) {
    if (this.collapseExtendVisible !== collapseExtendVisible) {
      this.collapseExtendVisible = collapseExtendVisible;
      this.collapseExtendVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setCollapseBtnVisible(collapseBtnVisible, force = false) {
    if (force || this.collapseBtnVisible !== collapseBtnVisible) {
      this.collapseBtnVisible = collapseBtnVisible;
      this.collapseBtnVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setHoverAreaVisible(hoverAreaVisible) {
    if (this.hoverAreaVisible !== hoverAreaVisible) {
      this.hoverAreaVisible = hoverAreaVisible;
      this.hoverAreaVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setConnectPathAttr(connectPathAttr) {
    const dr = utils.subtract(this.connectPathAttr, connectPathAttr);
    if (Object.keys(dr).length > 0) {
      this.connectPathAttrDirty = true;
      Object.assign(this.connectPathAttr, dr);
      Object.assign(this.connectPathAttrToPack, dr);
      this.invalidatePaint();
    }
  }
  setHoverAreaAttr(hoverAreaAttr) {
    const dr = utils.subtract(this.hoverAreaAttr, hoverAreaAttr);
    if (Object.keys(dr).length > 0) {
      this.hoverAreaAttrDirty = true;
      Object.assign(this.hoverAreaAttr, dr);
      Object.assign(this.hoverAreaAttrToPack, dr);
      this.invalidatePaint();
    }
  }
}
