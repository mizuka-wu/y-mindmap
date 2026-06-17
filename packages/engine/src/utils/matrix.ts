import { layoutConstant } from "./layoutconstant";
import * as baseutil from "./baseutil";
import * as matrixutils from "./matrixutils";

export const LEFT = "LEFT";
export const MIDDLE = "MIDDLE";
export const RIGHT = "RIGHT";
const CELL_PADDING = layoutConstant.MATRIX_CELL_PADDING;
const CELL_DEFAULT_WIDTH = layoutConstant.MATRIX_CELL_DEFAULT_WIDTH;
const copy = (obj) =>
  Array.isArray(obj) ? obj.slice() : Object.assign({}, obj);
const flatten = (arr) => arr.reduce((a, b) => a.concat(b), []);
const getCenterDelta = (s1, s2) => {
  return {
    x: (s1.width - s2.width) / 2,
    y: (s1.height - s2.height) / 2,
  };
};
const transpose = (rows) => {
  const t = [];
  if (rows.length === 0) {
    return t;
  } else {
    const rowLength = rows.length;
    const colLength = rows[0].length;
    for (let i = 0; i < colLength; i++) {
      t[i] = [];
      for (let j = 0; j < rowLength; j++) {
        t[i][j] = rows[j][i];
      }
    }
    return t;
  }
};
// 分配策略: 将多余的长度分配给 arr 的最后一位
const allocSize0 = (arr, x1) => {
  const x0 = arr.reduce((a, b) => a + b, 0);
  const dx = x1 - x0;
  arr[arr.length - 1] += dx;
};
// 分配策略: 将多余的长度平均分配给 arr 的每一位
const allocSize1 = (arr, x1) => {
  const x0 = arr.reduce((a, b) => a + b, 0);
  const dx = x1 - x0;
  const dxAvg = dx / arr.length;
  for (let i = 0; i < arr.length; i++) {
    arr[i] += dxAvg;
  }
};
export class Matrix {
  columns: any[];
  rows: any[];
  rowHeightArr: any[];
  colWidthArr: any[];
  size: any;
  pos: any;
  constructor(arrList = [], isColumn = false) {
    if (isColumn) {
      this.columns = arrList;
      this.rows = transpose(this.columns);
    } else {
      this.rows = arrList;
      this.columns = transpose(this.rows);
    }
    this.rowHeightArr = [];
    this.colWidthArr = [];
  }
  getMinSize() {
    this._calCellSize();
    const width = this.colWidthArr.reduce((a, b) => a + b);
    const height = this.rowHeightArr.reduce((a, b) => a + b);
    return {
      width,
      height,
    };
  }
  setSize(newSize) {
    this.size = newSize;
    const { width, height } = newSize;
    allocSize0(this.colWidthArr, width);
    allocSize0(this.rowHeightArr, height);
    this.rows.forEach((row, i) => {
      row.forEach((cell, j) => {
        const height = this.rowHeightArr[i];
        const width = this.colWidthArr[j];
        cell.setSize({
          width,
          height,
        });
      });
    });
  }
  setPos(newPos) {
    this.pos = newPos;
    const p1 = copy(newPos);
    this.rows.forEach((row, i) => {
      const p2 = copy(p1);
      row.forEach((cell, j) => {
        const colWidth = this.colWidthArr[j];
        const pos = copy(p2);
        cell.setPos(pos);
        p2.x += colWidth;
      });
      p1.y += this.rowHeightArr[i];
    });
  }
  getCells() {
    const cellsArr = this.rows.map((row) => {
      const cellsArr = row.map((cell) => cell.getCells());
      return flatten(cellsArr);
    });
    return flatten(cellsArr);
  }
  getColumnSize(index) {
    const height = this.rowHeightArr.reduce((a, b) => a + b);
    const width = this.colWidthArr[index];
    return {
      width,
      height,
    };
  }
  getRowSize(index) {
    const width = this.colWidthArr.reduce((a, b) => a + b);
    const height = this.rowHeightArr[index];
    return {
      width,
      height,
    };
  }
  _calCellSize() {
    this.rowHeightArr.length = 0;
    this.colWidthArr.length = 0;
    this.rows.forEach((row, i) => {
      row.forEach((cell, j) => {
        const { width, height } = cell.getMinSize();
        this.rowHeightArr[i] = this.rowHeightArr[i] || 0;
        this.colWidthArr[j] = this.colWidthArr[j] || 0;
        this.rowHeightArr[i] = Math.max(height, this.rowHeightArr[i]);
        this.colWidthArr[j] = Math.max(width, this.colWidthArr[j]);
      });
    });
  }
}
// 假设 container 的方向为 vertical
export class MatrixContainer {
  cells: any[];
  cellHeightArr: any[];
  size: any;
  pos: any;
  isTranspose: any;
  constructor(cells = []) {
    this.cells = cells;
    this.cellHeightArr = [];
  }
  getMinSize() {
    if (this.cells.length === 0) {
      return {
        width: 0,
        height: 0,
      };
    } else {
      const sizes = this.cells.map((cell) => cell.getMinSize());
      const widthArr = sizes.map((size) => size.width);
      const heightArr = sizes.map((size) => size.height);
      const width = Math.max(...widthArr);
      const height = heightArr.reduce((a, b) => a + b);
      this.cellHeightArr = heightArr;
      return {
        width,
        height,
      };
    }
  }
  setSize(newSize) {
    this.size = newSize;
    const { width, height } = newSize;
    allocSize1(this.cellHeightArr, height);
    this.cells.forEach((cell, i) => {
      const height = this.cellHeightArr[i];
      cell.setSize({
        width,
        height,
      });
    });
  }
  setPos(newPos) {
    this.pos = newPos;
    const p1 = copy(newPos);
    this.cells.forEach((cell, i) => {
      const pos = copy(p1);
      cell.setPos(pos);
      p1.y += this.cellHeightArr[i];
    });
  }
  getCells() {
    const cellsArr = this.cells.map((cell) => cell.getCells());
    return flatten(cellsArr);
  }
  getItems() {
    return this.getCells()
      .map((cell) => cell.item)
      .filter((item) => !Object(baseutil.isUndef)(item));
  }
}
export class MatrixCell {
  item: any;
  padding: number;
  align: string;
  size: any;
  pos: any;
  constructor(item?, opts: any = {}) {
    const defaultOpts = {
      padding: CELL_PADDING,
      align: MIDDLE,
    };
    const o = Object.assign(defaultOpts, opts);
    this.item = item;
    this.padding = o.padding;
    this.align = o.align;
  }
  getMinSize() {
    const defaultBounds = {
      width: CELL_DEFAULT_WIDTH,
      height: 0,
      x: 0,
      y: 0,
    };
    const { width, height } = Object(baseutil.isUndef)(this.item)
      ? defaultBounds
      : this.item.bounds;
    return {
      width: width + this.padding * 2,
      height: height + this.padding * 2,
    };
  }
  getCells() {
    return [this];
  }
  setSize(newSize) {
    this.size = newSize;
    this._setItemPos(newSize);
  }
  setPos(newPos) {
    this.pos = newPos;
  }
  getAbsPos() {
    const defaultBounds = {
      width: CELL_DEFAULT_WIDTH,
      height: 0,
      x: 0,
      y: 0,
    };
    const bounds = Object(baseutil.isUndef)(this.item)
      ? defaultBounds
      : this.item.bounds;
    return Object(matrixutils.sub)(
      Object(matrixutils.add)(this.pos, this.itemPos),
      bounds,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  itemPos: any = (pos: any, itemPos: any) => {
    throw new Error("Method not implemented.");
  };
  _setItemPos(newSize) {
    const minSize = this.getMinSize();
    const { padding } = this;
    let { x, y } = getCenterDelta(newSize, minSize);
    y += padding;
    switch (this.align) {
      case LEFT:
        x = padding;
        break;
      case RIGHT:
        x = newSize.width - minSize.width + padding;
        break;
      case MIDDLE:
      default:
        x += padding;
        break;
    }
    this.itemPos = {
      x,
      y,
    };
  }
}
export class ColumnMap {
  rowLength: any;
  colMap: Map<any, any>;
  keyArr: any[];
  constructor(rowLength) {
    this.rowLength = rowLength;
    this.colMap = new Map();
    this.keyArr = []; // for sorted column
  }
  getColumn(key) {
    const { colMap, rowLength } = this;
    if (!colMap.has(key)) {
      // init cells
      const cells = Array.from({
        length: rowLength,
      }).map(() => ({
        items: [],
      }));
      colMap.set(key, {
        key,
        cells,
      });
      this.keyArr.push(key);
    }
    return colMap.get(key);
  }
  getCell(index, key) {
    const column = this.getColumn(key);
    return column.cells[index];
  }
  getColumns() {
    return this.keyArr.map((key) => this.colMap.get(key));
  }
  setKeyArr(labelKeyList = []) {
    const oldLabelKeyList = [...this.keyArr];
    const result = [];
    labelKeyList.forEach((key) => {
      const index = oldLabelKeyList.indexOf(key);
      if (index !== -1) {
        oldLabelKeyList.splice(index, 1);
        result.push(key);
      }
    });
    this.keyArr = result.concat(oldLabelKeyList);
  }
  setKey(oldKey, newKey) {
    const index = this.keyArr.indexOf(oldKey);
    this.keyArr[index] = newKey;
    this.colMap.set(newKey, this.colMap.get(oldKey));
    this.colMap.delete(oldKey);
  }
  changeKeyOrder(oldIndex, newIndex) {
    const [targetKey] = this.keyArr.splice(oldIndex, 1);
    this.keyArr.splice(newIndex, 0, targetKey);
  }
}
