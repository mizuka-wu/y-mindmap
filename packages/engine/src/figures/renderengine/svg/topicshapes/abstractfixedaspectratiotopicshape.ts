import AbstractTopicShape from "./abstracttopicshape";

import * as utils from "./utils";
export class AbstractFixedAspectRatioTopicShape extends AbstractTopicShape {
  _options: any;
  constructor(options) {
    super();
    const defaultOptions = {
      containerAreaAspectRatio: 1,
      contentAreaAspectRatio: 1,
      containerWidthContentWidthRatio: 1,
      contentAreaOffsetX: 0,
      contentAreaOffsetY: 0,
      pointOffsetByLineFocusTypeAndDirection: {},
    };
    this._options = Object.assign(Object.assign({}, defaultOptions), options);
  }
  getContentAreaOffsetRatio() {
    return {
      x: this._options.contentAreaOffsetX,
      y: this._options.contentAreaOffsetY,
    };
  }
  getRealContentAreaOffset(branchView) {
    const { width, height } = branchView.topicView.shapeBounds;
    const { contentAreaOffsetX, contentAreaOffsetY } = this._options;
    return {
      x: contentAreaOffsetX * width,
      y: contentAreaOffsetY * height,
    };
  }
  getDerivedContentSize(branchView, customWidth) {
    const { containerWidthContentWidthRatio, contentAreaAspectRatio } =
      this._options;
    const borderWidth = utils.getBorderWidth(branchView);
    const contentWidth =
      customWidth / containerWidthContentWidthRatio - borderWidth * 2;
    const maxHeightBasedOnContentWidth = contentWidth / contentAreaAspectRatio;
    return {
      width: contentWidth,
      height: maxHeightBasedOnContentWidth,
    };
  }
  _getExtendedWidth(width, height) {
    const { contentAreaAspectRatio } = this._options;
    if (width / height < contentAreaAspectRatio) {
      return height * contentAreaAspectRatio;
    } else {
      return width;
    }
  }
  getFinalShapeSizeWithPadding(branchView, contentSize) {
    const { containerWidthContentWidthRatio, containerAreaAspectRatio } =
      this._options;
    const borderWidth = Object(utils.getBorderWidth)(branchView);
    const { width, height } = contentSize;
    const extendedWidth = this._getExtendedWidth(width, height);
    const finalWidth =
      (extendedWidth + borderWidth * 2) * containerWidthContentWidthRatio;
    const finalHeight = finalWidth / containerAreaAspectRatio;
    return {
      width: finalWidth,
      height: finalHeight,
    };
  }
  getTopicMargins(branchView, size) {
    const { contentAreaOffsetX, contentAreaOffsetY } = this._options;
    const { width, height } = size;
    const { width: hor, height: ver } = this.getFinalShapeSizeWithPadding(
      branchView,
      size,
    );
    return {
      top: (ver - height) / 2 + contentAreaOffsetY * ver,
      bottom: (ver - height) / 2 - contentAreaOffsetY * ver,
      left: (hor - width) / 2 + contentAreaOffsetX * hor,
      right: (hor - width) / 2 - contentAreaOffsetX * hor,
    };
  }
  // Override this method to calculate extend length of connection when branch is folded.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getExtConnectionOffset(branchView) {
    return 0;
  }
  /**
   * Override this method to calculate point offset in specific structure and line focus type.
   * 'Special cases' defined within method: _isSpecialCaseForPointOffset()
   */
  _getSpecialPointOffset(branch, direction, lineFocusType) {
    let _a;
    let _b;
    return (
      ((_b =
        (_a =
          this._options.pointOffsetByLineFocusTypeAndDirection[
            lineFocusType
          ]) === null || _a === undefined
          ? undefined
          : _a[direction]) === null || _b === undefined
        ? undefined
        : _b.call(_a, branch.topicView.shapeBounds)) ?? {
        x: 0,
        y: 0,
      }
    );
  }
  // Override this method to calculate common point offset relative by base point
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _getCommonPointOffset(branch, direction) {
    return {
      x: 0,
      y: 0,
    };
  }
  _isSpecialCaseForPointOffset(branch) {
    const isMapLike = branch.isMapLike();
    const specialLineFocusType = [
      utils.LINE_FOCUS_TYPE.DIVER_LINE,
      utils.LINE_FOCUS_TYPE.ORDER_LINE,
    ];
    return (
      isMapLike &&
      specialLineFocusType.includes(Object(utils.getLineFocusType)(branch))
    );
  }
  getPointOffset(branch, direction) {
    if (this._isSpecialCaseForPointOffset(branch)) {
      return this._getSpecialPointOffset(
        branch,
        direction,
        Object(utils.getLineFocusType)(branch),
      );
    } else {
      return this._getCommonPointOffset(branch, direction);
    }
  }
}

export default AbstractFixedAspectRatioTopicShape;
