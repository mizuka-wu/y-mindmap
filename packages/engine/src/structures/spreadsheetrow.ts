import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
} from "../common/constants/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import underscore from "underscore";
import { AbstractStructure } from "./abstractstructure";

import * as matrixutils from "../utils/matrixutils";

/**
 * structrue -- spreadsheetRow
 */

export const spreadsheetRow = underscore.extend({}, AbstractStructure, {
  STRUCTURECLASS: STRUCTURECLASS.SPREADSHEETROW,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calChildrenBounds(branch) {
    return;
  },
  calAttachedChildrenPos(branch, newBounds) {
    const getIndex = (branch) => {
      const parent = branch.parent();
      const children = parent.getChildrenBranchesByType();
      for (let i = 0; i < children.length; i++) {
        if (children[i] === branch) {
          return i;
        }
      }
    };
    const { matrixView } = branch.parent();
    if (matrixView === undefined) {
      return;
    } else {
      const { matrixGrid } = branch.parent().getMatrixView();
      const index = getIndex(branch);
      const size = matrixutils.getSize(matrixGrid, index);
      const itemPos = matrixutils.getItemPos(matrixGrid, index);
      const pos = Object(matrixutils.sub)(newBounds, itemPos);
      Object.assign(newBounds, size, pos);
    }
  },
  getSummaryDirection: function () {
    return DIRECTION.RIGHT;
  },
  getChildStructure: function () {
    return STRUCTURECLASS.LOGICRIGHT;
  },
  drawAttachedConnectLine: function (parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
  // Ray: the scope of droppable is decided by 'getCellByPos' in matrixView
  // may not great enough
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcPolygons: function (branch) {
    return [
      {
        points: [],
        pointList: [],
        relatedBranchViewList: [],
        side: null,
      },
    ];
  },
});
