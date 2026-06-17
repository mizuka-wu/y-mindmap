import Figure from "./figure";
import { action, makeObservable, observable } from "mobx";
import { LINETAPERED } from "../common/constants/index";
export class SheetFigure extends Figure {
  multiLineColors: string;
  multiLineColorsDirty: boolean;
  lineTapered: string;
  lineTaperedDirty: boolean;
  backgroundColor: string;
  backgroundColorDirty: boolean;
  cjkFontFamily: string;
  globalLineWidth: any;
  globalFontFamily: any;
  gradientColor: any;
  gradientColorDirty: boolean;
  wallpaper: any;
  wallpaperDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.multiLineColors = "";
    this.multiLineColorsDirty = true;
    this.lineTapered = LINETAPERED.NONE;
    this.lineTaperedDirty = true;
    this.backgroundColor = "";
    this.backgroundColorDirty = true;
    this.cjkFontFamily = "";
    this.globalLineWidth = null;
    this.globalFontFamily = null;
    Object(makeObservable)(this, {
      multiLineColors: observable,
      setMultiLineColors: action,
      lineTapered: observable,
      setLineTapered: action,
      backgroundColor: observable,
      setBackgroundColor: action,
      cjkFontFamily: observable,
      setCJKFontFamily: action,
      globalLineWidth: observable,
      setGlobalLineWidth: action,
      globalFontFamily: observable,
      setGlobalFontFamily: action,
    });
  }
  setMultiLineColors(multiLineColors) {
    if (this.multiLineColors !== multiLineColors) {
      this.multiLineColors = multiLineColors;
      this.multiLineColorsDirty = true;
      this.invalidatePaint();
    }
  }
  setLineTapered(lineTapered) {
    if (this.lineTapered !== lineTapered) {
      this.lineTapered = lineTapered;
      this.lineTaperedDirty = true;
      this.invalidatePaint();
    }
  }
  setGradientColor(gradientColor) {
    if (this.gradientColor !== gradientColor) {
      this.gradientColor = gradientColor;
      this.gradientColorDirty = true;
      this.invalidatePaint();
    }
  }
  setBackgroundColor(color) {
    if (this.backgroundColor !== color) {
      this.backgroundColor = color;
      this.backgroundColorDirty = true;
      this.invalidatePaint();
    }
  }
  setOpacity(opacity) {
    if (this.opacity !== opacity) {
      this.opacity = opacity;
      this.opacityDirty = true;
      this.invalidatePaint();
    }
  }
  setCJKFontFamily(fontFamily) {
    this.cjkFontFamily = fontFamily;
  }
  setWallpaper(wallpaper) {
    if (this.wallpaper !== wallpaper) {
      this.wallpaper = wallpaper;
      this.wallpaperDirty = true;
      this.invalidatePaint();
    }
  }
  setGlobalLineWidth(lineWidth) {
    this.globalLineWidth = lineWidth;
  }
  setGlobalFontFamily(fontFamily) {
    this.globalFontFamily = fontFamily;
  }
}
