import { DIRECTION } from "../common/constants/index";
export function equalsBounds(bound1, bound2) {
  return (
    bound1.x === bound2.x &&
    bound1.y === bound2.y &&
    bound1.width === bound2.width &&
    bound1.height === bound2.height
  );
}
export function intersectBounds(bound1, bound2) {
  return (
    //相离判断
    !(bound2.x > bound1.x + bound1.width) &&
    !(bound1.x > bound2.x + bound2.width) &&
    !(bound2.y > bound1.y + bound1.height) &&
    !(bound1.y > bound2.y + bound2.height)
  );
}
export function boundsContainPoint(bound, point) {
  return (
    !(point.x < bound.x) &&
    !(point.x > bound.x + bound.width) &&
    !(point.y < bound.y) &&
    !(point.y > bound.y + bound.height)
  );
}
export function mergeBounds(bound1, bound2) {
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
export function pointsToBounds(pointArr) {
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
export function inflateBounds(bound, padding) {
  return {
    x: bound.x - padding,
    y: bound.y - padding,
    width: bound.width + padding * 2,
    height: bound.height + padding * 2,
  };
} //
// Position
//
export function relativePositionFor(p, basePosition) {
  return {
    x: p.x - basePosition.x,
    y: p.y - basePosition.y,
  };
}
export function getReverseDir(direction) {
  const reverse = {
    [DIRECTION.UP]: DIRECTION.DOWN,
    [DIRECTION.DOWN]: DIRECTION.UP,
    [DIRECTION.LEFT]: DIRECTION.RIGHT,
    [DIRECTION.RIGHT]: DIRECTION.LEFT,
    [DIRECTION.NONE]: DIRECTION.NONE,
  };
  return reverse[direction] || null;
}
