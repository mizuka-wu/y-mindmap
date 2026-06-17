import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
} from "../common/constants/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import underscore from "underscore";

import { structuresSpreadsheet } from "./spreadsheet";

/**
 * structrue -- columnSpreadsheet
 * the same as spreadsheet, except needTranspose
 */

const { COLUMNSPREADSHEET, SPREADSHEETCOLUMN } = STRUCTURECLASS;
export const columnSpreadsheet = underscore.extend({}, structuresSpreadsheet, {
  _needTranspose: true,
  STRUCTURECLASS: COLUMNSPREADSHEET,
  isAttachedChildrenStructureImmutable: true,
  getSummaryDirection: function () {
    return DIRECTION.DOWN;
  },
  getRangeGrowthDirection() {
    return DIRECTION.RIGHT;
  },
  getChildStructure: function () {
    return SPREADSHEETCOLUMN;
  },
  drawAttachedConnectLine: function (parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
});
