import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPIC_TYPE,
  TREE_TABLE_EXPOSED_STRUCTURE,
  TREE_TABLE_GROUP_LIST,
} from "../common/constants/index";
import * as js_utils from "../utils/index";
import * as pointutils from "../utils/pointutils";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import { dragAreaUtil } from "./helper/dragareautil";

import { AbstractStructure } from "./abstractstructure";

import { structuresSpreadsheet } from "./spreadsheet";

import {
  calcTableCellWidth,
  calcTableCellHeight,
  calcTableCellPosition,
  calcTableCellItemPosition,
  getItemCellXY,
} from "../utils/treetable";
/**
 * about bounds and topicBounds in treeTable layout
 * do something about treeTable cell, use topicBounds;
 * do something about stopFlag cell, just use bounds, otherwise, branch bounds
 * final bounds must comes from topicBounds or cellSize
 */
export const treeTable = Object.assign({}, AbstractStructure, {
  newLayout: true,
  direction: DIRECTION.RIGHT,
  STRUCTURECLASS: STRUCTURECLASS.TREETABLE,
  startLayout(branchLayoutTreeInfo) {
    const treeTableLayoutTableInfo =
      this.treeInfoToTableInfo(branchLayoutTreeInfo);
    calcTableCellWidth(treeTableLayoutTableInfo);
    calcTableCellHeight(treeTableLayoutTableInfo);
    calcTableCellPosition(treeTableLayoutTableInfo);
    calcTableCellItemPosition(branchLayoutTreeInfo);
    this.calcTableBounds(treeTableLayoutTableInfo);
    branchLayoutTreeInfo.externalInfo.tableInfo = treeTableLayoutTableInfo;
  },
  treeInfoToTableInfo(treeInfo) {
    // in base tree table structure
    // number of rows euqals max wides of topics tree
    // number of cols equals max deep of topics tree
    return this.supplyTableRowInfoToRight(
      this.expandTableRowInfoToRight([[treeInfo]], 0),
    );
  },
  getSourceOrientation(branchView) {
    return structuresSpreadsheet.getSourceOrientation.call(this, branchView);
  },
  _calcChildrenPolygons(branchView) {
    const cellView = branchView.getTreeTableCellView();
    const { cellWidth, cellHeight, cellX } =
      branchView.getLayoutInfo().externalInfo;
    const rightEdgeX = cellX + cellWidth;
    const { width } = cellView.getChildrenCellSize();
    const PADDING = 16;
    const lt = {
      x: rightEdgeX - cellWidth / 2,
      y: -cellHeight / 2,
    };
    const rt = {
      x: rightEdgeX + width - PADDING,
      y: -cellHeight / 2,
    };
    const rb = {
      x: rightEdgeX + width - PADDING,
      y: cellHeight / 2,
    };
    const lb = {
      x: rightEdgeX - cellWidth / 2,
      y: cellHeight / 2,
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
  },
  _calcNoChildrenPolygons(branchView) {
    if (
      Object(js_utils.isTreeTableHeadBranch)(branchView) &&
      branchView.model.isCollapse()
    ) {
      const list = pointutils.convexHull([
        ...dragAreaUtil.getSidePoints(
          branchView,
          this.getSourceOrientation(branchView),
        ),
        ...dragAreaUtil.getPointsOfNoChildren(
          branchView,
          this.getSourceOrientation(branchView),
        ),
      ]);
      return [
        {
          points: list,
          pointList: list,
          relatedBranchViewList: [],
          side: null,
        },
      ];
    }
    const layoutinfo = branchView.getLayoutInfo(branchView.getStructureClass());
    if (!layoutinfo?.externalInfo) {
      return [];
    }
    const { cellWidth, cellHeight, cellX } = layoutinfo.externalInfo;
    const rightEdgeX = cellX + cellWidth;
    const PADDING = 16;
    const lt = {
      x: rightEdgeX - PADDING,
      y: -cellHeight / 2,
    };
    const rt = {
      x: rightEdgeX + PADDING,
      y: -cellHeight / 2,
    };
    const rb = {
      x: rightEdgeX + PADDING,
      y: cellHeight / 2,
    };
    const lb = {
      x: rightEdgeX - PADDING,
      y: cellHeight / 2,
    };
    const list = [lt, rt, rb, lb];
    return [
      {
        points: list,
        pointList: list,
        relatedBranchViewList: [],
        side: null,
      },
    ];
  },
  calcTableBounds(tableInfo) {
    tableInfo.forEach((row) => {
      Array.from(new Set<any>(row))
        .reverse()
        .forEach((item, index, currentRow) => {
          const { cellX, cellY } = getItemCellXY(item);
          item.externalInfo.cellX = cellX;
          item.externalInfo.cellY = cellY;
          if (item.stopFlag) {
            return;
          }
          item.bounds.x = cellX;
          item.bounds.y = cellY;
          item.bounds.height = item.externalInfo.cellHeight;
          let preItemBoundsWidth = 0;
          if (index > 0) {
            const preItem = currentRow[index - 1];
            preItemBoundsWidth = preItem.stopFlag
              ? preItem.externalInfo.cellWidth
              : preItem.bounds.width;
          }
          item.bounds.width = item.externalInfo.cellWidth + preItemBoundsWidth;
        });
    });
  },
  expandTableRowInfoToRight(tableInfo, level) {
    const newTableInfo = [];
    let hasChildToExpend = false;
    tableInfo.forEach((row) => {
      const levelTreeToExpend = row[level];
      if (
        levelTreeToExpend?.stopFlag ||
        !(levelTreeToExpend === null || levelTreeToExpend === undefined
          ? undefined
          : levelTreeToExpend.children[TOPIC_TYPE.ATTACHED].length)
      ) {
        newTableInfo.push([...row]);
      } else {
        hasChildToExpend = true;
        levelTreeToExpend.children[TOPIC_TYPE.ATTACHED].forEach((childInfo) => {
          newTableInfo.push([...row, childInfo]);
        });
      }
    });
    if (hasChildToExpend) {
      return this.expandTableRowInfoToRight(newTableInfo, level + 1);
    }
    return newTableInfo;
  },
  supplyTableRowInfoToRight(tableInfo) {
    const maxColNumber = Math.max(...tableInfo.map((row) => row.length));
    tableInfo.forEach((row) => {
      row.push(...Array(maxColNumber - row.length).fill(row[row.length - 1]));
    });
    return tableInfo;
  },
  // todo remove this from structure layout file
  drawAttachedConnectLine(parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
  getAvailableChildStructure() {
    return TREE_TABLE_EXPOSED_STRUCTURE.filter((structure) => {
      return (
        !TREE_TABLE_GROUP_LIST.includes(structure) ||
        structure === this.STRUCTURECLASS
      );
    });
  },
});
/* harmony default export */
export const structuresTreetable = treeTable;
