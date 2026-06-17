import * as commonUtils from '../common/utils/index';

import * as topicLineStyleUtils from './topiclinestyle/utils';
import * as topicShapesUtils from '../figures/renderengine/svg/topicshapes/utils';
/**
 * Curve
 */
export function curveHorizon(linePositions, padding = 0) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = endPt.x - ctrlPt.x;
  const ctrlX = dx / 5 + ctrlPt.x;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}Q ${ctrlX} ${endPt.y} ${endPt.x - padding} ${endPt.y}`;
}
export function taperedCurveHorizon(linePositions, lineWidth, padding = 0, isStartVertical) {
  const { startPt, ctrlPt, endPt } = linePositions;
  endPt.x -= padding;
  const dx = endPt.x - ctrlPt.x;
  const ctrlX = dx / 3 + ctrlPt.x;
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const p1 = Object(topicShapesUtils.calcUnderline)(startPt, ctrlPt, openGap / 2);
  const p2 = Object(topicShapesUtils.calcUnderline)(ctrlPt, endPt, openGap / 2, isStartVertical ? 'x' : 'y');
  const p4 = Object(topicShapesUtils.calcUnderline)(endPt, ctrlPt, closeGap / 2);
  const p3 = Object(commonUtils.pivot)(endPt, p4);
  const p5 = Object(commonUtils.pivot)(ctrlPt, p2);
  const p6 = Object(commonUtils.pivot)(startPt, p1);
  //corrections for control point.
  const corX = (p2.x - p5.x) / 2;
  const corY = (p3.y - p4.y) / 2;
  p3.x = p4.x = endPt.x;
  return `M ${p1.x} ${p1.y}L ${p2.x} ${p2.y}Q ${ctrlX + corX} ${
    endPt.y + corY
  } ${p3.x} ${p3.y}L ${p4.x} ${p4.y}Q ${ctrlX - corX} ${endPt.y - corY} ${p5.x} ${p5.y}L ${p6.x} ${p6.y} Z`;
} //Q的控制点选取的位置和水平时不太一样，弯曲度更大些
export function rect(linePositions, padding = 0) {
  const { startPt, ctrlPt, endPt } = linePositions;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}Q ${endPt.x} ${ctrlPt.y} ${endPt.x} ${endPt.y - padding}`;
}
export function taperedCurveVertical(linePositions, lineWidth, padding = 0) {
  const { startPt, ctrlPt, endPt } = linePositions;
  endPt.y -= padding;
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const p1 = Object(topicShapesUtils.calcUnderline)(startPt, ctrlPt, openGap / 2);
  const p2 = Object(topicShapesUtils.calcUnderline)(ctrlPt, endPt, openGap / 2);
  const p4 = Object(topicShapesUtils.calcUnderline)(endPt, ctrlPt, closeGap / 2);
  const p3 = Object(commonUtils.pivot)(endPt, p4);
  const p5 = Object(commonUtils.pivot)(ctrlPt, p2);
  const p6 = Object(commonUtils.pivot)(startPt, p1);
  //corrections for control point.
  const corX = (p2.x - p5.x) / 2;
  const corY = (p3.y - p4.y) / 2;
  p3.y = p4.y = endPt.y;
  return `M ${p1.x} ${p1.y}L ${p2.x} ${p2.y}Q ${endPt.x + corX} ${
    ctrlPt.y + corY
  } ${p3.x} ${p3.y}L ${p4.x} ${p4.y}Q ${endPt.x - corX} ${ctrlPt.y - corY} ${p5.x} ${p5.y}L ${p6.x} ${p6.y} Z`;
}
/**
 * Elbow
 */
export function elbowHorizon(linePositions) {
  const { startPt, ctrlPt, endPt } = linePositions;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${ctrlPt.x} ${endPt.y}L ${endPt.x} ${endPt.y}`;
} //走线从内到外，需要改成一致的。
export function taperedElbowHorizon(linePositions, lineWidth, obviousTapered) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = startPt.y === ctrlPt.y && ctrlPt.y === endPt.y ? 0 : 1; //消除直线情况下，怪异的凹凸效果。
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  //control point不止是在start point的左右方，在timeline结构中还可能在下方。
  //所以需要chor和cver来判断开口方向。 虽然也可以像taperedStraight中那样求，但此处更简单。
  const chor = ctrlPt.x !== startPt.x ? 1 : 0; //col 在 start左右
  const cver = ctrlPt.y !== startPt.y ? 1 : 0; //col 在 start上下
  const openGap = lineWidth * 2.4;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  const flexPt = {
    x: ctrlPt.x,
    y: endPt.y,
  }; //拐点
  const obviousValue = ver * hcp * (obviousTapered ? 2.1 : 1);
  return `M ${startPt.x + cver * hop} ${startPt.y - ver * chor * hop}L ${
    ctrlPt.x + hor * hop * linear
  } ${startPt.y - ver * chor * hop}L ${flexPt.x + hor * hop * linear} ${
    flexPt.y - obviousValue
  }L ${endPt.x} ${endPt.y - ver * hcp}L ${endPt.x} ${endPt.y + ver * hcp}L ${
    flexPt.x - hor * hop * linear
  } ${flexPt.y + obviousValue}L ${ctrlPt.x - hor * hop * linear} ${
    startPt.y + ver * chor * hop
  }L ${startPt.x - cver * hop} ${startPt.y + ver * chor * hop}`;
}
export function elbowVertical(linePositions) {
  const { startPt, ctrlPt, endPt } = linePositions;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${endPt.x} ${ctrlPt.y}L ${endPt.x} ${endPt.y}`;
} //相比taperedElbowHorizon简单点，control point只会在start point上下, 走线从外到内
export function taperedElbowVertical(linePositions, lineWidth, obviousTapered) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = startPt.x === ctrlPt.x && ctrlPt.x === endPt.x ? 0 : 1; //消除直线情况下，怪异的凹凸效果。
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  const flexPt = {
    x: endPt.x,
    y: ctrlPt.y,
  }; //拐点
  const obviousValue = hor * hcp * (obviousTapered ? 2.3 : 1);
  return `M ${startPt.x + hor * hop} ${startPt.y}L ${startPt.x + hor * hop} ${
    ctrlPt.y - ver * hop * linear
  }L ${flexPt.x + obviousValue} ${flexPt.y - ver * hop * linear}L ${
    endPt.x + hor * hcp
  } ${endPt.y}L ${endPt.x - hor * hcp} ${endPt.y}L ${flexPt.x - obviousValue} ${
    flexPt.y + ver * hop * linear
  }L ${startPt.x - hor * hop} ${ctrlPt.y + ver * hop * linear}L ${startPt.x - hor * hop} ${startPt.y}`;
}
/**
 * Rounded Elbow
 */
