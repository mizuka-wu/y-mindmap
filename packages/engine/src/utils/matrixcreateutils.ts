import styleManager from "./business/stylemanager/index";
import { STYLE_KEYS, ACTION_NAMES } from "../common/constants/index";
import MatrixLabelView from "../view/matrixlabelview";
import * as matrixutils from "./matrixutils";
import { MatrixCellView, MatrixPlusView } from "../view/matrixplusview";
import {
  ColumnMap,
  Matrix,
  MatrixContainer,
  MatrixCell,
  LEFT,
  MIDDLE,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  RIGHT,
} from "./matrix";

import { layoutConstant } from "./layoutconstant";
import * as baseutil from "./baseutil";
import * as lazyrunner from "../figures/lazyrunner/index";

const PLUS_VIEW_RADIUS = layoutConstant.MATRIX_PLUS_RADIUS;
const PLUS_VIEW_PADDING = layoutConstant.MATRIX_PLUS_RADIUS;
const LABEL_CELL = "LABEL_CELL";
const MAIN_CELL = "MAIN_CELL";
const NULL_CELL = "NULL_CELL";
const HEAD_CELL = "HEAD_CELL";
const CHILD_CELL = "CHILD_CELL";
// ============== create columnMap ==============
const createColumnMap = (branch) => {
  const children = branch.getChildrenBranchesByType();
  const columnMap = new ColumnMap(children.length);
  children.forEach((child, index) => {
    // get no grandChildren when child is dragged to prevent big change
    // which will cause 鬼畜 in Matrix
    const grandChildren = child.isPlaceHolderView
      ? []
      : child.getChildrenBranchesByType();
    grandChildren.forEach((gChild) => {
      const key = gChild.model.getLabel();
      const cell = columnMap.getCell(index, key);
      cell.items.push(gChild);
    });
  });
  // add empty column
  const columnLen = columnMap.getColumns().length;
  if (columnLen === 0) {
    children.forEach((child, index) => {
      const key = "";
      columnMap.getCell(index, key);
    });
  }
  // update columnKeyArr
  const columnKeyArr = branch.getMatrixView().figure.labelInfo;
  columnMap.setKeyArr(columnKeyArr);
  return columnMap;
};
// ============== create matrixGrid ==============
const createLabelRow = (columnMap) => {
  // first cell is empty
  const firstCell = createCell(NULL_CELL);
  const otherCells = columnMap.getColumns().map((column) => {
    const labelView = column?._keyView;
    if (column === null || column === undefined) {
      // do nothing
    } else {
      delete column._keyView;
    }
    const cell = createCell(LABEL_CELL, {
      labelView,
    });
    return cell;
  });
  return [firstCell, ...otherCells];
};
const createBranchRows = (columnMap, mainCell, branches) => {
  const rows = branches.map((branch, i) => {
    const headCell = createCell(HEAD_CELL, {
      branch,
      parentCell: mainCell,
    });
    const otherContainers = columnMap
      .getColumns()
      .filter((column) => Boolean(column))
      .map((column) => {
        const { items } = column.cells[i];
        const info = {
          labelText: column.key,
          parentCell: headCell,
        };
        const cells = items.map((item) => {
          const infoo = Object.assign(
            {
              branch: item,
            },
            info,
          );
          return createCell(CHILD_CELL, infoo);
        });
        if (cells.length === 0) {
          const emptyCell = createCell(CHILD_CELL, info);
          cells.push(emptyCell);
        }
        return new MatrixContainer(cells);
      });
    return [headCell, ...otherContainers];
  });
  return rows;
};
const createMatrixGrid = (branch, columnMap, isTranspose) => {
  const children = branch.getChildrenBranchesByType();
  // main cell
  const mainCell = createCell(MAIN_CELL, {
    branch,
  });
  // matrix
  const labelRow = createLabelRow(columnMap);
  const branchRows = createBranchRows(columnMap, mainCell, children);
  const totalRows = [labelRow, ...branchRows];
  const isColumn = isTranspose; // means that totalRows is column in matrix
  const matrix = new Matrix(totalRows, isColumn);
  const matrixGrid = new MatrixContainer([mainCell, matrix]);
  matrixGrid.isTranspose = isTranspose;
  return matrixGrid;
};
const setItemPos = (cell) => {
  const getRealPos = (cell) => {
    const p0 = cell.getAbsPos();
    if (Object(baseutil.isUndef)(cell._parentCell)) {
      return p0;
    } else {
      const p1 = cell._parentCell.getAbsPos(); // parent item pos
      return Object(matrixutils.sub)(p0, p1);
    }
  };
  if (Object(baseutil.isUndef)(cell.item)) {
    return;
  } else {
    // labelView or topicView
    let view = cell.item;
    if (Object(baseutil.isUndef)(view.setPosition)) {
      view = view.parent();
    }
    const pos = getRealPos(cell);
    view.setPosition(pos);
    if (Array.isArray(view.boundaries)) {
      view.boundaries.forEach((boundaryView) =>
        boundaryView.figure.invalidateLayout(),
      );
    }
  }
};
const initGrid = (matrixGrid) => {
  // calculate size of matrixGrid
  const size = matrixGrid.getMinSize();
  matrixGrid.setSize(size);
  matrixGrid.setPos({
    x: 0,
    y: 0,
  });
  const matrix = matrixGrid.cells[1];
  matrix.getCells().forEach((cell) => setItemPos(cell));
};
// ============== create cell  ==============
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const labelEventsC = (view) => {
  // const onDblClick = (e) => { $(view.getSvg().node).dblclick() }
  return {
    // 'dblclick': onDblClick,
  };
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const branchEventsC = (view) => {
  // const branch = (view.type === VIEW_TYPE.BRANCH) ? view : view.parent()
  // const onDblClick = (e) => { $(branch.getSvg().node).dblclick() }
  // const onClick = (e) => { $(branch.getSvg().node).click() }
  // const onMousedown = (e) => {
  //   branch.getModule(MODULE_NAME.SELECTION).selectSingle(branch)
  //   branch.onMousedown(e)
  // }
  // const onTap = (e) => {
  //   branch.getModule(MODULE_NAME.SELECTION).selectSingle(branch)
  // }
  return {
    // 'click': onClick,
    // 'dblclick': onDblClick,
    // 'mousedown': onMousedown,
    // 'tap': onTap,
  };
};
const emptyEventsC = (topicView, text) => {
  const onDblClick = () => {
    const topic = topicView.model.createEmptyTopic({
      title: topicView.parent().getChildDefaultTitle(),
      titleUnedited: true,
    });
    topicView.model.addChildTopic(topic, {
      noAnimation: true,
    });
    topic.changeLabel(text);
    lazyrunner.lazyRunner.work(lazyrunner.runnerConstants.PRIORITY.AFTER_EACH, {
      execute: () => {
        const context = topicView.getContext();
        const branchView = context.getSVGView().model2View[topic.getId()];
        context.execAction(ACTION_NAMES.SHOW_EDIT_BOX, {
          targets: [branchView],
        });
      },
    });
  };
  return {
    dblclick: onDblClick,
    doubletap: onDblClick,
  };
};
const createCell = (type, info = {}) => {
  const { branch, labelView, parentCell, labelText }: any = info;
  const opts0 = {
    align: LEFT,
  };
  const opts1 = {
    align: MIDDLE,
  };
  let cell;
  switch (type) {
    case CHILD_CELL:
      cell = new MatrixCell(branch, opts0);
      cell._view = branch;
      cell._parentCell = parentCell;
      cell._events = Object(baseutil.isUndef)(branch)
        ? emptyEventsC(parentCell.item, labelText)
        : branchEventsC(cell._view);
      return cell;
    case HEAD_CELL:
      cell = new MatrixCell(branch.topicView, opts0);
      cell._parentCell = parentCell;
      cell._view = branch;
      cell._events = branchEventsC(cell._view);
      return cell;
    case MAIN_CELL:
      cell = new MatrixCell(branch.topicView, opts0);
      cell._view = branch;
      cell._events = branchEventsC(cell._view);
      return cell;
    case LABEL_CELL:
      cell = new MatrixCell(labelView, opts1);
      cell._events = labelEventsC(labelView);
      cell._view = labelView;
      return cell;
    case NULL_CELL:
    default:
      cell = new MatrixCell();
      cell._isNull = true;
      return cell;
  }
};
// ============== create append view  ==============
const createCellViews = (matrixGrid, matrixHeadBranchView) => {
  const cellViews = matrixGrid.getCells().map((cell) => {
    const cellBounds = Object.assign(cell.pos, cell.size);
    const view = new MatrixCellView(
      cellBounds,
      cell._view,
      cell._events,
      cell._isNull,
      matrixHeadBranchView,
    );
    cell.view = view;
    return view;
  });
  return cellViews;
};
const addLabel = (branch) => {
  const addSubTopic = (branch) => {
    const { model } = branch;
    const title = branch.getChildDefaultTitle();
    const emptyTopic = model.createEmptyTopic({
      title,
      titleUnedited: true,
    });
    return model.addChildTopic(emptyTopic);
  };
  const getUniqueName = (title, titles, count = 1) => {
    let newTitle = `${title} ${count}`;
    while (titles.indexOf(newTitle) >= 0) {
      count++;
      newTitle = `${title} ${count}`;
    }
    return newTitle;
  };
  const getLabelName = (columMap, title) => {
    const titles = columMap.keyArr.filter((key) => key !== "");
    const count = titles.length + 1;
    return getUniqueName(title, titles, count);
  };
  const children = branch.getChildrenBranchesByType();
  if (children.length === 0) {
    addSubTopic(branch);
  }
  const firstBranch = children[0] || addSubTopic(branch);
  const topic = addSubTopic(firstBranch);
  const labelStr = branch.getContext().getTranslatedText("LABEL_TITLE");
  const { columnMap } = branch.getMatrixView();
  const newLabel = getLabelName(columnMap, labelStr);
  topic.changeLabel(newLabel);
  branch.model.setMatrixLabelInfos([
    ...branch.model.getMatrixLabelInfos(),
    newLabel,
  ]);
};
const addHeadTopic = (branch) => {
  branch.getContext().execAction(ACTION_NAMES.ADD_SUB_TOPIC, {
    targets: [branch],
    prue: true,
  });
};
const createPlusViews = (matrixGrid, branch) => {
  const matrix = matrixGrid.cells[1];
  const n = matrix.rows.length;
  const m = matrix.rows[0].length;
  const b0 = matrix.rows[0][m - 1].view.bounds;
  const b1 = matrix.rows[n - 1][0].view.bounds;
  const diameter = PLUS_VIEW_RADIUS * 2;
  const s1 = {
    width: diameter,
    height: diameter,
  }; // view size
  const padding = PLUS_VIEW_PADDING;
  const vb0 = Object.assign({}, b0, s1, {
    x: b0.x + b0.width + padding,
  }); // right
  const vb1 = Object.assign({}, b1, s1, {
    y: b1.y + b1.height + padding,
  }); // bottom
  let fn0 = () => {
    addLabel(branch);
  };
  let fn1 = () => {
    addHeadTopic(branch);
  };
  // swap fn0, fn1
  if (matrixGrid.isTranspose) {
    const tmp = fn0;
    fn0 = fn1;
    fn1 = tmp;
  }
  const view1 = new MatrixPlusView(vb0, fn0);
  const view2 = new MatrixPlusView(vb1, fn1);
  return [view1, view2];
};
const createLabelViews = (columnMap, mainBranch) => {
  const _getStyleForLengthValue = (view, keysObj) => {
    const result = {};
    Object.keys(keysObj).forEach((key) => {
      const styleKey = keysObj[key];
      const value = styleManager.getStyleValue(view, styleKey, {
        ignoreUser: true,
        ignoreClass: true,
      });
      if (value !== undefined) {
        result[key] = parseInt(value);
      }
    });
    return result;
  };
  const children = mainBranch.getChildrenBranchesByType();
  const isEmpty = children.length === 0;
  const fontInfoKeysObj = {
    fontSize: STYLE_KEYS.FONT_SIZE,
  };
  const marginInfoKeysObj = {
    marginTop: STYLE_KEYS.MARGIN_TOP,
    marginBottom: STYLE_KEYS.MARGIN_BOTTOM,
    marginLeft: STYLE_KEYS.MARGIN_LEFT,
    marginRight: STYLE_KEYS.MARGIN_RIGHT,
  };
  const fontInfo = isEmpty
    ? {}
    : _getStyleForLengthValue(children[0], fontInfoKeysObj);
  const marginInfo = isEmpty
    ? {}
    : _getStyleForLengthValue(children[0], marginInfoKeysObj);
  return columnMap.getColumns().map((column) => {
    const { key, cells } = column;
    const labelView = new MatrixLabelView(
      key,
      cells,
      fontInfo,
      marginInfo,
      mainBranch,
    );
    // add a reference so that matriGrid can get labelView by column
    column._keyView = labelView;
    return labelView;
  });
};
/* harmony default export */
export const matrixCreateUtils = {
  createColumnMap,
  createMatrixGrid,
  initGrid,
  createPlusViews,
  createLabelViews,
  createCellViews,
  PLUS_VIEW_PADDING,
};

export default matrixCreateUtils;
