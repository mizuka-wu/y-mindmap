import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_TYPE,
} from "../common/constants/index";
import * as js_utils from "../utils/index";

import { structuresTreetable } from "./treetable";

export const TreeTableTopTitle = Object.assign({}, structuresTreetable, {
  direction: DIRECTION.DOWN,
  STRUCTURECLASS: STRUCTURECLASS.TOPTITLETREETABLE,
  treeInfoToTableInfo(treeInfo) {
    if (!treeInfo.children[TOPIC_TYPE.ATTACHED].length) {
      return [[treeInfo]];
    }
    const tableInfoExcludeHead = this.supplyTableRowInfoToRight(
      this.expandTableRowInfoToRight(
        treeInfo.children[TOPIC_TYPE.ATTACHED].map((childInfo) => {
          return [childInfo];
        }),
        0,
      ),
    );
    return [
      Array(tableInfoExcludeHead[0].length).fill(treeInfo),
      ...tableInfoExcludeHead,
    ];
  },
  _calcChildrenPolygons(branchView) {
    if (Object(js_utils.isTreeTableHeadBranch)(branchView)) {
      const cellView = branchView.getTreeTableCellView();
      const { cellWidth, cellHeight } = branchView.getLayoutInfo().externalInfo;
      const { height } = cellView.getChildrenCellSize();
      const PADDING = 16;
      const lt = {
        x: -cellWidth / 2,
        y: 0,
      };
      const rt = {
        x: cellWidth / 2 - PADDING,
        y: 0,
      };
      const rb = {
        x: cellWidth / 2 - PADDING,
        y: cellHeight / 2 + height + PADDING,
      };
      const lb = {
        x: -cellWidth / 2,
        y: cellHeight / 2 + height + PADDING,
      };
      const list = [lt, rt, rb, lb];
      return [
        {
          points: list,
          pointList: list,
          relatedBranchViewList: branchView.getChildrenBranchesByType(),
          side: null,
        },
      ];
    } else {
      return structuresTreetable._calcChildrenPolygons(branchView);
    }
  },
  calcTableBounds(tableInfo) {
    structuresTreetable.calcTableBounds.call(this, tableInfo);
    const tableInfoCopy = [...tableInfo];
    tableInfoCopy.splice(0, 1);
    const mainTableInfo = [...tableInfoCopy];
    const headCellItem = tableInfo[0][0];
    headCellItem.bounds.height = Array.from(
      new Set(mainTableInfo.map((row) => row[0])),
    ).reduce((preValue, currentCellItem) => {
      return preValue + currentCellItem.externalInfo.cellHeight;
    }, headCellItem.externalInfo.cellHeight);
  },
});
