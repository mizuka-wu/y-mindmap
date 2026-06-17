import Figure from "./figure";
import { action, makeObservable, observable } from "mobx";

export class TitleAbleFigure extends Figure {
  textColor: string;
  textDecoration: string;
  textAlign: string;
  textTransform: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: string;
  fontWeight: string;
  constructor(viewController) {
    super(viewController);
    this.textColor = "";
    this.textDecoration = "";
    this.textAlign = "";
    this.textTransform = "";
    this.fontSize = 0;
    this.fontFamily = "";
    this.fontStyle = "";
    this.fontWeight = "normal";
    Object(makeObservable)(this, {
      textColor: observable,
      setTextColor: action,
      textDecoration: observable,
      setTextDecoration: action,
      textAlign: observable,
      setTextAlign: action,
      textTransform: observable,
      setTextTransform: action,
      fontSize: observable,
      setFontSize: action,
      fontFamily: observable,
      setFontFamily: action,
      fontStyle: observable,
      setFontStyle: action,
      fontWeight: observable,
      setFontWeight: action,
    });
  }
  setTextColor(color) {
    this.textColor = color;
  }
  setTextDecoration(textDecoration) {
    this.textDecoration = textDecoration;
  }
  setTextAlign(textAlign) {
    this.textAlign = textAlign;
  }
  setTextTransform(textTransform) {
    this.textTransform = textTransform;
  }
  setFontSize(fontSize) {
    this.fontSize = fontSize;
  }
  setFontFamily(fontFamily) {
    this.fontFamily = fontFamily;
  }
  setFontStyle(fontStyle) {
    this.fontStyle = fontStyle;
  }
  setFontWeight(fontWeight) {
    this.fontWeight = fontWeight;
  }
}
