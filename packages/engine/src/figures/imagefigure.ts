import Figure from "./figure";
import * as commonUtils from "../common/utils/index";

export class ImageFigure extends Figure {
  originalSize: { width: number; height: number };
  imageUrl: any;
  imageUrlDirty: boolean;
  ignoreLoading: any;
  borderPath: any;
  borderPathDirty: boolean;
  borderColor: any;
  borderColorDirty: boolean;
  borderWidth: any;
  borderWidthDirty: boolean;
  shadowVisible: any;
  shadowVisibleDirty: boolean;
  lockRatio: any;
  lockRatioDirty: boolean;
  staticBackgroundFillColor: any;
  staticBackgroundFillColorDirty: boolean;
  constructor(viewController) {
    super(viewController);
    this.originalSize = {
      width: 0,
      height: 0,
    };
  }
  setImageUrl(imageUrl) {
    if (this.imageUrl !== imageUrl) {
      this.imageUrl = imageUrl;
      this.imageUrlDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setIgnoreLoading(ignoreLoading) {
    this.ignoreLoading = ignoreLoading;
  }
  setOriginalSize(originalSize) {
    const newSizeDirty =
      !this.originalSize ||
      !Object(commonUtils.isSameSize)(this.originalSize, originalSize);
    if (!newSizeDirty) {
      return;
    }
    this.originalSize = Object.assign({}, originalSize);
  }
  setBorderPath(imageBorderPath) {
    if (this.borderPath !== imageBorderPath) {
      this.borderPath = imageBorderPath;
      this.borderPathDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setBorderColor(borderColor) {
    if (this.borderColor !== borderColor) {
      this.borderColor = borderColor;
      this.borderColorDirty = true;
      this.invalidatePaint();
    }
  }
  setBorderWidth(borderWidth) {
    if (this.borderWidth !== borderWidth) {
      this.borderWidth = borderWidth;
      this.borderWidthDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setShadowVisible(visible) {
    if (this.shadowVisible !== visible) {
      this.shadowVisible = visible;
      this.shadowVisibleDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setLockRatio(lock) {
    if (this.lockRatio !== lock) {
      this.lockRatio = lock;
      this.lockRatioDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setStaticBackgroundFillColor(color) {
    if (this.staticBackgroundFillColor !== color) {
      this.staticBackgroundFillColor = color;
      this.staticBackgroundFillColorDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
}