export function roundedElbowHorizon(linePositions, corner) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = Math.abs(ctrlPt.y - endPt.y) < corner ? 0 : 1; //接近直线时去除corner
  const hor = endPt.x > ctrlPt.x ? 1 : -1; // same as below.
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const flexPt = {
    x: ctrlPt.x,
    y: endPt.y,
  }; //拐点
  corner = Math.min(corner, Math.abs(endPt.x - ctrlPt.x));
  const bflexPt = {
    x: flexPt.x,
    y: flexPt.y - ver * corner * linear,
  }; //拐点之前
  const aflexPt = {
    x: flexPt.x + hor * corner,
    y: flexPt.y,
  }; //拐点之后
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${bflexPt.x} ${bflexPt.y}Q ${flexPt.x} ${flexPt.y} ${aflexPt.x} ${aflexPt.y}L ${endPt.x} ${endPt.y}`;
} //走线从内到外，需要改成一致的。
export function taperedRoundedElbowHorizon(linePositions, lineWidth, corner, obviousTapered) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = Math.abs(ctrlPt.y - endPt.y) < corner ? 0 : 1;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  //control point不止是在start point的左右方，在timeline结构中还可能在下方。
  //所以需要chor和cver来判断开口方向。 虽然也可以像taperedStraight中那样求，但此处更简单。
  const chor = ctrlPt.x !== startPt.x ? 1 : 0; //col 在 start左右
  const cver = ctrlPt.y !== startPt.y ? 1 : 0; //col 在 start上下
  const openGap = lineWidth * 2.5;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  const flexPt = {
    x: ctrlPt.x,
    y: endPt.y,
  }; //拐点
  const outerCorner = corner + lineWidth / 2;
  const innerCorner = corner - lineWidth / 2;
  const obviousValue = ver * hcp * (obviousTapered ? 2.3 : 1);
  const obviousOffset = obviousTapered ? ver * 0.4 * lineWidth : 0;
  return `M ${startPt.x + cver * hop} ${startPt.y - ver * chor * hop}L ${
    ctrlPt.x + hor * hop * linear
  } ${startPt.y - ver * chor * hop}L ${flexPt.x + hor * hop * linear} ${
    flexPt.y - obviousValue - ver * innerCorner * linear
  }Q ${flexPt.x + hor * hop * linear} ${
    flexPt.y - obviousValue + obviousOffset
  } ${flexPt.x + hor * hop * linear + hor * innerCorner * linear} ${
    flexPt.y - obviousValue + obviousOffset
  }L ${endPt.x} ${endPt.y - ver * hcp}L ${endPt.x} ${endPt.y + ver * hcp}L ${
    flexPt.x - hor * hop * linear + hor * outerCorner * linear + obviousOffset * 2
  } ${flexPt.y + obviousValue}Q ${flexPt.x - hor * hop * linear} ${
    flexPt.y + obviousValue
  } ${flexPt.x - hor * hop * linear} ${
    flexPt.y + ver * hcp - ver * outerCorner * linear
  }L ${ctrlPt.x - hor * hop * linear} ${startPt.y + ver * chor * hop}L ${
    startPt.x - cver * hop
  } ${startPt.y + ver * chor * hop}`;
}
export function roundedElbowVertical(linePositions, corner) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = Math.abs(ctrlPt.x - endPt.x) < corner ? 0 : 1;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; // same as below.
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const flexPt = {
    x: endPt.x,
    y: ctrlPt.y,
  }; //拐点
  corner = Math.min(corner, Math.abs(endPt.y - ctrlPt.y));
  const bflexPt = {
    x: flexPt.x - hor * corner * linear,
    y: flexPt.y,
  }; //拐点之前
  const aflexPt = {
    x: flexPt.x,
    y: flexPt.y + ver * corner,
  }; //拐点之后
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${bflexPt.x} ${bflexPt.y}Q ${flexPt.x} ${flexPt.y} ${aflexPt.x} ${aflexPt.y}L ${endPt.x} ${endPt.y}`;
} //相比taperedElbowHorizon简单点，control point只会在start point上下, 走线从外到内
export function taperedRoundedElbowVertical(linePositions, lineWidth, corner, obviousTapered) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const linear = Math.abs(ctrlPt.x - endPt.x) < corner ? 0 : 1;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  const flexPt = {
    x: endPt.x,
    y: ctrlPt.y,
  }; //拐点
  const outerCorner = corner + lineWidth / 2;
  const innerCorner = corner - lineWidth / 2;
  const obviousValue = hor * hcp * (obviousTapered ? 2.6 : 1);
  const obviousOffset = obviousTapered ? hor * 0.4 * lineWidth : 0;
  return `M ${startPt.x + hor * hop} ${startPt.y}L ${startPt.x + hor * hop} ${
    ctrlPt.y - ver * hop * linear
  }L ${flexPt.x + obviousValue - hor * outerCorner * linear} ${
    flexPt.y - ver * hop * linear
  }Q ${flexPt.x + obviousValue - obviousOffset} ${
    flexPt.y - ver * hop * linear
  } ${flexPt.x + obviousValue - obviousOffset} ${
    flexPt.y - ver * hop * linear + ver * outerCorner
  }L ${endPt.x + hor * hcp - obviousOffset} ${endPt.y}L ${
    endPt.x - hor * hcp - obviousOffset
  } ${endPt.y}L ${flexPt.x - obviousValue} ${
    flexPt.y + ver * hop * linear + ver * innerCorner * linear
  }Q ${flexPt.x - obviousValue} ${flexPt.y + ver * hop * linear} ${
    flexPt.x - hor * hcp - hor * innerCorner - obviousOffset
  } ${flexPt.y + ver * hop * linear}L ${startPt.x - hor * hop} ${
    ctrlPt.y + ver * hop * linear
  }L ${startPt.x - hor * hop} ${startPt.y}`;
}
/**
 * Straight
 */
