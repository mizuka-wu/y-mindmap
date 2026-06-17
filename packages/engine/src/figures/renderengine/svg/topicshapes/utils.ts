import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
  TOPICSHAPE,
  TREE_TABLE_GROUP_LIST,
} from "../../../../common/constants/index";

import { getStructure } from "../../../../structures/helper/allstructures";

import * as utils from "../../../../utils/index"; // @flow
/**
 * @description todo
 * */
export function getStartDirection(parentBranchView, childBranchView) {
  const structure = parentBranchView.getStructureClass();
  switch (structure) {
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
    case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
      return DIRECTION.RIGHT;
    case STRUCTURECLASS.LOGICLEFT:
      return DIRECTION.LEFT;
    case STRUCTURECLASS.ORGCHARTUP:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
      return DIRECTION.UP;
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TREESIDED:
    case STRUCTURECLASS.TIMELINEVERTICAL:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
      return DIRECTION.DOWN;
    default:
      break;
  }
  if (!childBranchView) {
    return DIRECTION.RIGHT;
  }
  // 根据 parent 和 child 的相对位置判断左右
  const childIsLeft =
    childBranchView.linePosition.x < parentBranchView.linePosition.x;
  if (childIsLeft) {
    return DIRECTION.LEFT;
  } else {
    return DIRECTION.RIGHT;
  }
}
/**
 * @description todo
 * */
export function getEndDirection(
  parentBranchView /*BranchView*/,
  childBranchView /*BranchView*/,
) {
  const structure = parentBranchView.getStructureClass();
  if (structure === STRUCTURECLASS.TIMELINESIDEDHORIZONTAL) {
    return utils.getReverseDir(
      utils.getFinalTimelineChildDirection(
        parentBranchView,
        childBranchView.branchIndex(),
      ),
    );
  }
  switch (structure) {
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.LEFTHEADTOPBONE:
    case STRUCTURECLASS.LEFTHEADBOTTOMBONE:
      return DIRECTION.LEFT;
    case STRUCTURECLASS.LOGICLEFT:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.RIGHTHEADTOPBONE:
    case STRUCTURECLASS.RIGHTHEADBOTTOMBONE:
      return DIRECTION.RIGHT;
    case STRUCTURECLASS.ORGCHARTUP:
      return DIRECTION.DOWN;
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
      return DIRECTION.UP;
    default:
      break;
  }
  if (!childBranchView) {
    return DIRECTION.LEFT;
  }
  // 根据 parent 和 child 的相对位置判断左右
  const childIsLeft =
    childBranchView.linePosition.x < parentBranchView.linePosition.x;
  if (childIsLeft) {
    return DIRECTION.RIGHT;
  } else {
    return DIRECTION.LEFT;
  }
}
/**
 * @description todo
 * */
export function getJointPosition(bounds, direction) {
  const { x, y, width, height } = bounds;
  const position = {
    x: 0,
    y: 0,
  };
  switch (direction) {
    case DIRECTION.LEFT:
      position.x += x;
      break;
    case DIRECTION.RIGHT:
      position.x += x + width;
      break;
    case DIRECTION.UP:
      position.y += y;
      break;
    case DIRECTION.DOWN:
      position.y += y + height;
      break;
  }
  return position;
}
const UNDERLINE_DIVERGENCE = [
  BRANCHCONNECTION.ROUNDEDELBOW,
  BRANCHCONNECTION.CURVE,
  BRANCHCONNECTION.ELBOW,
];
const DIVERGENCE = UNDERLINE_DIVERGENCE.concat([
  BRANCHCONNECTION.STRAIGHT,
  BRANCHCONNECTION.FOLD,
  BRANCHCONNECTION.ROUNDEDFOLD,
]);
const BIGHT_DIVERGENCE = DIVERGENCE.concat([BRANCHCONNECTION.BIGHT]);
function isBalancedMap(structure) {
  return [STRUCTURECLASS.MAP, STRUCTURECLASS.MAPFLOATING].includes(structure);
}
function isAntiClockwiseMap(structure) {
  return [
    STRUCTURECLASS.MAPANTICLOCKWISE,
    STRUCTURECLASS.MAPFLOATINGANTICLOCKWISE,
  ].includes(structure);
}
export function isMapStructure(structure) {
  return structure.indexOf(STRUCTURECLASS.MAP) !== -1;
}
const isDivergentLine = (shapeStyle, lineStyle) => {
  const getLineStyleArr = (shapeStyle) => {
    switch (shapeStyle) {
      case TOPICSHAPE.UNDERLINE:
        return UNDERLINE_DIVERGENCE;
      case TOPICSHAPE.CLOUD:
      case TOPICSHAPE.PARALLELOGRAM:
        return BIGHT_DIVERGENCE;
      default:
        return DIVERGENCE;
    }
  };
  const lineStyleArr = getLineStyleArr(shapeStyle);
  return lineStyleArr.indexOf(lineStyle) >= 0;
};
const isOrderLine = (shapeStyle, lineStyle) => {
  const getLineStyleArr = (shapeStyle) => {
    switch (shapeStyle) {
      case TOPICSHAPE.UNDERLINE:
      case TOPICSHAPE.DIAMOND:
      case TOPICSHAPE.HEXAGON:
      case TOPICSHAPE.PARALLELOGRAM:
        return [];
      default:
        return [BRANCHCONNECTION.BIGHT];
    }
  };
  const lineStyleArr = getLineStyleArr(shapeStyle);
  return lineStyleArr.indexOf(lineStyle) >= 0;
};
/**
 * 三种聚拢类型
 * DIVER 为发散形，典型例子: Map structure + Rounded Elbow
 * ORDER 为从上到下排列形,典型例子: Map structure + Bight
 * FOCUS 为聚拢型，典型例子: mainTopic 下所有线形
 */
