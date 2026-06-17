import { MODULE_NAME, CONFIG } from '../../../../common/constants/index';
import * as utils from '../../../../utils/index';

import * as lib from '../../../../lib/index';
import { layoutConstant } from '../../../../utils/layoutconstant';

const IMAGE_DEFAULT_MAX_WIDTH = 200;
const BASE_SHADOW_OPACITY = 0.3;
export class ImageRenderWorker {
  figure: any;
  svg: any;
  imageContainer: any;
  imageStaticBackground: any;
  imageBorderPath: any;
  loadImage: any;
  image: any;
  imageShadowFilter: any;
  imageFeDropShadow: any;
  _isLoading: any;
  currentLoadId: number;
  constructor(figure) {
    this.figure = figure;
    this.svg = new lib.SVG.G().data('name', 'image-group');
    this.imageContainer = this.svg.put(new lib.SVG.G()).data('name', 'image-container').translate(0, 0);
    this.imageStaticBackground = this.imageContainer
      .put(new lib.SVG.Rect())
      .data('name', 'image-static-bg')
      .attr({
        fill: 'none',
        'fill-opacity': '1',
      })
      .hide();
    this.imageBorderPath = this.imageContainer
      .put(new lib.SVG.Path())
      .data('name', 'image-border-path')
      .attr('fill', 'none')
      .translate(0, 0);
    this.loadImage = this.imageContainer.put(new lib.SVG.Image()).data('name', 'topic-img-load').translate(0, 0);
    this.image = this.imageContainer
      .put(new lib.SVG.Image())
      .data('name', 'topic-img')
      .attr('preserveAspectRatio', 'none')
      .translate(0, 0)
      .hide();
    this.figure.viewController.setElement(this.svg.node);
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    const svgView = this.figure.viewController.editDomain();
    if (svgView && !this.imageShadowFilter) {
      this.imageShadowFilter = svgView.svg.filter();
      // this.imageFeDropShadow = new lib.SVG.FeDropShadow()
      //   .dmove(0, 0)
      //   .floodColor('#000')
      //   .floodOpacity(BASE_SHADOW_OPACITY * this.figure.opacity);
      // this.imageShadowFilter.filterUnits('userSpaceOnUse').put(this.imageFeDropShadow);
    }
    if (this.figure.imageUrlDirty) {
      this.figure.imageUrlDirty = false;
      this._loadImage();
    }
    if (this.figure.positionDirty) {
      const borderWidth = this.figure.borderWidth;
      this.svg.translate(this.figure.position.x + borderWidth / 2, this.figure.position.y + borderWidth / 2);
      this.figure.positionDirty = false;
    }
    if (this.figure.sizeDirty) {
      const { width, height } = this.figure.size;
      if (this._isLoading) {
        this.loadImage.size(Math.min(width, height), Math.min(width, height));
      }
      this.image.size(width, height);
      this.imageStaticBackground.size(width, height);
      this.figure.sizeDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.opacityDirty) {
      this.image.attr('opacity', this.figure.opacity);
      this.imageBorderPath.attr('opacity', this.figure.opacity);
      this.imageFeDropShadow.floodOpacity(BASE_SHADOW_OPACITY * this.figure.opacity);
      this.figure.opacityDirty = false;
    }
    if (this.figure.borderPathDirty) {
      this.imageBorderPath.attr('d', this.figure.borderPath);
      this.figure.borderPathDirty = false;
    }
    if (this.figure.borderWidthDirty) {
      this.imageBorderPath.attr('stroke-width', this.figure.borderWidth);
      const halfBorderWidth = this.figure.borderWidth / 2;
      this.svg.translate(this.figure.position.x + halfBorderWidth, this.figure.position.y + halfBorderWidth);
      this.imageStaticBackground.translate(halfBorderWidth, halfBorderWidth);
      this.loadImage.translate(halfBorderWidth, halfBorderWidth);
      this.image.translate(halfBorderWidth, halfBorderWidth);
      this._updateShadowStyle();
      if (this.figure.borderWidth > 0) {
        this.imageBorderPath.attr('opacity', this.figure.opacity);
      }
      this.figure.borderWidthDirty = false;
    }
    if (this.figure.borderColorDirty) {
      this.imageBorderPath.attr('stroke', this.figure.borderColor);
      this.figure.borderColorDirty = false;
    }
    if (this.figure.shadowVisibleDirty) {
      if (this.figure.shadowVisible) {
        const { width, height } = this.figure.size;
        const offsetY = (width + height) / 175;
        const maxStdDeviation = this.figure.borderWidth > 0 ? this.figure.borderWidth * 0.7 : Infinity;
        this.imageFeDropShadow.dy(offsetY);
        this.imageFeDropShadow.stdDeviation(Math.min(offsetY * 3, maxStdDeviation));
        this.imageFeDropShadow.floodOpacity(BASE_SHADOW_OPACITY * this.figure.opacity);
      }
      this._updateShadowStyle();
      this.figure.shadowVisibleDirty = false;
    }
    if (this.figure.staticBackgroundFillColorDirty) {
      this.imageStaticBackground.attr({
        fill: this.figure.staticBackgroundFillColor,
      });
      this.figure.staticBackgroundFillColorDirty = false;
    }
    parentFigure.renderWorker.appendChild('image', this.svg);
  }
  _updateShadowStyle() {
    const filterId = this.imageShadowFilter.toString();
    const hasShadow = this.figure.shadowVisible;
    const hasBorder = this.figure.borderWidth > 0;
    const containerFilterValue = hasShadow && hasBorder ? filterId : 'none';
    const backgroundFilterValue = hasShadow && !hasBorder ? filterId : 'none';
    this.imageContainer.style('filter', containerFilterValue);
    this.imageStaticBackground.style('filter', backgroundFilterValue);
    if (hasShadow || hasBorder) {
      this.imageStaticBackground.show();
    } else {
      this.imageStaticBackground.hide();
    }
  }
  _loadImage() {
    if (!this.figure.ignoreLoading && this.loadImage) {
      this._isLoading = true;
      const { addonModule } = Object(utils.getInjectModule)(MODULE_NAME.SNOWBIRD);
      const placeholderUrl = this.figure.viewController
        .getContext()
        .getFileRealResource(addonModule.getImageLoadingPlaceHolderResource());
      this.loadImage.load(placeholderUrl);
    }
    const loadImageFinalUrl = imageUrl => {
      if (!imageUrl) {
        return;
      }
      this.resizeImageToBase64(imageUrl).then(imageData => {
        this.image.load(imageData).loaded(image => this._loaded(image, currentLoadId));
      });
    };
    const currentLoadId = (this.currentLoadId = Date.now());
    if (utils.isXapResource(this.figure.imageUrl)) {
      this.figure.viewController
        .config(CONFIG.XAP_LOADER)(this.figure.imageUrl)
        .then(imgUrl => {
          loadImageFinalUrl(imgUrl);
        });
    } else {
      loadImageFinalUrl(this.figure.imageUrl);
    }
  }
  _loaded(image, currentLoadId) {
    this.figure.setOriginalSize({
      width: image.width,
      height: image.height,
    });
    if (this.currentLoadId !== currentLoadId) {
      return;
    }
    this._isLoading = false;
    let calibratedWidth;
    let calibratedHeight;
    if (image.width > IMAGE_DEFAULT_MAX_WIDTH) {
      const ratio = image.width / IMAGE_DEFAULT_MAX_WIDTH;
      calibratedWidth = IMAGE_DEFAULT_MAX_WIDTH;
      calibratedHeight = image.height / ratio;
    } else {
      calibratedHeight = image.height;
      calibratedWidth = image.width;
    }
    this.figure.viewController.setImageDefaultSize({
      width: calibratedWidth,
      height: calibratedHeight,
    });
    const imageModelSize = this.figure.viewController.getSize();
    const width = imageModelSize.width && imageModelSize.width > 0 ? imageModelSize.width : calibratedWidth;
    const height = imageModelSize.height && imageModelSize.height > 0 ? imageModelSize.height : calibratedHeight;
    if (width && height) {
      this.image.show();
      this.loadImage.remove();
      const bounds = {
        x: 0,
        y: 0,
        width,
        height,
      };
      this.figure.viewController.setBounds(bounds);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(type, childNode, options) {
    switch (type) {
      case 'resizebox':
        if (childNode.parent !== this.svg) {
          this.svg.add(childNode);
        }
        break;
      default:
        break;
    }
  }
  getContent() {
    return this.svg;
  }
  dispose() {
    if (this.imageShadowFilter) {
      this.imageShadowFilter.remove();
      this.imageShadowFilter = null;
      this.imageFeDropShadow = null;
    }
    this.svg.remove();
  }
  resizeImageToBase64(imageSrc) {
    if (imageSrc.startsWith('javascript:')) {
      return Promise.reject();
    }
    const isBase64Data = imageSrc.startsWith('data:image');
    if (isBase64Data) {
      return new Promise(resolve => resolve(imageSrc));
    }
    const extensionName = imageSrc.split('.').pop().toLowerCase();
    const extensionListToFilter = ['svg', 'gif', 'jif', 'webp'];
    if (extensionListToFilter.includes(extensionName)) {
      return new Promise(resolve => resolve(imageSrc));
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    return new Promise((resolve, reject) => {
      img.onload = () => {
        let ratio = Math.max(img.width / layoutConstant.IMAGE_MAX_SIZE, img.height / layoutConstant.IMAGE_MAX_SIZE);
        ratio = ratio > 1 ? ratio : 1;
        const newWidth = img.width / ratio;
        const newHeight = img.height / ratio;
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, newWidth, newHeight);
        const imageDataUrl = canvas.toDataURL('image/png');
        resolve(imageDataUrl);
      };
      img.onerror = () => {
        reject();
      };
    });
  }
}
