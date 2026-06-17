import { svgPathProperties } from "svg-path-properties";
import { toPoints } from "svg-points";
import { boundingBox, Shape } from "points";

export function getTotalLength(path) {
  return new svgPathProperties(path).getTotalLength();
}
export function getPointAtLength(path, at) {
  return new svgPathProperties(path).getPointAtLength(at);
}
export function getPropertiesAtLength(path, at) {
  return new svgPathProperties(path).getPropertiesAtLength(at);
}
export function getSSP(path) {
  return new svgPathProperties(path);
}
export function getPathSize(path) {
  const points = toPoints({
    type: "path",
    d: path,
  });
  const { top, right, bottom, left } = boundingBox(
    points as unknown as Shape[],
  );
  return {
    width: Math.abs(right - left),
    height: Math.abs(top - bottom),
  };
}
export function getBoundsPath(bounds) {
  const { x, y, width, height } = bounds;
  return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
}

export default {
  getBoundsPath,
  getPathSize,
  getSSP,
  getPropertiesAtLength,
  getPointAtLength,
  getTotalLength,
};
