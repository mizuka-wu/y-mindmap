import figures from "../figures/index";
import {
  VIEW_TYPE,
  FIGURE_TYPE,
  STYLE_KEYS,
  EVENTS,
  MODULE_NAME,
} from "../common/constants/index";

import * as pointUtils from "../utils/pointutils";

import WorkbookComponentView from "./workbookcomponentview";
import styleManager from "../utils/business/stylemanager/index";

import * as utils from "../utils/index";
import Util from "../util";
import ResizeBoxView from "./resizeboxview";

const IMAGE_LOADING_WIDTH = 64;
const IMAGE_LOADING_HEIGHT = 64;
export class ImageView extends WorkbookComponentView {
  moving: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  position: { x: number; y: number };
  isSelected: boolean;
  _imageDefaultSize: any;
  figure: any;
  resizeBox: ResizeBoxView;
  imageGroup: any;
  loadImage: any;
  image: any;
  model: any;
  constructor(model, parentTopicView) {
    super({
      model,
    });
    this.moving = true;
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.position = {
      x: 0,
      y: 0,
    };
    this.isSelected = false;
    this._imageDefaultSize = null; //当model中没设置size时候的宽高。
    this.parent(parentTopicView);
    this.model = model;
    this.figure = figures.createFigure(this);
    this.initSVGStructure();
    this.resizeBox = new ResizeBoxView(this);
    this.resizeBox.parent(this);
    this.setBounds({
      x: 0,
      y: 0,
      width: IMAGE_LOADING_WIDTH,
      height: IMAGE_LOADING_HEIGHT,
    });
    this.setImageUrl(this.model.getSrc());
    this.setBorderWidth(this.model.getBorderWidth());
    this.setBorderColor(this.model.getBorderColor());
    this.setShadowVisible(this.model.getShadowVisible());
    this.setLockRatio(this.model.getLockRatio());
    this.updateBounds();
    this.setStaticBackgroundFillColor();
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.IMAGE;
  }
  get figureType() {
    return FIGURE_TYPE.IMAGE;
  }
  initSVGStructure() {
    const renderWorker = this.figure.renderWorker;
    this.imageGroup = renderWorker.svg;
    this.loadImage = renderWorker.loadImage;
    this.image = renderWorker.image;
    // this.imageBorderBox = this.imageGroup.put(new SVG.Rect()).data('name', 'image-border-box hidden');
    // this.imageGroup.add(this.resizeBox.svg);
  }
  initEventsListener() {
    let _b;
    this.listenTo(this.resizeBox, "resize", (size) => {
      this.model.resize(size);
    });
    this.listenTo(this.model, "resize", (size) => {
      let _a;
      this.resize(size);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
    });
    this.listenTo(this.model, "align", () => {
      let _a;
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
    });
    this.listenTo(this.model, "changeOpacity", (opacity) => {
      let _a;
      this.setOpacity(opacity);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
    });
    this.listenTo(this.model, "changeBorderWidth", (borderWidth) => {
      let _a;
      this.setBorderWidth(borderWidth);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
      this.setStaticBackgroundFillColor();
    });
    this.listenTo(this.model, "changeBorderColor", (borderColor) => {
      let _a;
      this.setBorderColor(borderColor);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
    });
    this.listenTo(this.model, "changeShadowVisible", (visible) => {
      let _a;
      this.setShadowVisible(visible);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
      this.setStaticBackgroundFillColor();
    });
    this.listenTo(this.model, "changeLockRatio", (lock) => {
      let _a;
      this.setLockRatio(lock);
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refresh();
      }
    });
    this.listenTo(this.model, "changeImageData", () => {
      this.setImageUrl(this.model.getSrc());
      this.updateBounds();
    });
    this.listenTo(this.parent()?.model, "changeStyle", (key) => {
      if (key === STYLE_KEYS.FILL_COLOR) {
        this.setStaticBackgroundFillColor();
      }
    });
    const sheetModel =
      (_b = this.parent()) === null || _b === undefined
        ? undefined
        : _b.getContext().model;
    this.listenTo(sheetModel, "changeStyle", this.setStaticBackgroundFillColor);
    this.listenTo(sheetModel, "addTheme", this.setStaticBackgroundFillColor);
    this.listenTo(sheetModel, "changeTheme", this.setStaticBackgroundFillColor);
    this.listenTo(
      sheetModel,
      "setStyleObject",
      this.setStaticBackgroundFillColor,
    );
    this.listenTo(
      this.getContext(),
      EVENTS.AFTER_SHEET_CONTENT_CHANGE,
      (data) => {
        if (data.attr === "boundaries") {
          let view = this.parent();
          let needUpdate = view?.model === data.target;
          while (
            view === null || view === undefined ? undefined : view.parent()
          ) {
            view =
              view === null || view === undefined ? undefined : view.parent();
            if (
              view &&
              view.topicView &&
              view.topicView.model === data.target
            ) {
              needUpdate = true;
            }
          }
          if (needUpdate) {
            setTimeout(() => this.setStaticBackgroundFillColor(), 0);
          }
        }
      },
    );
    this.getContext()
      .afterRender()
      .then(() => this.setStaticBackgroundFillColor());
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  select() {
    let _a;
    this.isSelected = true;
    if ((_a = this.resizeBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.active();
    }
    return this;
  }
  deselect() {
    let _a;
    this.isSelected = false;
    if ((_a = this.resizeBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.hide();
    }
    return this;
  }
  getOriginalSize() {
    return Object.assign({}, this.figure.originalSize);
  }
  resize(size) {
    let { width, height } = size;
    if (width === undefined || height === undefined) {
      if (!this._imageDefaultSize) {
        return;
      }
      width = this._imageDefaultSize.width;
      height = this._imageDefaultSize.height;
    }
    const bounds = {
      x: 0,
      y: 0,
      width,
      height,
    };
    this.setBounds(bounds);
  }
  setImageDefaultSize(size) {
    this._imageDefaultSize = size;
  }
  selientlyModifySize(width, height) {
    if (!this.getContext() || !this.getContext().model) {
      return;
    }
    const undo = this.getContext().model.getUndo();
    undo.setRecordState(false);
    // silently change the size in model, since this the first time we set the size.
    this.model.resize({
      width,
      height,
    });
    undo.setRecordState(true);
  }
  setBounds(bounds) {
    let _a;
    let _b;
    this.bounds = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
    const borderWidth = this.model.getBorderWidth();
    if (borderWidth > 0) {
      this.bounds.width += borderWidth * 2;
      this.bounds.height += borderWidth * 2;
    }
    this.calcBorderPath(this.bounds);
    this.figure.setSize(Object.assign({}, bounds));
    if ((_a = this.resizeBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.size(bounds.width, bounds.height);
    }
    if ((_b = this.resizeBox) === null || _b === undefined) {
      // do nothing;
    } else {
      _b.translate(bounds.x + borderWidth / 2, bounds.x + borderWidth / 2);
    }
  }
  refreshBounds() {
    const { width, height } = this.figure.size;
    if (width && height) {
      this.setBounds({
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  }
  calcBorderPath(bounds) {
    const borderWidth = this.model.getBorderWidth();
    const path = `M ${bounds.x} ${bounds.y}L ${bounds.x + bounds.width - borderWidth} ${bounds.y}L ${bounds.x + bounds.width - borderWidth} ${bounds.y + bounds.height - borderWidth}L ${bounds.x} ${bounds.y + bounds.height - borderWidth}Z`;
    this.setBorderPath(path);
  }
  setImageUrl(imageUrl) {
    this.figure.setImageUrl(imageUrl);
  }
  setOpacity(opacity) {
    this.figure.setOpacity(opacity);
  }
  setBorderPath(path) {
    this.figure.setBorderPath(path);
  }
  setBorderColor(borderColor) {
    this.figure.setBorderColor(borderColor);
  }
  setBorderWidth(borderWidth) {
    this.refreshBounds();
    this.figure.setBorderWidth(borderWidth || 0);
  }
  setShadowVisible(visible) {
    this.figure.setShadowVisible(visible);
  }
  setLockRatio(lock) {
    let _a;
    this.figure.setLockRatio(lock);
    if ((_a = this.resizeBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.setLockRatio(lock);
    }
  }
  setStaticBackgroundFillColor() {
    let _a;
    let _b;
    let _c;
    if (!this.parent()) {
      return;
    }
    const hasShadow = this.figure.shadowVisible;
    const hasBorder = this.figure.borderWidth > 0;
    if (!hasShadow && !hasBorder) {
      return;
    }
    const topicFillColor =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.figure.fillColor;
    let resultHex = "none";
    if (
      !Object(utils.isTreeTableCell)(
        (_b = this.parent()) === null || _b === undefined
          ? undefined
          : _b.parent(),
      )
    ) {
      try {
        const rgxRGBA = /^#[0-9a-fA-F]{8}$/;
        const sheetView = this.getContext().getSheetView();
        const sheetViewFillColor = styleManager.getStyleValue(
          sheetView,
          STYLE_KEYS.FILL_COLOR,
        );
        const { snowballUtil } = Object(utils.getInjectModule)(
          MODULE_NAME.SNOWBALL,
        );
        const boundaries = Object(utils.getAllContainedBoundaries)(
          (_c = this.parent()) === null || _c === undefined
            ? undefined
            : _c.parent(),
        ).reverse();
        resultHex = sheetViewFillColor;
        // topic fill color 为不透明色
        if (
          topicFillColor &&
          topicFillColor !== "none" &&
          !rgxRGBA.test(topicFillColor)
        ) {
          resultHex = topicFillColor;
        } else {
          if (boundaries.length) {
            boundaries.forEach((boundary) => {
              const fillColor = styleManager.getStyleValue(
                boundary,
                STYLE_KEYS.FILL_COLOR,
              );
              const fillOpacity = styleManager.getStyleValue(
                boundary,
                STYLE_KEYS.OPACITY,
              );
              const boundayFillRGB =
                snowballUtil.hexStringToRgbObject(fillColor);
              const hexRGB = snowballUtil.hexStringToRgbObject(resultHex);
              boundayFillRGB.a = parseFloat(fillOpacity);
              resultHex = snowballUtil.blendingColor(boundayFillRGB, hexRGB);
            });
          }
          if (topicFillColor && topicFillColor !== "none") {
            const topicRGB = snowballUtil.hexStringToRgbObject(topicFillColor);
            const hexRGB = snowballUtil.hexStringToRgbObject(resultHex);
            resultHex = snowballUtil.blendingColor(topicRGB, hexRGB);
          }
        }
      } catch {
        resultHex = topicFillColor;
      }
    }
    this.figure.setStaticBackgroundFillColor(resultHex);
  }
  updateBounds() {
    const width = this.model.getWidth();
    const height = this.model.getHeight();
    if (width && height) {
      this.setBounds({
        x: 0,
        y: 0,
        width,
        height,
      });
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  renderBase64(src) {}
  remove() {
    this.stopListening();
    this.figure.dispose();
    const parent = this.parent();
    const editDomain =
      parent === null || parent === undefined ? undefined : parent.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.removeFromSelection(this);
    }
    if (editDomain && editDomain.model2View) {
      delete editDomain.model2View[this.model.id];
    }
    if (this.resizeBox) {
      this.resizeBox.remove();
      this.resizeBox = null;
    }
    this.parent(null);
    return this;
  }
  move(x, y) {
    if (x === this.position.x && y === this.position.y) {
      return this;
    }
    // this.imageGroup.translate(x, y);
    this.figure.setPosition({
      x,
      y,
    });
    this.position.x = x;
    this.position.y = y;
    this.trigger("change:position", Object.assign({}, this.position), this);
    return this;
  }
  getSvg() {
    return this.imageGroup;
  }
  getSize() {
    return {
      width: this.model.getWidth() || -1,
      height: this.model.getHeight() || -1,
    };
  }
  getResizeMinWidth() {
    return 30;
  }
  getRealPosition() {
    const realPosition = Object.assign({}, this.position);
    const topic = this.parent();
    const branch =
      topic === null || topic === undefined ? undefined : topic.parent();
    const ts = branch && Object(utils.getTopicShape)(branch);
    const topicContentBounds = topic?.contentBounds;
    const branchPosition =
      branch === null || branch === undefined
        ? undefined
        : branch.getRealPosition();
    if (topicContentBounds && branchPosition) {
      realPosition.x += branchPosition.x + topicContentBounds.x;
      realPosition.y += branchPosition.y + topicContentBounds.y;
    }
    const borderWidth = this.model.getBorderWidth();
    if (borderWidth) {
      realPosition.x += borderWidth;
      realPosition.y += borderWidth;
    }
    if (ts && ts.getRealContentAreaOffset) {
      const { x: offsetX, y: offsetY } = ts.getRealContentAreaOffset(branch);
      realPosition.x += offsetX;
      realPosition.y += offsetY;
    }
    return realPosition;
  }
  createDragView() {
    const cloneG = Util.cloneImage(this);
    const realPosition = this.getRealPosition();
    cloneG.move(realPosition.x, realPosition.y);
    return cloneG;
  }
  /** @description for selectable view */
  getClientRect() {
    const { bounds } = this;
    const realPos = pointUtils.add(this.getRealPosition(), bounds);
    const clientPos = this.editDomain()
      .getCoordinateTransfer()
      .mindMapToViewport(realPos);
    return Object.assign(Object.assign({}, bounds), clientPos);
  }
} // TODO refactor - deprecated function.
Object(utils.wrapReadOnly)(ImageView, ["select", "onMouseover"]);

export default ImageView;
