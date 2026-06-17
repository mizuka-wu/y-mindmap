/**
 * distance between two point.
 */
export function getPointDistance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
/**
 * Rotate point/vector around origin({x:0,y:0}).
 * @param  {number} radian 弧度值，正为顺时针，负为逆时针. （在标准笛卡尔坐标系中，正度数指的是x正轴逆时针旋转，但我们的坐标系是上下颠倒的）
 */
function rotatePoint(point, radian) {
  const sinA = Math.sin(radian);
  const cosA = Math.cos(radian);
  const x = point.x * cosA - point.y * sinA;
  const y = point.x * sinA + point.y * cosA;
  return {
    x,
    y,
  };
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rotatePointDeg(point, degree) {
  return rotatePoint(point, degree(degree));
}
/**
 * 计算出 以center为旋转中心，将point旋转radian度后的点
 * @param radian {number} 是弧度值(带PI的），正为顺时针，负为逆时针
 */
function rotatePointAround(point, center, radian) {
  let v = {
    x: point.x - center.x,
    y: point.y - center.y,
  };
  v = rotatePoint(v, radian);
  return {
    x: center.x + v.x,
    y: center.y + v.y,
  };
}
export function rotatePointAroundDeg(point, center, degree) {
  return rotatePointAround(point, center, degree(degree));
}
export function degree(degree) {
  return (degree / 180) * Math.PI;
} //使一个向量长度标准化为1，也可标准化为别的长度。
function normalizeVector(vector, len = 1) {
  const d = Math.hypot(vector.x, vector.y);
  const ratio = d / len;
  return {
    x: Number.isNaN(ratio) ? 0 : vector.x / ratio,
    y: Number.isNaN(ratio) ? 0 : vector.y / ratio,
  };
}
//construct a vector from two point.
export function diffPoint(from, to) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}
export function addPoint(pointA, pointB) {
  return {
    x: pointA.x + pointB.x,
    y: pointA.y + pointB.y,
  };
}
export function isEqualPoint(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPointLike(pos) {
  return !!pos && typeof pos.x === "number" && typeof pos.y === "number";
}
/**
 * @description 判断某个点是否在多边形内部
 * @param {point} point
 * @param {Array.<point>} polygonPoints 多边形的构成点
 * @return {boolean}
 * */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPointInPolygon(point, polygonPoints) {
  // todo 这一块儿的运算逻辑需要学习一下
  let i;
  let j = polygonPoints.length - 1;
  let oddNodes = false;
  const x = point.x;
  const y = point.y;
  let iPoint;
  let jPoint;
  for (i = 0; i < polygonPoints.length; i++) {
    iPoint = polygonPoints[i];
    jPoint = polygonPoints[j];
    if (
      ((iPoint.y < y && jPoint.y >= y) || (jPoint.y < y && iPoint.y >= y)) &&
      (iPoint.x <= x || jPoint.x <= x)
    ) {
      if (
        iPoint.x +
          ((y - iPoint.y) / (jPoint.y - iPoint.y)) * (jPoint.x - iPoint.x) <
        x
      ) {
        oddNodes = !oddNodes;
      }
    }
    j = i;
  }
  return oddNodes;
}
/**
 * @description 凸包算法
 * @return {Array<{ x: number, y: number }>}
 * */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convexPointHull(pointList) {
  pointList = [...pointList];
  pointList.sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  const n = pointList.length;
  const hull = [];
  for (let i = 0; i < n * 2; i++) {
    const j = i < n ? i : n * 2 - 1 - i;
    while (
      hull.length >= 2 &&
      removeMiddle(hull[hull.length - 2], hull[hull.length - 1], pointList[j])
    ) {
      hull.pop();
    }
    hull.push(pointList[j]);
  }
  hull.pop();
  return hull;
  function removeMiddle(a, b, c) {
    const cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
    const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
    return cross < 0 || (cross === 0 && dot <= 0);
  }
}
export function crossPoint(p1, p2, width, keepWidth?) {
  if (isEqualPoint(p1, p2)) {
    return p1;
  }
  let v = diffPoint(p1, p2);
  v = normalizeVector(v, width);
  v = rotatePoint(v, Math.PI / 2);
  if (keepWidth === "x") {
    v.x *= Math.abs(width) / Math.abs(v.x);
  } else if (keepWidth === "y") {
    v.y *= Math.abs(width) / Math.abs(v.y);
  }
  return addPoint(p1, v);
}
export function pivot(pivot, point) {
  return {
    x: pivot.x * 2 - point.x,
    y: pivot.y * 2 - point.y,
  };
} //tapered line中，拐点两边变宽后外部线条的拐点。 返回的是Vector<start, end>顺时针碰到的第一个点。
//另一个点用pivot求。
export function flexSidePoint(start, flex, end, width) {
  if (
    isEqualPoint(start, flex) ||
    (start.y === flex.y && flex.y === end.y) ||
    (start.x === flex.x && flex.x === end.x)
  ) {
    return crossPoint(flex, end, width);
  }
  let v1 = diffPoint(start, flex);
  let v2 = diffPoint(flex, end);
  v1 = normalizeVector(v1);
  v2 = normalizeVector(v2);
  let v = addPoint(v1, v2);
  v = normalizeVector(v, width);
  v = rotatePoint(v, Math.PI / 2);
  if (isNaN(v.x)) {
    throw "Hey";
  }
  return addPoint(flex, v);
  //👆这种方式遇到三点一线时会出现NaN bug。
  //👇 这种方式计算出来的点在内角中，而不是顺时针先碰到的那个点。
  // let v1 = pointutils.diff(flex, start);
  // let v2 = pointutils.diff(flex, end);
  // v1 = pointutils.normalize(v1);
  // v2 = pointutils.normalize(v2);
  // let v = pointutils.add(v1, v2);
  // return pointutils.normalize(v, width);
}
/** 绘制corner时使用，尤其是折角非90度的情况。
 * 计算出flex前后两个点，作为曲线的起点和终点。 Q的控制点还是flexpos。
 * @return [beforeFlexPos, afterFlexPos]
 */
export function flexCorner(start, flex, end, corner) {
  let v1 = diffPoint(flex, start);
  let v2 = diffPoint(flex, end);
  v1 = normalizeVector(v1, corner);
  v2 = normalizeVector(v2, corner);
  return [addPoint(flex, v1), addPoint(flex, v2)];
} // 类似flexCorner，但进入弯曲区域时会更长，为2*corner，离开时为corner。
export function flexCornerEaseIn(start, flex, end, corner) {
  let v1 = diffPoint(flex, start);
  let v2 = diffPoint(flex, end);
  v1 = normalizeVector(v1, corner * 2);
  v2 = normalizeVector(v2, corner);
  return [addPoint(flex, v1), addPoint(flex, v2)];
}