export function straightLine(linePositions) {
  const { startPt, ctrlPt, endPt } = linePositions;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${endPt.x} ${endPt.y}`;
}
export function taperedStraight(linePositions, lineWidth, isStartVertical, isEndVertical) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const p1 = Object(topicShapesUtils.calcUnderline)(startPt, ctrlPt, openGap / 2);
  const p2 = Object(topicShapesUtils.calcUnderline)(ctrlPt, endPt, openGap / 2, isStartVertical ? 'x' : 'y');
  const p4 = Object(topicShapesUtils.calcUnderline)(endPt, ctrlPt, closeGap / 2);
  const p3 = Object(commonUtils.pivot)(endPt, p4);
  const p5 = Object(commonUtils.pivot)(ctrlPt, p2);
  const p6 = Object(commonUtils.pivot)(startPt, p1);
  if (isEndVertical) {
    p4.y = p3.y = endPt.y;
  } else {
    p4.x = p3.x = endPt.x;
  }
  return (
    'M ' +
    p1.x +
    ' ' +
    p1.y +
    'L ' +
    p2.x +
    ' ' +
    p2.y +
    'L ' +
    p3.x +
    ' ' +
    p3.y +
    'L ' +
    p4.x +
    ' ' +
    p4.y +
    'L ' +
    p5.x +
    ' ' +
    p5.y +
    'L ' +
    p6.x +
    ' ' +
    p6.y +
    ' Z'
  );
}
/**
 * Skew Elbow
 */
const DEFAULT_SE_RATIO = 2 / 3;
export function skewElbowHorizon(linePositions, seRatio = DEFAULT_SE_RATIO) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: (endPt.x - ctrlPt.x) * seRatio + ctrlPt.x,
    y: endPt.y,
  };
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${flexPt.x} ${flexPt.y}L ${endPt.x} ${endPt.y}`;
}
export function taperedSkewElbowHorizon(linePositions, lineWidth, seRatio = DEFAULT_SE_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: (endPt.x - ctrlPt.x) * seRatio + ctrlPt.x,
    y: endPt.y,
  };
  return _taperedSkewElbow(linePositions, lineWidth, flexPt);
}
export function skewElbowVertical(linePositions, seRatio = DEFAULT_SE_RATIO) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: endPt.x,
    y: (endPt.y - ctrlPt.y) * seRatio + ctrlPt.y,
  };
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${flexPt.x} ${flexPt.y}L ${endPt.x} ${endPt.y}`;
}
export function taperedSkewElbowVertical(linePositions, lineWidth, seRatio = DEFAULT_SE_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: endPt.x,
    y: (endPt.y - ctrlPt.y) * seRatio + ctrlPt.y,
  };
  return _taperedSkewElbow(linePositions, lineWidth, flexPt);
}
function _taperedSkewElbow(linePositions, lineWidth, flexPt) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const openGap = lineWidth * 3;
  const midGap = lineWidth * 2;
  const closeGap = lineWidth;
  const p1 = Object(topicShapesUtils.calcUnderline)(startPt, ctrlPt, openGap / 2);
  const p2 = Object(commonUtils.flexSidePoint)(startPt, ctrlPt, flexPt, openGap / 2);
  const p3 = Object(commonUtils.flexSidePoint)(ctrlPt, flexPt, endPt, midGap / 2); //this is better.
  const p5 = Object(topicShapesUtils.calcUnderline)(endPt, flexPt, closeGap / 2);
  const p4 = Object(commonUtils.pivot)(endPt, p5);
  const p6 = Object(commonUtils.pivot)(flexPt, p3);
  const p7 = Object(commonUtils.pivot)(ctrlPt, p2);
  const p8 = Object(commonUtils.pivot)(startPt, p1);
  return (
    'M ' +
    p1.x +
    ' ' +
    p1.y +
    'L ' +
    p2.x +
    ' ' +
    p2.y +
    'L ' +
    p3.x +
    ' ' +
    p3.y +
    'L ' +
    p4.x +
    ' ' +
    p4.y +
    'L ' +
    p5.x +
    ' ' +
    p5.y +
    'L ' +
    p6.x +
    ' ' +
    p6.y +
    'L ' +
    p7.x +
    ' ' +
    p7.y +
    'L ' +
    p8.x +
    ' ' +
    p8.y +
    ' Z'
  );
}
/**
 * Horn
 */
const DEFAULT_HO_RATIO = 1 / 2;
export function hornHorizon(linePositions, hoRatio = DEFAULT_HO_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: (endPt.x - ctrlPt.x) * hoRatio + ctrlPt.x,
    y: endPt.y,
  };
  return _horn(linePositions, flexPt);
} //suppose startpos and colpos at the same position.
export function taperedHornHorizon(linePositions, lineWidth, hoRatio = DEFAULT_HO_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: (endPt.x - ctrlPt.x) * hoRatio + ctrlPt.x,
    y: endPt.y,
  };
  return _taperedHorn(linePositions, flexPt, lineWidth);
}
export function hornVertical(linePositions, hoRatio = DEFAULT_HO_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: endPt.x,
    y: (endPt.y - ctrlPt.y) * hoRatio + ctrlPt.y,
  };
  return _horn(linePositions, flexPt);
}
export function taperedHornVertical(linePositions, lineWidth, hoRatio = DEFAULT_HO_RATIO) {
  const { ctrlPt, endPt } = linePositions;
  const flexPt = {
    x: endPt.x,
    y: (endPt.y - ctrlPt.y) * hoRatio + ctrlPt.y,
  };
  return _taperedHorn(linePositions, flexPt, lineWidth);
} //same logic for hornVertical and hornHorizon.
function _horn(linePositions, flexPt) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = Math.abs(endPt.x - ctrlPt.x);
  const dy = Math.abs(endPt.y - ctrlPt.y);
  const corner = Math.min(dx, dy) / 4;
  const flexes = Object(commonUtils.flexCornerEaseIn)(ctrlPt, flexPt, endPt, corner);
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}L ${flexes[0].x} ${flexes[0].y}Q ${flexPt.x} ${flexPt.y} ${flexes[1].x} ${flexes[1].y}L ${endPt.x} ${endPt.y}`;
}
function _taperedHorn(linePositions, flexPt, lineWidth) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = Math.abs(endPt.x - ctrlPt.x);
  const dy = Math.abs(endPt.y - ctrlPt.y);
  const corner = Math.max(Math.min(dx, dy) / 4, 8);
  const openGap = lineWidth * 3;
  const midGap = lineWidth * 2;
  const closeGap = lineWidth;
  const flex1 = Object(commonUtils.flexSidePoint)(ctrlPt, flexPt, endPt, midGap / 2);
  const flex2 = Object(commonUtils.pivot)(flexPt, flex1);
  //this is kind of like taperedSkewElbow, but have a corner.
  const start1 = Object(topicShapesUtils.calcUnderline)(startPt, ctrlPt, openGap / 2);
  const start2 = Object(commonUtils.pivot)(startPt, start1);
  const col1 = Object(commonUtils.flexSidePoint)(startPt, ctrlPt, flexPt, openGap / 2);
  const col2 = Object(commonUtils.pivot)(ctrlPt, col1);
  const end2 = Object(topicShapesUtils.calcUnderline)(endPt, flexPt, closeGap / 2);
  const end1 = Object(commonUtils.pivot)(endPt, end2);
  const flex1sides = Object(commonUtils.flexCornerEaseIn)(col1, flex1, end1, corner);
  const flex2sides = Object(commonUtils.flexCornerEaseIn)(col2, flex2, end2, corner);
  return `M ${start1.x} ${start1.y}L ${col1.x} ${col1.y}L ${flex1sides[0].x} ${flex1sides[0].y}Q ${flex1.x} ${flex1.y} ${flex1sides[1].x} ${flex1sides[1].y}L ${end1.x} ${end1.y}L ${end2.x} ${end2.y}L ${flex2sides[1].x} ${flex2sides[1].y}Q ${flex2.x} ${flex2.y} ${flex2sides[0].x} ${flex2sides[0].y}L ${col2.x} ${col2.y}L ${start2.x} ${start2.y}`;
}
/**
 * Sinus
 */
