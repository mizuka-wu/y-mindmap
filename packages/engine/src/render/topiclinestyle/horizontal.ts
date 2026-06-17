import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";

function horizontalLine(linePositions) {
  const { startPt, endPt } = linePositions;
  return `M ${startPt.x} ${startPt.y}L ${endPt.x} ${endPt.y}`;
}
export function horizontal(childBranch, linePositions) {
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(
    childBranch,
    linePositions.startPt,
    linePositions.endPt,
  );
  return Object(topicLineStyleUtils.setConnectionAttr)(
    {
      verticalBrush: horizontalLine,
    },
    childBranch,
    linePositions,
    false,
    true,
  );
}
