import { RELATIONSHIPSHAPE } from "../../common/constants/index";
import * as utils from "../../utils/index";

import Util from "../../util";
import { getRelationshipLineType } from "../../render/relationshiplinetype";

import * as common_utils from "../../common/utils/index";
import * as pointutils from "../../utils/pointutils";

export const relationshipLayoutWorker = {
  work(viewController) {
    const relationshipView = viewController;
    const figure = relationshipView.figure;
    const { end1View, end2View } = relationshipView;
    if (
      !end1View ||
      !end2View ||
      !end2View.figure.isVisible ||
      !end1View.figure.isVisible
    ) {
      return;
    }
    const posInfo = caclPosFromModel(relationshipView);
    figure.setPosInfo(posInfo);
    relationshipView.posInfo = posInfo;
    relationshipView.relativeDistance1 = {
      x: posInfo.controlPoint1.x - posInfo.insectPoint1.x,
      y: posInfo.controlPoint1.y - posInfo.insectPoint1.y,
    };
    relationshipView.relativeDistance2 = {
      x: posInfo.controlPoint2.x - posInfo.insectPoint2.x,
      y: posInfo.controlPoint2.y - posInfo.insectPoint2.y,
    };
    updateBounds1(relationshipView, posInfo);
    const { insectPoint1, insectPoint2, controlPoint1, controlPoint2 } =
      posInfo;
    relationshipView.renderTitleText(posInfo);
    const relationshipPath = Object(getRelationshipLineType)(
      figure.lineStyle,
    ).calcPathD(insectPoint1, insectPoint2, controlPoint1, controlPoint2);
    const centerPoint = Object(utils.getPointAtLength)(
      relationshipPath,
      Object(utils.getTotalLength)(relationshipPath) / 2,
    );
    const pos = {
      x: centerPoint.x - relationshipView.titleView.bounds.width / 2,
      y: centerPoint.y - relationshipView.titleView.bounds.height / 2,
    };
    const _rectToPath = (bound) => {
      return `M ${bound.x} ${bound.y}
        L${bound.x + bound.width} ${bound.y}
        L${bound.x + bound.width} ${bound.y + bound.height}
        L${bound.x} ${bound.y + bound.height}`;
    };
    const svgSize = relationshipView.bounds;
    //200px to make mark of relationship not hidden
    //assert that size of mark is smaller than 200px
    const attr = {
      width: svgSize.width + 400,
      height: svgSize.height + 400,
      x: svgSize.x - 200,
      y: svgSize.y - 200,
    };
    const titleBounds = Object.assign(
      {},
      relationshipView.titleView.bounds,
      pos,
    );
    const innerD = _rectToPath(attr);
    const outerD = _rectToPath(titleBounds);
    figure.setRelationshipMaskD(`${innerD} ${outerD}`);
    updateBounds2(relationshipView, titleBounds);
    return relationshipView.bounds;
  },
};
function caclPosFromModel(relationshipView) {
  const relationship = relationshipView.model;
  const { end1View, end2View } = relationshipView;
  const startPos = end1View.getRealPosition();
  const endPos = end2View.getRealPosition();
  const controlPoints = relationship.get("controlPoints") || {};
  let controlPoint1 = controlPoints["0"] || {};
  let controlPoint2 = controlPoints["1"] || {};
  let tmpPoint1;
  let tmpPoint2;
  const lineEndPoints = relationship.get("lineEndPoints") || {};
  let lineEndPoint1 = lineEndPoints["0"];
  let lineEndPoint2 = lineEndPoints["1"];
  if (lineEndPoint1) {
    lineEndPoint1 = pointutils.add(startPos, lineEndPoint1);
  }
  if (lineEndPoint2) {
    lineEndPoint2 = pointutils.add(endPos, lineEndPoint2);
  }
  if (relationshipView.figure.lineStyle !== RELATIONSHIPSHAPE.CURVED) {
    //如果不是曲线线型，那么amount和angle是不生效的
    controlPoint1 = {
      x: controlPoint1.x,
      y: controlPoint1.y,
    };
    controlPoint2 = {
      x: controlPoint2.x,
      y: controlPoint2.y,
    };
  }
  const isControl1PolarCoord =
    controlPoint1.amount !== undefined && controlPoint1.angle !== undefined;
  const isControl1RelativeCoord =
    controlPoint1.x !== undefined && controlPoint1.y !== undefined;
  const isControl2PolarCoord =
    controlPoint2.amount !== undefined && controlPoint2.angle !== undefined;
  const isControl2RelativeCoord =
    controlPoint2.x !== undefined && controlPoint2.y !== undefined;
  let startSectPoint;
  let endSectPoint;
  if (isControl1PolarCoord || isControl2PolarCoord) {
    startSectPoint = Util.topicInsectLine(end1View, endPos);
    endSectPoint = Util.topicInsectLine(end2View, startPos);
  }
  if (isControl1RelativeCoord) {
    controlPoint1 = {
      x: startPos.x + controlPoint1.x,
      y: startPos.y + controlPoint1.y,
    };
  } else if (isControl1PolarCoord) {
    //极坐标系表示
    tmpPoint1 = {
      x:
        (endSectPoint.x - startSectPoint.x) * controlPoint1.amount +
        startSectPoint.x,
      y:
        (endSectPoint.y - startSectPoint.y) * controlPoint1.amount +
        startSectPoint.y,
    };
    controlPoint1 = pointutils.rotateAround(
      tmpPoint1,
      startSectPoint,
      controlPoint1.angle,
    );
  } else {
    //controlPoints未初始化，使用偏移0度的controlPoint
    tmpPoint1 = {
      x: (endPos.x - startPos.x) / 3 + startPos.x,
      y: (endPos.y - startPos.y) / 3 + startPos.y,
    };
    controlPoint1 = pointutils.rotateAround(tmpPoint1, startPos, 0);
  }
  if (isControl2RelativeCoord) {
    controlPoint2 = {
      x: endPos.x + controlPoint2.x,
      y: endPos.y + controlPoint2.y,
    };
  } else if (isControl2PolarCoord) {
    //极坐标系表示
    tmpPoint2 = {
      x:
        (startSectPoint.x - endSectPoint.x) * controlPoint2.amount +
        endSectPoint.x,
      y:
        (startSectPoint.y - endSectPoint.y) * controlPoint2.amount +
        endSectPoint.y,
    };
    controlPoint2 = pointutils.rotateAround(
      tmpPoint2,
      endSectPoint,
      controlPoint2.angle,
    );
  } else {
    //controlPoints未初始化，使用偏移0度的controlPoint
    tmpPoint2 = {
      x: ((endPos.x - startPos.x) / 3) * 2 + startPos.x,
      y: ((endPos.y - startPos.y) / 3) * 2 + startPos.y,
    };
    controlPoint2 = pointutils.rotateAround(tmpPoint2, endPos, 0);
  }
  // fix same insect point special situation
  if (
    Object(common_utils.isEqualPoint)(controlPoint1, controlPoint2) &&
    !lineEndPoint1 &&
    !lineEndPoint2 &&
    Object(common_utils.isEqualPoint)(startPos, endPos)
  ) {
    controlPoint1 = {
      x: controlPoint1.x - 10,
      y: controlPoint1.y - 10,
    };
  }
  if (
    relationshipView.figure.lineStyle === RELATIONSHIPSHAPE.STRAIGHT &&
    lineEndPoint1 &&
    lineEndPoint2
  ) {
    controlPoint1 = Object.assign({}, lineEndPoint2);
    controlPoint2 = Object.assign({}, lineEndPoint1);
  }
  const insectPoint1 = relationshipView.intersectPointWithTopic(
    "start",
    lineEndPoint1 || controlPoint1,
    controlPoint1,
  );
  const insectPoint2 = relationshipView.intersectPointWithTopic(
    "end",
    lineEndPoint2 || controlPoint2,
    controlPoint2,
  );
  if (!lineEndPoint1) {
    lineEndPoint1 = {
      x: insectPoint1.x,
      y: insectPoint1.y,
    };
  }
  if (!lineEndPoint2) {
    lineEndPoint2 = {
      x: insectPoint2.x,
      y: insectPoint2.y,
    };
  }
  return {
    insectPoint1,
    insectPoint2,
    controlPoint1,
    controlPoint2,
    lineEndPoint1,
    lineEndPoint2,
  };
}
function updateBounds1(
  relationshipView,
  { insectPoint1, insectPoint2, controlPoint1, controlPoint2 },
) {
  const lineType = relationshipView.figure.lineStyle;
  const newBounds = Object(utils.inflateBounds)(
    Object(getRelationshipLineType)(lineType).calcBoundingBox(
      insectPoint1,
      insectPoint2,
      controlPoint1,
      controlPoint2,
    ),
    parseInt(relationshipView.figure.lineWidth || 0),
  );
  if (!Object(utils.equalsBounds)(newBounds, relationshipView.bounds)) {
    relationshipView.bounds = newBounds;
    relationshipView.trigger(
      "change:bounds",
      relationshipView.bounds,
      relationshipView,
    );
  }
}
function updateBounds2(relationshipView, titleBounds) {
  const bbox = Object(utils.mergeBounds)(relationshipView.bounds, titleBounds);
  // the x,y of relationship bounds is the realpos of titleView
  // bbox.x = titleBounds.x
  // bbox.y = titleBounds.y
  if (!Object(utils.equalsBounds)(bbox, relationshipView.bounds)) {
    relationshipView.bounds = bbox;
    relationshipView.trigger(
      "change:bounds",
      relationshipView.bounds,
      relationshipView,
    );
  }
}
