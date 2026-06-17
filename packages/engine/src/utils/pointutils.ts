// @flow
/**
 * @description distance between two point.
 */
export function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
/**
 * Rotate point/vector around origin({x:0,y:0}).
 * @param {number} radian 弧度值，正为顺时针，负为逆时针. （在标准笛卡尔坐标系中，正度数指的是x正轴逆时针旋转，但我们的坐标系是上下颠倒的）
 */
export function rotate(point, radian) {
  const sinA = Math.sin(radian);
  const cosA = Math.cos(radian);
  return {
    x: point.x * cosA - point.y * sinA,
    y: point.x * sinA + point.y * cosA,
  };
}
export function rotateDeg(point, degree) {
  return rotate(point, degree2Radian(degree));
}
/**
 * 计算出 以center为旋转中心，将point旋转radian度后的点
 * @param radian {number} 是弧度值(带PI的），正为顺时针，负为逆时针
 */
export function rotateAround(point, center, radian) {
  let v = {
    x: point.x - center.x,
    y: point.y - center.y,
  };
  v = rotate(v, radian);
  return {
    x: center.x + v.x,
    y: center.y + v.y,
  };
}
export function rotateAroundDeg(point, center, degree) {
  return rotateAround(point, center, degree2Radian(degree));
}
function degree2Radian(degree) {
  return (degree / 180) * Math.PI;
}
//使一个向量长度标准化为1，也可标准化为别的长度。
export function normalize(vector, len = 1) {
  const d = Math.hypot(vector.x, vector.y);
  if (d === 0) {
    return {
      x: 0,
      y: 0,
    };
  }
  const ratio = d / len;
  return {
    x: vector.x / ratio,
    y: vector.y / ratio,
  };
} // 计算二维向量的法向量, 注意跟 normalize 区别
export function normal(vector) {
  return normalize({
    x: vector.y,
    y: -vector.x,
  });
} // 使一向量以坐标原点为中心作中心对称
export function reverse(vector) {
  return {
    x: -vector.x,
    y: -vector.y,
  };
}
export function sub(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
} //construct a vector from two point.
export function diff(from, to) {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}
export function add(point, vector) {
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  };
}
export function scale(vector, ratio) {
  return {
    x: vector.x * ratio,
    y: vector.y * ratio,
  };
} // 反射函数, a为入射向量, b为平面法线
export function reflect(a, b) {
  return sub(a, normalize(b, dot(a, b) * 2));
}
export function dot(vector1, vector2) {
  return vector1.x * vector2.x + vector1.y * vector2.y;
}
export function cross(vector1, vector2) {
  return vector1.x * vector2.y - vector1.y * vector2.x;
}
export function equal(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}
export function isPointLike(pos) {
  return Boolean(pos) && typeof pos.x === "number" && typeof pos.y === "number";
}
/**
 * @description 判断某个点是否在多边形内部
 * @param point 需要判断的点
 * @param polygonPoints 多边形的构成点
 * */
export function isPointInPolygon(point, polygonPoints) {
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
 * */
export function convexHull(pointList) {
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
export function Point(x, y) {
  return {
    x,
    y,
  };
}