export const LINE_FOCUS_TYPE = {
  DIVER_LINE: "DIVER_LINE",
  ORDER_LINE: "ORDER_LINE",
  FOCUS_LINE: "FOCUS_LINE",
};
export function getLineFocusType(branchView /*BranchView*/) {
  const structure = branchView.getStructureClass();
  const shapeStyle = branchView.topicView.topicShapeStyle;
  const lineStyle = branchView.getConnectionView().getLineShape();
  if (!isMapStructure(structure)) {
    return LINE_FOCUS_TYPE.FOCUS_LINE;
  }
  if (isDivergentLine(shapeStyle, lineStyle)) {
    return LINE_FOCUS_TYPE.DIVER_LINE;
  }
  if (isOrderLine(shapeStyle, lineStyle)) {
    return LINE_FOCUS_TYPE.ORDER_LINE;
  } else {
    return LINE_FOCUS_TYPE.FOCUS_LINE;
  }
}
export function addPositionByDirection(position, direction, dx, dy = dx) {
  position = Object.assign({}, position); // copy to prevent change the origin pos
  switch (direction) {
    case DIRECTION.LEFT:
      position.x -= dx;
      break;
    case DIRECTION.RIGHT:
      position.x += dx;
      break;
    case DIRECTION.UP:
      position.y -= dy;
      break;
    case DIRECTION.DOWN:
      position.y += dy;
      break;
  }
  return position;
}
export function relativePositionToRealPosition(
  relativePosition,
  branchView /*BranchView*/,
) {
  const branchRealPosition = branchView.getRealPosition();
  return {
    x: relativePosition.x + branchRealPosition.x,
    y: relativePosition.y + branchRealPosition.y,
  };
}
export function realPositionToRelativePosition(realPosition, branchView) {
  const branchRealPosition = branchView.getRealPosition();
  return {
    x: realPosition.x - branchRealPosition.x,
    y: realPosition.y - branchRealPosition.y,
  };
}
/**
 * a inverse proportional function 反比例函数
 * constraint: if |y| <= y0, f(y) === p1
 * if |y| >= y0, f(y) decrease by y increase
 * and, f(y) approach to p2
 * f(y1) = (p2 - p1) / 2
 */
