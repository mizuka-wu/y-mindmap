import { VIEW_TYPE, FIGURE_TYPE } from "../common/constants/index";

import figures from "../figures/index";

import SvgComponentView from "./svgcomponentview";

import * as utils from "../utils/index"; // todo copy from matrix cell, find a place to hold them
const SELECT_COLOR = "rgb(94, 187, 254)";
const HOVER_COLOR = "rgb(154, 213, 255)";
const DEFOCUS_COLOR = "#9f9f9f";
// todo
// change cell width by drag cell left or right border
// hide and show boundary as so on
// question
// 2: should or not support treetable child cell's collapse
// prefer size means custom width in titleView
// nodesArr.length is 1 while text's status was not break-line
// custom width disable
// user break line enable
// don't use break line to compute line width while it has not children
export class TreeTableCellView extends SvgComponentView {
  _treeTableHeadBranchView: any;
  isVisible: boolean;
  figure: any;
  isForcedInvisible: any;
  constructor(parentView) {
    super();
    this._treeTableHeadBranchView = null;
    this.isVisible = true;
    this.parent(parentView);
    this.figure = figures.createFigure(this);
    this._setTreeTableHeadBranchView();
    this.refreshTreeTableRealPosition();
    this._initEventListener();
    parentView.setProxy(this);
  }
  get type() {
    return VIEW_TYPE.TREE_TABLE_CELL;
  }
  get figureType() {
    return FIGURE_TYPE.TREE_TABLE_CELL;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this.isForcedInvisible);
    const parentBranchView = this.parent();
    if (Object(utils.isTreeTableHeadBranch)(parentBranchView)) {
      parentBranchView.topicView.refreshStyles();
    }
  }
  updateCellSizeByEditing(editingTopicSize) {
    const layoutInfo = this.getParentLayoutInfo();
    if (!layoutInfo) {
      return;
    }
    const {
      cellHeight: layoutCellHeight,
      cellWidth: layoutCellWidth,
      cellX,
      cellY,
    } = layoutInfo.externalInfo;
    const { borderLineWidth } = this.figure;
    const originalTopicSize = Object.assign({}, layoutInfo.topicBounds);
    const fixEditingCellWidth =
      Math.abs(cellX) -
      originalTopicSize.width / 2 +
      editingTopicSize.width +
      borderLineWidth / 2 +
      utils.layoutConstant.TREE_TABLE_CELL_PADDING_HORIZON;
    const fixEditingCellHeight =
      Math.abs(cellY) -
      originalTopicSize.height / 2 +
      editingTopicSize.height +
      borderLineWidth / 2 +
      utils.layoutConstant.TREE_TABLE_CELL_PADDING_VERTICAL;
    const newCellWidth = Math.max(fixEditingCellWidth, layoutCellWidth);
    const newCellHeight = Math.max(fixEditingCellHeight, layoutCellHeight);
    this.figure.setSize({
      width: newCellWidth,
      height: newCellHeight,
    });
  }
  _setTreeTableHeadBranchView() {
    const treeTableHeadBranchView = Object(utils.getTreeTableHeadBranchView)(
      this.parent()
    );
    if (treeTableHeadBranchView === this._treeTableHeadBranchView) {
      return;
    }
    if (
      this._treeTableHeadBranchView &&
      this._treeTableHeadBranchView !== this.parent()
    ) {
      this.stopListening(this._treeTableHeadBranchView.model);
    }
    this._treeTableHeadBranchView = treeTableHeadBranchView;
    this._initEventListenerAboutTreeTableHeadBranch();
  }
  _initEventListenerAboutTreeTableHeadBranch() {
    if (!this._treeTableHeadBranchView) {
      return;
    }
    this.addAutoRun(() => {
      if (!this._treeTableHeadBranchView) {
        return;
      }
      this.refreshTreeTableBorderLineColor();
      this.refreshTreeTableBorderLineWidth();
    });
    this.addAutoRun(() => {
      if (!this._treeTableHeadBranchView) {
        return;
      }
      this.figure.setBorderLinePattern(
        Object(utils.getUnDashableLinePattern)(
          this._treeTableHeadBranchView.topicView.figure.borderLinePattern
        )
      );
    });
  }
  _initEventListener() {
    const parentBranchView = this.parent();
    if (!parentBranchView) {
      return;
    }
    this.listenTo(parentBranchView, "afterlayoutInfoUpdate", () => {
      this._setTreeTableHeadBranchView();
      this.refreshCellSize();
      this.refreshCellBoundsPosition();
    });
    this.listenTo(parentBranchView, "afterRealPosChange", () => {
      this.refreshTreeTableRealPosition();
    });
    this.listenTo(parentBranchView.model, "addTopic removeTopic", () => {
      this.parent().topicView.refreshTextAlign();
    });
    this.listenTo(parentBranchView, "refreshView", () => {
      let shouldHideTreeTableCell;
      if (Object(utils.isTreeTableHeadBranch)(parentBranchView)) {
        shouldHideTreeTableCell =
          parentBranchView.shouldCollapse() || parentBranchView.shouldHide();
        if (shouldHideTreeTableCell) {
          this.parent().deleteProxy(this);
        } else {
          this.parent().setProxy(this);
        }
      } else {
        shouldHideTreeTableCell = parentBranchView.shouldHide();
      }
      this.setVisible(!shouldHideTreeTableCell);
    });
    const topicFigure = parentBranchView.topicView.figure;
    this.addAutoRun(() => {
      this.figure.setFillColor(topicFigure.originalFillColor);
      this.figure.setFillPattern(topicFigure.fillPattern);
    });
  }
  getParentLayoutInfo() {
    let _a;
    return this.parent().getLayoutInfo(
      (_a = this._treeTableHeadBranchView) === null || _a === undefined
        ? undefined
        : _a.getStructureClass()
    );
  }
  refreshCellSize() {
    const layoutInfo = this.getParentLayoutInfo();
    if (!layoutInfo) {
      return;
    }
    this.figure.setSize({
      width: layoutInfo.externalInfo.cellWidth,
      height: layoutInfo.externalInfo.cellHeight,
    });
  }
  getRealPosition() {
    let _a;
    const parentBranch = this.parent();
    const structure =
      (_a = this._treeTableHeadBranchView) === null || _a === undefined
        ? undefined
        : _a.getStructureClass();
    const { x: posX, y: posY } = parentBranch.getRealPosition();
    const { cellX, cellY, cellWidth, cellHeight } =
      parentBranch.getLayoutInfo(structure).externalInfo;
    return {
      x: posX + cellX + cellWidth / 2,
      y: posY + cellY + cellHeight / 2,
    };
  }
  getChildrenCellSize() {
    let _a;
    let _b;
    const children = this.parent().getChildrenBranchesByType();
    const structure =
      (_a = this._treeTableHeadBranchView) === null || _a === undefined
        ? undefined
        : _a.getStructureClass();
    return {
      width:
        ((_b = children[0]) === null || _b === undefined
          ? undefined
          : _b.getLayoutInfo(structure).bounds.width) ?? 0,
      height: children.reduce((total, child) => {
        return (total += child.getLayoutInfo(structure).bounds.height);
      }, 0),
    };
  }
  refreshCellBoundsPosition() {
    const layoutInfo = this.getParentLayoutInfo();
    if (!layoutInfo) {
      return;
    }
    this.figure.setCellBoundsPosition({
      x: layoutInfo.externalInfo.cellX,
      y: layoutInfo.externalInfo.cellY,
    });
  }
  refreshTreeTableRealPosition() {
    const realPos = this.parent().getRealPosition();
    if (realPos) {
      this.figure.setPosition(realPos);
    }
  }
  refreshTreeTableBorderLineColor() {
    if (!this._treeTableHeadBranchView) {
      return;
    }
    this.figure.setBorderLineColor(
      this._treeTableHeadBranchView.topicView.figure.borderColor
    );
  }
  refreshTreeTableBorderLineWidth() {
    if (!this._treeTableHeadBranchView) {
      return;
    }
    this.figure.setBorderLineWidth(
      this._treeTableHeadBranchView.topicView.figure.borderWidth
    );
  }
  getNextEventTarget() {
    return this.parent().figure.renderWorker.getContent().node;
  }
  getTreeTableHeadBranchViewId() {
    let _a;
    if ((_a = this._treeTableHeadBranchView) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.model.getId();
    }
  }
  remove() {
    this.figure.dispose();
    this.stopListening();
    this.clearReactions();
    this.parent().deleteProxy(this);
    this.parent(null);
    return this;
  }
  displayHover() {
    let _a;
    this.figure.setSelectBoxAttr({
      display: "block",
      stroke: HOVER_COLOR,
    });
    if ((_a = this.parent().collapseExtendView) === null || _a === undefined) {
      // do noting;
    } else {
      _a.hover();
    }
  }
  displayDehover() {
    let _a;
    this.figure.setSelectBoxAttr({
      display: "none",
    });
    if ((_a = this.parent().collapseExtendView) === null || _a === undefined) {
      // do noting
    } else {
      _a.dehover();
    }
  }
  displaySelect() {
    let _a;
    this.figure.setSelectBoxAttr({
      display: "block",
      stroke: SELECT_COLOR,
    });
    if ((_a = this.parent().collapseExtendView) === null || _a === undefined) {
      // do noting
    } else {
      _a.hover();
    }
  }
  displayDeselect() {
    let _a;
    this.figure.setSelectBoxAttr({
      display: "none",
    });
    if ((_a = this.parent().collapseExtendView) === null || _a === undefined) {
      // do noting
    } else {
      _a.dehover();
    }
  }
  displayDeFocus() {
    this.figure.setSelectBoxAttr({
      display: "block",
      stroke: DEFOCUS_COLOR,
    });
  }
}
export default TreeTableCellView;
