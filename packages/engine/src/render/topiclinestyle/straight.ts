import { DIRECTION } from "../../common/constants/index";
import * as utils from "../../figures/renderengine/svg/topicshapes/utils";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

export function straight(childBranch, linePositions, tapered) {
  const parentBranch = childBranch.parent();
  const startDirection = Object(utils.getStartDirection)(
    parentBranch,
    childBranch,
  );
  const endDirection = Object(utils.getEndDirection)(parentBranch, childBranch);
  const isStartVertical =
    startDirection === DIRECTION.DOWN || startDirection === DIRECTION.UP;
  const isEndVertical =
    endDirection === DIRECTION.DOWN || endDirection === DIRECTION.UP;
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(
    childBranch,
    linePositions.startPt,
    linePositions.endPt,
  );
  return Object(topicLineStyleUtils.setConnectionAttr)(
    {
      taperedHorizonBrush: brushes.taperedStraight,
      horizonBrush: brushes.straightLine,
    },
    childBranch,
    linePositions,
    tapered,
    false,
    [isStartVertical, isEndVertical],
  );
}
