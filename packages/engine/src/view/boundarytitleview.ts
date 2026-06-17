import { VIEW_TYPE, FIGURE_TYPE } from "../common/constants/index";
import { layoutConstant } from "../utils/layoutconstant";
import TextView from "./textview";
export class BoundaryTitleView extends TextView {
  figure: any;
  static BoundaryTitleView: any;
  get type() {
    return VIEW_TYPE.BOUNDARY_TITLE;
  }
  get figureType() {
    return FIGURE_TYPE.BOUNDARY_TITLE;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  afterAncestorChange() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    this.setText(parent.model.get("title"));
    this.initEventsListener();
    super.afterAncestorChange();
  }
  setText(text) {
    let _a;
    super.setText(text);
    const showOrHide =
      !!text &&
      !((_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.shouldPreventTitle());
    if (showOrHide) {
      this.show();
    } else {
      this.hide();
    }
  }
  calcTitlePosition(size) {
    const boundaryView = this.parent();
    const borderWidth =
      parseInt(
        `${boundaryView === null || boundaryView === undefined ? undefined : boundaryView.figure.borderWidth}`,
      ) || 0;
    return {
      x:
        layoutConstant.BOUNDARY_TITLE.TO_BOUNDARY_BORDER_DISTANCE +
        borderWidth / 2,
      y: -size.height + borderWidth / 2,
    };
  }
  setSize(size) {
    this.figure.setTextSize(size);
    if (size.width === 0 && size.height === 0) {
      this.figure.setSize(size);
    } else {
      const titleBGPaddingHorizontal =
        layoutConstant.BOUNDARY_TITLE.CONTENT_PADDING_HORIZON;
      const titleBGPaddingVertical =
        layoutConstant.BOUNDARY_TITLE.CONTENT_PADDING_VERTICAL;
      const currentSize = {
        width: size.width + titleBGPaddingHorizontal * 2,
        height: size.height + titleBGPaddingVertical * 2,
      };
      const titlePosition = this.calcTitlePosition(currentSize);
      this.figure.setSize(currentSize);
      this.setPosition(titlePosition);
      this.move(titleBGPaddingHorizontal, titleBGPaddingVertical);
      Object.assign(this.bounds, titlePosition);
    }
    Object.assign(this.bounds, this.figure.size);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  bounds(bounds: any, titlePosition: { x: number; y: number }) {
    throw new Error("Method not implemented.");
  }
  setPosition(position) {
    this.figure.setPosition(position);
    Object.assign(this.bounds, this.figure.position);
  }
  getTextVectorPosition() {
    let _a;
    const parentRealPosition = ((_a = this.parent()) === null ||
    _a === undefined
      ? undefined
      : _a.getRealPosition()) ?? {
      x: 0,
      y: 0,
    };
    return {
      x:
        parentRealPosition.x +
        this.figure.position.x +
        this.figure.textPosition.x,
      y:
        parentRealPosition.y +
        this.figure.position.y +
        this.figure.textPosition.y,
    };
  }
  getClientRect() {
    const realPosition = this.getRealPosition();
    const clientPosition = this.editDomain()
      .getCoordinateTransfer()
      .mindMapToViewport(realPosition);
    return Object.assign(
      Object.assign({}, clientPosition),
      this.figure.textSize,
    );
  }
}

export default BoundaryTitleView;
