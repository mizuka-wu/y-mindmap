import { VIEW_TYPE, FIGURE_TYPE, STYLE_KEYS } from "../common/constants/index";
import figures from "../figures/index";
import * as matrixutils from "../utils/matrixutils";
import styleManager from "../utils/business/stylemanager/index";
import BranchView from "./branchview";
import WorkbookComponentView from "./workbookcomponentview";
import * as utils from "../utils/index";
import SvgComponentView from "../view/svgcomponentview";
import * as lib from "../lib/index";

// @flow
const SELECT_COLOR = "rgb(94, 187, 254)";
const HOVER_COLOR = "rgb(154, 213, 255)";
const DEFOCUS_COLOR = "#9f9f9f";

export class MatrixCellView extends WorkbookComponentView {
  _isFront: boolean;
  bounds: any;
  isNull: boolean;
  _view: any;
  matrixHeadBranchView: any;
  _cellEvents: any;
  figure: any;
  _s$svg: any;
  selectedPath: any;
  constructor(
    bounds,
    view = null,
    events = {},
    isNull = false,
    matrixHeadBranchView,
  ) {
    super();
    this._isFront = false;
    this.bounds = bounds;
    this.isNull = isNull; // only for defaultEvents
    this._view = view;
    this.matrixHeadBranchView = matrixHeadBranchView;
    this._cellEvents = events;
    this.figure = figures.createFigure(this);
    this._s$svg = this.figure.getContent();
    // todo
    this.selectedPath = this.figure.renderWorker._s$selectedPath;
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.MATRIX_CELL;
  }
  get figureType() {
    return FIGURE_TYPE.MATRIX_CELL;
  }
  initEventsListener() {
    this.addAutoRun(() => {
      this.figure.setBorderColor(
        this.matrixHeadBranchView.topicView.figure.borderColor,
      );
    });
    this.refreshFillColor();
  }
  afterAncestorChange() {
    if (!this.parent()) {
      return;
    }
    this.refreshFillColor();
    this.refreshBorderWidth();
    this.refreshBorderColor();
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  refreshFillColor() {
    this.addAutoRun(() => {
      let _a;
      if (!this.parent()) {
        return;
      }
      let fillColor = "none";
      if (!this._view && !this.isNull) {
        fillColor = "none";
      } else if (this._view instanceof BranchView) {
        fillColor = this._view.topicView.figure.fillColor;
      } else {
        const matrixHeadBranchView =
          (_a = this.parent()) === null || _a === undefined
            ? undefined
            : _a.parent();
        fillColor = matrixutils.getFillColor(
          matrixHeadBranchView.topicView.figure.fillColor,
        );
      }
      this.figure.setFillColor(fillColor);
    });
  }
  refreshBorderWidth() {
    if (!this.parent()) {
      return;
    }
    this.figure.setBorderWidth(
      this.matrixHeadBranchView.topicView.figure.borderWidth,
    );
  }
  refreshBorderColor() {
    if (!this.parent()) {
      return;
    }
    this.figure.setBorderColor(
      this.matrixHeadBranchView.topicView.figure.borderColor,
    );
  }
  refreshViewShapeClass() {
    if (this._view instanceof BranchView) {
      this._view.topicView.setTopicShapeClass(
        styleManager.getStyleValue(this._view, STYLE_KEYS.SHAPE_CLASS),
      );
    }
  }
  afterMounted() {
    let _a;
    if ((_a = this._view) === null || _a === undefined) {
      // do nothing
    } else {
      _a.setProxy(this);
    }
  }
  getSvg() {
    return this._s$svg;
  }
  getRealPosition() {
    let _a;
    const pPos =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.getRealPosition();
    return Object(matrixutils.add)(this.bounds, pPos);
  }
  removeSelf() {
    this.figure.dispose();
    this.clearReactions();
    this.parent(null);
    if (this._view) {
      this._view.deleteProxy(this);
    }
    delete this._view;
  }
  // todo
  displaySelect() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.setPlusViewVisible(true);
    }
    this._front();
    this.selectedPath.attr({
      display: "block",
      stroke: SELECT_COLOR,
    });
    this._showCollapseExtendView();
  }
  displayDeselect() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.setPlusViewVisible(false);
    }
    this._back();
    this.selectedPath.attr({
      display: "none",
    });
    this._hideCollapseExtendView();
  }
  displayHover() {
    this._front();
    this.selectedPath.attr({
      display: "block",
      stroke: HOVER_COLOR,
    });
    this._showCollapseExtendView();
  }
  displayDehover() {
    this._back();
    this.selectedPath.attr({
      display: "none",
    });
    this._hideCollapseExtendView();
  }
  displayDeFocus() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.setPlusViewVisible(true);
    }
    this._front();
    this.selectedPath.attr({
      display: "block",
      stroke: DEFOCUS_COLOR,
    });
  }
  _showCollapseExtendView() {
    let _a;
    if (this._view instanceof BranchView) {
      if (this._view.isMatrixBranch() || this._view.isMatrixHeadCellBranch()) {
        return;
      }
      if (
        (_a = (this._view as any).collapseExtendView) === null ||
        _a === undefined
      ) {
        // do nothing;
      } else {
        _a.hover();
      }
    }
  }
  _hideCollapseExtendView() {
    let _a;
    if (this._view instanceof BranchView) {
      if (this._view.isMatrixBranch() || this._view.isMatrixHeadCellBranch()) {
        return;
      }
      if (
        (_a = (this._view as any).collapseExtendView) === null ||
        _a === undefined
      ) {
        // do nothing;
      } else {
        _a.dehover();
      }
    }
  }
  _front() {
    if (!this._isFront) {
      this._isFront = true;
      const svg = this.getSvg();
      if (svg.parent) {
        svg.front();
      }
    }
  }
  _back() {
    if (this._isFront) {
      this._isFront = false;
      const svg = this.getSvg();
      // this._back maybe applied after svg was removed
      if (svg.parent) {
        svg.back();
      }
    }
  }
  getSelectedPath() {
    return this.selectedPath;
  }
  // for events.js
  getNextEventTarget(elm) {
    let _a;
    if (Object(utils.isUndef)(this._view)) {
      return elm.parentNode;
    } else if ((_a = this._view) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getSvg().node;
    }
  }
  getProxyView() {
    return this._view;
  }
  createDragView() {
    const cloneG = this.editDomain().content().getCloneG();
    const { width, height } = this.bounds;
    // origin position
    const oPos = {
      x: -width / 2,
      y: -height / 2,
    };
    const realPos = this.getRealPosition();
    const { x, y } = Object(matrixutils.sub)(realPos, oPos);
    const d = `M ${oPos.x} ${oPos.y} l ${width} 0 l 0 ${height} l ${-width} 0 Z`;
    const borderPath = new lib.SVG.Path();
    const defaultStyle = {
      fill: "#f44336",
      stroke: "#f44336",
      "stroke-width": "3",
    };
    borderPath.attr(
      Object.assign(
        {
          d,
        },
        defaultStyle,
      ),
    );
    cloneG.add(borderPath);
    cloneG.move(x, y);
    return cloneG;
  }
}

export class MatrixPlusView extends SvgComponentView {
  bounds: any;
  _clickEvent: any;
  figure: any;
  svg: any;
  // TODO Refactor - _clickEvent is a function type.
  constructor(bounds, clickEvent) {
    super();
    this.bounds = bounds;
    this._clickEvent = clickEvent;
    this.figure = figures.createFigure(this);
    this.svg = this.figure.getContent();
  }
  get type() {
    return VIEW_TYPE.MATRIX_PLUS;
  }
  get figureType() {
    return FIGURE_TYPE.MATRIX_PLUS;
  }
  /** @public */
  setVisible(visible) {
    this.figure.setVisible(visible);
  }
  getSvg() {
    return this.svg;
  }
  removeSelf() {
    this.figure.dispose();
    this.parent(null);
  }
}
