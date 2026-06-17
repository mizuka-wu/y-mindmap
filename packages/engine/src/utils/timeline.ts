import {
  DIRECTION,
  STRUCTURECLASS,
  TOPIC_TYPE,
} from "../common/constants/index";
import * as branchUtils from "./branch";
import { getReverseDir } from "./geometry";

export function getTimelineParentBranch(branch) {
  let parent = branch.parent();
  let timelineParent;
  while (parent && Object(branchUtils.isBranch)(parent)) {
    timelineParent = Object(branchUtils.isTimeline)(parent)
      ? parent
      : undefined;
    parent = parent.parent();
  }
  return timelineParent;
}
function inSameRangeWithPreviousChild(parentBranch, targetIndex) {
  const boundaries = parentBranch.model.boundaries();
  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    if (
      targetIndex - 1 >= boundary.rangeStart &&
      targetIndex <= boundary.rangeEnd
    ) {
      return true;
    }
  }
  const summaries = parentBranch.model.summaries();
  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];
    if (
      targetIndex - 1 >= summary.rangeStart &&
      targetIndex <= summary.rangeEnd
    ) {
      return true;
    }
  }
  return false;
}
export function getFinalTimelineChildDirection(parentBranch, targetIndex) {
  const parentStructure = parentBranch.getStructureClass();
  let initializeDirection = DIRECTION.NONE;
  switch (parentStructure) {
    case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
    case STRUCTURECLASS.TIMELINEHORIZONTAL:
      initializeDirection = DIRECTION.UP;
      break;
    case STRUCTURECLASS.TIMELINETHROUGHVERTICAL:
      initializeDirection = DIRECTION.LEFT;
      break;
  }
  if (initializeDirection === DIRECTION.NONE) {
    console.warn(`${parentStructure} is not a valid timeline structure`);
    return [];
  }
  const children = parentBranch.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
  if (typeof targetIndex === "undefined") {
    return children.reduce(
      (res, _, i) =>
        i !== 0
          ? [
              ...res,
              inSameRangeWithPreviousChild(parentBranch, i)
                ? res[i - 1]
                : getReverseDir(res[i - 1]),
            ]
          : [initializeDirection],
      [],
    );
  } else {
    return children
      .slice(0, targetIndex + 1)
      .reduce(
        (dir, _, i) =>
          i !== 0
            ? inSameRangeWithPreviousChild(parentBranch, i)
              ? dir
              : getReverseDir(dir)
            : initializeDirection,
        DIRECTION.NONE,
      );
  }
}
