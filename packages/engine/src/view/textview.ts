import figures from "../figures/index";

import SvgComponentView from "./svgcomponentview";

import { VIEW_TYPE, TEXTALIGN } from "../common/constants/index";

const Style = (target) => {
  return class TextView extends target {
    initEventsListener() {
      super.initEventsListener();
      const parentTitleAbleView = this.parent();
      this.addAutoRun(() => {
        this.figure.setTextColor(parentTitleAbleView.figure.textColor);
        this.figure.setTextDecoration(
          parentTitleAbleView.figure.textDecoration,
        );
        this.figure.setTextAlign(parentTitleAbleView.figure.textAlign);
        this.figure.setTextTransform(parentTitleAbleView.figure.textTransform);
        this.figure.setFontSize(parentTitleAbleView.figure.fontSize);
        this.figure.setFontFamily(parentTitleAbleView.figure.fontFamily);
        this.figure.setFontStyle(parentTitleAbleView.figure.fontStyle);
        this.figure.setFontWeight(parentTitleAbleView.figure.fontWeight);
      });
    }
  } as typeof target;
};
@Style
export class TextView extends SvgComponentView {
  text: null;
  bounds: { x: number; y: number; width: number; height: number };
  figure: any;
  textSvg: any;
  constructor() {
    super();
    this.text = null;
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.figure = figures.createFigure(this);
    this.textSvg = this.figure.renderWorker.titleText;
  }
  get type() {
    return VIEW_TYPE.TEXT;
  }
  /** @deprecated */
  refreshFontInfo(fontInfo) {
    // fontInfo = Object.assign(DEFAULT_FONT_INFO, fontInfo)
    if (fontInfo.color) {
      this.figure.setTextColor(fontInfo.color);
    }
    if (fontInfo.fontFamily) {
      this.figure.setFontFamily(fontInfo.fontFamily);
    }
    if (fontInfo.fontSize) {
      this.figure.setFontSize(fontInfo.fontSize);
    } // +'px'
    if (fontInfo.fontStyle) {
      this.figure.setFontStyle(fontInfo.fontStyle);
    }
    if (fontInfo.fontWeight) {
      this.figure.setFontWeight(fontInfo.fontWeight);
    }
    if (fontInfo.textDecoration) {
      this.figure.setTextDecoration(fontInfo.textDecoration);
    }
    if (fontInfo.textAlign) {
      this.figure.setTextAlign(fontInfo.textAlign);
    }
    if (fontInfo.textTransform) {
      this.figure.setTextTransform(fontInfo.textTransform);
    }
  }
  setText(text) {
    this.text = this.protectedHandleText(text);
    this.figure.setText(this.text);
  }
  protectedHandleText(text) {
    return text;
  }
  setSize(size) {
    this.figure.setSize(size);
    this.figure.setTextSize(size);
    this.bounds = Object.assign(Object.assign({}, this.figure.position), size);
  }
  getTextSvg() {
    return this.textSvg;
  }
  move(x, y) {
    const { textSize, textAlign } = this.figure;
    if (textAlign === TEXTALIGN.CENTER) {
      x += textSize.width / 2;
    }
    if (textAlign === TEXTALIGN.RIGHT) {
      x += textSize.width;
    }
    this.figure.setTextPosition({
      x,
      y,
    });
  }
  hide() {
    this.figure.attr({
      opacity: 0,
    });
  }
  show() {
    this.figure.attr({
      opacity: 1,
    });
  }
  isUnedited() {
    let _b;
    if ((_b = this.parent()?.model) === null || _b === undefined) {
      return undefined;
    } else {
      return _b.isTitleUnedited();
    }
  }
  getTextVectorPosition(): any {
    throw new Error("should implement this method");
  }
  getRealPosition() {
    const textVectorPosition = this.getTextVectorPosition();
    const { textSize, textAlign } = this.figure;
    if (textAlign === TEXTALIGN.CENTER) {
      textVectorPosition.x -= textSize.width / 2;
    } else if (textAlign === TEXTALIGN.RIGHT) {
      textVectorPosition.x -= textSize.width;
    }
    return textVectorPosition;
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.clearReactions();
    this.parent(null);
    return this;
  }
}

export default TextView;
