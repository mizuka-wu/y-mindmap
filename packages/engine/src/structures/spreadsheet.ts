import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
} from "../common/constants/index";
import * as js_utils from "../utils/index";
import * as pointutils from "../utils/pointutils";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import structuresUtil from "./helper/structuresutil";
import { dragAreaUtil } from "./helper/dragareautil";

import underscore from "underscore";
import { AbstractStructure } from "./abstractstructure";

import matrixCreateUtils from "../utils/matrixcreateutils";
import * as matrixutils from "../utils/matrixutils";
/**
 * structure -- spreadsheet
 */
const spreadsheet = underscore.extend({}, AbstractStructure, {
  _needTranspose: false,
  STRUCTURECLASS: STRUCTURECLASS.SPREADSHEET,
  isAttachedChildrenStructureImmutable: true,
  calChildrenBounds(branch) {
    // cal grand children bounds
    const children = branch.getChildrenBranchesByType();
    children.forEach((child) => {
      child.calChildrenBounds();
      // force child to layout, not good enough
      child.isLayout = false;
    });
    if (!branch.model.isCollapse()) {
      this._calMatrix(branch);
      branch.calChildrenBounds();
    }
    structuresUtil.setBoundaryPadding(branch);
  },
  /**
   * @description 布局matrix的入口
   * @private
   * */
  _calMatrix(branchView) {
    const matrixView = branchView.getMatrixView();
    const columnMap = matrixCreateUtils.createColumnMap(branchView);
    matrixView.setColumnMap(columnMap);
    const matrixGrid = matrixCreateUtils.createMatrixGrid(
      branchView,
      columnMap,
      this._needTranspose,
    );
    matrixCreateUtils.initGrid(matrixGrid);
    matrixView.setMatrixGrid(matrixGrid);
  },
  calAttachedChildrenPos(branch, newBounds) {
    const matrixView = branch.getMatrixView();
    if (!matrixView || !matrixView.figure.isVisible) {
      return;
    } else {
      const size = matrixView.getSize();
      const mainCell = matrixutils.getMainCell(matrixView.matrixGrid);
      const newPos = matrixutils.sub(newBounds, mainCell.itemPos);
      Object.assign(newBounds, size, newPos);
    }
  },
  getSummaryDirection() {
    return DIRECTION.RIGHT;
  },
  getChildStructure() {
    return STRUCTURECLASS.SPREADSHEETROW;
  },
  drawAttachedConnectLine(parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAvailableChildStructure: function (branch, child) {
    return [];
  },
  getSourceOrientation(branchView) {
    if (!branchView || !Object(js_utils.isBranch)(branchView.parent())) {
      return DIRECTION.RIGHT;
    }
    const preSetStructureWithoutModelValue = Object(js_utils.getViewStructure)(
      branchView,
    );
    switch (preSetStructureWithoutModelValue) {
      case STRUCTURECLASS.FISHBONELEFTHEADED:
      case STRUCTURECLASS.TREERIGHT:
      case STRUCTURECLASS.ORGCHARTDOWN:
      case STRUCTURECLASS.ORGCHARTUP:
        return DIRECTION.RIGHT;
      case STRUCTURECLASS.FISHBONERIGHTHEADED:
      case STRUCTURECLASS.LOGICLEFT:
      case STRUCTURECLASS.TREELEFT:
        return DIRECTION.LEFT;
      case STRUCTURECLASS.TIMELINEHORIZONTALDOWN:
      case STRUCTURECLASS.TIMELINEVERTICAL:
      case STRUCTURECLASS.TREESIDED:
        return DIRECTION.DOWN;
      case STRUCTURECLASS.TIMELINEHORIZONTALUP:
        return DIRECTION.UP;
      default: {
        return DIRECTION.RIGHT;
      }
    }
  },
  _calcNoChildrenPolygons(branchView) {
    if (
      Object(js_utils.isMatrixMainBranch)(branchView) &&
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
    return [];
  },
});

export const structuresSpreadsheet = spreadsheet;
