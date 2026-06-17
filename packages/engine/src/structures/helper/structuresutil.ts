import { layoutConstant } from "../../utils/layoutconstant";

import * as utils from "../../utils/index";

import { DIRECTION } from "../../common/constants/index";
const BOUNDARYGAP = layoutConstant.BOUNDARYGAP;
export const structuresUtil = {
  CALLOUTPOSAVAILABLE: {
    isAvailable: true,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sortBoundaries: function (boundaries) {
    const length = boundaries.length;
    let temp;
    let i;
    let j;
    for (i = 0; i < length - 1; i++) {
      const iRangeStart = boundaries[i].model.rangeStart;
      const iRangeEnd = boundaries[i].model.rangeEnd;
      for (j = i + 1; j < length; j++) {
        const jRangeStart = boundaries[j].model.rangeStart;
        const jRangeEnd = boundaries[j].model.rangeEnd;
        if (
          iRangeStart < jRangeStart ||
          (iRangeStart === jRangeStart && iRangeEnd > jRangeEnd)
        ) {
          temp = boundaries[i];
          boundaries[i] = boundaries[j];
          boundaries[j] = temp;
        }
      }
    }
    return boundaries;
  },
  isLineTapered: function (branch) {
    const sheetView = branch.editDomain().content();
    if (!sheetView) {
      return false;
    }
    if (!branch.isCentralBranch()) {
      return false;
    }
    const tapered = sheetView.figure.lineTapered;
    return tapered === "tapered";
  },
  setBoundaryPadding(branch) {
    if (Array.isArray(branch.boundaries)) {
      branch.boundaries.forEach((boundary) => {
        const boundaryTitleSize =
          boundary.figure.isVisible &&
          Object(utils.calcBoundaryTitleSize)(branch, boundary);
        if (boundaryTitleSize) {
          boundary.titleView.setSize(boundaryTitleSize);
          boundary.titleView.figure.setPreferredSize(boundaryTitleSize);
        }
      });
    }
    // placeholder branch should also have boundary bounds, for itself's layout
    // see https://hq.xmind.cn:30000/xmind/snowbrush/issues/146
    const attachedChildrenBranches =
      branch.getChildrenBranchesByType("attached");
    attachedChildrenBranches.forEach((childBranch, i) => {
      childBranch.boundaryBounds = Object.assign({}, childBranch.bounds);
      if (branch.boundaries.length) {
        _setBoundaryPadding(branch, childBranch, i);
      }
    });
    const otherChildrenBranches = branch.getChildrenBranchesByType([
      "callout",
      "summary",
      "detached",
    ]);
    otherChildrenBranches.forEach((otherBranch, i) => {
      otherBranch.boundaryBounds = Object.assign({}, otherBranch.bounds);
      if (otherBranch.boundaries.length) {
        _setBoundaryPadding(otherBranch, otherBranch, i);
      }
    });
  },
  /**
   * restrict callout move to right of parent
   * @param callout
   * @param position
   * @returns {*}
   */
  restrictCalloutToRight: function (callout, position) {
    const parentTopicBounds = callout.parent().topicView.bounds;
    const offset =
      position.x +
      callout.boundaryBounds.x +
      callout.boundaryBounds.width -
      (parentTopicBounds.x + parentTopicBounds.width);
    if (offset <= 0) {
      return structuresUtil.CALLOUTPOSAVAILABLE;
    } else {
      return {
        isAvailable: false,
        top: 0,
        bottom: 0,
        left: Math.abs(offset),
        right: 0,
      };
    }
  },
  restrictCalloutToLeft: function (callout, position) {
    const parentTopicBounds = callout.parent().topicView.bounds;
    const offset = position.x + callout.boundaryBounds.x - parentTopicBounds.x;
    if (offset >= 0) {
      return structuresUtil.CALLOUTPOSAVAILABLE;
    } else {
      return {
        isAvailable: false,
        top: 0,
        bottom: 0,
        left: 0,
        right: Math.abs(offset),
      };
    }
  },
  restrictCalloutToBottom: function (callout, position) {
    const parentTopicBounds = callout.parent().topicView.bounds;
    const offset =
      position.y +
      callout.boundaryBounds.y +
      callout.boundaryBounds.height -
      parentTopicBounds.y;
    if (offset <= 0) {
      return structuresUtil.CALLOUTPOSAVAILABLE;
    } else {
      return {
        isAvailable: false,
        top: Math.abs(offset),
        bottom: 0,
        left: 0,
        right: 0,
      };
    }
  },
  restrictCalloutToTop: function (callout, position) {
    const parentTopicBounds = callout.parent().topicView.bounds;
    const offset =
      position.y +
      callout.boundaryBounds.y -
      (parentTopicBounds.y + parentTopicBounds.height);
    if (offset >= 0) {
      return structuresUtil.CALLOUTPOSAVAILABLE;
    } else {
      return {
        isAvailable: false,
        top: 0,
        bottom: Math.abs(offset),
        left: 0,
        right: 0,
      };
    }
  },
  mergeCalloutOffset: function (...args) {
    const result = {
      isAvailable: true,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    };
    result.isAvailable = args.every((item) => {
      return item.isAvailable;
    });
    args.forEach((item) => {
      result.top += item.top;
      result.bottom += item.bottom;
      result.left += item.left;
      result.right += item.right;
    });
    return result;
  },
  /**
   * @description 计算boundary title的高度
   * @param boundary {BoundaryView} 目标boundary的view对象
   * @return {number} 返回title的高度
   * */
  calcBoundaryTitle(boundary) {
    const titleHeight = boundary.getTitleSize().height;
    // 若boundary不需要显示title / if the boundary do not need to show title
    if (
      !boundary.model.get("title") ||
      boundary.shouldPreventTitle() ||
      titleHeight === 0
    ) {
      return 0;
    }
    return titleHeight;
  },
  mergeBounds(branchArr, bounds) {
    const newBounds = Object.assign({}, bounds);
    const maxRight = branchArr.reduce(
      (maxV, branch) =>
        Math.max(
          maxV,
          branch.position.x +
            branch.boundaryBounds.x +
            branch.boundaryBounds.width,
        ),
      newBounds.x + newBounds.width,
    );
    newBounds.x = branchArr.reduce(
      (minV, branch) =>
        Math.min(minV, branch.position.x + branch.boundaryBounds.x),
      newBounds.x,
    );
    newBounds.width = maxRight - newBounds.x;
    const maxBottom = branchArr.reduce(
      (maxV, branch) =>
        Math.max(
          maxV,
          branch.position.y +
            branch.boundaryBounds.y +
            branch.boundaryBounds.height,
        ),
      newBounds.y + newBounds.height,
    );
    newBounds.y = branchArr.reduce(
      (minV, branch) =>
        Math.min(minV, branch.position.y + branch.boundaryBounds.y),
      newBounds.y,
    );
    newBounds.height = maxBottom - newBounds.y;
    return newBounds;
  },
};
/**
 * @description set boundary padding for topic layout
 * */
function _setBoundaryPadding(parentBranch, childBranch, i) {
  childBranch.outsidePadding = {
    up: 0,
    down: 0,
    left: 0,
    right: 0,
  };
  const direction = parentBranch.getDirection();
  parentBranch.boundaries.forEach((boundary) => {
    const titleHeight = structuresUtil.calcBoundaryTitle(boundary);
    if (boundary.model.get("range") === "master") {
      parentBranch.outsidePadding.up = BOUNDARYGAP + titleHeight;
      parentBranch.outsidePadding.down = BOUNDARYGAP;
      parentBranch.outsidePadding.left = BOUNDARYGAP;
      parentBranch.outsidePadding.right = BOUNDARYGAP;
      parentBranch.boundaryBounds.y -= BOUNDARYGAP - titleHeight;
      parentBranch.boundaryBounds.height += BOUNDARYGAP * 2 + titleHeight;
      parentBranch.boundaryBounds.x -= BOUNDARYGAP;
      parentBranch.boundaryBounds.width += BOUNDARYGAP * 2;
      return;
    }
    if (i >= boundary.model.rangeStart && i <= boundary.model.rangeEnd) {
      if (direction === "UD") {
        childBranch.outsidePadding.left += BOUNDARYGAP;
        childBranch.outsidePadding.right += BOUNDARYGAP;
      } else {
        childBranch.outsidePadding.up += BOUNDARYGAP + titleHeight;
        childBranch.outsidePadding.down += BOUNDARYGAP;
      }
    }
    if (i === boundary.model.rangeStart) {
      if (direction === "UD") {
        if (_isReverseGrowthIndex(parentBranch, i)) {
          childBranch.outsidePadding.down += BOUNDARYGAP;
        } else {
          childBranch.outsidePadding.up += BOUNDARYGAP + titleHeight;
        }
      } else {
        childBranch.outsidePadding.left += BOUNDARYGAP;
      }
    }
    if (i === boundary.model.rangeEnd) {
      if (direction === "UD") {
        if (_isReverseGrowthIndex(parentBranch, i)) {
          childBranch.outsidePadding.up += BOUNDARYGAP + titleHeight;
        } else {
          childBranch.outsidePadding.down += BOUNDARYGAP;
        }
        // childBranch.outsidePadding.down += BOUNDARYGAP;
      } else {
        childBranch.outsidePadding.right += BOUNDARYGAP;
      }
    }
    // childBranch.bounds.y -= titleHeight;
  });
  childBranch.boundaryBounds.y -= childBranch.outsidePadding.up;
  childBranch.boundaryBounds.height +=
    childBranch.outsidePadding.up + childBranch.outsidePadding.down;
  childBranch.boundaryBounds.x -= childBranch.outsidePadding.left;
  childBranch.boundaryBounds.width +=
    childBranch.outsidePadding.right + childBranch.outsidePadding.left;
}
function _isReverseGrowthIndex(parentBranch, index) {
  return parentBranch.getRangeGrowthDirection(index) === DIRECTION.UP;
}
/* harmony default export */
export default structuresUtil;
