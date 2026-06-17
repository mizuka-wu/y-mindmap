/* eslint-disable @typescript-eslint/no-unused-vars */
import styleManager from "../utils/business/stylemanager/index";
import { VIEW_TYPE, STYLE_KEYS, FIGURE_TYPE } from "../common/constants/index";

import figures from "../figures/index";

import SvgComponentView from "./svgcomponentview";

import * as matrixUtils from "../utils/matrixutils";

import matrixCreateUtils from "../utils/matrixcreateutils";

import * as utils from "../utils/index";

const LABEL_TYPE = VIEW_TYPE.MATRIX_LABEL;
// Ray TODO: not good enough
// 应该从根源上，在获取数据的时候就做处理
const getNormFill = (view) => {
  if (view.type === VIEW_TYPE.TOPIC) {
    view = view.parent();
    if (!view) {
      return;
    }
  }
  const fill = styleManager.getStyleValue(view, STYLE_KEYS.FILL_COLOR);
  if (fill === "$none$") {
    return "none";
  } else {
    return fill;
  }
};
export class MatrixView extends SvgComponentView {
  _labelViews: any;
  _cellViews: any;
  _plusViews: any;
  columnMap: any;
  matrixGrid: any;
  matrixStructureType: any;
  figure: any;
  svg: any;
  cells: any;

  constructor(matrixStructureType) {
    super();
    this._labelViews = [];
    this._cellViews = [];
    this._plusViews = [];
    this.columnMap = null;
    this.matrixGrid = null;
    this.matrixStructureType = matrixStructureType;
    this.figure = figures.createFigure(this);
    this.svg = this.figure.getContent(); // 历史遗留
    this.cells = this.figure.renderWorker.getCells();
  }
  get type() {
    return VIEW_TYPE.MATRIX;
  }
  get figureType() {
    return FIGURE_TYPE.MATRIX;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  render() {
    // todo
    const realPos = this.getRealPosition();
    this.move(realPos);
    this.syncLabelStyle();
    return this;
  }
  setColumnMap(columnMap) {
    this.columnMap = columnMap;
    this._labelViews.forEach((view) => view.removeSelf());
    this._labelViews = [];
    matrixCreateUtils
      .createLabelViews(this.columnMap, this.parent())
      .forEach((v) => {
        this._addLabelView(v);
        v.figure.layoutWorker.work(v);
      });
  }
  setMatrixGrid(matrixGrid) {
    this.matrixGrid = matrixGrid;
    this._initInnerViews();
  }
  setVisible(visible) {
    this.figure.setVisible(visible);
    const parent = this.parent();
    if (visible) {
      this.setBranchViewProxy();
    } else if (parent === null || parent === undefined) {
      // do nothing;
    } else {
      parent.setProxy(parent);
    }
    this._cellViews.forEach((v) => v.refreshViewShapeClass());
  }
  _initInnerViews() {
    this._cellViews.forEach((view) => view.removeSelf());
    this._cellViews = [];
    this._plusViews.forEach((view) => view.removeSelf());
    this._plusViews = [];
    const cellViews = matrixCreateUtils.createCellViews(
      this.matrixGrid,
      this.parent(),
    );
    cellViews.forEach((v) => this._addCellView(v));
    const plusViews = matrixCreateUtils.createPlusViews(
      this.matrixGrid,
      this.parent(),
    );
    plusViews.forEach((v) => this._addPlusView(v));
    this.setBranchViewProxy();
  }
  /** @private */
  _addLabelView(view) {
    this._labelViews.push(view);
    view.parent(this);
  }
  getLabelViewList() {
    return [...this._labelViews];
  }
  /** @private */
  _addCellView(view) {
    this._cellViews.push(view);
    view.parent(this);
  }
  /** @private */
  _addPlusView(view) {
    this._plusViews.push(view);
    view.parent(this);
  }
  setPlusViewVisible(visible) {
    this._plusViews.forEach((v) => v.setVisible(visible));
  }
  setBranchViewProxy() {
    // 在plus view添加之后再执行 after mounted
    this._cellViews.forEach((v) => v.afterMounted(v));
  }
  move(position) {
    this.getSvg().translate(position.x, position.y);
  }
  getSize() {
    const { width, height } = this.matrixGrid
      ? this.matrixGrid.size
      : { width: 0, height: 0 };
    const borderWidth = Number.parseInt(
      styleManager.getStyleValue(this.parent(), STYLE_KEYS.BORDER_LINE_WIDTH) ||
        "0",
    );
    const plusHeight = this._plusViews[1].bounds.height;
    return {
      width: width + borderWidth / 2,
      height: height + plusHeight + utils.layoutConstant.MATRIX_PLUS_RADIUS,
    };
  }
  removeSelf() {
    // todo 应该从figure中连环调用各自的dispose
    this._labelViews.forEach((v) => v.removeSelf());
    this._cellViews.forEach((v) => v.removeSelf());
    this._plusViews.forEach((v) => v.removeSelf());
    this.figure.dispose();
    this.stopListening();
    this.parent(null);
  }
  getSvg() {
    return this.svg;
  }
  syncLabelStyle() {
    const parent = this.parent();
    const fontColor = styleManager.getStyleValue(parent, STYLE_KEYS.TEXT_COLOR);
    this._labelViews.forEach((view) => view.setTextColor(fontColor));
  }
  getRealPosition() {
    let _a;
    let _b;
    const mainCell =
      (_a = this.matrixGrid) === null || _a === undefined
        ? undefined
        : _a.cells[0];
    if (!mainCell) {
      return {
        x: 0,
        y: 0,
      };
    }
    const p0 = mainCell.getAbsPos();
    const pPos =
      (_b = this.parent()) === null || _b === undefined
        ? undefined
        : _b.getRealPosition();
    return Object(matrixUtils.sub)(pPos, p0);
  }
  getCellByPos(rPos) {
    const matrixGrid = this.matrixGrid;
    const realPos = this.getRealPosition();
    const pos = Object(matrixUtils.sub)(rPos, realPos);
    return matrixUtils.getChildCellByPos(matrixGrid, pos);
  }
  getCellViews() {
    return this._cellViews;
  }
}

export default MatrixView;
