import TextView from "./textview";
import { VIEW_TYPE, FIGURE_TYPE, STYLE_KEYS } from "../common/constants/index";
import * as matrixUtils from "../utils/matrixutils"; // @flow

const DEFAULT_FONT_INFO = {
  fontSize: 12,
  fontFamily: "Helvetica, Arial, sans-serif",
  fontWeight: "normal",
  fontStyle: "normal",
  textColor: "#000",
};
// Pretend that Matrix label view has a model
// textAlign for editReceiver
// fill for matrixView
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fakeModel = {
  getStyle: (type) => {
    const style = {
      textAlign: "left",
    };
    return style[type];
  },
  hasAncestor() {
    return null;
  },
};

export class MatrixLabelView extends TextView {
  bounds: { x: number; y: number; width: number; height: number };
  isSelected: boolean;
  _cells: any;
  fontInfo: any;
  marginInfo: any;
  wrapperGroup: any;
  figure: any;
  matrixHeadBranchView: any;
  text: any;
  _proxy: any;
  constructor(text, cells, fontInfo, marginInfo, matrixHeadBranchView) {
    super();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.isSelected = false; /** @private */
    this._cells = cells;
    this.fontInfo = Object.assign({}, DEFAULT_FONT_INFO, fontInfo);
    this.marginInfo = Object.assign({}, marginInfo);
    this.wrapperGroup = this.figure.getContent();
    this.matrixHeadBranchView = matrixHeadBranchView;
    this.setText(text);
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.MATRIX_LABEL;
  }
  get figureType() {
    return FIGURE_TYPE.MATRIX_LABEL;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  initEventsListener() {
    this.addAutoRun(() => {
      let _a;
      this.figure.setTextColor(
        (_a = this.matrixHeadBranchView.topicView.titleView) === null ||
          _a === undefined
          ? undefined
          : _a.figure.textColor,
      );
    });
  }
  afterAncestorChange() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    this.refreshFontInfo(this.fontInfo);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setTextColor(color) {}
  /** @description for Brownie */
  getStyleValue(key) {
    switch (key) {
      case STYLE_KEYS.TEXT_COLOR: {
        return this.figure.textColor;
      }
      case STYLE_KEYS.FONT_FAMILY: {
        return this.figure.fontFamily;
      }
      case STYLE_KEYS.FONT_SIZE: {
        return this.figure.fontSize;
      }
      case STYLE_KEYS.FONT_STYLE: {
        return this.figure.fontStyle;
      }
      case STYLE_KEYS.FONT_WEIGHT: {
        return this.figure.fontWeight;
      }
      case STYLE_KEYS.FILL_COLOR: {
        return this._getCellView().figure.fillColor;
      }
    }
  }
  removeSelf() {
    const editDomain = this.editDomain();
    if (editDomain?.selectionManager) {
      editDomain.selectionManager.removeFromSelection(this);
    }
    this._cells = [];
    this.clearReactions();
    this.figure.dispose();
    this.parent(null);
  }
  setPosition(positions) {
    this.wrapperGroup.translate(positions.x, positions.y);
  }
  getEditContent() {
    return this.text || this.getContext().getTranslatedText("LABEL_TITLE");
  }
  // interface for edit receiver
  getTextClientStyle() {
    return this.fontInfo;
  }
  getTextClientBounds() {
    const textNode = this.getTextSvg().node;
    const val = textNode.getBoundingClientRect();
    val.width = this.bounds.width;
    val.height = this.bounds.height;
    return val;
  }
  // interface for edit receiver
  saveEdit(newText) {
    let _a;
    const oldText = this.text;
    this._cells.forEach((cell) => {
      cell.items.forEach((view) => {
        view.model.changeLabel(newText);
      });
    });
    const matrixView = this.parent();
    if (matrixView) {
      if ((_a = matrixView.columnMap) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setKey(oldText, newText);
      } // merge columns with same label
      const newKeyArr = matrixView.columnMap.keyArr.reduce(
        (arr, key) => (key === arr[arr.length - 1] ? arr : [...arr, key]),
        [],
      );
      const branch = matrixView.parent();
      if (branch === null || branch === undefined) {
        // do nothing
      } else {
        branch.model.setMatrixLabelInfos(newKeyArr);
      }
      if (branch === null || branch === undefined) {
        // do nothing
      } else {
        branch.layout();
      }
    }
  }
  getSvg() {
    return this.wrapperGroup;
  }
  setProxy(newProxy) {
    this._proxy = newProxy;
  }
  getProxy() {
    return this._proxy ?? null;
  }
  deleteProxy() {
    delete this._proxy;
  }
  _getCellView() {
    // Ray: TODO, not good enough
    // should not assume the index of labelViews is the same as cells
    const matrixView = this.parent();
    const index = matrixView.getLabelViewList().indexOf(this);
    const labelRow = matrixUtils.getSliceFirstRow(matrixView?.matrixGrid);
    return labelRow[index].view;
  }
  createDragView() {
    const cellView = this._getCellView();
    return cellView.createDragView();
  }
  getRealPosition() {
    return this._getCellView().getRealPosition();
  }
  /** @description for selectable view */
  getClientRect() {
    const cellView = this._getCellView();
    const { bounds } = cellView;
    const realPos = this.getRealPosition();
    const clientPos = this.editDomain()
      .getCoordinateTransfer()
      .mindMapToViewport(realPos);
    return {
      x: clientPos.x,
      y: clientPos.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  removeColumnItems() {
    this._cells.forEach((cell) => {
      cell.items.forEach((view) => {
        view.model.removeSelf();
      });
    });
  }
  isEmpty() {
    let itemCount = 0;
    this._cells.forEach((cell) => {
      cell.items.forEach(() => {
        itemCount++;
      });
    });
    return itemCount === 0;
  }
  select() {
    let _a;
    this.isSelected = true;
    if ((_a = this.getProxy()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.displaySelect();
    }
  }
  deselect() {
    let _a;
    this.isSelected = false;
    if ((_a = this.getProxy()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.displayDeselect();
    }
  }
}

export default MatrixLabelView;
