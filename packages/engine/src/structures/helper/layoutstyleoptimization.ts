import {
  BRANCHCONNECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
  COMPACT_LAYOUT_MODE_LEVEL,
  MAP_LIKE_STRUCTURES,
  LOGIC_CHART_STRUCTURES,
  ORG_CHART_STRUCTURES,
} from "../../common/constants/index";
import styleManager from "../../utils/business/stylemanager/index";

// EXTERNAL MODULE: ./js/utils/layoututil.ts
export function calcOutwardDistanceByAttachedChildren(
  parentBranch,
  effectedChildren?,
) {
  const structure = parentBranch.getStructureClass();
  const children =
    effectedChildren ??
    parentBranch.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
  const isCompactLayoutMode =
    parentBranch.getContext().model.getCompactLayoutModeLevel() !==
    COMPACT_LAYOUT_MODE_LEVEL.Third;
  const isMapLikeStructure = MAP_LIKE_STRUCTURES.includes(structure);
  const isLogicChartStructure = LOGIC_CHART_STRUCTURES.includes(structure);
  const isOrgChartStructure = ORG_CHART_STRUCTURES.includes(structure);
  const isStructureNeedsProcessed =
    isMapLikeStructure || isLogicChartStructure || isOrgChartStructure;
  const childrenCountLimit =
    isMapLikeStructure || isLogicChartStructure ? 8 : 7;
  const lineStyle = styleManager.getStyleValue(
    parentBranch,
    STYLE_KEYS.LINE_CLASS,
  );
  const isLineStyleNeedsProcess =
    lineStyle !== BRANCHCONNECTION.ROUNDEDELBOW &&
    lineStyle !== BRANCHCONNECTION.ELBOW;
  if (
    !isCompactLayoutMode &&
    isStructureNeedsProcessed &&
    children?.length >= childrenCountLimit &&
    isLineStyleNeedsProcess
  ) {
    const isVertical = isMapLikeStructure || isLogicChartStructure;
    const totalHeightOrLength = isVertical
      ? children.reduce(
          (height, child) => height + child.boundaryBounds.height,
          0,
        )
      : children.reduce(
          (width, child) => width + child.boundaryBounds.width,
          0,
        );
    /**
     * K   - the factor of outward offset
     * MIN - the minimum length of topics height or width to effect outward distance
     * MAX - the maximum length of topics height or width to stop effect outward distance
     */
    const [K, MIN, MAX] = isVertical ? [0.15, 400, 800] : [0.09, 1000, 1600];
    if (totalHeightOrLength <= MIN) {
      return 0;
    } else {
      return K * (Math.min(totalHeightOrLength, MAX) - MIN);
    }
  }
  return 0;
}
