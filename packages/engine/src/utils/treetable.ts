import * as utils from "./index";

import { STYLE_KEYS, TEXTALIGN, TOPIC_TYPE } from "../common/constants/index";

import defaultStyles from "./business/stylemanager/defaultstyles";
/**
 * tree table's cell size, start from left border line's center line, end by right border line's ceter line
 * so extend width and height only need to add one width and one height
 */
function getPadding(treeInfo, styleKey) {
  let presetValue;
  if (
    styleKey === STYLE_KEYS.MARGIN_LEFT ||
    styleKey === STYLE_KEYS.MARGIN_RIGHT
  ) {
    presetValue = utils.layoutConstant.TREE_TABLE_CELL_PADDING_HORIZON;
  } else {
    presetValue = utils.layoutConstant.TREE_TABLE_CELL_PADDING_VERTICAL;
  }
  return (
    (parseInt(treeInfo.style[styleKey]) * presetValue) /
    parseInt(defaultStyles.getStyleValue(treeInfo.classType, styleKey))
  );
}
function getBorderWidth(info) {
  return parseInt(info.style[STYLE_KEYS.BORDER_LINE_WIDTH]);
}
export function getExtendWidth(info) {
  return (
    getBorderWidth(info) +
    getPadding(info, STYLE_KEYS.MARGIN_LEFT) +
    getPadding(info, STYLE_KEYS.MARGIN_RIGHT)
  );
}
export function getExtendHeight(info) {
  return (
    getBorderWidth(info) +
    getPadding(info, STYLE_KEYS.MARGIN_TOP) +
    getPadding(info, STYLE_KEYS.MARGIN_BOTTOM)
  );
}
export function isExpandItem(list, item) {
  return list.indexOf(item) !== list.lastIndexOf(item);
}
export function getItemCellXY(item) {
  const textAlign = item.style[STYLE_KEYS.TEXT_ALIGN];
  const itemBounds = item.stopFlag ? item.bounds : item.topicBounds;
  let cellX = getExtendWidth(item) / 2 + Math.abs(itemBounds.x);
  switch (textAlign) {
    case TEXTALIGN.CENTER: {
      cellX =
        (item.externalInfo.cellWidth - itemBounds.width) / 2 +
        Math.abs(itemBounds.x);
      break;
    }
    case TEXTALIGN.RIGHT: {
      cellX =
        item.externalInfo.cellWidth -
        itemBounds.width -
        getExtendWidth(item) / 2 +
        Math.abs(itemBounds.x);
      break;
    }
  }
  const cellY =
    (item.externalInfo.cellHeight - itemBounds.height) / 2 +
    Math.abs(itemBounds.y);
  return {
    cellX: -cellX,
    cellY: -cellY,
  };
}
export function getItemCenterToCellRelativePosition(item) {
  const { cellX, cellY } = getItemCellXY(item);
  return {
    x: item.externalInfo.cellPosition.x + Math.abs(cellX),
    y: item.externalInfo.cellPosition.y + Math.abs(cellY),
  };
}
export function getCellItemRelativePosition(itemA, itemB) {
  const itemACenterToCellRelativePosition =
    getItemCenterToCellRelativePosition(itemA);
  const itemBCenterToCellRelativePosition =
    getItemCenterToCellRelativePosition(itemB);
  return {
    x:
      itemBCenterToCellRelativePosition.x - itemACenterToCellRelativePosition.x,
    y:
      itemBCenterToCellRelativePosition.y - itemACenterToCellRelativePosition.y,
  };
}
export function calcTableCellWidth(tableInfo) {
  const rowLength = tableInfo[0].length;
  for (let rIndex = 0; rIndex < rowLength; rIndex++) {
    const currentColItemInfoList = tableInfo.map((row) => {
      return {
        row,
        item: row[rIndex],
      };
    });
    const singleColItemInfoList = currentColItemInfoList.filter(
      (info) => !isExpandItem(info.row, info.item),
    );
    const maxSingleColWidth = Math.max(
      ...singleColItemInfoList.map((info) => {
        return (
          (info.item.stopFlag
            ? info.item.bounds.width
            : info.item.topicBounds.width) + getExtendWidth(info.item)
        );
      }),
    );
    // calc expand col item width
    const expandColItemInfoList = currentColItemInfoList.filter((info) =>
      isExpandItem(info.row, info.item),
    );
    let expandWidthToSuply = 0;
    const widthListToSuplyToEachRow = Array(rowLength).fill(0);
    expandColItemInfoList.forEach((info) => {
      info.item.externalInfo.cellWidth =
        (info.item.externalInfo.cellWidth ?? 0) + maxSingleColWidth;
      if (rIndex === info.row.lastIndexOf(info.item)) {
        const itemOriginWidth =
          (info.item.stopFlag
            ? info.item.bounds.width
            : info.item.topicBounds.width) + getExtendWidth(info.item);
        if (info.item.externalInfo.cellWidth < itemOriginWidth) {
          expandWidthToSuply = Math.max(
            itemOriginWidth - info.item.externalInfo.cellWidth,
            expandWidthToSuply,
          );
          widthListToSuplyToEachRow[rIndex] = expandWidthToSuply;
        }
      }
    });
    expandColItemInfoList.forEach((info) => {
      info.item.externalInfo.cellWidth += widthListToSuplyToEachRow[rIndex];
    });
    singleColItemInfoList.forEach((info) => {
      info.item.externalInfo.cellWidth =
        maxSingleColWidth + widthListToSuplyToEachRow[rIndex];
    });
  }
}
export function calcTableCellHeight(tableInfo) {
  const colLength = tableInfo.length;
  for (let cIndex = 0; cIndex < colLength; cIndex++) {
    const currentRowItemInfoList = tableInfo[cIndex].map((item, rIndex) => {
      return {
        col: tableInfo.map((row) => row[rIndex]),
        item,
      };
    });
    const singleRowItemInfoList = currentRowItemInfoList.filter(
      (info) => !isExpandItem(info.col, info.item),
    );
    const maxSingleRowHeight = Math.max(
      ...singleRowItemInfoList.map((info) => {
        return (
          (info.item.stopFlag
            ? info.item.bounds.height
            : info.item.topicBounds.height) + getExtendHeight(info.item)
        );
      }),
    );
    // calc expand row item height
    const expandRowItemInfoList = currentRowItemInfoList.filter((info) =>
      isExpandItem(info.col, info.item),
    );
    // todo 此处假定了不会有交叉的跨row单元格
    let expandHeightToSuply = 0;
    let expandRowItemFirstIndex = -1;
    const heightListToSuplyToEachCol = Array(colLength).fill(0);
    expandRowItemInfoList.forEach((info) => {
      info.item.externalInfo.cellHeight =
        (info.item.externalInfo.cellHeight ?? 0) + maxSingleRowHeight;
      if (cIndex === info.col.lastIndexOf(info.item)) {
        const itemOriginHeight =
          (info.item.stopFlag
            ? info.item.bounds.height
            : info.item.topicBounds.height) + getExtendHeight(info.item);
        if (info.item.externalInfo.cellHeight < itemOriginHeight) {
          expandHeightToSuply = Math.max(
            itemOriginHeight - info.item.externalInfo.cellHeight,
            expandHeightToSuply,
          );
          expandRowItemFirstIndex = info.col.indexOf(info.item);
          const heightToSuplyToEachCol =
            expandHeightToSuply / (cIndex - expandRowItemFirstIndex + 1);
          for (let i = expandRowItemFirstIndex; i <= cIndex; i++) {
            heightListToSuplyToEachCol[i] = heightToSuplyToEachCol;
          }
        }
      }
    });
    if (expandRowItemFirstIndex !== -1) {
      for (let i = expandRowItemFirstIndex; i < cIndex; i++) {
        Array.from(new Set(tableInfo[i]))
          .map((item: any, rIndex) => {
            return {
              col: tableInfo.map((row) => row[rIndex]),
              item,
            };
          })
          .forEach((info) => {
            info.item.externalInfo.cellHeight += heightListToSuplyToEachCol[i];
          });
      }
    }
    expandRowItemInfoList.forEach((info) => {
      info.item.externalInfo.cellHeight += heightListToSuplyToEachCol[cIndex];
    });
    singleRowItemInfoList.forEach((info) => {
      info.item.externalInfo.cellHeight =
        maxSingleRowHeight + heightListToSuplyToEachCol[cIndex];
    });
  }
}
export function calcTableCellPosition(tableInfo) {
  // point [0, 0] starts from left top corner
  // calc x
  tableInfo.forEach((row) => {
    let baseX = 0;
    Array.from(new Set(row)).forEach((item: any) => {
      item.externalInfo.cellPosition = {
        x: baseX,
        y: 0,
      };
      baseX += item.externalInfo.cellWidth;
    });
  });
  // calc y
  for (let i = 0; i < tableInfo[0].length; i++) {
    let baseY = 0;
    Array.from(new Set(tableInfo.map((row) => row[i]))).forEach((item: any) => {
      item.externalInfo.cellPosition.y = baseY;
      baseY += item.externalInfo.cellHeight;
    });
  }
}
export function calcTableCellItemPosition(treeInfo) {
  const chidlrenInfoList = treeInfo.children[TOPIC_TYPE.ATTACHED];
  if (!chidlrenInfoList.length) {
    return;
  }
  chidlrenInfoList.forEach((childInfo) => {
    childInfo.position = getCellItemRelativePosition(treeInfo, childInfo);
    if (!childInfo.stopFlag) {
      calcTableCellItemPosition(childInfo);
    }
  });
}
