import { layoutConstant } from "../../../../utils/layoutconstant";
import * as commonUtils from "../../../../common/utils/index";
/**
 * brushes.js
 * functions in this file only return string.
 *
 * My test (https://jsperf.com/simple-test-string-concate-vs-array-join/1) shows that string-array-join is faster.
 * While in this https://jsperf.com/string-concatenation/47.
 * string-array-join is very very slow.
 * Note:
 * elbow中直线动画效果不好
 */
const { STACKGAP, NEWCLOUDCORNERLEN } = layoutConstant;
const POINT = (x, y) => ({
  x,
  y,
});
export function rect(bound: any) {
  return (
    "M " +
    bound.x +
    " " +
    bound.y +
    "L " +
    (bound.x + bound.width) +
    " " +
    bound.y +
    "L " +
    (bound.x + bound.width) +
    " " +
    (bound.y + bound.height) +
    "L " +
    bound.x +
    " " +
    (bound.y + bound.height) +
    "z"
  );
} //左右两边突出的三角形区域长度为1/9
//bound在原有内容区域上增加了两个1/7
export function hexagon(bound) {
  const x0 = bound.x;
  const x1 = bound.width / 9 + bound.x;
  const x2 = (bound.width * 8) / 9 + bound.x;
  const x3 = bound.width + bound.x;
  const y0 = bound.y;
  const y1 = bound.y + bound.height / 2;
  const y2 = bound.y + bound.height;
  return `M ${x0} ${y1}L ${x1} ${y0}L ${x2} ${y0}L ${x3} ${y1}L ${x2} ${y2}L ${x1} ${y2}Z`;
}
export function peakrect(bound) {
  const x0 = bound.x;
  const x1 = bound.x + bound.width / 2;
  const x2 = bound.x + bound.width;
  const peak = Math.min(bound.height / 6, bound.width * 0.2);
  const y0 = bound.y + peak;
  const y1 = bound.y + bound.height - peak;
  const corner = 4;
  // peak = Math.min(peak, bound.width/16);
  const p0 = POINT(x0, y0); //左上角
  const p1 = POINT(x2, y0); //右上角
  const p2 = POINT(x2, y1); //右下角
  const p3 = POINT(x0, y1); //左下角
  const pu = POINT(x1, y0 - peak); //peak up
  const pd = POINT(x1, y1 + peak); //peak down
  //left top corner's before and after flex pos.
  const lt = Object(commonUtils.flexCorner)(p3, p0, pu, corner);
  //right top
  const rt = Object(commonUtils.flexCorner)(pu, p1, p2, corner);
  //right bottom
  const rb = Object(commonUtils.flexCorner)(p1, p2, pd, corner);
  //left bottom
  const lb = Object(commonUtils.flexCorner)(pd, p3, p0, corner);
  const up = Object(commonUtils.flexCorner)(p0, pu, p1, corner);
  const down = Object(commonUtils.flexCorner)(p2, pd, p3, corner);
  return `M ${lt[0].x} ${lt[0].y}Q ${x0} ${y0} ${lt[1].x} ${lt[1].y}L ${up[0].x} ${up[0].y}Q ${pu.x} ${pu.y} ${up[1].x} ${up[1].y}L ${rt[0].x} ${rt[0].y}Q ${x2} ${y0} ${rt[1].x} ${rt[1].y}L ${rb[0].x} ${rb[0].y}Q ${x2} ${y1} ${rb[1].x} ${rb[1].y}L ${down[0].x} ${down[0].y}Q ${pd.x} ${pd.y} ${down[1].x} ${down[1].y}L ${lb[0].x} ${lb[0].y}Q ${x0} ${y1} ${lb[1].x} ${lb[1].y}Z`;
}
export function convexrect(bound) {
  const x0 = bound.x;
  const x1 = bound.x + bound.width / 2;
  const x2 = bound.x + bound.width;
  const peak = Math.min(bound.height / 3, bound.width * 0.2);
  const y0 = bound.y + peak / 2;
  const y1 = bound.y + bound.height - peak / 2;
  const corner = 5;
  // peak = Math.min(peak, bound.width/16);
  const p0 = POINT(x0, y0); //左上角
  const p1 = POINT(x2, y0); //右上角
  const p2 = POINT(x2, y1); //右下角
  const p3 = POINT(x0, y1); //左下角
  const pu = POINT(x1, y0 - peak); //peak up
  const pd = POINT(x1, y1 + peak); //peak down
  //left top corner's before and after flex pos.
  const lt = Object(commonUtils.flexCorner)(p3, p0, pu, corner);
  //right top
  const rt = Object(commonUtils.flexCorner)(pu, p1, p2, corner);
  //right bottom
  const rb = Object(commonUtils.flexCorner)(p1, p2, pd, corner);
  //left bottom
  const lb = Object(commonUtils.flexCorner)(pd, p3, p0, corner);
  return `M ${lt[0].x} ${lt[0].y}Q ${x0} ${y0} ${lt[1].x} ${lt[1].y}Q ${x1} ${y0 - peak} ${rt[0].x} ${rt[0].y}Q ${x2} ${y0} ${rt[1].x} ${rt[1].y}L ${rb[0].x} ${rb[0].y}Q ${x2} ${y1} ${rb[1].x} ${rb[1].y}Q ${x1} ${y1 + peak} ${lb[0].x} ${lb[0].y}Q ${x0} ${y1} ${lb[1].x} ${lb[1].y}Z`;
}
export function singleBreakAngle(bound, withLine) {
  const length = Math.min(20, Math.min(bound.height / 5, bound.width / 5));
  let path = `
    M ${bound.x} ${bound.y}
    L ${bound.x + bound.width - length} ${bound.y}
    L ${bound.x + bound.width} ${bound.y + length}
    L ${bound.x + bound.width} ${bound.y + bound.height}
    L ${bound.x} ${bound.y + bound.height}
    z
  `;
  if (withLine) {
    path += `
      M ${bound.x + bound.width - length} ${bound.y}
      L ${bound.x + bound.width - length} ${bound.y + length}
      L ${bound.x + bound.width} ${bound.y + length}
    `;
  }
  return path;
}
export function singleBreakAngleWithLine(bound) {
  return singleBreakAngle(bound, true);
}
export function doubleRoundedAngle(bound) {
  const corner = 15;
  return `
    M ${bound.x + corner} ${bound.y}
    L ${bound.x + bound.width} ${bound.y}
    L ${bound.x + bound.width} ${bound.y + bound.height - corner}
    Q ${bound.x + bound.width} ${bound.y + bound.height} ${bound.x + bound.width - corner} ${bound.y + bound.height}
    L ${bound.x} ${bound.y + bound.height}
    L ${bound.x} ${bound.y + corner}
    Q ${bound.x} ${bound.y} ${bound.x + corner} ${bound.y}
  `;
}
export function doubleUnderline(bound) {
  const padding = 5;
  return `
    M ${bound.x} ${bound.y + bound.height - padding}
    L ${bound.x + bound.width} ${bound.y + bound.height - padding}
    M ${bound.x} ${bound.y + bound.height}
    L ${bound.x + bound.width} ${bound.y + bound.height}
  `;
}
export function leaf(bound) {
  const height = bound.height / 2;
  return `
    M ${bound.x} ${bound.y + bound.height / 2}
    Q ${bound.x + bound.width / 2} ${bound.y - height} ${bound.x + bound.width} ${bound.y + bound.height / 2}
    Q ${bound.x + bound.width / 2} ${bound.y + bound.height + height} ${bound.x} ${bound.y + bound.height / 2}
    z
  `;
}
export function stack(bound) {
  const gap = STACKGAP;
  return `
    M ${bound.x} ${bound.y}
    L ${bound.x + bound.width - gap} ${bound.y}
    L ${bound.x + bound.width - gap} ${bound.y + bound.height - gap}
    L ${bound.x} ${bound.y + bound.height - gap}
    z
    M ${bound.x + bound.width - gap} ${bound.y + gap}
    L ${bound.x + bound.width} ${bound.y + gap}
    L ${bound.x + bound.width} ${bound.y + bound.height}
    L ${bound.x + gap} ${bound.y + bound.height}
    L ${bound.x + gap} ${bound.y + bound.height - gap}
  `;
} /// Boring: 画云还是很复杂的, 参数比较难调整, 不知道有没有更好的方法.
export function newCloud(bound) {
  let cornerLen = NEWCLOUDCORNERLEN; // 四个拐角预留的长度
  const length = 40; // 每个波浪的长度
  const minX = bound.x;
  const minY = bound.y;
  if (bound.width - cornerLen * 2 < length) {
    cornerLen = NEWCLOUDCORNERLEN / 1.34;
  }
  // offset1 和 offset2 用与画拐角连接处时计算起始点
  const offset1 = cornerLen / 5;
  const offset2 = (cornerLen / 5) * 4;
  const controlDistance = cornerLen / 2; // 用于画拐角的控制点
  const width = bound.width - cornerLen * 2; // 实际能画的宽度
  const height = bound.height - cornerLen * 2; // 实际能画的高度
  const horizontalNumber = Math.max(1, parseInt(`${width / length}`));
  const verticalNumber = Math.max(1, parseInt(`${height / length}`));
  const hstep = width / horizontalNumber;
  const vstep = height / verticalNumber;
  let startPosX = minX + cornerLen;
  let startPosY = minY + offset1;
  let endPosX = minX + cornerLen + hstep;
  let endPosY = minY + offset1;
  const horizontalRealNumber = width / hstep;
  const verticalRealNumber = height / vstep;
  let d = "M " + startPosX + " " + startPosY;
  let count = 0;
  /// for循环中的d中的(cornerLen / 4)是控制波浪的抖度的.
  /// 虽然几个线条可以抽个函数, 但是意义不大, 较难维护.
  //画上部
  const waveHeight = cornerLen / 3;
  for (count = 0; count < horizontalRealNumber; count++) {
    d += `
      C ${startPosX + (endPosX - startPosX) * 0.25} ${endPosY - waveHeight}
      ${startPosX + (endPosX - startPosX) * 0.75} ${endPosY - waveHeight}
      ${endPosX} ${endPosY}
    `;
    startPosX = endPosX;
    endPosX = startPosX + hstep;
  }
  // 画右上角
  d += `
    C ${startPosX + controlDistance} ${bound.y}
    ${bound.x + bound.width} ${startPosY + offset2 - controlDistance}
    ${startPosX + offset2} ${startPosY + offset2}
  `;
  //画右部
  startPosX += offset2;
  startPosY += offset2;
  endPosX = startPosX;
  endPosY = startPosY + vstep;
  for (count = 0; count < verticalRealNumber; count++) {
    d += `
      C ${startPosX + waveHeight} ${startPosY + (endPosY - startPosY) * 0.25}
      ${startPosX + waveHeight} ${startPosY + (endPosY - startPosY) * 0.75}
      ${startPosX} ${endPosY}
    `;
    startPosY = endPosY;
    endPosY = startPosY + vstep;
  }
  // 画右下角
  d += `
    C ${bound.x + bound.width} ${startPosY + controlDistance}
    ${startPosX - offset2 + controlDistance} ${bound.y + bound.height}
    ${startPosX - offset2} ${startPosY + offset2}
  `;
  //画下部
  startPosX -= offset2;
  startPosY += offset2;
  endPosX = startPosX - hstep;
  endPosY = startPosY;
  for (count = 0; count < horizontalRealNumber; count++) {
    d += `
      C ${startPosX - Math.abs(endPosX - startPosX) * 0.25} ${endPosY + waveHeight}
      ${startPosX - Math.abs(endPosX - startPosX) * 0.75} ${endPosY + waveHeight}
      ${endPosX} ${endPosY}
    `;
    startPosX = endPosX;
    endPosX = startPosX - hstep;
  }
  // 画左下角
  d += `
    C ${startPosX - controlDistance} ${bound.y + bound.height}
    ${bound.x} ${startPosY - offset2 + controlDistance}
    ${startPosX - offset2} ${startPosY - offset2}
  `;
  //画左部
  startPosX -= offset2;
  startPosY -= offset2;
  endPosX = startPosX;
  endPosY = startPosY - vstep;
  for (count = 0; count < verticalRealNumber; count++) {
    d += `
      C ${startPosX - waveHeight} ${startPosY - Math.abs(endPosY - startPosY) * 0.25}
      ${startPosX - waveHeight} ${startPosY - Math.abs(endPosY - startPosY) * 0.75}
      ${startPosX} ${endPosY}
    `;
    startPosY = endPosY;
    endPosY = startPosY - vstep;
  }
  // 画左上角
  d += `
    C ${bound.x} ${startPosY - controlDistance}
    ${startPosX + offset2 - controlDistance} ${bound.y}
    ${startPosX + offset2} ${startPosY - offset2}
  `;
  d += "Z";
  return d;
}
