import * as svgpathUtils from "../../utils/svgpath";
import BranchView from "../../view/branchview";
import * as js_utils from "../../utils/index";

// EXTERNAL MODULE: ./js/util.ts
import Util from "../../util";

export function calloutLine(childBranch) {
  const parent = childBranch.parent();
  if (!(parent instanceof BranchView)) {
    return;
  }
  const childCenterPt = childBranch.linePosition;
  const parentCenterPt = parent.linePosition;
  const insectPtInChild = Util.topicInsectLine(childBranch, parentCenterPt);
  const insectPtInParent = Util.topicInsectLine(parent, childCenterPt);
  const childTopicView = childBranch.topicView;
  const currentShapePath = Object(js_utils.isHandDrawnLinePattern)(
    childTopicView.figure.borderLinePattern,
  )
    ? Object(js_utils.getFillPatternAttr)(childTopicView.figure.fillPattern, {
        fillPath: childTopicView.figure.topicShapeFillPath,
        isForceHandDrawnSolid: true,
      }).d
    : childTopicView.figure.topicShapeFillPath;
  const length = Object(svgpathUtils.getTotalLength)(currentShapePath);
  const at = insectPtInChild.at;
  let atLeft = at - 8;
  if (atLeft < 0) {
    atLeft += length;
  }
  let atRight = at + 8;
  if (atRight > length) {
    atRight -= length;
  }
  const atLeftPt = svgpathUtils.getPointAtLength(currentShapePath, atLeft);
  const atRightPt = svgpathUtils.getPointAtLength(currentShapePath, atRight);
  // fix 1 point's slit
  const offset = childBranch.topicView.figure.borderWidth + 1;
  const offsetAX = atLeftPt.x > 0 ? -offset : offset;
  const offsetBX = atRightPt.x > 0 ? -offset : offset;
  const offsetAY = atLeftPt.y > 0 ? -offset : offset;
  const offsetBY = atRightPt.y > 0 ? -offset : offset;
  const crossPtA = {
    x: parseInt(atLeftPt.x + childBranch.linePosition.x) + offsetAX,
    y: parseInt(atLeftPt.y + childBranch.linePosition.y) + offsetAY,
  };
  const crossPtB = {
    x: parseInt(atRightPt.x + childBranch.linePosition.x) + offsetBX,
    y: parseInt(atRightPt.y + childBranch.linePosition.y) + offsetBY,
  };
  const d = `M ${crossPtA.x} ${crossPtA.y} L ${parseInt(
    insectPtInParent.x,
  )} ${parseInt(insectPtInParent.y)} L ${crossPtB.x} ${crossPtB.y}`;
  const connection = childBranch.getConnectionView();
  connection.figure.setLinePath(d);
  connection.figure.setLineTapered(true);
  connection.figure.setLineColor(childBranch.topicView.figure.fillColor);
  // 根据起始点，设置topic shape的mask
  setTopicShapeMasking(childBranch, crossPtA, crossPtB, insectPtInParent);
}
function setTopicShapeMasking(branch, startPt, endPt, insectPtInParent) {
  const containerTrans = branch.getSvg().transform();
  // outer 是剪贴外边框, 跟 inner 一起框住要显示出来的部分
  const bound = {
    x: -10000,
    y: -10000,
    width: 20000,
    height: 20000,
  };
  const outerD = `M ${bound.x} ${bound.y} L${bound.x + bound.width} ${
    bound.y
  } L${bound.x + bound.width} ${bound.y + bound.height} L${bound.x} ${
    bound.y + bound.height
  }`;
  const drawPtA = {
    x: startPt.x - containerTrans.x.valueOf(),
    y: startPt.y - containerTrans.y.valueOf(),
  };
  const drawPtB = {
    x: endPt.x - containerTrans.x.valueOf(),
    y: endPt.y - containerTrans.y.valueOf(),
  };
  const drawPtParent = {
    x: parseInt(`${insectPtInParent.x - containerTrans.x.valueOf()}`),
    y: parseInt(`${insectPtInParent.y - containerTrans.y.valueOf()}`),
  };
  const innerD = `M ${drawPtA.x} ${drawPtA.y} L ${drawPtParent.x} ${drawPtParent.y} L ${drawPtB.x} ${drawPtB.y}`;
  branch.topicView.setTopicShapeMaskAttrD(`${innerD} ${outerD}`);
}
