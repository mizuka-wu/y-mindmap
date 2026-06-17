import {
  STRUCTURECLASS,
  TOPIC_ATTACHED,
  TOPIC_CALLOUT,
  TOPIC_SUMMARY,
} from "../../common/constants/index";
import * as js_utils from "../../utils/index";

import * as index_all from "underscore";
import * as common_utils from "../../common/utils/index";
// @flow
/**
 * @fileOverview detect the position hit between the floating branches
 */
const AREA_GAP = 5;
class HitDetectHelper {
  OldHitDetect: (branch: any, config: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(branch?, config?) {
    /**
     * @deprecated
     * @public
     * */
    this.OldHitDetect = HitDetect;
  }
  /** @public */
  calcRealPosition(branchView /*BranchView*/, allBranchViewList) {
    const branchViewIndex = allBranchViewList.indexOf(branchView);
    // remove all detached branches that index is larger that current branch (important!)
    // add remove the current branch
    allBranchViewList = allBranchViewList.filter(
      (v, index) =>
        !Object(js_utils.isDetachedBranch)(v) || index < branchViewIndex,
    );
    const allRealBoundsList = this._getAllRealBoundsList(allBranchViewList);
    const modelPosition = branchView.model.getPosition() || {
      x: 0,
      y: 0,
    };
    const boundsToTest = {
      x: modelPosition.x + branchView.bounds.x,
      y: modelPosition.y + branchView.bounds.y,
      width: branchView.bounds.width,
      height: branchView.bounds.height,
    };
    const fitRealBounds = this._getFitRealBounds(
      boundsToTest,
      allRealBoundsList,
    );
    return {
      x: fitRealBounds.x - branchView.bounds.x,
      y: fitRealBounds.y - branchView.bounds.y,
    };
  }
  _getAllRealBoundsList(allBranchViewList) {
    return allBranchViewList
      .filter((branchView) => {
        return branchView.figure.isVisible;
      })
      .map((branchView) => {
        // if check target is detached, use branch bounds, others us topic bounds
        const boundsToCheck = Object.assign(
          {},
          Object(js_utils.isDetachedBranch)(branchView)
            ? branchView.bounds
            : branchView.topicView.bounds,
        );
        // don't use the function 'getRealPosition' here
        const realPosition = Object.assign({}, branchView.position);
        let parentBranch = branchView.parent();
        while (
          !Object(js_utils.isRootBranch)(branchView) &&
          !Object(js_utils.isRootBranch)(parentBranch)
        ) {
          realPosition.x += parentBranch.position.x;
          realPosition.y += parentBranch.position.y;
          parentBranch = parentBranch.parent();
        }
        return {
          x: realPosition.x + boundsToCheck.x,
          y: realPosition.y + boundsToCheck.y,
          width: boundsToCheck.width,
          height: boundsToCheck.height,
        };
      });
  }
  _getFitRealBounds(testBounds, allBoundsList) {
    let intersectBaseBounds;
    allBoundsList.some((baseBounds) => {
      if (Object(common_utils.isBoundsIntersect)(testBounds, baseBounds)) {
        intersectBaseBounds = Object.assign({}, baseBounds);
        return true;
      }
    });
    if (intersectBaseBounds) {
      return this._getFitRealBounds(
        this._calcNewTestRealBounds(testBounds, intersectBaseBounds),
        allBoundsList,
      );
    } else {
      return Object.assign({}, testBounds);
    }
  }
  _calcNewTestRealBounds(originTestBounds, intersectBaseBounds) {
    const newTestRealBounds = Object.assign({}, originTestBounds);
    if (originTestBounds.y < 0) {
      newTestRealBounds.y =
        intersectBaseBounds.y - originTestBounds.height - AREA_GAP;
    } else {
      newTestRealBounds.y =
        intersectBaseBounds.y + intersectBaseBounds.height + AREA_GAP;
    }
    return newTestRealBounds;
  }
}
// old hit detect manager
function HitDetect(branch, config) {
  this.branch = branch;
  this.duadrant = null;
  config = config || {};
  this.space = config.space || 5;
  this.checkCoord = config.checkCoord || null;
  this.rootBoundary = config.rootBoundary || true;
  this.proxyHelper = new HitDetectHelper(branch, config);
}
HitDetect.prototype = {
  // get branch real coords
  calCoords() {
    const parentPos = this.branch.parent().getRealPosition();
    const position = index_all.default.extend(
      {
        x: 0,
        y: 0,
      },
      this.branch.model.get("position"),
    );
    const bounds = this.branch.boundaryBounds;
    return {
      left: parentPos.x + position.x + bounds.x,
      top: parentPos.y + position.y + bounds.y,
      bottom: parentPos.y + position.y + bounds.y + bounds.height,
      right: parentPos.x + position.x + bounds.x + bounds.width,
    };
  },
  // private duadrant为象限quadrant的错拼写
  getDuadrant: function (branch) {
    const centrlPos = branch.getRealPosition();
    const topicBounds = branch.topicView.bounds;
    const pos = this.calCoords(branch);
    const duadrant: any = {};
    if (centrlPos.x >= 0) {
      // right
      if (centrlPos.y < 0) {
        // up
        duadrant.y = (pos.bottom - pos.top) / 2;
        duadrant.index = 1;
      } else {
        // down
        duadrant.y = -(pos.bottom - pos.top) / 2;
        duadrant.index = 2;
      }
      duadrant.x = -topicBounds.width / 2;
    } else {
      // left
      duadrant.x = topicBounds.width / 2;
      if (centrlPos.y < 0) {
        // up
        duadrant.y = (pos.bottom - pos.top) / 2;
        duadrant.index = 4;
      } else {
        // down
        duadrant.y = -(pos.bottom - pos.top) / 2;
        duadrant.index = 3;
      }
    }
    this.duadrant = duadrant;
    return duadrant;
  },
  isInDuadrant: function (duadrant, coord, isContain) {
    if (isContain) {
      if (
        duadrant.index === 1 &&
        coord.left > duadrant.x &&
        coord.bottom < duadrant.y
      ) {
        return true;
      } else if (
        duadrant.index === 2 &&
        coord.left > duadrant.x &&
        coord.top > duadrant.y
      ) {
        return true;
      } else if (
        duadrant.index === 3 &&
        coord.right < duadrant.x &&
        coord.top > duadrant.y
      ) {
        return true;
      } else if (
        duadrant.index === 4 &&
        coord.right < duadrant.x &&
        coord.bottom < duadrant.y
      ) {
        return true;
      }
    }
    // intersect
    else if (
      duadrant.index === 1 &&
      coord.right > duadrant.x &&
      coord.top < duadrant.y
    ) {
      return true;
    } else if (
      duadrant.index === 2 &&
      coord.right > duadrant.x &&
      coord.bottom > duadrant.y
    ) {
      return true;
    } else if (
      duadrant.index === 3 &&
      coord.left < duadrant.x &&
      coord.bottom > duadrant.y
    ) {
      return true;
    } else if (
      duadrant.index === 4 &&
      coord.left < duadrant.x &&
      coord.top < duadrant.y
    ) {
      return true;
    }
    return false;
  },
  isCoordAvaliable: function (coord, isContain) {
    // default use duadrant
    if (!this.checkCoord && typeof this.checkCoord !== "function") {
      if (!this.duadrant) {
        this.getDuadrant(this.branch);
      }
      return this.isInDuadrant(this.duadrant, coord, isContain);
    } else {
      // use custom
      return this.checkCoord(coord, isContain);
    }
  },
  // get real position for all child
  getChildPosList: function (branch, includeSelf) {
    let exclude;
    if (branch) {
      if (!includeSelf) {
        exclude = this.branch;
      }
    } else {
      branch = this.branch;
      exclude = null;
    }
    if (branch === exclude) {
      return [];
    }
    const topicType = [TOPIC_ATTACHED, TOPIC_SUMMARY, TOPIC_CALLOUT];
    const childs = branch.getChildrenBranchesByType(topicType);
    const attchedChilds = branch.getChildrenBranchesByType();
    const centrlPos = branch.getRealPosition();
    let boundsList = [];
    let posList = [];
    let bounds = branch.topicView.bounds;
    const structureClass = branch.getStructureClass();
    if (
      (structureClass === STRUCTURECLASS.SPREADSHEET ||
        structureClass === STRUCTURECLASS.COLUMNSPREADSHEET) &&
      branch.getMatrixView() &&
      !branch.model.isCollapse()
    ) {
      bounds = Object.assign({}, bounds, branch.getMatrixView().getSize());
      return [
        {
          left: centrlPos.x + bounds.x,
          top: centrlPos.y + bounds.y,
          bottom: centrlPos.y + bounds.y + bounds.height,
          right: centrlPos.x + bounds.x + bounds.width,
        },
      ];
    }
    // add itself
    posList.push({
      left: centrlPos.x + bounds.x,
      top: centrlPos.y + bounds.y,
      bottom: centrlPos.y + bounds.y + bounds.height,
      right: centrlPos.x + bounds.x + bounds.width,
    });
    // add boundaries
    for (const boundary of branch.boundaries) {
      const boundaryBounds = {
        x: boundary.position.x,
        y: boundary.position.y,
        width: boundary.size.width,
        height: boundary.size.height,
      };
      if (boundary.model.get("range") === "master") {
        boundsList = [boundaryBounds];
        break;
      } else {
        // pointless boundary
        if (
          boundaryBounds.width === boundaryBounds.height &&
          boundaryBounds.width === 0
        ) {
          continue;
        }
        const { rangeStart, rangeEnd } = boundary.model;
        for (let index = rangeStart; index <= rangeEnd; index++) {
          childs.splice(childs.indexOf(attchedChilds[index]), 1);
        }
      }
      boundsList.push(boundaryBounds);
    }
    if (boundsList) {
      for (const bounds of boundsList) {
        posList.push({
          left: bounds.x,
          top: bounds.y,
          bottom: bounds.y + bounds.height,
          right: bounds.x + bounds.width,
        });
      }
    }
    // iterate descendant
    if (childs && !branch.model.isCollapse()) {
      for (const childBranch of childs) {
        posList = posList.concat(this.getChildPosList(childBranch));
      }
    }
    return posList;
  },
  /**
   * @deprecated
   * */
  sortByPos: function (rects, duadrant) {
    const cmp = {
      1: function (rectA, rectB) {
        if (rectA.bottom !== rectB.bottom) {
          return rectB.bottom - rectA.bottom;
        } else {
          return rectA.left - rectB.left;
        }
      },
      2: function (rectA, rectB) {
        if (rectA.bottom !== rectB.bottom) {
          return rectA.bottom - rectB.bottom;
        } else {
          return rectA.left - rectB.left;
        }
      },
      3: function (rectA, rectB) {
        if (rectA.bottom !== rectB.bottom) {
          return rectA.bottom - rectB.bottom;
        } else {
          return rectB.left - rectA.left;
        }
      },
      4: function (rectA, rectB) {
        if (rectA.bottom !== rectB.bottom) {
          return rectB.bottom - rectA.bottom;
        } else {
          return rectB.left - rectA.left;
        }
      },
    };
    rects = rects.filter((rect) => {
      if (this.isInDuadrant(duadrant, rect)) {
        return rect;
      }
    });
    return rects.sort(cmp[duadrant.index]);
  },
  move: function (source, newPos) {
    const target = index_all.default.extend({}, source);
    let offset;
    if (newPos.bottom) {
      offset = newPos.bottom - source.bottom;
      target.top += offset;
    }
    if (newPos.top) {
      offset = newPos.top - source.top;
      target.bottom += offset;
    }
    if (newPos.left) {
      offset = newPos.left - source.left;
      target.right += offset;
    }
    if (newPos.right) {
      offset = newPos.right - source.right;
      target.left += offset;
    }
    return index_all.default.extend(target, newPos);
  },
  setNewPos: function (target, rect, gap) {
    gap = Math.abs(parseInt(gap, 10) || 0);
    const newPosList = [
      // left
      this.move(target, {
        right: rect.left - gap,
      }),
      this.move(target, {
        right: rect.left - gap,
        bottom: rect.top - gap,
      }),
      this.move(target, {
        right: rect.left - gap,
        top: rect.top,
      }),
      this.move(target, {
        right: rect.left - gap,
        top: rect.top + (rect.bottom - rect.top) / 2,
      }),
      this.move(target, {
        right: rect.left - gap,
        top: rect.bottom,
      }),
      this.move(target, {
        right: rect.left - gap,
        top: rect.bottom + gap,
      }),
      // right
      this.move(target, {
        left: rect.right + gap,
      }),
      this.move(target, {
        left: rect.right + gap,
        bottom: rect.top - gap,
      }),
      this.move(target, {
        left: rect.right + gap,
        top: rect.top,
      }),
      this.move(target, {
        left: rect.right + gap,
        top: rect.top + (rect.bottom - rect.top) / 2,
      }),
      this.move(target, {
        left: rect.right + gap,
        top: rect.bottom,
      }),
      this.move(target, {
        left: rect.right + gap,
        top: rect.bottom + gap,
      }),
      // top
      this.move(target, {
        bottom: rect.top - gap,
      }),
      this.move(target, {
        bottom: rect.top - gap,
        left: rect.left - gap,
      }),
      this.move(target, {
        bottom: rect.top - gap,
        left: rect.left,
      }),
      this.move(target, {
        bottom: rect.top - gap,
        left: rect.left + (rect.right - rect.left) / 2,
      }),
      this.move(target, {
        bottom: rect.top - gap,
        left: rect.right,
      }),
      this.move(target, {
        bottom: rect.top - gap,
        left: rect.right + gap,
      }),
      // bottom
      this.move(target, {
        top: rect.bottom + gap,
      }),
      this.move(target, {
        top: rect.bottom + gap,
        left: rect.left - gap,
      }),
      this.move(target, {
        top: rect.bottom + gap,
        left: rect.left,
      }),
      this.move(target, {
        top: rect.bottom + gap,
        left: rect.left + (rect.right - rect.left) / 2,
      }),
      this.move(target, {
        top: rect.bottom + gap,
        left: rect.right,
      }),
      this.move(target, {
        top: rect.bottom + gap,
        left: rect.right + gap,
      }),
    ];
    const targetPosList = [];
    for (const pos of newPosList) {
      if (this.isCoordAvaliable(pos, true)) {
        targetPosList.push(pos);
      }
    }
    return targetPosList;
  },
  sortByDis: function (source, rects) {
    const origin = {
      x: source.left + (source.right - source.left) / 2,
      y: source.top + (source.bottom - source.top) / 2,
    };
    return rects.sort((rectA, rectB) => {
      const centrlA = {
        x: rectA.left + (rectA.right - rectA.left) / 2,
        y: rectA.top + (rectA.bottom - rectA.top) / 2,
      };
      const centrlB = {
        x: rectB.left + (rectB.right - rectB.left) / 2,
        y: rectB.top + (rectB.bottom - rectB.top) / 2,
      };
      const disA =
        Math.pow(origin.x - centrlA.x, 2) + Math.pow(origin.y - centrlA.y, 2);
      const disB =
        Math.pow(origin.x - centrlB.x, 2) + Math.pow(origin.y - centrlB.y, 2); // floating tolerance is smaller than 0.0001 is consider equal
      if (Math.abs(disA - disB) < 0.0001) {
        return rectA.top - rectB.top;
      } else {
        return disA - disB;
      }
    });
  },
  // take the rect coords into consideration, left < right, bottom > top
  isIntersect: function (target, source) {
    const isXIntersect =
      !(target.left > source.right) && !(target.right < source.left);
    const isYIntersect =
      !(target.bottom < source.top) && !(target.top > source.bottom);
    return isXIntersect && isYIntersect;
  },
  calPosition(oriPosition, usedPositionList) {
    const defaultGap = 1;
    const // space between the candidate position with other topics
      space = 5; // space between the real position with other topics
    let intersect = false;
    let newPosList = [];
    oriPosition.left -= space;
    oriPosition.top -= space;
    oriPosition.right += space;
    oriPosition.bottom += space;
    const position = index_all.default.extend({}, oriPosition);
    for (const pos of usedPositionList) {
      if (this.isIntersect(position, pos)) {
        intersect = true;
      }
      newPosList = newPosList.concat(this.setNewPos(position, pos, defaultGap));
    }
    if (!intersect) {
      return position;
    } else {
      newPosList = this.sortByDis(position, newPosList);
      for (const newPos of newPosList) {
        intersect = false;
        for (const pos of usedPositionList) {
          if (this.isIntersect(newPos, pos)) {
            intersect = true;
            break;
          }
        }
        if (!intersect) {
          return newPos;
        }
      }
    }
  },
};
/* harmony default export */
export const hitDetect = new HitDetectHelper();
export default hitDetect;