const _f = (() => {
  // critical value
  const y0 = 100;
  // f(y1) = (p1 - p2) * k
  const y1 = 600;
  // key point
  const k = 0.1;
  /**
   * @param {Number} y - y-position
   * @param {Number} p1 - f(y0) === p1
   * @param {Number} p2 - approximation
   * */
  return (y, p1, p2) => {
    p1 = Math.abs(p1);
    const symb = p2 / Math.abs(p2);
    y = Math.abs(y);
    if (y < y0) {
      return symb * p1;
    } else {
      p2 = Math.abs(p2);
      const c = p2;
      const b =
        ((k * p1 + (1 - k) * p2) * y1 - (p1 - p2) * y0) /
        ((1 - k) * p1 + (k - 2) * p2);
      const a = (p1 - p2) * (y0 + b);
      return symb * (a / (y + b) + c);
    }
  };
})();
export function isBoundsIntersect(parent) {
  const structure = parent.getStructureClass();
  const attached = parent.getChildrenBranchesByType();
  const rightNum = attached.filter(
    (child) => child.linePosition.x > parent.linePosition.x,
  ).length;
  const leftNum = attached.length - rightNum;
  const rightGroupInfo = {
    dir: DIRECTION.DOWN,
    length: rightNum,
    firstIndex: 0,
  };
  const leftGroupInfo = {
    dir: DIRECTION.UP,
    length: leftNum,
    firstIndex: rightNum,
  };
  if (isBalancedMap(structure)) {
    leftGroupInfo.dir = DIRECTION.DOWN;
  } else if (isAntiClockwiseMap(structure)) {
    rightGroupInfo.dir = DIRECTION.UP;
    leftGroupInfo.dir = DIRECTION.DOWN;
    rightGroupInfo.firstIndex = leftNum;
    leftGroupInfo.firstIndex = 0;
  }
  return {
    rightGroupInfo,
    leftGroupInfo,
  };
}
const pureOffsetPointCalcFnMap = {
  diver(parent, info) {
    const { childPos } = info;
    const topicBounds = parent.topicView.bounds;
    const parentPos = parent.linePosition;
    const isRight = childPos.x > parentPos.x;
    const scale = 2 / 3;
    const p1 = isRight
      ? (topicBounds.x + topicBounds.width) * scale
      : topicBounds.x * scale;
    const p2 = isRight ? 0.1 : -0.1;
    const offset = isRight ? topicBounds.x : -topicBounds.x;
    const deltaX = _f(childPos.y - parentPos.y, p1, p2) + offset;
    return {
      x: deltaX,
      y: 0,
    };
  },
  order(parent, info) {
    const { num, cur, dir } = info;
    const height = parent.topicView.bounds.height - 5; //不要突出
    // 计算 offset
    let offset = 0;
    const step = Math.min(height / (num + 1), 3);
    if (num % 2) {
      //odd
      const mid = Math.floor(num / 2);
      offset = (cur - mid) * step;
    } else {
      //even
      const mid = num / 2 - 0.5;
      offset = (cur - mid) * step;
    }
    if (dir === DIRECTION.UP) {
      offset *= -1;
    }
    return {
      x: 0,
      y: offset,
    };
  },
};
const PURE_LINE_FOCUS_OFFSET_FN_MAP = {
  [LINE_FOCUS_TYPE.DIVER_LINE]: [pureOffsetPointCalcFnMap.diver],
  [LINE_FOCUS_TYPE.ORDER_LINE]: [pureOffsetPointCalcFnMap.order],
  [LINE_FOCUS_TYPE.FOCUS_LINE]: [],
};
export function getLineOffsetPts(parent, info) {
  const lineFocusType = getLineFocusType(parent);
  const offsetFns = PURE_LINE_FOCUS_OFFSET_FN_MAP[lineFocusType];
  return offsetFns.map((fn) => fn(parent, info));
}
export const offsetPointCalcFnMap = {
  calcMapStructureStartPoint(parentBranchView, childBranchView) {
    const childPos = childBranchView.linePosition;
    return pureOffsetPointCalcFnMap.diver(parentBranchView, {
      childPos,
    });
  },
  /**
   * Ray TODO: 算 index 应该属于 branch 的责任，而不是由这个函数负责。
   * @description 计算map结构下sinus线型的出线点，start和col点将相同（计算两次）。
   */
  calcSinusStartYPoint(parentBranchView, childBranchView) {
    const attached = parentBranchView.getChildrenBranchesByType();
    const index = attached.indexOf(childBranchView);
    const { rightGroupInfo, leftGroupInfo } =
      isBoundsIntersect(parentBranchView);
    const atRight =
      rightGroupInfo.firstIndex <= index &&
      index < rightGroupInfo.firstIndex + rightGroupInfo.length;
    const groupInfo = atRight ? rightGroupInfo : leftGroupInfo;
    const info = {
      num: groupInfo.length,
      cur: index - groupInfo.firstIndex,
      dir: groupInfo.dir,
    };
    return pureOffsetPointCalcFnMap.order(parentBranchView, info);
  },
};
export function setTopicShapeScale(topicView, scaleX, scaleY, type) {
  let _a;
  let _b;
  let _c;
  let _d;
  let _e;
  if (type === "cloud") {
    topicView.topicShape.scale(scaleX, scaleY);
    topicView.topicShapeFill.scale(scaleX, scaleY);
    if (
      (_a = topicView.handDrawnTopicShapeBackground) === null ||
      _a === undefined
    ) {
      // do nothing
    } else {
      _a.scale(scaleX, scaleY);
    }
    if (
      (_b = topicView.handDrawnTopicShapeBackgroundMask) === null ||
      _b === undefined
    ) {
      // do nothing
    } else {
      _b.scale(scaleX, scaleY);
    }
  } else {
    if ((_c = topicView.topicShapeSelectBox) === null || _c === undefined) {
      // do nothing
    } else {
      _c.attr("transform", null);
    }
    topicView.topicShape.attr("transform", null);
    topicView.topicShapeFill.attr("transform", null);
    if (
      (_d = topicView.handDrawnTopicShapeBackground) === null ||
      _d === undefined
    ) {
      // do nothing
    } else {
      _d.attr("transform", null);
    }
    if (
      (_e = topicView.handDrawnTopicShapeBackgroundMask) === null ||
      _e === undefined
    ) {
      // do nothing
    } else {
      _e.attr("transform", null);
    }
  }
}
export function getBorderWidth(branchView /*BranchView*/) {
  return parseInt(branchView.topicView.figure.borderWidth || 0);
}
export function getFontSize(branchView /*BranchView*/) {
  return parseInt(branchView.topicView.titleView.figure.fontSize || 0);
}
/**
 * 返回四个方向的margin，以及lineWidth
 */
