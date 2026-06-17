import * as constants from "../common/constants/index";

import figures from "../figures/index";
import SvgComponentView from "./svgcomponentview";
import { getTopicShape as originGetTopicShape } from "../figures/renderengine/svg/topicshapes/index";
import * as common_utils from "../common/utils/index";
import * as topicshapes_utils from "../figures/renderengine/svg/topicshapes/utils";
import * as topiclinestyle_utils from "../render/topiclinestyle/utils";
import { layoutConstant } from "../utils/layoutconstant";
import * as matrixutils from "../utils/matrixutils";
import * as utils from "../utils/index";

const LEAF_LINE = 30;
const FISH_LINE = 40;
const TREE_LINE = 20;
const DISTANCE = 20;
const MIN_TABLE_LIKE_INNER_INDICATOR_WIDTH = 4;
const TABLE_LIKE_INDICATOR_WIDTH = 4;
const TABLE_LIKE_INDICATOR_PADDING = 0;
const BONE_CONNECTION_TAN = layoutConstant.FISH_BONE.BONE_CONNECTION_TAN;
const DELTA_DIR_MAP = {
  [constants.ALL_DIRECTION.RIGHT]: {
    x: 1,
    y: 0,
  },
  [constants.ALL_DIRECTION.LEFT]: {
    x: -1,
    y: 0,
  },
  [constants.ALL_DIRECTION.UP]: {
    x: 0,
    y: -1,
  },
  [constants.ALL_DIRECTION.DOWN]: {
    x: 0,
    y: 1,
  },
  [constants.ALL_DIRECTION.RIGHT_UP]: {
    x: 1 / BONE_CONNECTION_TAN,
    y: -1,
  },
  [constants.ALL_DIRECTION.RIGHT_DOWN]: {
    x: 1 / BONE_CONNECTION_TAN,
    y: 1,
  },
  [constants.ALL_DIRECTION.LEFT_UP]: {
    x: -1 / BONE_CONNECTION_TAN,
    y: -1,
  },
  [constants.ALL_DIRECTION.LEFT_DOWN]: {
    x: -1 / BONE_CONNECTION_TAN,
    y: 1,
  },
};
// from the centrol point of topic to corner point
const TOPIC_OFFSET_MAP = {
  [constants.ALL_DIRECTION.UP]: (bounds) => {
    return {
      x: 0,
      y: -bounds.height / 2,
    };
  },
  [constants.ALL_DIRECTION.DOWN]: (bounds) => {
    return {
      x: 0,
      y: bounds.height / 2,
    };
  },
  [constants.ALL_DIRECTION.LEFT]: (bounds) => {
    return {
      x: -bounds.width / 2,
      y: 0,
    };
  },
  [constants.ALL_DIRECTION.RIGHT]: (bounds) => {
    return {
      x: bounds.width / 2,
      y: 0,
    };
  },
  [constants.ALL_DIRECTION.LEFT_UP]: (bounds) => {
    return {
      x: -bounds.width / 2,
      y: -bounds.height / 2,
    };
  },
  [constants.ALL_DIRECTION.LEFT_DOWN]: (bounds) => {
    return {
      x: -bounds.width / 2,
      y: bounds.height / 2,
    };
  },
  [constants.ALL_DIRECTION.RIGHT_UP]: (bounds) => {
    return {
      x: bounds.width / 2,
      y: -bounds.height / 2,
    };
  },
  [constants.ALL_DIRECTION.RIGHT_DOWN]: (bounds) => {
    return {
      x: bounds.width / 2,
      y: bounds.height / 2,
    };
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [constants.ALL_DIRECTION.NONE]: (bounds) => {
    return {
      x: 0,
      y: 0,
    };
  },
};
const indicatorview_utils = {
  getDeltaByDir: (delta, dir) => {
    const mask = DELTA_DIR_MAP[dir];
    return {
      x: delta * mask.x,
      y: delta * mask.y,
    };
  },
  getTopicPosition: (branchView, direction) => {
    const position = branchView.figure.position;
    const bounds = branchView.topicView.shapeBounds;
    const offset = TOPIC_OFFSET_MAP[direction](bounds);
    return Object(common_utils.addPoint)(position, offset);
  },
  getCurrentColPosY: (p1, p2, deg = 30) =>
    Math.abs(p1.x - p2.x) * Math.tan((deg * Math.PI) / 180),
};
const FISHBONE_STRUCTURES = [
  constants.STRUCTURECLASS.FISHBONELEFTHEADED,
  constants.STRUCTURECLASS.FISHBONERIGHTHEADED,
];
const FISHBONE_CHILD_STRUCTURES = [
  constants.STRUCTURECLASS.LEFTHEADTOPBONE,
  constants.STRUCTURECLASS.LEFTHEADBOTTOMBONE,
  constants.STRUCTURECLASS.RIGHTHEADTOPBONE,
  constants.STRUCTURECLASS.RIGHTHEADBOTTOMBONE,
];
const TREE_STRUCTURES = [
  constants.STRUCTURECLASS.TREELEFT,
  constants.STRUCTURECLASS.TREERIGHT,
];
const INTER_CTX_MAP = {
  [constants.STRUCTURECLASS.TIMELINEVERTICAL]: [
    constants.STRUCTURECLASS.TREERIGHT,
    constants.STRUCTURECLASS.TREELEFT,
  ],
  [constants.STRUCTURECLASS.TREESIDED]: [
    constants.STRUCTURECLASS.TREERIGHT,
    constants.STRUCTURECLASS.TREELEFT,
  ],
  [constants.STRUCTURECLASS.FISHBONELEFTHEADED]: [
    constants.STRUCTURECLASS.FISHBONELEFTHEADTOP,
    constants.STRUCTURECLASS.FISHBONELEFTHEADBOTTOM,
  ],
  [constants.STRUCTURECLASS.FISHBONERIGHTHEADED]: [
    constants.STRUCTURECLASS.FISHBONERIGHTHEADTOP,
    constants.STRUCTURECLASS.FISHBONERIGHTHEADBOTTOM,
  ],
};
const STRUCTURE_END_DIR_MAP = {
  [constants.STRUCTURECLASS.TREERIGHT]: constants.ALL_DIRECTION.RIGHT,
  [constants.STRUCTURECLASS.TREELEFT]: constants.ALL_DIRECTION.LEFT,
  [constants.STRUCTURECLASS.FISHBONELEFTHEADTOP]:
    constants.ALL_DIRECTION.RIGHT_UP,
  [constants.STRUCTURECLASS.FISHBONELEFTHEADBOTTOM]:
    constants.ALL_DIRECTION.RIGHT_DOWN,
  [constants.STRUCTURECLASS.FISHBONERIGHTHEADTOP]:
    constants.ALL_DIRECTION.LEFT_UP,
  [constants.STRUCTURECLASS.FISHBONERIGHTHEADBOTTOM]:
    constants.ALL_DIRECTION.LEFT_DOWN,
};
function transInterStructure(structure, i) {
  const ctxs = INTER_CTX_MAP[structure];
  if (ctxs) {
    return ctxs[i % ctxs.length];
  } else {
    return null;
  }
}
function getEndDirection(structure, i) {
  const interStructure = transInterStructure(structure, i);
  if (interStructure) {
    return STRUCTURE_END_DIR_MAP[interStructure];
  }
  return constants.ALL_DIRECTION.RIGHT;
}
function getTopicShape(branchView) {
  return originGetTopicShape(branchView.topicView.getShapeStyle());
}
function getStartAnchorPoint(branchView, direction) {
  const TopicShape = getTopicShape(branchView);
  const basePt = TopicShape.getBasePoint(branchView, direction);
  const offset = TopicShape.getPointOffset(branchView, direction);
  const startPt = Object(common_utils.addPoint)(basePt, offset);
  return Object(topicshapes_utils.relativePositionToRealPosition)(
    startPt,
    branchView,
  );
}
function getCtrlAnchorPoint(branchView, direction) {
  const TopicShape = getTopicShape(branchView);
  const ctrlPt = TopicShape.getCtrlPoint(branchView, direction);
  return Object(topicshapes_utils.relativePositionToRealPosition)(
    ctrlPt,
    branchView,
  );
}
const SIBLIGN_DIR_MAP = {
  [constants.DIRECTION.UP]: [constants.DIRECTION.UP, constants.DIRECTION.DOWN],
  [constants.DIRECTION.DOWN]: [
    constants.DIRECTION.DOWN,
    constants.DIRECTION.UP,
  ],
  [constants.DIRECTION.LEFT]: [
    constants.DIRECTION.LEFT,
    constants.DIRECTION.RIGHT,
  ],
  [constants.DIRECTION.RIGHT]: [
    constants.DIRECTION.RIGHT,
    constants.DIRECTION.LEFT,
  ],
  [constants.DIRECTION.NONE]: [
    constants.DIRECTION.RIGHT,
    constants.DIRECTION.LEFT,
  ],
};
const JOINT_POS_MAP = {
  [constants.DIRECTION.UP]: {
    [constants.DIRECTION.LEFT]: constants.ALL_DIRECTION.LEFT_UP,
    [constants.DIRECTION.RIGHT]: constants.ALL_DIRECTION.RIGHT_UP,
    [constants.DIRECTION.NONE]: constants.ALL_DIRECTION.UP,
  },
  [constants.DIRECTION.DOWN]: {
    [constants.DIRECTION.LEFT]: constants.ALL_DIRECTION.LEFT_DOWN,
    [constants.DIRECTION.RIGHT]: constants.ALL_DIRECTION.RIGHT_DOWN,
    [constants.DIRECTION.NONE]: constants.ALL_DIRECTION.DOWN,
  },
  [constants.DIRECTION.LEFT]: {
    [constants.DIRECTION.UP]: constants.ALL_DIRECTION.LEFT_UP,
    [constants.DIRECTION.DOWN]: constants.ALL_DIRECTION.LEFT_DOWN,
    [constants.DIRECTION.NONE]: constants.ALL_DIRECTION.LEFT,
  },
  [constants.DIRECTION.RIGHT]: {
    [constants.DIRECTION.UP]: constants.ALL_DIRECTION.RIGHT_UP,
    [constants.DIRECTION.DOWN]: constants.ALL_DIRECTION.RIGHT_DOWN,
    [constants.DIRECTION.NONE]: constants.ALL_DIRECTION.RIGHT,
  },
  [constants.DIRECTION.NONE]: {
    [constants.DIRECTION.UP]: constants.ALL_DIRECTION.RIGHT_UP,
    [constants.DIRECTION.DOWN]: constants.ALL_DIRECTION.RIGHT_DOWN,
    [constants.DIRECTION.NONE]: constants.ALL_DIRECTION.RIGHT,
  },
};
function getTopicPoint(branch, dir, align = constants.DIRECTION.NONE) {
  const jointDir =
    JOINT_POS_MAP[dir]?.[align] ||
    JOINT_POS_MAP[dir]?.[constants.DIRECTION.NONE];
  return indicatorview_utils.getTopicPosition(branch, jointDir);
}
const getFishStartPoint = (b) => {
  let _a;
  if ((_a = b.getFishBoneMainLineView()) === null || _a === undefined) {
    return undefined;
  } else {
    return _a.figure.endPosition;
  }
};
// TODO 也许需要更严谨地计算
const getTreeStartPoint = (b, dir) => {
  const x = indicatorview_utils.getTopicPosition(
    b.parent(),
    constants.ALL_DIRECTION.DOWN,
  ).x;
  const y = getTopicPoint(b, dir).y;
  return {
    x,
    y,
  };
};
function calEndPosInGroup(
  index,
  siblings,
  groupDir,
  align = constants.DIRECTION.NONE,
) {
  const [dir1, dir2] = SIBLIGN_DIR_MAP[groupDir];
  if (index === 0) {
    const b2 = siblings[0];
    const point = getTopicPoint(b2, dir2, align);
    return Object(topicshapes_utils.addPositionByDirection)(
      point,
      dir2,
      DISTANCE,
    );
  }
  if (index === siblings.length) {
    const b1 = siblings[siblings.length - 1];
    const point = getTopicPoint(b1, dir1, align);
    return Object(topicshapes_utils.addPositionByDirection)(
      point,
      dir1,
      DISTANCE,
    );
  }
  const b1 = siblings[index - 1];
  const b2 = siblings[index];
  const p1 = getTopicPoint(b1, dir1, align);
  const p2 = getTopicPoint(b2, dir2, align);
  const offset = Object(common_utils.diffPoint)(p2, p1);
  return Object(common_utils.addPoint)(p2, {
    x: offset.x / 2,
    y: offset.y / 2,
  });
}
function calStartPosInInterGroup(index, siblings, groupDir, getStartPointFn) {
  const [dir1, dir2] = SIBLIGN_DIR_MAP[groupDir];
  if (index === 0) {
    const b2 = siblings[0];
    const p2 = getStartPointFn(b2, dir2);
    return Object(topicshapes_utils.addPositionByDirection)(p2, dir2, DISTANCE);
  }
  if (index === siblings.length) {
    const b1 = siblings[siblings.length - 1];
    const p1 = getStartPointFn(b1, dir1);
    return Object(topicshapes_utils.addPositionByDirection)(p1, dir1, DISTANCE);
  }
  const b1 = siblings[index - 1];
  const b2 = siblings[index];
  const p1 = getStartPointFn(b1, dir1);
  const p2 = getStartPointFn(b2, dir2);
  const offset = Object(common_utils.diffPoint)(p2, p1);
  return Object(common_utils.addPoint)(p2, {
    x: offset.x / 2,
    y: offset.y / 2,
  });
}
function getGroupInfo(dropView, opts) {
  let structure = dropView.getStructureClass();
  let children = dropView.getChildrenBranchesByType(
    constants.TOPIC_TYPE.ATTACHED,
  );
  let index = opts.index;
  const toRight = opts.addToRight;
  const freePosition = opts.freePosition;
  if (Object(topicshapes_utils.isMapStructure)(structure)) {
    const { rightGroupInfo, leftGroupInfo } = Object(
      topicshapes_utils.isBoundsIntersect,
    )(dropView);
    const { firstIndex, length } = toRight ? rightGroupInfo : leftGroupInfo;
    children = children.slice(firstIndex, firstIndex + length);
    index -= firstIndex;
  }
  if (dropView.shouldCollapse()) {
    children = [];
  }
  // 保证 index 的值在正常范围内，避免后面的逻辑报错
  index = Math.max(0, index);
  index = Math.min(index, children.length);
  const jointDir = Object(topicshapes_utils.getOutDirection)(
    structure,
    toRight,
    dropView,
  );
  const groupDir = Object(topicshapes_utils.getGroupDirection)(
    structure,
    toRight,
  );
  const interStructure = transInterStructure(structure, index);
  if (interStructure) {
    structure = interStructure;
  }
  const childJointDir = Object(topicshapes_utils.getChildInDirection)(
    structure,
    toRight,
    index,
    children.length,
    dropView,
  );
  const groupAlign = Object(topicshapes_utils.getGroupAlign)(
    structure,
    toRight,
  );
  const isVertical =
    constants.STRUCTURECLASS.ORGCHARTUP === structure ||
    constants.STRUCTURECLASS.ORGCHARTDOWN === structure;
  const groupInfo = {
    parent: dropView,
    jointDir,
    childJointDir,
    children,
    dir: groupDir,
    align: groupAlign,
    isVertical,
    freePosition,
  };
  return {
    groupInfo,
    index,
  };
}
function reverseDirection(dir) {
  switch (dir) {
    case constants.DIRECTION.UP:
      return constants.DIRECTION.DOWN;
    case constants.DIRECTION.DOWN:
      return constants.DIRECTION.UP;
    case constants.DIRECTION.LEFT:
      return constants.DIRECTION.RIGHT;
    case constants.DIRECTION.RIGHT:
      return constants.DIRECTION.LEFT;
  }
}
function getFishboneChildStartPos(startPt, endPt, childJointDir) {
  const maskX = childJointDir === constants.DIRECTION.LEFT ? 1 : -1;
  const deltaX =
    Math.abs(endPt.y - startPt.y) /
    layoutConstant.FISH_BONE.BONE_CONNECTION_TAN;
  return {
    x: startPt.x - maskX * deltaX,
    y: endPt.y,
  };
}
function getTreeTableIndicatorInfo(dropView, index) {
  const children = dropView.getChildrenBranchesByType();
  const childrenCount = children.length;
  const dropCellView = dropView.getTreeTableCellView();
  const dropViewStructure = dropView.getStructureClass();
  const { width: childrenWidth } = dropCellView.getChildrenCellSize();
  const borderLineWidth = dropCellView.figure.borderLineWidth;
  let pos;
  let size;
  if (childrenCount === 0) {
    // drop as new child, render a vertical block inside the drop cell right border
    const { x: cellPosX, y: cellPosY } = dropCellView.getRealPosition();
    const { width: cellWidth, height: cellHeight } = dropCellView.figure.size;
    pos = {
      x:
        cellPosX +
        cellWidth / 2 -
        borderLineWidth / 2 -
        TABLE_LIKE_INDICATOR_WIDTH -
        TABLE_LIKE_INDICATOR_PADDING,
      y: cellPosY - cellHeight / 2 + borderLineWidth / 2,
    };
    size = {
      width: TABLE_LIKE_INDICATOR_WIDTH,
      height: cellHeight - borderLineWidth,
    };
  } else if (childrenCount > 0 && index === 0) {
    // drop as first child, render a horizontal block inside the first child top border
    const firstCellView = children[0].getTreeTableCellView();
    const { x: firstCellPosX, y: firstCellPosY } =
      firstCellView.getRealPosition();
    const { width: firstCellWidth, height: firstCellHeight } =
      firstCellView.figure.size;
    pos = {
      x: firstCellPosX - firstCellWidth / 2 + borderLineWidth / 2,
      y:
        firstCellPosY -
        firstCellHeight / 2 +
        borderLineWidth / 2 +
        TABLE_LIKE_INDICATOR_PADDING,
    };
    size = {
      width: childrenWidth - borderLineWidth,
      height: TABLE_LIKE_INDICATOR_WIDTH,
    };
  } else if (childrenCount > 0 && index === childrenCount) {
    // drop as last child, render a horizontal block inside the last child bottom border
    const lastCellView = children[children.length - 1].getTreeTableCellView();
    const { x: lastCellPosX, y: lastCellPosY } = lastCellView.getRealPosition();
    const { width: lastCellWidth, height: lastCellHeight } =
      lastCellView.figure.size;
    pos = {
      x: lastCellPosX - lastCellWidth / 2 + borderLineWidth / 2,
      y:
        lastCellPosY +
        lastCellHeight / 2 -
        borderLineWidth / 2 -
        TABLE_LIKE_INDICATOR_WIDTH -
        TABLE_LIKE_INDICATOR_PADDING,
    };
    size = {
      width: childrenWidth - borderLineWidth,
      height: TABLE_LIKE_INDICATOR_WIDTH,
    };
  } else {
    // drop as middle child, render a horizontal block to cover the edge of neighbor children.
    const prevCell = dropView
      .getChildrenBranchesByType()
      [index - 1].getTreeTableCellView();
    const { width: prevWidth, height: prevHeight } = prevCell.figure.size;
    const { width: prevBonudsWidth } = prevCell
      .parent()
      .getLayoutInfo(dropViewStructure).bounds;
    const { x: prevPosX, y: prevPosY } = prevCell.getRealPosition();
    const indicatorWidth = Math.max(
      borderLineWidth,
      MIN_TABLE_LIKE_INNER_INDICATOR_WIDTH,
    );
    pos = {
      x: prevPosX - prevWidth / 2 + borderLineWidth / 2,
      y: prevPosY + prevHeight / 2 - indicatorWidth / 2,
    };
    size = {
      width: prevBonudsWidth - borderLineWidth,
      height: indicatorWidth,
    };
  }
  return {
    pos,
    size,
  };
}
function getMatrixIndicatorInfo(dropView, opts) {
  // drop as column / row, render a block to cover the edge between columns / rows
  const { index } = opts;
  const isDropAsHeadCell = utils.isMatrixMainBranch(dropView);
  const rootMatrixBranch = isDropAsHeadCell ? dropView : dropView.parent();
  const matrixView = rootMatrixBranch.getMatrixView();
  const baseAbsPos = matrixView.getRealPosition();
  const borderWidth = rootMatrixBranch.topicView.figure.borderWidth;
  if (isDropAsHeadCell) {
    const matrixGrid = matrixView.matrixGrid;
    const heads = matrixutils.getHeads(matrixGrid);
    const isDropAsRow =
      dropView.getStructureClass() === constants.STRUCTURECLASS.SPREADSHEET;
    if (heads.length - 1 === 0 || index === heads.length - 1) {
      // drop as last row or column
      const { width, height } = matrixView.matrixGrid.size;
      if (isDropAsRow) {
        // drop as the last row
        const matrixBottomLeftAbsPos = Object(common_utils.addPoint)(
          baseAbsPos,
          {
            x: 0,
            y: height,
          },
        );
        return {
          pos: {
            x: matrixBottomLeftAbsPos.x + borderWidth / 2,
            y:
              matrixBottomLeftAbsPos.y -
              borderWidth / 2 -
              TABLE_LIKE_INDICATOR_WIDTH -
              TABLE_LIKE_INDICATOR_PADDING,
          },
          size: {
            width: width - borderWidth,
            height: TABLE_LIKE_INDICATOR_WIDTH,
          },
        };
      } else {
        // drop as the last column
        const { height: mainCellHeight } = Object(matrixutils.getMainCell)(
          matrixGrid,
        ).size;
        const matrixTopRightAbsPos = Object(common_utils.addPoint)(baseAbsPos, {
          x: width,
          y: mainCellHeight,
        });
        return {
          pos: {
            x:
              matrixTopRightAbsPos.x -
              borderWidth / 2 -
              TABLE_LIKE_INDICATOR_WIDTH -
              TABLE_LIKE_INDICATOR_PADDING,
            y: matrixTopRightAbsPos.y + borderWidth / 2,
          },
          size: {
            width: TABLE_LIKE_INDICATOR_WIDTH,
            height: height - mainCellHeight - borderWidth,
          },
        };
      }
    } else {
      // drop as middle row or column
      const rowPos = matrixutils.getPos(matrixGrid, index + 1, 0).pos;
      const { width, height } = Object(matrixutils.getSize)(matrixGrid, index);
      const rowTopLeftAbsPos = Object(common_utils.addPoint)(
        baseAbsPos,
        rowPos,
      );
      const indicatorWidth = Math.max(borderWidth, TABLE_LIKE_INDICATOR_WIDTH);
      if (isDropAsRow) {
        // drop as middle row
        return {
          pos: {
            x: rowTopLeftAbsPos.x + borderWidth / 2,
            y: rowTopLeftAbsPos.y - indicatorWidth / 2,
          },
          size: {
            width: width - borderWidth,
            height: indicatorWidth,
          },
        };
      } else {
        // drop as middle column
        return {
          pos: {
            x: rowTopLeftAbsPos.x - indicatorWidth / 2,
            y: rowTopLeftAbsPos.y - borderWidth / 2,
          },
          size: {
            width: indicatorWidth,
            height: height + borderWidth,
          },
        };
      }
    }
  }
  // drop as cell children
  const { items: cellBranches, cell } = opts.matrixDroppedCellInfo;
  const { width: cellWidth, height: cellHeight } = cell.size;
  const cellTopLeftAbsPos = Object(common_utils.addPoint)(baseAbsPos, cell.pos);
  if (cellBranches.length === 0) {
    // drop as entire cell, render a block to cover the cell
    return {
      pos: {
        x: cellTopLeftAbsPos.x + borderWidth / 2,
        y: cellTopLeftAbsPos.y + borderWidth / 2,
      },
      size: {
        width: cellWidth - borderWidth,
        height: cellHeight - borderWidth,
      },
    };
  } else if (index === cellBranches[0].branchIndex()) {
    // drop as the first cell children, render a horizontal block to cover the top edge of first cell
    return {
      pos: {
        x: cellTopLeftAbsPos.x + borderWidth / 2,
        y: cellTopLeftAbsPos.y + borderWidth / 2 + TABLE_LIKE_INDICATOR_PADDING,
      },
      size: {
        width: cellWidth - borderWidth,
        height: TABLE_LIKE_INDICATOR_WIDTH,
      },
    };
  } else if (
    index ===
    cellBranches[cellBranches.length - 1].branchIndex() + 1
  ) {
    // drop as the last cell children, render a horizontal block to cover the bottom edge of last cell
    return {
      pos: {
        x: cellTopLeftAbsPos.x + borderWidth / 2,
        y:
          cellTopLeftAbsPos.y +
          cellHeight -
          borderWidth / 2 -
          TABLE_LIKE_INDICATOR_WIDTH -
          TABLE_LIKE_INDICATOR_PADDING,
      },
      size: {
        width: cellWidth - borderWidth,
        height: TABLE_LIKE_INDICATOR_WIDTH,
      },
    };
  } else {
    // drop as middle cell children, render a horizontal block to cover the edge between neighbor cells
    const indicatorWidth = Math.max(borderWidth, TABLE_LIKE_INDICATOR_WIDTH);
    return {
      pos: {
        x: cellTopLeftAbsPos.x + borderWidth / 2,
        y:
          cellTopLeftAbsPos.y +
          (index === cell.item.branchIndex() ? 0 : cell.size.height) -
          indicatorWidth / 2,
      },
      size: {
        width: cellWidth - borderWidth,
        height: indicatorWidth,
      },
    };
  }
}
function getTreeLikeIndicatorInfo(groupInfo, index) {
  const {
    parent,
    children,
    jointDir,
    isVertical,
    childJointDir,
    freePosition,
  } = groupInfo;
  const structure = parent.getStructureClass();
  const isFishbone = FISHBONE_STRUCTURES.includes(structure);
  const isFishboneChild = FISHBONE_CHILD_STRUCTURES.includes(structure);
  const isTree = TREE_STRUCTURES.includes(structure);
  // For Compatibility: support old TIMELINEHORIZONTAL structure
  // For Compatibility: old structure *TIMELINEVERTICAL* has been renamed as TREESIDED
  const isTreeSided = structure === constants.STRUCTURECLASS.TREESIDED;
  const isOldTimelineVer =
    structure === constants.STRUCTURECLASS.TIMELINEVERTICAL;
  const isOldTimelineHor =
    structure === constants.STRUCTURECLASS.TIMELINEHORIZONTAL;
  const isTimelineSidedHor =
    structure === constants.STRUCTURECLASS.TIMELINESIDEDHORIZONTAL;
  const isTimelineThroughVer =
    structure === constants.STRUCTURECLASS.TIMELINETHROUGHVERTICAL;
  const getLinePositions = () => {
    if (children.length === 0) {
      let startPt = getStartAnchorPoint(parent, jointDir);
      const p1 = Object(topicshapes_utils.addPositionByDirection)(
        startPt,
        jointDir,
        layoutConstant.LINECOLPOS,
      );
      const endPt = Object(topicshapes_utils.addPositionByDirection)(
        p1,
        reverseDirection(childJointDir),
        LEAF_LINE,
      );
      if (isFishboneChild) {
        startPt = getFishboneChildStartPos(
          startPt,
          endPt,
          groupInfo.childJointDir,
        );
      }
      const ctrlPt = startPt;
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    if (isFishbone) {
      const startPt = calStartPosInInterGroup(
        index,
        children,
        groupInfo.dir,
        getFishStartPoint,
      );
      const endPt = Object(common_utils.addPoint)(
        startPt,
        indicatorview_utils.getDeltaByDir(
          FISH_LINE,
          getEndDirection(structure, index),
        ),
      );
      const ctrlPt = startPt;
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    if (isTreeSided || isOldTimelineVer) {
      const startPt = getStartAnchorPoint(parent, jointDir);
      const ctrlPt = calStartPosInInterGroup(
        index,
        children,
        groupInfo.dir,
        getTreeStartPoint,
      );
      const endPt = Object(common_utils.addPoint)(
        ctrlPt,
        indicatorview_utils.getDeltaByDir(
          TREE_LINE,
          getEndDirection(structure, index),
        ),
      );
      ctrlPt.y = endPt.y - indicatorview_utils.getCurrentColPosY(endPt, ctrlPt);
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    if (isTimelineSidedHor) {
      const prevBranch = index === 0 ? parent : children[index - 1];
      const nextBranch = index < children.length ? children[index] : null;
      const startPosY = getStartAnchorPoint(parent, jointDir).y;
      const startBaseX =
        prevBranch === parent
          ? getStartAnchorPoint(parent, jointDir).x
          : prevBranch.getRealPosition().x;
      const startOffsetX = nextBranch
        ? (nextBranch.getRealPosition().x - startBaseX) / 2
        : parent.figure.majorSpacing;
      const startPt = {
        x: startBaseX + startOffsetX,
        y: startPosY,
      };
      const endPt = {
        x: startPt.x,
        y:
          startPt.y +
          (childJointDir === constants.DIRECTION.UP ? -1 : 1) *
            parent.figure.majorSpacing,
      };
      return {
        startPt,
        ctrlPt: startPt,
        endPt,
      };
    }
    if (isOldTimelineHor) {
      const mountBranch = index === 0 ? parent : children[index - 1];
      const startPt = getStartAnchorPoint(mountBranch, jointDir);
      const { x: endX } = calEndPosInGroup(
        index,
        children,
        groupInfo.dir,
        groupInfo.align,
      );
      const endPt = {
        x: endX,
        y: startPt.y,
      };
      const ctrlPt = startPt;
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    if (isTimelineThroughVer) {
      const mountBranch = index === 0 ? parent : children[index - 1];
      const startPt = getStartAnchorPoint(mountBranch, jointDir);
      const { x: endX } = calEndPosInGroup(
        index,
        children,
        groupInfo.dir,
        groupInfo.align,
      );
      const endPt = {
        x: endX,
        y: startPt.y + parent.figure.majorSpacing / 2,
      };
      return {
        startPt,
        ctrlPt: startPt,
        endPt,
      };
    }
    let startPt = getStartAnchorPoint(parent, jointDir);
    const endPt =
      freePosition ??
      calEndPosInGroup(index, children, groupInfo.dir, groupInfo.align);
    if (isTree) {
      const ctrlPt = {
        x: startPt.x,
        y: endPt.y,
      };
      ctrlPt.y = endPt.y - indicatorview_utils.getCurrentColPosY(endPt, ctrlPt);
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    if (isFishboneChild) {
      startPt = getFishboneChildStartPos(
        startPt,
        endPt,
        groupInfo.childJointDir,
      );
      const ctrlPt = startPt;
      return {
        startPt,
        ctrlPt,
        endPt,
      };
    }
    const info = {
      childPos: endPt,
      num: children.length,
      cur: index,
      dir: groupInfo.dir,
    };
    const deltaPts = Object(topicshapes_utils.getLineOffsetPts)(parent, info);
    startPt = deltaPts.reduce(
      (p1, p2) => Object(common_utils.addPoint)(p1, p2),
      startPt,
    );
    const ctrlPt =
      deltaPts.length > 0 ? startPt : getCtrlAnchorPoint(parent, jointDir);
    return {
      startPt,
      ctrlPt,
      endPt,
    };
  };
  const linePositions = getLinePositions();
  const needStraight =
    isFishbone ||
    isTimelineSidedHor ||
    ([
      constants.STRUCTURECLASS.BRACERIGHT,
      constants.STRUCTURECLASS.BRACELEFT,
    ].includes(structure) &&
      children.length === 0);
  const topicLineStyle = needStraight
    ? constants.BRANCHCONNECTION.STRAIGHT
    : parent.getConnectionView().getLineShape();
  const d = Object(topiclinestyle_utils.getLinePathBrushes)(topicLineStyle)[
    isVertical ? 1 : 0
  ](linePositions);
  return {
    d,
    endPt: linePositions.endPt,
    childJointDir,
  };
}
export class IndicatorView extends SvgComponentView {
  dropView: any;
  figure: any;
  constructor() {
    super();
    this.dropView = null;
    this.figure = figures.createFigure(this);
  }
  get type() {
    return constants.VIEW_TYPE.INDICATOR;
  }
  get figureType() {
    return constants.FIGURE_TYPE.INDICATOR;
  }
  update(dropView, opts?) {
    this.dropView = dropView;
    if (!dropView) {
      return this.hide();
    }
    if (!opts) {
      return;
    }
    const isMatrix = dropView.getStructureClass().includes("spreadsheet");
    const isTreeTable = constants.TREE_TABLE_GROUP_LIST.includes(
      dropView.getStructureClass(),
    );
    if (!dropView.model.isCollapse() && (isMatrix || isTreeTable)) {
      const { pos, size } = isMatrix
        ? getMatrixIndicatorInfo(dropView, opts)
        : getTreeTableIndicatorInfo(dropView, opts.index);
      this.figure.updateLineAttrs({
        d: "",
      });
      this.figure.updateBoxAttrs(
        Object.assign(Object.assign({}, pos), size),
        true,
      );
      this.figure.updateStartBranch(dropView);
    } else {
      const { groupInfo, index } = getGroupInfo(dropView, opts);
      const { d, endPt, childJointDir } = getTreeLikeIndicatorInfo(
        groupInfo,
        index,
      );
      this.figure.updateLineAttrs({
        d,
      });
      this.figure.updateBoxPos(endPt, childJointDir);
      this.figure.updateStartBranch(groupInfo.parent);
    }
    this.show();
  }
  clear() {
    this.update(null);
  }
  getSheetView() {
    if (!this.dropView) {
      return;
    }
    return this.dropView.sheetView;
  }
  show() {
    this.figure.setVisible(true, true);
  }
  hide() {
    this.figure.setVisible(false, true);
  }
}

export default IndicatorView;
