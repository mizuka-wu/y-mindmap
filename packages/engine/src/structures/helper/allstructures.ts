import { STRUCTURECLASS, CONFIG } from "../../common/constants/index";
import config from "../../common/config";

import { logicRight } from "../logicright";
import { BraceLeft } from "../braceleft";
import { BraceRight } from "../braceright";
import { logicLeft } from "../logicleft";
import { treeLeft } from "../treeleft";
import { treeRight } from "../treeright";
import { orgChartUp } from "../orgchartup";
import { orgChartDown } from "../orgchartdown";

import { structuresMap } from "../map";
import { mapClockWise } from "../mapclockwise";
import { mapAntiClockWise } from "../mapanticlockwise";
import { MapUnbalanced } from "../mapunbalanced";
import { timelineHorizontal } from "../timelinehorizontal";
import { timelineHorizontalUp } from "../timelinehorizontalup";
import { timelineHorizontalDown } from "../timelinehorizontaldown";
import { timelineVertical } from "../timelinevertical";
import { structuresSpreadsheet } from "../spreadsheet";
import { spreadsheetRow } from "../spreadsheetrow";
import { columnSpreadsheet } from "../columnspreadsheet";
import { spreadsheetColumn } from "../spreadsheetcolumn";
import { structuresTreetable } from "../treetable";
import { TreeTableTopTitle } from "../treetabletoptitle";
import { FishBoneLeftHead } from "../fishbonelefthead";
import { FishBoneLeftHeadTopBone } from "../fishboneleftheadtopbone";
import { FishBoneLeftHeadBottomBone } from "../fishboneleftheadbottombone";
import { FishBoneRightHead } from "../fishbonerighthead";
import { FishBoneRightHeadTopBone } from "../fishbonerightheadtopbone";
import { FishBoneRightHeadBottomBone } from "../fishbonerightheadbottombone";
import { TimelineSidedHorizontal } from "../timelinesidedhorizontal";
import { TimelineThroughVertical } from "../timelinethroughvertical";

//引入所有的structure

const allStructures = {
  [STRUCTURECLASS.LOGICRIGHT]: logicRight,
  [STRUCTURECLASS.LOGICLEFT]: logicLeft,
  [STRUCTURECLASS.BRACERIGHT]: BraceRight,
  [STRUCTURECLASS.BRACELEFT]: BraceLeft,
  [STRUCTURECLASS.TREERIGHT]: treeRight,
  [STRUCTURECLASS.TREELEFT]: treeLeft,
  [STRUCTURECLASS.ORGCHARTDOWN]: orgChartDown,
  [STRUCTURECLASS.ORGCHARTUP]: orgChartUp,
  [STRUCTURECLASS.MAPCLOCKWISE]: mapClockWise,
  [STRUCTURECLASS.MAPANTICLOCKWISE]: mapAntiClockWise,
  [STRUCTURECLASS.MAP]: structuresMap,
  [STRUCTURECLASS.MAPUNBALANCED]: MapUnbalanced,
  [STRUCTURECLASS.MAPFLOATING]: structuresMap,
  [STRUCTURECLASS.MAPFLOATINGANTICLOCKWISE]: mapAntiClockWise,
  [STRUCTURECLASS.MAPFLOATINGCLOCKWISE]: mapClockWise,
  [STRUCTURECLASS.TIMELINETHROUGHVERTICAL]: TimelineThroughVertical,
  [STRUCTURECLASS.TIMELINESIDEDHORIZONTAL]: TimelineSidedHorizontal,
  [STRUCTURECLASS.TREESIDED]: timelineVertical,
  [STRUCTURECLASS.SPREADSHEET]: structuresSpreadsheet,
  [STRUCTURECLASS.SPREADSHEETROW]: spreadsheetRow,
  [STRUCTURECLASS.COLUMNSPREADSHEET]: columnSpreadsheet,
  [STRUCTURECLASS.SPREADSHEETCOLUMN]: spreadsheetColumn,
  [STRUCTURECLASS.TREETABLE]: structuresTreetable,
  [STRUCTURECLASS.TOPTITLETREETABLE]: TreeTableTopTitle,
  [STRUCTURECLASS.FISHBONELEFTHEADED]: FishBoneLeftHead,
  [STRUCTURECLASS.LEFTHEADTOPBONE]: FishBoneLeftHeadTopBone,
  [STRUCTURECLASS.LEFTHEADBOTTOMBONE]: FishBoneLeftHeadBottomBone,
  [STRUCTURECLASS.FISHBONERIGHTHEADED]: FishBoneRightHead,
  [STRUCTURECLASS.RIGHTHEADTOPBONE]: FishBoneRightHeadTopBone,
  [STRUCTURECLASS.RIGHTHEADBOTTOMBONE]: FishBoneRightHeadBottomBone,
  // 已废弃，为了兼容旧 structure
  [STRUCTURECLASS.LOGICCHARTRIGHT]: logicRight,
  [STRUCTURECLASS.LOGICCHARTLEFT]: logicLeft,
  [STRUCTURECLASS.TIMELINEHORIZONTAL]: timelineHorizontal,
  [STRUCTURECLASS.TIMELINEHORIZONTALUP]: timelineHorizontalUp,
  [STRUCTURECLASS.TIMELINEHORIZONTALDOWN]: timelineHorizontalDown,
  [STRUCTURECLASS.TIMELINEVERTICAL]: timelineVertical,
};
/* harmony default export */
export const getStructure = (key) => {
  if (!allStructures[key]) {
    config.get(CONFIG.LOGGER).warn(`Unsupported structure class: ${key}`);
    return allStructures[STRUCTURECLASS.LOGICRIGHT];
  }
  return allStructures[key];
};

export default allStructures;
