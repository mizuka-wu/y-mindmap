import { DIRECTION, TOPIC_TYPE } from "../../common/constants/index";
import * as utils from "../../utils/index";
import { layoutConstant } from "../../utils/layoutconstant";

import { boundaryshapes } from "../renderengine/svg/shapes/boundaryshapes";

const { BOUNDARYGAP, BOUNDARYGAP_IN_TREETABLE } = layoutConstant;
// todo need to refactor
// remove boundsForBoundaryLayout
/* harmony default export */
export const boundaryLayoutWorker = {
  work(viewController) {
    const boundaryView = viewController;
    let boundaryShapeSize;
    if (boundaryView.model.get("range") === "master") {
      boundaryShapeSize = this._calcMasterBoundaryShapeSize(boundaryView);
    } else {
      boundaryShapeSize = this._calcNormalBoundaryShapeSize(boundaryView);
    }
    const borderWidth = parseInt(boundaryView.figure.borderWidth);
    // set title position
    const titlePosition = !boundaryView.shouldPreventTitle()
      ? {
          x:
            layoutConstant.BOUNDARY_TITLE.TO_BOUNDARY_BORDER_DISTANCE +
            borderWidth / 2,
          y: -boundaryView.titleView.figure.size.height + borderWidth / 2,
        }
      : {
          x: 0,
          y: 0,
        };
    boundaryView.titleView.setPosition(titlePosition);
    const boundaryFullSize = {
      width: boundaryShapeSize.width,
      height:
        boundaryShapeSize.height + boundaryView.titleView.figure.size.height,
    };
    // set boundary full size
    boundaryView.setSize(boundaryFullSize);
    boundaryView.updateRealPosition();
    boundaryshapes(boundaryView.figure.shapeClass)(
      boundaryView,
      boundaryView.figure.boundaryShapeSize,
    );
  },
  _getBoundaryGap(boundaryView) {
    const parentBranchView = boundaryView.parent();
    if (
      Object(utils.isTreeTableCell)(parentBranchView) &&
      Object(utils.isTreeTableStructure)(parentBranchView)
    ) {
      return BOUNDARYGAP_IN_TREETABLE;
    } else {
      return BOUNDARYGAP;
    }
  },
  _getBoundsForBoundaryLayout(branchView) {
    const branchViewBounds = Object.assign(
      {},
      branchView.bounds || branchView.topicView.bounds,
    );
    if (Object(utils.isTreeTableCell)(branchView)) {
      const layoutInfo = branchView.getLayoutInfo(
        Object(utils.getTreeTableHeadBranchView)(
          branchView,
        ).getStructureClass(),
      );
      const externalInfo = Object.assign({}, layoutInfo?.externalInfo);
      // collpased tree table head branchview, has not layoutInfo
      if (!layoutInfo?.stopFlag) {
        return branchViewBounds;
      } else {
        return {
          x: externalInfo.cellX,
          y: externalInfo.cellY,
          width: externalInfo.cellWidth,
          height: externalInfo.cellHeight,
        };
      }
    } else {
      return branchViewBounds;
    }
  },
  _getBranchIndexToBoundaries(boundaryView) {
    const branchView = boundaryView.parent();
    const attachedChildrenBranches = branchView
      .getChildrenBranchesByType(TOPIC_TYPE.ATTACHED)
      .filter((item) => {
        return !item.isPlaceHolderView;
      });
    const branchIndexToBoundaries = [];
    for (let i = 0; i < attachedChildrenBranches.length; i++) {
      const childBranch = attachedChildrenBranches[i];
      childBranch.insection = {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
      };
      childBranch.boundsForBoundaryLayout =
        this._getBoundsForBoundaryLayout(childBranch);
      const bs = [];
      branchView.boundaries.forEach((boundary) => {
        const { rangeStart, rangeEnd } = boundary.model;
        if (rangeStart <= i && i <= rangeEnd) {
          bs.push(boundary);
        }
      });
      branchIndexToBoundaries.push(bs);
    }
    return branchIndexToBoundaries;
  },
  _calcMasterBoundaryShapeSize(boundaryView) {
    const branchView = boundaryView.parent();
    branchView.insection = {
      left: BOUNDARYGAP,
      right: BOUNDARYGAP,
      up: BOUNDARYGAP,
      down: BOUNDARYGAP,
    };
    branchView.boundsForBoundaryLayout = Object.assign(
      {},
      branchView.bounds || branchView.topicView.bounds,
    );
    const position = {
      x: 0,
      y: 0,
    };
    branchView.boundsForBoundaryLayout.y -= branchView.insection.up;
    branchView.boundsForBoundaryLayout.height +=
      branchView.insection.up + branchView.insection.down;
    branchView.boundsForBoundaryLayout.x -= branchView.insection.left;
    branchView.boundsForBoundaryLayout.width +=
      branchView.insection.right + branchView.insection.left;
    const minX = branchView.boundsForBoundaryLayout.x + position.x;
    const minY = branchView.boundsForBoundaryLayout.y + position.y;
    const maxX =
      branchView.boundsForBoundaryLayout.x +
      branchView.boundsForBoundaryLayout.width +
      position.x;
    const maxY =
      branchView.boundsForBoundaryLayout.y +
      branchView.boundsForBoundaryLayout.height +
      position.y;
    boundaryView.setPosition({
      x: minX,
      y: minY,
    });
    const size = {
      width: maxX - minX,
      height: maxY - minY,
    };
    boundaryView.setShapeSize(size);
    return size;
  },
  _calcNormalBoundaryShapeSize(boundaryView) {
    const branchView = boundaryView.parent();
    const { rangeStart, rangeEnd } = boundaryView.model;
    const branchIndexToBoundaries =
      this._getBranchIndexToBoundaries(boundaryView);
    const attachedChildrenBranches = branchView
      .getChildrenBranchesByType(TOPIC_TYPE.ATTACHED)
      .filter((item) => {
        return !item.isPlaceHolderView;
      });
    let minX;
    let minY;
    let maxX;
    let maxY;
    const direction = branchView.getDirection();
    // prepare insection, for calc boundary real bounds
    for (let i = rangeStart; i <= rangeEnd; i++) {
      let upInsectionFix = 0;
      branchIndexToBoundaries[i].some((checkTitleBoundary) => {
        upInsectionFix += checkTitleBoundary.titleView.figure.size.height;
        if (checkTitleBoundary === boundaryView) {
          return true;
        }
      });
      const insectionBoundaryGap =
        (branchIndexToBoundaries[i].indexOf(boundaryView) + 1) *
        this._getBoundaryGap(boundaryView);
      if (i >= rangeStart && i <= rangeEnd) {
        if (direction === "UD") {
          attachedChildrenBranches[i].insection.left = insectionBoundaryGap;
          attachedChildrenBranches[i].insection.right = insectionBoundaryGap;
        } else {
          attachedChildrenBranches[i].insection.up =
            insectionBoundaryGap + upInsectionFix;
          attachedChildrenBranches[i].insection.down = insectionBoundaryGap;
        }
      }
      if (i === rangeStart) {
        if (direction === "UD") {
          if (branchView.getRangeGrowthDirection(i) === DIRECTION.UP) {
            attachedChildrenBranches[i].insection.down = insectionBoundaryGap;
          } else {
            attachedChildrenBranches[i].insection.up =
              insectionBoundaryGap + upInsectionFix;
          }
        } else {
          attachedChildrenBranches[i].insection.left = insectionBoundaryGap;
        }
      }
      if (i === rangeEnd) {
        if (direction === "UD") {
          if (branchView.getRangeGrowthDirection(i) === DIRECTION.DOWN) {
            attachedChildrenBranches[i].insection.down = insectionBoundaryGap;
          } else {
            attachedChildrenBranches[i].insection.up =
              insectionBoundaryGap + upInsectionFix;
          }
        } else {
          attachedChildrenBranches[i].insection.right = insectionBoundaryGap;
        }
      }
      attachedChildrenBranches[i].boundsForBoundaryLayout.y -=
        attachedChildrenBranches[i].insection.up;
      attachedChildrenBranches[i].boundsForBoundaryLayout.height +=
        attachedChildrenBranches[i].insection.up +
        attachedChildrenBranches[i].insection.down;
      attachedChildrenBranches[i].boundsForBoundaryLayout.x -=
        attachedChildrenBranches[i].insection.left;
      attachedChildrenBranches[i].boundsForBoundaryLayout.width +=
        attachedChildrenBranches[i].insection.right +
        attachedChildrenBranches[i].insection.left;
    }
    if (rangeStart === rangeEnd) {
      const cuChildBranch = attachedChildrenBranches[rangeStart];
      const position = {
        x: cuChildBranch.position.x,
        y: cuChildBranch.position.y,
      };
      minX = cuChildBranch.boundsForBoundaryLayout.x + position.x;
      minY = cuChildBranch.boundsForBoundaryLayout.y + position.y;
      // todo fix maxX and maxY
      maxX =
        cuChildBranch.boundsForBoundaryLayout.x +
        position.x +
        cuChildBranch.boundsForBoundaryLayout.width +
        cuChildBranch.topicView.figure.borderWidth / 2;
      maxY =
        cuChildBranch.boundsForBoundaryLayout.y +
        position.y +
        cuChildBranch.boundsForBoundaryLayout.height +
        cuChildBranch.topicView.figure.borderWidth / 2;
    } else if (rangeStart < rangeEnd) {
      for (let j = rangeStart; j <= rangeEnd; j++) {
        const cuChildBranch = attachedChildrenBranches[j];
        const position = {
          x: cuChildBranch.position.x,
          y: cuChildBranch.position.y,
        };
        if (!minX) {
          minX = cuChildBranch.boundsForBoundaryLayout.x + position.x;
        }
        if (!minY) {
          minY = cuChildBranch.boundsForBoundaryLayout.y + position.y;
        }
        if (!maxX) {
          maxX =
            cuChildBranch.boundsForBoundaryLayout.x +
            position.x +
            cuChildBranch.boundsForBoundaryLayout.width;
        }
        if (!maxY) {
          maxY =
            cuChildBranch.boundsForBoundaryLayout.y +
            position.y +
            cuChildBranch.boundsForBoundaryLayout.height;
        }
        minX = Math.min(
          minX,
          cuChildBranch.boundsForBoundaryLayout.x + position.x,
        );
        minY = Math.min(
          minY,
          cuChildBranch.boundsForBoundaryLayout.y + position.y,
        );
        maxX = Math.max(
          maxX,
          cuChildBranch.boundsForBoundaryLayout.x +
            position.x +
            cuChildBranch.boundsForBoundaryLayout.width,
        );
        maxY = Math.max(
          maxY,
          cuChildBranch.boundsForBoundaryLayout.y +
            position.y +
            cuChildBranch.boundsForBoundaryLayout.height,
        );
      }
    } else {
      branchView.model.removeBoundary(boundaryView.model);
    }
    const titleHeight = boundaryView.titleView.figure.size.height;
    const position = {
      x: minX,
      y: minY + titleHeight,
    };
    boundaryView.setPosition(position);
    const boundaryShapeSize = {
      width: maxX - minX,
      height: maxY - minY - titleHeight,
    };
    boundaryView.setShapeSize(boundaryShapeSize);
    return boundaryShapeSize;
  },
};
