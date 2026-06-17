import Util from "../util";
import * as lib from "../lib/index";
export { add, sub } from "./pointutils";
const getPoints = ({ x, y, width, height }) => {
  return [
    {
      x,
      y,
    },
    {
      x,
      y: y + height,
    },
    {
      x: x + width,
      y: y + height,
    },
    {
      x: x + width,
      y,
    },
  ];
};

export const getMainCell = (matrixGrid) => matrixGrid.cells[0];
const getMatrix = (matrixGrid) => matrixGrid.cells[1];
export const getHeads = (matrixGrid) => {
  const matrix = getMatrix(matrixGrid);
  if (matrixGrid.isTranspose) {
    return matrix.columns;
  } else {
    return matrix.rows;
  }
};
const getRow = (matrixGrid, i) => getHeads(matrixGrid)[i];
export const getPos = (matrixGrid, i, j) => getRow(matrixGrid, i)[j];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getColumn = (matrixGrid, i) => getHeads(matrixGrid).map((row) => row[i]);
// slice to remove the frist nullCell
export const getSliceFirstRow = (matrixGrid) => getRow(matrixGrid, 0).slice(1); // get ChildCell by pos
export const getChildCellByPos = (matrixGrid, pos) => {
  let cellInfo = null;
  const rows = getHeads(matrixGrid);
  rows.forEach((row, i) => {
    if (i === 0) {
      return;
    }
    row.forEach((col, j) => {
      if (j === 0) {
        return;
      }
      const points = getPoints(Object.assign({}, col.pos, col.size));
      const isIntersection = Util.pointInPolygon(pos, points);
      if (isIntersection) {
        const headCell = getPos(matrixGrid, i, 0);
        const labelCell = getPos(matrixGrid, 0, j);
        const headBranch = headCell.item.parent();
        const label = labelCell.item.text;
        const items = col.getItems();
        const cell = col.cells.find((cell) =>
          Util.pointInPolygon(
            pos,
            getPoints(Object.assign(Object.assign({}, cell.pos), cell.size)),
          ),
        );
        cellInfo = {
          headBranch,
          label,
          items,
          cell,
        };
      }
    });
  });
  return cellInfo;
};
export const getSize = (matrixGrid, index) => {
  index = index + 1; // the first row is label row
  const matrix = getMatrix(matrixGrid);
  if (matrixGrid.isTranspose) {
    return matrix.getColumnSize(index);
  } else {
    return matrix.getRowSize(index);
  }
};
export const getItemPos = (matrixGrid, index) => {
  index = index + 1; // the first row is label row
  const cell = getPos(matrixGrid, index, 0);
  return cell.itemPos;
};
export const getFillColor = (color) => {
  if (color === "none") {
    return "none";
  } else {
    const hsv = lib.tinyColor(color).toHsv();
    hsv.v = Math.min(hsv.v + 0.1, 0.99);
    return lib.tinyColor(hsv).toRgbString();
  }
};