export function getUnits(branch) {
  return {
    fontSize: Math.min(
      50,
      parseInt(branch.topicView.titleView.figure.fontSize || 0),
    ),
    lm: parseInt(branch.topicView.figure.marginLeft || 0),
    rm: parseInt(branch.topicView.figure.marginRight || 0),
    tm: parseInt(branch.topicView.figure.marginTop || 0),
    bm: parseInt(branch.topicView.figure.marginBottom || 0),
    lw: parseInt(branch.topicView.figure.borderWidth || 0),
  };
}
export function calcUnderline(parentBranch) {
  const borderLineWidth = parseInt(
    parentBranch.topicView.figure.borderWidth || 0,
  );
  const { shapeBounds: bounds } = parentBranch.topicView;
  return {
    x: 0,
    y: bounds.y + bounds.height - borderLineWidth / 2,
  };
}
export const END_OFFSET = -1;
export function getGroupDirection(structure, addToRight = false) {
  if (isBalancedMap(structure)) {
    return DIRECTION.DOWN;
  }
  if (isAntiClockwiseMap(structure)) {
    if (addToRight) {
      return DIRECTION.UP;
    } else {
      return DIRECTION.DOWN;
    }
  }
  if (isMapStructure(structure)) {
    if (addToRight) {
      return DIRECTION.DOWN;
    } else {
      return DIRECTION.UP;
    }
  }
  switch (structure) {
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.ORGCHARTUP:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
    case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
    case STRUCTURECLASS.FISHBONELEFTHEADED:
      return DIRECTION.RIGHT;
    case STRUCTURECLASS.FISHBONERIGHTHEADED:
      return DIRECTION.LEFT;
    case STRUCTURECLASS.LOGICLEFT:
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.BRACELEFT:
    case STRUCTURECLASS.BRACERIGHT:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TREESIDED:
    case STRUCTURECLASS.TIMELINEVERTICAL:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
    case STRUCTURECLASS.LEFTHEADTOPBONE:
    case STRUCTURECLASS.RIGHTHEADTOPBONE:
      return DIRECTION.DOWN;
    case STRUCTURECLASS.LEFTHEADBOTTOMBONE:
    case STRUCTURECLASS.RIGHTHEADBOTTOMBONE:
      return DIRECTION.UP;
    default:
      return DIRECTION.DOWN;
  }
}
export function getOutDirection(structure, addToRight = false, dropView) {
  if (isMapStructure(structure)) {
    if (addToRight) {
      return DIRECTION.RIGHT;
    } else {
      return DIRECTION.LEFT;
    }
  }
  if (
    TREE_TABLE_GROUP_LIST.includes(structure) ||
    structure.includes("spreadsheet")
  ) {
    return getStructure(structure).getSourceOrientation(dropView);
  }
  switch (structure) {
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.TIMELINEVERTICAL:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.TREESIDED:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
    case STRUCTURECLASS.LEFTHEADTOPBONE:
    case STRUCTURECLASS.RIGHTHEADTOPBONE:
      return DIRECTION.DOWN;
    case STRUCTURECLASS.ORGCHARTUP:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
    case STRUCTURECLASS.LEFTHEADBOTTOMBONE:
    case STRUCTURECLASS.RIGHTHEADBOTTOMBONE:
      return DIRECTION.UP;
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.BRACERIGHT:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
    case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
    case STRUCTURECLASS.FISHBONELEFTHEADED:
      return DIRECTION.RIGHT;
    case STRUCTURECLASS.LOGICLEFT:
    case STRUCTURECLASS.BRACELEFT:
    case STRUCTURECLASS.FISHBONERIGHTHEADED:
      return DIRECTION.LEFT;
    default:
      return DIRECTION.RIGHT;
  }
}
export function getChildInDirection(
  structure,
  addToRight = false,
  index,
  total,
  dropView,
) {
  const isLastOne = index === total;
  const isEmpty = total === 0;
  if (isEmpty) {
    switch (structure) {
      case STRUCTURECLASS.FISHBONELEFTHEADTOP:
      case STRUCTURECLASS.FISHBONELEFTHEADBOTTOM:
      case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
        return DIRECTION.LEFT;
      case STRUCTURECLASS.FISHBONERIGHTHEADTOP:
      case STRUCTURECLASS.FISHBONERIGHTHEADBOTTOM:
        return DIRECTION.RIGHT;
    }
  }
  if (
    structure.includes("spreadsheet") ||
    TREE_TABLE_GROUP_LIST.includes(structure)
  ) {
    return Object(utils.getReverseDir)(
      getStructure(structure).getSourceOrientation(dropView),
    );
  }
  if (isMapStructure(structure)) {
    if (addToRight) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.RIGHT;
    }
  }
  if (STRUCTURECLASS.TIMELINEHORIZONTAL === structure) {
    if (isLastOne) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.NONE;
    }
  }
  if (STRUCTURECLASS.TIMELINESIDEDHORIZONTAL === structure) {
    return Object(utils.getFinalTimelineChildDirection)(dropView, index);
  }
  switch (structure) {
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.FISHBONELEFTHEADBOTTOM:
    case STRUCTURECLASS.FISHBONERIGHTHEADBOTTOM:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
      return DIRECTION.UP;
    case STRUCTURECLASS.ORGCHARTUP:
    case STRUCTURECLASS.FISHBONELEFTHEADTOP:
    case STRUCTURECLASS.FISHBONERIGHTHEADTOP:
      return DIRECTION.DOWN;
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.BRACERIGHT:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.LEFTHEADTOPBONE:
    case STRUCTURECLASS.LEFTHEADBOTTOMBONE:
      return DIRECTION.LEFT;
    case STRUCTURECLASS.LOGICLEFT:
    case STRUCTURECLASS.BRACELEFT:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.RIGHTHEADTOPBONE:
    case STRUCTURECLASS.RIGHTHEADBOTTOMBONE:
      return DIRECTION.RIGHT;
    default:
      return DIRECTION.NONE;
  }
}
export function getGroupAlign(structure, addToRight = false) {
  if (isMapStructure(structure)) {
    if (addToRight) {
      return DIRECTION.LEFT;
    } else {
      return DIRECTION.RIGHT;
    }
  }
  switch (structure) {
    case STRUCTURECLASS.ORGCHARTDOWN:
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
    case STRUCTURECLASS.FISHBONELEFTHEADBOTTOM:
    case STRUCTURECLASS.FISHBONERIGHTHEADBOTTOM:
      return DIRECTION.UP;
    case STRUCTURECLASS.ORGCHARTUP:
    case STRUCTURECLASS.FISHBONELEFTHEADTOP:
    case STRUCTURECLASS.FISHBONERIGHTHEADTOP:
      return DIRECTION.DOWN;
    case STRUCTURECLASS.LOGICRIGHT:
    case STRUCTURECLASS.BRACERIGHT:
    case STRUCTURECLASS.TREERIGHT:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
    case STRUCTURECLASS.TIMELINEHORIZONTALUP:
    case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
    case STRUCTURECLASS.LEFTHEADTOPBONE:
    case STRUCTURECLASS.LEFTHEADBOTTOMBONE:
      return DIRECTION.LEFT;
    case STRUCTURECLASS.LOGICLEFT:
    case STRUCTURECLASS.BRACELEFT:
    case STRUCTURECLASS.TREELEFT:
    case STRUCTURECLASS.RIGHTHEADTOPBONE:
    case STRUCTURECLASS.RIGHTHEADBOTTOMBONE:
      return DIRECTION.RIGHT;
    default:
      return DIRECTION.NONE;
  }
}
