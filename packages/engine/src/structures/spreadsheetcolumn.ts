import {
  STRUCTURECLASS,
  DIRECTION,
  BRANCHCONNECTION,
} from "../common/constants/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import underscore from "underscore";

import { spreadsheetRow } from "./spreadsheetrow";

/**
 * structrue -- spreadsheetColumn
 * the same with spreadsheetrow
 */

const { LOGICRIGHT } = STRUCTURECLASS;
export const spreadsheetColumn = underscore.extend({}, spreadsheetRow, {
  STRUCTURECLASS: STRUCTURECLASS.SPREADSHEETCOLUMN,
  getSummaryDirection: function () {
    return DIRECTION.RIGHT;
  },
  getChildStructure: function () {
    return LOGICRIGHT;
  },
  drawAttachedConnectLine: function (parent, child) {
    getTopicLineStyle(BRANCHCONNECTION.NONE)(child);
  },
});
