import { CONFIG, SUMMARYCONNECTION } from "../common/constants/index";
import config from "../common/config";

const padding = 20;
const SummaryLineStyle = {
  [SUMMARYCONNECTION.ANGLE]: function (summaryBranch, posArray) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    const d =
      "M " +
      startPos.x +
      " " +
      startPos.y +
      "  " +
      middlePos.x +
      " " +
      middlePos.y +
      "  " +
      endPos.x +
      " " +
      endPos.y;
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  [SUMMARYCONNECTION.CURLY]: function (summaryBranch, posArray, isHorizontal) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    const lw = summaryBranch.getConnectionView().getLineWidth();
    const d =
      routeCurlyLine(middlePos, startPos, lw) +
      routeCurlyLine(middlePos, endPos, lw);
    summaryBranch.getConnectionView().figure.setLinePath(d);
    function routeCurlyLine(sp, tp, w) {
      const H = 0.3;
      let path;
      if (!isHorizontal) {
        const sy1 = sp.y < tp.y ? sp.y - H : sp.y + H;
        const sy2 = sp.y < tp.y ? sp.y + H : sp.y - H;
        const ty1 = tp.y < sp.y ? tp.y + H : tp.y - H;
        const ty2 = tp.y < sp.y ? tp.y - H : tp.y + H;
        const cx = (sp.x + tp.x) / 2;
        const cy = (sp.y + tp.y) / 2;
        const cx1 = cx < tp.x ? cx + w / 2 : cx - w / 2;
        const cx2 = cx < tp.x ? cx - w / 2 : cx + w / 2;
        const scx1 = tp.x;
        const scx2 = scx1 < sp.x ? scx1 + w : scx1 - w;
        const tcx2 = sp.x;
        const tcx1 = tcx2 < tp.x ? tcx2 + w : tcx2 - w;
        path =
          "M " +
          sp.x +
          " " +
          sy1 +
          "Q " +
          scx1 +
          " " +
          sy1 +
          ", " +
          cx1 +
          " " +
          cy +
          "Q " +
          tcx1 +
          " " +
          ty1 +
          ", " +
          tp.x +
          " " +
          ty1 +
          "L " +
          tp.x +
          " " +
          ty2 +
          "Q " +
          tcx2 +
          " " +
          ty2 +
          ", " +
          cx2 +
          " " +
          cy +
          "Q " +
          scx2 +
          " " +
          sy2 +
          ", " +
          sp.x +
          " " +
          sy2 +
          "L " +
          sp.x +
          " " +
          sy1;
      } else {
        const sx1 = sp.x < tp.x ? sp.x - H : sp.x + H;
        const sx2 = sp.x < tp.x ? sp.x + H : sp.x - H;
        const tx1 = tp.x < sp.x ? tp.x + H : tp.x - H;
        const tx2 = tp.x < sp.x ? tp.x - H : tp.x + H;
        const cx = (sp.x + tp.x) / 2;
        const cy = (sp.y + tp.y) / 2;
        const cy1 = cy < tp.y ? cy + w / 2 : cy - w / 2;
        const cy2 = cy < tp.y ? cy - w / 2 : cy + w / 2;
        const scy1 = tp.y;
        const scy2 = scy1 < sp.y ? scy1 + w : scy1 - w;
        const tcy2 = sp.y;
        const tcy1 = tcy2 < tp.y ? tcy2 + w : tcy2 - w;
        path =
          "M " +
          sx1 +
          " " +
          sp.y +
          "Q " +
          sx1 +
          " " +
          scy1 +
          ", " +
          cx +
          " " +
          cy1 +
          "Q " +
          tx1 +
          " " +
          tcy1 +
          ", " +
          tx1 +
          " " +
          tp.y +
          "L " +
          tx2 +
          " " +
          tp.y +
          "Q " +
          tx2 +
          " " +
          tcy2 +
          ", " +
          cx +
          " " +
          cy2 +
          "Q " +
          sx2 +
          " " +
          scy2 +
          ", " +
          sx2 +
          " " +
          sp.y +
          "L " +
          sx1 +
          " " +
          sp.y;
      }
      return path;
    }
  },
  [SUMMARYCONNECTION.SQUARE]: function (summaryBranch, posArray, isHorizontal) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    const referenceX = summaryBranch.position.x >= 0 ? padding : -padding;
    let d =
      "M " +
      startPos.x +
      " " +
      startPos.y +
      "L " +
      (startPos.x + referenceX / 2) +
      " " +
      startPos.y +
      "L " +
      (startPos.x + referenceX / 2) +
      " " +
      middlePos.y +
      "L " +
      middlePos.x +
      " " +
      middlePos.y +
      "M " +
      (startPos.x + referenceX / 2) +
      " " +
      middlePos.y +
      "L " +
      (endPos.x + referenceX / 2) +
      " " +
      endPos.y +
      "L " +
      endPos.x +
      " " +
      endPos.y;
    if (isHorizontal) {
      const referenceY = summaryBranch.position.y >= 0 ? padding : -padding;
      d =
        "M " +
        startPos.x +
        " " +
        startPos.y +
        "L " +
        startPos.x +
        " " +
        (startPos.y + referenceY / 2) +
        "L " +
        middlePos.x +
        " " +
        (startPos.y + referenceY / 2) +
        "L " +
        middlePos.x +
        " " +
        middlePos.y +
        "M " +
        middlePos.x +
        " " +
        (startPos.y + referenceY / 2) +
        "L " +
        endPos.x +
        " " +
        (endPos.y + referenceY / 2) +
        "L " +
        endPos.x +
        " " +
        endPos.y;
    }
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  [SUMMARYCONNECTION.ROUND]: function (summaryBranch, posArray, isHorizontal) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    const referenceX = summaryBranch.position.x >= 0 ? padding : -padding;
    const clockDirectionX = summaryBranch.position.x >= 0 ? 1 : 0;
    let d =
      "M " +
      startPos.x +
      " " +
      startPos.y +
      "A " +
      (referenceX / 3) * 2 +
      " " +
      (endPos.y - startPos.y) / 2 +
      " 0 1 " +
      clockDirectionX +
      " " +
      endPos.x +
      " " +
      endPos.y +
      "M " +
      (startPos.x + (referenceX / 3) * 2) +
      " " +
      middlePos.y +
      "L " +
      middlePos.x +
      " " +
      middlePos.y;
    if (isHorizontal) {
      const clockDirectionY = summaryBranch.position.y >= 0 ? 0 : 1;
      const referenceY = summaryBranch.position.y >= 0 ? padding : -padding;
      d =
        "M " +
        startPos.x +
        " " +
        startPos.y +
        "A " +
        (endPos.x - startPos.x) / 2 +
        " " +
        (referenceY / 3) * 2 +
        "  0 1 " +
        clockDirectionY +
        " " +
        endPos.x +
        " " +
        endPos.y +
        "M " +
        middlePos.x +
        " " +
        (startPos.y + (referenceY / 3) * 2) +
        "L " +
        middlePos.x +
        " " +
        middlePos.y;
    }
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  [SUMMARYCONNECTION.BRACKET]: function (
    summaryBranch,
    posArray,
    isHorizontal,
  ) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    function createCurveVer(begin, end) {
      const hor = end.x > begin.x ? 1 : -1;
      const ver = end.y > begin.y ? 1 : -1;
      const cx = (begin.x + end.x) / 2;
      const dx = end.x - begin.x;
      const dy = end.y - begin.y;
      const corner = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 4);
      return `M ${begin.x} ${begin.y}L ${cx - hor * corner} ${begin.y}Q ${cx} ${
        begin.y
      } ${cx} ${begin.y + ver * corner} L ${cx} ${
        end.y - ver * corner
      }Q ${cx} ${end.y} ${cx + hor * corner} ${end.y}L ${end.x} ${end.y}`;
    }
    function createCurveHor(begin, end) {
      const hor = end.x > begin.x ? 1 : -1;
      const ver = end.y > begin.y ? 1 : -1;
      const cy = (begin.y + end.y) / 2;
      const dx = end.x - begin.x;
      const dy = end.y - begin.y;
      const corner = Math.min(Math.abs(dx) / 4, Math.abs(dy) / 2);
      return `M ${begin.x} ${begin.y}L ${begin.x} ${cy - ver * corner}Q ${
        begin.x
      } ${cy} ${begin.x + hor * corner} ${cy}L ${end.x - hor * corner} ${cy}Q ${
        end.x
      } ${cy} ${end.x} ${cy + ver * corner} L ${end.x} ${end.y}`;
    }
    const createCurve = isHorizontal ? createCurveHor : createCurveVer;
    const d = createCurve(middlePos, startPos) + createCurve(middlePos, endPos);
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  //暂时未实现
  [SUMMARYCONNECTION.SHARP]: function (summaryBranch, posArray, isHorizontal) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    let d = "";
    const lw = summaryBranch.getConnectionView().getLineWidth();
    d =
      routeCurlyLine(middlePos, startPos, lw) +
      routeCurlyLine(middlePos, endPos, lw);
    function routeCurlyLine(sp, tp, w) {
      const H = 0.3;
      let path;
      if (!isHorizontal) {
        const sy1 = sp.y < tp.y ? sp.y - H : sp.y + H;
        const sy2 = sp.y < tp.y ? sp.y + H : sp.y - H;
        const ty1 = tp.y < sp.y ? tp.y + H : tp.y - H;
        const ty2 = tp.y < sp.y ? tp.y - H : tp.y + H;
        const cx = (sp.x + tp.x) / 2;
        const cy = (sp.y + tp.y) / 2;
        const cx1 = cx < tp.x ? cx + w / 2 : cx - w / 2;
        const cx2 = cx < tp.x ? cx - w / 2 : cx + w / 2;
        const scx1 = tp.x;
        const scx2 = scx1 < sp.x ? scx1 + w : scx1 - w;
        const tcx2 = sp.x;
        const tcx1 = tcx2 < tp.x ? tcx2 + w : tcx2 - w;
        path =
          "M " +
          sp.x +
          " " +
          sy1 +
          "Q " +
          scx1 +
          " " +
          sy1 +
          ", " +
          cx1 +
          " " +
          cy +
          "Q " +
          tcx1 +
          " " +
          ty1 +
          ", " +
          tp.x +
          " " +
          ty1 +
          "L " +
          tp.x +
          " " +
          ty2 +
          "Q " +
          tcx2 +
          " " +
          ty2 +
          ", " +
          cx2 +
          " " +
          cy +
          "Q " +
          scx2 +
          " " +
          sy2 +
          ", " +
          sp.x +
          " " +
          sy2 +
          "L " +
          sp.x +
          " " +
          sy1;
      } else {
        const sx1 = sp.x < tp.x ? sp.x - H : sp.x + H;
        const sx2 = sp.x < tp.x ? sp.x + H : sp.x - H;
        const tx1 = tp.x < sp.x ? tp.x + H : tp.x - H;
        const tx2 = tp.x < sp.x ? tp.x - H : tp.x + H;
        const cx = (sp.x + tp.x) / 2;
        const cy = (sp.y + tp.y) / 2;
        const cy1 = cy < tp.y ? cy + w / 2 : cy - w / 2;
        const cy2 = cy < tp.y ? cy - w / 2 : cy + w / 2;
        const scy1 = tp.y;
        const scy2 = scy1 < sp.y ? scy1 + w : scy1 - w;
        const tcy2 = sp.y;
        const tcy1 = tcy2 < tp.y ? tcy2 + w : tcy2 - w;
        path =
          "M " +
          sx1 +
          " " +
          sp.y +
          "Q " +
          sx1 +
          " " +
          scy1 +
          ", " +
          cx +
          " " +
          cy1 +
          "Q " +
          tx1 +
          " " +
          tcy1 +
          ", " +
          tx1 +
          " " +
          tp.y +
          "L " +
          tx2 +
          " " +
          tp.y +
          "Q " +
          tx2 +
          " " +
          tcy2 +
          ", " +
          cx +
          " " +
          cy2 +
          "Q " +
          sx2 +
          " " +
          scy2 +
          ", " +
          sx2 +
          " " +
          sp.y +
          "L " +
          sx1 +
          " " +
          sp.y;
      }
      return path;
    }
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  [SUMMARYCONNECTION.FOLD]: function (summaryBranch, posArray, isHorizontal) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    function createCurveVer(begin, end, reverse) {
      const ver = end.y > begin.y ? 1 : -1;
      const dx = end.x - begin.x;
      const dy = end.y - begin.y;
      const cx = dx / 1.8 + begin.x;
      const corner = Math.min(Math.abs(dx) / 2, Math.abs(dy) / 4);
      const ret = [
        `L ${begin.x} ${begin.y}`,
        `L ${cx} ${begin.y + (ver * corner) / 1.5}`,
        `L ${cx} ${end.y - (ver * corner) / 2}`,
        `${reverse ? "M" : "L"} ${end.x} ${end.y}`,
      ];
      if (reverse) {
        return ret.reverse();
      } else {
        return ret;
      }
    }
    function createCurveHor(begin, end, reverse) {
      const hor = end.x > begin.x ? 1 : -1;
      const dx = end.x - begin.x;
      const dy = end.y - begin.y;
      const cy = dy / 1.8 + begin.y;
      const corner = Math.min(Math.abs(dx) / 4, Math.abs(dy) / 2);
      const ret = [
        `L ${begin.x} ${begin.y}`,
        `L ${begin.x + (hor * corner) / 1.5} ${cy}`,
        `L ${end.x - (hor * corner) / 2} ${cy}`,
        `${reverse ? "M" : "L"} ${end.x} ${end.y}`,
      ];
      if (reverse) {
        return ret.reverse();
      } else {
        return ret;
      }
    }
    const createCurve = isHorizontal ? createCurveHor : createCurveVer;
    const d = createCurve(middlePos, startPos, true)
      .concat(createCurve(middlePos, endPos, false))
      .join("");
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
  [SUMMARYCONNECTION.STRAIGHT]: function (
    summaryBranch,
    posArray,
    isHorizontal,
  ) {
    const startPos = posArray.startPos;
    const middlePos = posArray.middlePos;
    const endPos = posArray.endPos;
    const referenceX = summaryBranch.position.x >= 0 ? padding : -padding;
    let d = `M ${startPos.x + referenceX / 2} ${startPos.y}
            L ${startPos.x + referenceX / 2} ${endPos.y}
            M ${startPos.x + referenceX / 2} ${middlePos.y}
            L ${middlePos.x} ${middlePos.y}
            `;
    if (isHorizontal) {
      const referenceY = summaryBranch.position.y >= 0 ? padding : -padding;
      d = `M ${startPos.x} ${startPos.y + referenceY / 2}
          L ${endPos.x} ${startPos.y + referenceY / 2}
          M ${middlePos.x} ${endPos.y + referenceY / 2}
          L ${middlePos.x} ${middlePos.y}
          `;
    }
    summaryBranch.getConnectionView().figure.setLinePath(d);
  },
};
/* harmony default export */
export const getSummaryLineStyle = (key) => {
  if (!SummaryLineStyle[key]) {
    config.get(CONFIG.LOGGER).warn(`Unsupported summary line style: ${key}`);
    return SummaryLineStyle[SUMMARYCONNECTION.ROUND];
  }
  return SummaryLineStyle[key];
};