export function convexrect(linePositions, reverseDirection = false) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = endPt.x - ctrlPt.x;
  const c1x = ctrlPt.x + dx / 3;
  const c1y = ctrlPt.y + (Math.abs(dx) / 5) * (reverseDirection ? -1 : 1);
  const c2x = endPt.x - dx / 3;
  const c2y = endPt.y - (Math.abs(dx) / 6) * (reverseDirection ? -1 : 1);
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}C ${c1x} ${c1y} ${c2x} ${c2y} ${endPt.x} ${endPt.y}`;
}
export function taperedBightTreeHorizon(linePositions, lineWidth) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = endPt.x - ctrlPt.x;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const hop = openGap / 2; // 1.5
  const hcp = closeGap / 2; // 0.5
  const c1x = ctrlPt.x + dx / 3;
  const c1y = ctrlPt.y + Math.abs(dx) / 5;
  const c2x = endPt.x - dx / 3;
  const c2y = endPt.y - Math.abs(dx) / 6;
  return `M ${startPt.x} ${startPt.y}L ${startPt.x - hor * hop} ${startPt.y}L ${
    ctrlPt.x - hor * hop
  } ${ctrlPt.y + hop * 0.8}C ${c1x + hor * closeGap} ${c1y + hop} ${
    c2x - hor * hcp
  } ${c2y + hcp} ${endPt.x} ${endPt.y}L ${endPt.x} ${endPt.y - 2}C ${
    c2x + hor * hcp
  } ${c2y - hop} ${c1x} ${c1y - hcp} ${ctrlPt.x + hor * hcp} ${ctrlPt.y - hcp}L ${startPt.x + hor * hcp} ${startPt.y}Z`;
}
export function sinusHorizon(linePositions) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = endPt.x - ctrlPt.x;
  const flexX = (endPt.x + ctrlPt.x) / 2;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}C ${
    endPt.x - dx / 4
  } ${ctrlPt.y} ${flexX} ${endPt.y} ${endPt.x} ${endPt.y}`;
}
export function taperedSinusHorizon(linePositions, lineWidth) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dx = endPt.x - ctrlPt.x;
  const flexX = (endPt.x + ctrlPt.x) / 2;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  let beginD = '';
  //tree和timeline结构，horizon中一种比较棘手的情况.
  if (ctrlPt.y !== startPt.y) {
    beginD = `M ${startPt.x} ${startPt.y}L ${startPt.x - hor * hop} ${
      startPt.y
    }L ${ctrlPt.x - hor * hop} ${ctrlPt.y + ver * hop}L ${
      ctrlPt.x + hor * hop
    } ${ctrlPt.y + ver * hop}L ${startPt.x + hor * hop} ${startPt.y}Z`;
  }
  return `${beginD}M ${ctrlPt.x} ${ctrlPt.y}L ${ctrlPt.x} ${
    ctrlPt.y + ver * hop
  }C ${endPt.x - dx / 4 - hor * openGap} ${ctrlPt.y + ver * hop} ${
    flexX - hor * closeGap
  } ${endPt.y + ver * hcp} ${endPt.x} ${endPt.y + ver * hcp}L ${endPt.x} ${
    endPt.y - ver * hcp
  }C ${flexX + hor * closeGap} ${endPt.y - ver * hcp} ${endPt.x - dx / 4} ${
    ctrlPt.y - ver * hop
  } ${ctrlPt.x} ${ctrlPt.y - ver * hop}Z`;
}
export function sinusVertical(linePositions) {
  const { startPt, ctrlPt, endPt } = linePositions;
  const dy = endPt.y - ctrlPt.y;
  const flexY = (endPt.y + ctrlPt.y) / 2;
  return `M ${startPt.x} ${startPt.y}L ${ctrlPt.x} ${ctrlPt.y}C ${ctrlPt.x} ${
    endPt.y - dy / 4
  } ${endPt.x} ${flexY} ${endPt.x} ${endPt.y}`;
}
export function taperedSinusVertical(linePositions, lineWidth) {
  const { ctrlPt, endPt } = linePositions;
  const dy = endPt.y - ctrlPt.y;
  const flexY = (endPt.y + ctrlPt.y) / 2;
  const hor = endPt.x > ctrlPt.x ? 1 : -1; //-hor means closer +hor means farther
  const ver = endPt.y > ctrlPt.y ? 1 : -1; //-ver means closer +ver means farther
  const openGap = lineWidth * 3;
  const closeGap = lineWidth;
  const hop = openGap / 2;
  const hcp = closeGap / 2;
  return `M ${ctrlPt.x} ${ctrlPt.y}L ${ctrlPt.x + hor * hop} ${ctrlPt.y}C ${
    ctrlPt.x + hor * hop
  } ${endPt.y - dy / 4 - ver * openGap}  ${endPt.x + hor * hcp} ${
    flexY - ver * closeGap
  }  ${endPt.x + hor * hcp} ${endPt.y}L ${endPt.x - hor * hcp} ${endPt.y}C ${
    endPt.x - hor * hcp
  } ${flexY + ver * closeGap}  ${ctrlPt.x - hor * hop} ${endPt.y - dy / 4} ${ctrlPt.x - hor * hop} ${ctrlPt.y}Z`;
}
/**
 * Brace
 */
