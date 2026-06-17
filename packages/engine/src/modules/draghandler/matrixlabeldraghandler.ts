import BaseHandler from "../draghandler/basehandler";

import * as matrixUtils from "../../utils/matrixutils";
export class MatrixLabelDragHandler extends BaseHandler {
  _matrixView: any;
  _matrixMainBranchView: any;
  _matrixViewRealPosition: any;
  _matrixLabelViewOldIndex: any;
  constructor(context) {
    super(context);
    /** @private */
    this._matrixView = null;
    /** @private */
    this._matrixMainBranchView = null;
    /** @private */
    this._matrixViewRealPosition = null;
    /** @private */
    this._matrixLabelViewOldIndex = null;
  }
  dragStart(transferData) {
    const { draggedView } = transferData;
    this._matrixView = draggedView.parent();
    this._matrixMainBranchView = this._matrixView.parent();
    this._matrixViewRealPosition = this._matrixView.getRealPosition();
    this._matrixLabelViewOldIndex = this._matrixView
      .getLabelViewList()
      .indexOf(transferData.draggedView);
  }
  dragMoving(transferData) {
    const { position } = transferData;
    const { isTranspose } = this._matrixView.matrixGrid;
    const cellViews = this._getLabelCellViews();
    let newIndex;
    if (isTranspose) {
      const cellsY = cellViews.map(
        (view) =>
          view.bounds.y +
          this._matrixViewRealPosition.y +
          view.bounds.height / 2,
      );
      newIndex = this._geIndex(
        cellsY,
        position.y,
        this._matrixLabelViewOldIndex,
      );
    } else {
      const cellsX = cellViews.map(
        (view) =>
          view.bounds.x +
          this._matrixViewRealPosition.x +
          view.bounds.width / 2,
      );
      newIndex = this._geIndex(
        cellsX,
        position.x,
        this._matrixLabelViewOldIndex,
      );
    }
    if (newIndex !== this._matrixLabelViewOldIndex) {
      this._matrixView.columnMap.changeKeyOrder(
        this._matrixLabelViewOldIndex,
        newIndex,
      );
      const keyArr = [...this._matrixView.columnMap.keyArr];
      this._matrixLabelViewOldIndex = newIndex;
      this._matrixView.figure.setLabelInfo(keyArr);
      this._matrixMainBranchView.layout();
    }
  }
  dragFinish() {
    const newKeyArr = this._matrixView.figure.labelInfo;
    this._matrixMainBranchView.model.setMatrixLabelInfos(newKeyArr);
  }
  _getLabelCellViews() {
    const labelRow = Object(matrixUtils.getSliceFirstRow)(
      this._matrixView.matrixGrid,
    );
    return labelRow.map((cell) => cell.view);
  }
  _geIndex(arr, n, oldIndex) {
    let index = -1;
    arr.forEach((item, i) => {
      if (item < n) {
        index = i;
      }
    });
    if (oldIndex > index) {
      index++;
    }
    return index;
  }
}
