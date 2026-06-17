/* eslint-disable @typescript-eslint/no-unused-vars */
import { rotateAroundDeg } from "./pointutils";
function isEqual(bound1, bound2) {
  return (
    bound1.x === bound2.x &&
    bound1.y === bound2.y &&
    bound1.width === bound2.width &&
    bound1.height === bound2.height
  );
}
export function isIntersect(bound1, bound2) {
  return (
    //相离判断
    !(bound2.x > bound1.x + bound1.width) &&
    !(bound1.x > bound2.x + bound2.width) &&
    !(bound2.y > bound1.y + bound1.height) &&
    !(bound1.y > bound2.y + bound2.height)
  );
}
function isContainPoint(bound, point) {
  return (
    !(point.x < bound.x) &&
    !(point.x > bound.x + bound.width) &&
    !(point.y < bound.y) &&
    !(point.y > bound.y + bound.height)
  );
}
export function getUnionBoundingBox(bound1, bound2) {
  const x = Math.min(bound1.x, bound2.x);
  const y = Math.min(bound1.y, bound2.y);
  const width = Math.max(bound1.x + bound1.width, bound2.x + bound2.width) - x;
  const height =
    Math.max(bound1.y + bound1.height, bound2.y + bound2.height) - y;
  return {
    x,
    y,
    width,
    height,
  };
}
export function getUnionBoundingBoxFromAllBounds(bounds) {
  if (!Array.isArray(bounds)) {
    throw "Wrong arguements";
  }
  if (bounds.length === 0) {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
  }
  if (bounds.length === 1) {
    return bounds[0];
  }
  return bounds.reduce((pre, cur) => getUnionBoundingBox(pre, cur));
}
function inflate(bound, padding) {
  return {
    x: bound.x - padding,
    y: bound.y - padding,
    width: bound.width + padding * 2,
    height: bound.height + padding * 2,
  };
}
export function vector(bound, vector) {
  return {
    x: vector.x + bound.x,
    y: vector.y + bound.y,
    width: bound.width,
    height: bound.height,
  };
}
export function getBoundingBox(pointArr) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  pointArr.forEach((point) => {
    if (point.x < minX) {
      minX = point.x;
    }
    if (point.x > maxX) {
      maxX = point.x;
    }
    if (point.y < minY) {
      minY = point.y;
    }
    if (point.y > maxY) {
      maxY = point.y;
    }
  });
  return {
    x: minX,
    y: minY,
    height: maxY - minY,
    width: maxX - minX,
  };
}
export function rotate(bound, degree, cx = 0, cy = 0) {
  const p1 = {
    x: bound.x,
    y: bound.y,
  };
  const p2 = {
    x: bound.x + bound.width,
    y: bound.y,
  };
  const p3 = {
    x: bound.x + bound.width,
    y: bound.y + bound.height,
  };
  const p4 = {
    x: bound.x,
    y: bound.y + bound.height,
  };
  return getBoundingBox(
    [p1, p2, p3, p4].map((p) =>
      rotateAroundDeg(
        p,
        {
          x: cx,
          y: cy,
        },
        degree,
      ),
    ),
  );
}
//none is tested.
//mark the tested func `ok`
/***/