export function braceVertical(ctrlPt, endPt, lineWidth?, branchView?) {
  const { isToDown, braceEndPt, centerX, corner } = getBraceCalcInfo(ctrlPt, endPt);
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(branchView, ctrlPt, braceEndPt);
  return `M ${ctrlPt.x} ${ctrlPt.y}Q ${centerX} ${ctrlPt.y} ${centerX} ${
    ctrlPt.y + isToDown * corner
  } L ${centerX} ${braceEndPt.y - isToDown * corner}Q ${centerX} ${braceEndPt.y} ${braceEndPt.x} ${braceEndPt.y}`;
}
export function fullBraceVertical(ctrlPt, endPt1, endPt2, lineWidth, branchView) {
  function getLine1() {
    const { isToDown, braceEndPt, centerX, corner } = getBraceCalcInfo(ctrlPt, endPt1);
    return `M ${braceEndPt.x} ${braceEndPt.y} Q ${centerX} ${
      braceEndPt.y
    } ${centerX} ${braceEndPt.y - isToDown * corner} L ${centerX} ${
      ctrlPt.y + isToDown * corner
    } Q ${centerX} ${ctrlPt.y} ${ctrlPt.x} ${ctrlPt.y} `;
  }
  function getLine2() {
    const { isToDown, braceEndPt, centerX, corner } = getBraceCalcInfo(ctrlPt, endPt2);
    return `M ${ctrlPt.x} ${ctrlPt.y}Q ${centerX} ${ctrlPt.y} ${centerX} ${
      ctrlPt.y + isToDown * corner
    } L ${centerX} ${braceEndPt.y - isToDown * corner}Q ${centerX} ${braceEndPt.y} ${braceEndPt.x} ${braceEndPt.y}`;
  }
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(branchView, endPt1, endPt2);
  return getLine1() + getLine2();
}
export function taperedBraceVertical(ctrlPt, endPt, lineWidth, branchView) {
  const { isToRight, isToDown, braceEndPt, centerX, corner } = getBraceCalcInfo(ctrlPt, endPt);
  const endHalfWidth = lineWidth / 2;
  const centerHalfWidth = lineWidth * 2;
  const p1 = {
    x: ctrlPt.x,
    y: ctrlPt.y + isToDown * endHalfWidth,
  };
  const c1 = {
    x: centerX - isToRight * centerHalfWidth,
    y: p1.y,
  };
  const p2 = {
    x: c1.x,
    y: c1.y + isToDown * (corner - endHalfWidth),
  };
  const p3 = {
    x: c1.x,
    y: braceEndPt.y - isToDown * (corner - endHalfWidth),
  };
  const c2 = {
    x: c1.x,
    y: braceEndPt.y + isToDown * endHalfWidth,
  };
  const p4 = {
    x: braceEndPt.x,
    y: braceEndPt.y + isToDown * endHalfWidth,
  };
  const p5 = {
    x: braceEndPt.x,
    y: braceEndPt.y - isToDown * endHalfWidth,
  };
  const c3 = {
    x: centerX + isToRight * centerHalfWidth,
    y: p5.y,
  };
  const p6 = {
    x: c3.x,
    y: p3.y,
  };
  const p7 = {
    x: c3.x,
    y: p2.y,
  };
  const c4 = {
    x: p7.x,
    y: ctrlPt.y - isToDown * endHalfWidth,
  };
  const p8 = {
    x: p1.x,
    y: ctrlPt.y - isToDown * endHalfWidth,
  };
  // 一三象限的顺时针绘制圆角，二四象限的逆时针绘制圆角
  const roundSweep = isToRight * isToDown === 1 ? 0 : 1;
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(branchView, ctrlPt, endPt);
  return `M ${p1.x} ${p1.y}Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}L ${p3.x} ${p3.y}Q ${c2.x} ${c2.y} ${p4.x} ${p4.y}A ${endHalfWidth} ${endHalfWidth} 0 0 ${roundSweep} ${p5.x} ${p5.y}Q ${c3.x} ${c3.y} ${p6.x} ${p6.y}L ${p7.x} ${p7.y}Q ${c4.x} ${c4.y} ${p8.x} ${p8.y}A ${endHalfWidth} ${endHalfWidth} 0 0 ${roundSweep} ${p1.x} ${p1.y}`;
}
export function fullTaperedBraceVertical(ctrlPt, endPt1, endPt2, lineWidth, branchView) {
  const { isToRight, corner, centerX } = getBraceCalcInfo(ctrlPt, endPt1);
  const endHalfWidth = lineWidth / 2;
  const centerHalfWidth = lineWidth * 2;
  if (endPt1.y > endPt2.y) {
    const temp = endPt1.y;
    endPt1.y = endPt2.y;
    endPt2.y = temp;
  }
  const braceEnd1Position = endPt1;
  const braceEnd2Position = endPt2;
  Object(topicLineStyleUtils.setConnectionSpecialPoint)(branchView, endPt1, endPt2);
  const getHalfTaperedBraceVertical = (_ctrlPt, _endPt) => {
    const isToDown = _ctrlPt.y < _endPt.y ? 1 : -1;
    const p1 = {
      x: _ctrlPt.x,
      y: _ctrlPt.y + isToDown * endHalfWidth,
    };
    const c1 = {
      x: centerX - isToRight * centerHalfWidth,
      y: p1.y,
    };
    const p2 = {
      x: c1.x,
      y: c1.y + isToDown * (corner - endHalfWidth),
    };
    const p3 = {
      x: c1.x,
      y: _endPt.y - isToDown * (corner - endHalfWidth),
    };
    const c2 = {
      x: c1.x,
      y: _endPt.y + isToDown * endHalfWidth,
    };
    const p4 = {
      x: _endPt.x,
      y: _endPt.y + isToDown * endHalfWidth,
    };
    const p5 = {
      x: _endPt.x,
      y: _endPt.y - isToDown * endHalfWidth,
    };
    const c3 = {
      x: centerX + isToRight * centerHalfWidth,
      y: p5.y,
    };
    const p6 = {
      x: c3.x,
      y: p3.y,
    };
    const p7 = {
      x: c3.x,
      y: p2.y,
    };
    const c4 = {
      x: c3.x,
      y: _ctrlPt.y,
    };
    const p8 = {
      x: centerX - (isToRight * centerHalfWidth) / 2,
      y: _ctrlPt.y,
    };
    // 同 line 996
    const roundSweep = isToRight * isToDown === 1 ? 0 : 1;
    return `M ${_ctrlPt.x} ${_ctrlPt.y} L ${p1.x} ${p1.y}Q ${c1.x} ${c1.y} ${p2.x} ${p2.y}L ${p3.x} ${p3.y}Q ${c2.x} ${c2.y} ${p4.x} ${p4.y}A ${endHalfWidth} ${endHalfWidth} 0 0 ${roundSweep} ${p5.x} ${p5.y}Q ${c3.x} ${c3.y} ${p6.x} ${p6.y}L ${p7.x} ${p7.y}Q ${c4.x} ${c4.y} ${p8.x} ${p8.y}`;
  };
  return `${
    getHalfTaperedBraceVertical(ctrlPt, braceEnd1Position) + getHalfTaperedBraceVertical(ctrlPt, braceEnd2Position)
  }M ${ctrlPt.x} ${ctrlPt.y - endHalfWidth}A ${endHalfWidth} ${endHalfWidth} 0 0 ${isToRight === 1 ? 0 : 1} ${
    ctrlPt.x
  } ${ctrlPt.y + endHalfWidth}`;
}
export function brace2Vertical(ctrlPt, endPt) {
  const { isToDown, braceEndPt, centerX, dx } = getBraceCalcInfo(ctrlPt, endPt);
  const KEY_DEGREES = 25;
  const cornerDy = (Math.tan((KEY_DEGREES * Math.PI) / 180) * dx) / 2;
  return `M ${ctrlPt.x} ${ctrlPt.y}L ${centerX} ${
    ctrlPt.y + isToDown * cornerDy
  }L ${centerX} ${braceEndPt.y - isToDown * cornerDy}L ${braceEndPt.x} ${braceEndPt.y}`;
}
export function taperedBrace2Vertical(ctrlPt, endPt, lineWidth) {
  const { isToRight, isToDown, braceEndPt, centerX } = getBraceCalcInfo(ctrlPt, endPt);
  const LINE_DEGREES = 25;
  const endHalfWidth = lineWidth / 2;
  const centerHalfWidth = lineWidth * 1.5;
  const cornerDy1To2 =
    Math.tan((LINE_DEGREES * Math.PI) / 180) * Math.abs(centerX - centerHalfWidth - ctrlPt.x + endHalfWidth);
  const cornerDy3To4 = Math.tan((LINE_DEGREES * Math.PI) / 180) * Math.abs(braceEndPt.x - centerX + centerHalfWidth);
  const p1 = {
    x: ctrlPt.x,
    y: ctrlPt.y,
  };
  const p2 = {
    x: centerX - isToRight * centerHalfWidth,
    y: ctrlPt.y + isToDown * cornerDy1To2,
  };
  const p3 = {
    x: p2.x,
    y: braceEndPt.y + isToDown * endHalfWidth - isToDown * cornerDy3To4,
  };
  const p4 = {
    x: braceEndPt.x,
    y: braceEndPt.y + isToDown * endHalfWidth,
  };
  const p5 = {
    x: p4.x,
    y: braceEndPt.y - isToDown * endHalfWidth,
  };
  const p6 = {
    x: centerX + isToRight * centerHalfWidth,
    y: p3.y,
  };
  const p7 = {
    x: p6.x,
    y: p2.y,
  };
  const p8 = {
    x: ctrlPt.x + isToRight * lineWidth * 3,
    y: p1.y,
  };
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}L ${p4.x} ${p4.y} L ${p5.x} ${p5.y} L ${p6.x} ${p6.y}L ${p7.x} ${p7.y} L ${p8.x} ${p8.y} Z`;
}
export function brace3Vertical(ctrlPt, endPt) {
  const { isToDown, braceEndPt, centerX, dx } = getBraceCalcInfo(ctrlPt, endPt);
  const KEY_DEGREES = 25;
  const cornerDy = (Math.tan((KEY_DEGREES * Math.PI) / 180) * dx) / 2;
  return `M ${ctrlPt.x} ${ctrlPt.y}L ${centerX} ${
    ctrlPt.y + isToDown * cornerDy
  }L ${centerX} ${braceEndPt.y}L ${braceEndPt.x} ${braceEndPt.y}`;
}
export function taperedBrace3Vertical(ctrlPt, endPt, lineWidth) {
  const { isToRight, isToDown, braceEndPt, centerX } = getBraceCalcInfo(ctrlPt, endPt);
  const LINE_DEGREES = 25;
  const endHalfWidth = lineWidth / 2;
  const centerHalfWidth = lineWidth * 1.5;
  const cornerDy =
    Math.tan((LINE_DEGREES * Math.PI) / 180) * Math.abs(centerX - centerHalfWidth - ctrlPt.x + endHalfWidth);
  const p1 = {
    x: ctrlPt.x,
    y: ctrlPt.y,
  };
  const p2 = {
    x: centerX - isToRight * centerHalfWidth,
    y: ctrlPt.y + isToDown * cornerDy,
  };
  const p3 = {
    x: p2.x,
    y: braceEndPt.y + isToDown * endHalfWidth,
  };
  const p4 = {
    x: braceEndPt.x,
    y: p3.y,
  };
  const p5 = {
    x: p4.x,
    y: braceEndPt.y - isToDown * endHalfWidth,
  };
  const p6 = {
    x: centerX + isToRight * centerHalfWidth,
    y: p5.y,
  };
  const p7 = {
    x: p6.x,
    y: p2.y,
  };
  const p8 = {
    x: ctrlPt.x + isToRight * lineWidth * 3,
    y: p1.y,
  };
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}L ${p4.x} ${p4.y} L ${p5.x} ${p5.y} L ${p6.x} ${p6.y}L ${p7.x} ${p7.y} L ${p8.x} ${p8.y} Z`;
}
export function brace4Vertical(ctrlPt, endPt, lineWidth) {
  const { isToDown, isToRight, braceEndPt, centerX, dy } = getBraceCalcInfo(ctrlPt, endPt);
  const centerHalfWidth = lineWidth / 2;
  const endHalfWidth = ((lineWidth / 2) * 3) / 4;
  const curveCenterPositionMagnification = 4 / 5;
  const curveEndPositionMagnification = 3 / 5;
  const p1 = {
    x: centerX - isToRight * centerHalfWidth,
    y: ctrlPt.y,
  };
  const p2 = {
    x: p1.x,
    y: braceEndPt.y + isToDown * endHalfWidth,
  };
  const p3 = {
    x: braceEndPt.x,
    y: p2.y,
  };
  const p4 = {
    x: braceEndPt.x,
    y: braceEndPt.y - isToDown * endHalfWidth,
  };
  const p5 = {
    x: centerX + isToRight * centerHalfWidth,
    y: p4.y - isToDown * endHalfWidth * curveEndPositionMagnification,
  };
  const p6 = {
    x: centerX + isToRight * centerHalfWidth * (1 + curveCenterPositionMagnification),
    y: p1.y,
  };
  const line56CtrlPt = {
    x: p6.x,
    y: p5.y - (isToDown * dy) / 4,
  };
  return `M ${p1.x} ${p1.y}L ${p2.x} ${p2.y}L ${p3.x} ${p3.y}L ${p4.x} ${p4.y}L ${p5.x} ${p5.y}Q ${line56CtrlPt.x} ${line56CtrlPt.y} ${p6.x} ${p6.y}`;
}
export function brace5Vertical(ctrlPt, endPt, lineWidth) {
  const { isToDown, isToRight, braceEndPt, centerX, dx, dy } = getBraceCalcInfo(ctrlPt, endPt);
  const centerHalfWidth = lineWidth / 2;
  const corner = Math.min(Math.abs(dx), Math.abs(dy) / 2);
  const curveCenterPositionMagnification = 4 / 5;
  const p1 = {
    x: centerX - isToRight * centerHalfWidth,
    y: ctrlPt.y,
  };
  const p2 = {
    x: p1.x,
    y: braceEndPt.y - isToDown * corner,
  };
  const p3 = {
    x: braceEndPt.x,
    y: braceEndPt.y,
  };
  const line23CtrlPt = {
    x: p2.x,
    y: p3.y,
  };
  const p4 = {
    x: centerX + isToRight * centerHalfWidth,
    y: p2.y,
  };
  const line34CtrlPt = {
    x: p4.x,
    y: p3.y,
  };
  const p5 = {
    x: centerX + isToRight * centerHalfWidth * (1 + curveCenterPositionMagnification),
    y: p1.y,
  };
  const line45CtrlPt = {
    x: p5.x,
    y: p5.y + (isToDown * dy) / 4,
  };
  return `M ${p1.x} ${p1.y}L ${p2.x} ${p2.y}Q ${line23CtrlPt.x} ${line23CtrlPt.y} ${p3.x} ${p3.y}Q ${line34CtrlPt.x} ${line34CtrlPt.y} ${p4.x} ${p4.y}Q ${line45CtrlPt.x} ${line45CtrlPt.y} ${p5.x} ${p5.y}`;
}
function getBraceCalcInfo(ctrlPt, endPt) {
  const isToRight = endPt.x > ctrlPt.x ? 1 : -1;
  const isToDown = endPt.y > ctrlPt.y ? 1 : -1;
  const braceEndPt = endPt;
  const centerX = (ctrlPt.x + braceEndPt.x) / 2;
  const dx = Math.abs(braceEndPt.x - ctrlPt.x);
  const dy = Math.abs(braceEndPt.y - ctrlPt.y);
  const corner = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 4);
  return {
    isToRight,
    isToDown,
    braceEndPt,
    centerX,
    dx,
    dy,
    corner,
  };
}
