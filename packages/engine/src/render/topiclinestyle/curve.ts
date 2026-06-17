import { DIRECTION } from "../../common/constants/index";
import * as utils from "../../figures/renderengine/svg/topicshapes/utils";
import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

// EXTERNAL MODULE: ./js/util.ts
/** curve style line
 * @param  {[child]} [description]
 * @param  {[endPos]}     [description]
 * @param  {[special]}  [如果该值为真,则表示传入的是orgnizeToDown或orgnizeToUp.
 *                           如果为假或空,则表示为其他布局]
 */
export function curve(childBranch, linePoints, tapered, special) {
  const startDirection = Object(utils.getStartDirection)(
    childBranch.parent(),
    childBranch,
  );
  const isStartVertical =
    startDirection === DIRECTION.DOWN || startDirection === DIRECTION.UP;
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(
    childBranch,
    linePoints.startPt,
    linePoints.endPt,
  );
  return Object(topicLineStyleUtils.setConnectionAttr)(
    {
      horizonBrush: brushes.curveHorizon,
      verticalBrush: brushes.rect,
      taperedHorizonBrush: brushes.taperedCurveHorizon,
      taperedVerticalBrush: brushes.taperedCurveVertical,
    },
    childBranch,
    linePoints,
    tapered,
    special,
    [undefined, isStartVertical],
  );
}
