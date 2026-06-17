import styleManager from "../utils/business/stylemanager/index";

import { STYLE_KEYS } from "../common/constants/index";

import SvgComponentView from "./svgcomponentview";
export class TitleableView extends SvgComponentView {
  figure: any;
  initEventsListenerWithContext() {
    if (!this.getContext()) {
      return;
    }
    const sheetView = this.getContext().getSheetView();
    this.addReaction(
      () => sheetView.figure.cjkFontFamily,
      () => this.refreshFontFamily(),
    );
    this.addReaction(
      () => sheetView.figure.globalFontFamily,
      () => this.refreshFontFamily(),
    );
  }
  onChangeStyle(key) {
    switch (key) {
      case STYLE_KEYS.TEXT_COLOR:
        this.refreshTextColor();
        break;
      case STYLE_KEYS.TEXT_DECORATION:
        this.refreshTextDecoration();
        break;
      case STYLE_KEYS.TEXT_ALIGN:
        this.refreshTextAlign();
        break;
      case STYLE_KEYS.TEXT_TRANSFORM:
        this.refreshTextTransform();
        break;
      case STYLE_KEYS.FONT_SIZE:
        this.refreshFontSize();
        break;
      case STYLE_KEYS.FONT_FAMILY:
        this.refreshFontFamily();
        break;
      case STYLE_KEYS.FONT_STYLE:
        this.refreshFontStyle();
        break;
      case STYLE_KEYS.FONT_WEIGHT:
        this.refreshFontWeight();
        break;
      default:
    }
  }
  refreshSkeletonStyles() {
    this.refreshTextDecoration();
    this.refreshTextAlign();
    this.refreshTextTransform();
    this.refreshFontSize();
    this.refreshFontFamily();
    this.refreshFontStyle();
    this.refreshFontWeight();
  }
  refreshColorStyles() {
    this.refreshTextColor();
  }
  refreshTextColor() {
    this.figure.setTextColor(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.TEXT_COLOR,
      ),
    );
  }
  getTitledStyleView(): any {
    throw new Error("Method not implemented.");
  }
  refreshTextDecoration() {
    this.figure.setTextDecoration(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.TEXT_DECORATION,
      ),
    );
  }
  refreshTextAlign() {
    this.figure.setTextAlign(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.TEXT_ALIGN,
      ),
    );
  }
  refreshTextTransform() {
    this.figure.setTextTransform(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.TEXT_TRANSFORM,
      ),
    );
  }
  refreshFontSize() {
    this.figure.setFontSize(
      parseInt(
        `${styleManager.getStyleValue(this.getTitledStyleView(), STYLE_KEYS.FONT_SIZE)}`,
      ),
    );
  }
  refreshFontFamily() {
    this.figure.setFontFamily(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.FONT_FAMILY,
      ),
    );
  }
  refreshFontStyle() {
    this.figure.setFontStyle(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.FONT_STYLE,
      ),
    );
  }
  refreshFontWeight() {
    this.figure.setFontWeight(
      styleManager.getStyleValue(
        this.getTitledStyleView(),
        STYLE_KEYS.FONT_WEIGHT,
      ),
    );
  }
}

export default TitleableView;
