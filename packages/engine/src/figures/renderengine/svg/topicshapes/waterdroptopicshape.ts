import { CircleTopicShape } from "./circletopicshape";
export class WaterdropTopicShape extends CircleTopicShape {
  calcTopicShapePath(bounds) {
    const r = Math.max(bounds.width, bounds.height) / 2;
    const circleCenter = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const start = {
      x: circleCenter.x,
      y: circleCenter.y - r,
    };
    const end = {
      x: circleCenter.x + r,
      y: circleCenter.y,
    };
    const outter = {
      x: circleCenter.x + r,
      y: circleCenter.y - r,
    };
    return `M ${start.x} ${start.y} A ${r} ${r}, 0, 1, 0, ${end.x} ${end.y} L ${outter.x} ${outter.y} Z`;
  }
}
