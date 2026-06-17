import { BRANCHCONNECTION, STRUCTURECLASS } from "../../common/constants/index";

import * as commonUtils from "../../common/utils/index";

import BranchView from "../../view/branchview";

import * as lib from "../../lib/index";

import * as brushes from "../brushes";

import * as figuresRenderEngineSvgTopicShapesUtils from "../../figures/renderengine/svg/topicshapes/utils";

function _setConnectionAttr(branchView, attr) {
  const connectionFigure = branchView.getConnectionView().figure;
  connectionFigure.setLinePath(attr.d);
}
const DEFAULT_CORNER = 8;
const LINE_PATH_MAP = {
  [BRANCHCONNECTION.ROUNDEDELBOW]: [
    (l) => brushes.roundedElbowHorizon(l, DEFAULT_CORNER),
    (l) => brushes.roundedElbowVertical(l, DEFAULT_CORNER),
  ],
  [BRANCHCONNECTION.ELBOW]: [brushes.elbowHorizon, brushes.elbowVertical],
  [BRANCHCONNECTION.STRAIGHT]: [brushes.straightLine, brushes.straightLine],
  [BRANCHCONNECTION.CURVE]: [brushes.curveHorizon, brushes.rect],
  [BRANCHCONNECTION.BIGHT]: [brushes.sinusHorizon, brushes.sinusVertical],
  [BRANCHCONNECTION.FOLD]: [
    brushes.skewElbowHorizon,
    brushes.skewElbowVertical,
  ],
  [BRANCHCONNECTION.ROUNDEDFOLD]: [brushes.hornHorizon, brushes.hornVertical],
  [BRANCHCONNECTION.BRACE]: [
    (l) => brushes.braceVertical(l.ctrlPt, l.endPt),
    (l) => brushes.braceVertical(l.ctrlPt, l.endPt),
  ],
};
export const getLinePathBrushes = (lineStyle) =>
  LINE_PATH_MAP[lineStyle] || LINE_PATH_MAP[BRANCHCONNECTION.ROUNDEDELBOW];
export function setConnectionSpecialPoint(branchView, startPoint, endPoint) {
  if (!branchView) {
    return;
  }
  const connectionFigure = branchView.getConnectionView().figure;
  connectionFigure.setStartPoint(startPoint);
  connectionFigure.setEndPoint(endPoint);
}
/** @deprecated */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getArrowMarker(svgView, connection, size) {
  const width = size;
  const height = size;
  if (!connection.arrowMarker) {
    const svg = svgView.svg;
    const arrowMarker = svg.marker(width, height).ref(0, 4).attr({
      viewBox: "0 0 8 8",
      markerUnits: "userSpaceOnUse",
    });
    const markerPath = new lib.SVG.Path();
    const markerD = "M 0 0 L 8 4 L 0 8 Z";
    markerPath.attr({
      d: markerD,
    });
    arrowMarker.add(markerPath);
    connection.arrowMarker = arrowMarker;
    connection.arrowSize = width;
  } else if (width !== connection.arrowSize) {
    connection.arrowSize = width;
    connection.arrowMarker.attr({
      markerWidth: width,
      markerHeight: height,
    });
  }
  return connection.arrowMarker;
}
function horizon(brush, linePoints, childBranch, ...options) {
  const { startPt, ctrlPt, endPt } = linePoints;
  if (startPt.x === ctrlPt.x) {
    return brush(linePoints, ...options);
  }
  const parentBranch = childBranch.parent();
  let brotherList = [];
  if (parentBranch instanceof BranchView) {
    const childBranchStartDirection = Object(
      figuresRenderEngineSvgTopicShapesUtils.getStartDirection,
    )(parentBranch, childBranch);
    brotherList = parentBranch
      .getChildrenBranchesByType()
      .filter(
        (branch) =>
          Object(figuresRenderEngineSvgTopicShapesUtils.getStartDirection)(
            parentBranch,
            branch,
          ) === childBranchStartDirection,
      );
  }
  const originChildBranch = childBranch.originBranchView || childBranch;
  const isLastChild =
    brotherList.indexOf(originChildBranch) === brotherList.length - 1;
  if (!isLastChild) {
    linePoints = {
      startPt: ctrlPt,
      ctrlPt,
      endPt,
    };
  }
  return brush(linePoints, ...options);
}
export function setConnectionAttr(
  brush,
  childBranch,
  linePositions,
  tapered,
  special,
  params = [],
) {
  let _a;
  const {
    horizonBrush,
    verticalBrush,
    taperedHorizonBrush,
    taperedVerticalBrush,
  } = brush;
  let d;
  const lineWidth = commonUtils.toNumber(
    parseInt,
    (_a = childBranch.parent()) === null || _a === undefined
      ? undefined
      : _a.figure.lineWidth,
    1,
  );
  if (!special) {
    if (tapered && taperedHorizonBrush) {
      d = taperedHorizonBrush(linePositions, lineWidth, ...params);
    } else if (horizonBrush) {
      d = horizon(horizonBrush, linePositions, childBranch, ...params);
    }
  } else if (tapered && taperedVerticalBrush) {
    d = taperedVerticalBrush(linePositions, lineWidth, ...params);
  } else if (verticalBrush) {
    d = verticalBrush(linePositions, ...params);
  }
  _setConnectionAttr(childBranch, {
    d,
    tapered,
  });
}
export function lineStyleTemplate(brush) {
  return (childBranch, linePositions, tapered, special) => {
    setConnectionAttr(brush, childBranch, linePositions, tapered, special);
    setConnectionSpecialPoint(
      childBranch,
      linePositions.ctrlPt,
      linePositions.endPt,
    );
  };
}
export function lineStyleTemplateWithStructureConfig(
  brushCfg,
  getAdditionalParams,
) {
  return (child, linePositions, tapered, special) => {
    setConnectionSpecialPoint(
      child,
      linePositions.startPt,
      linePositions.endPt,
    );
    const brush = [...brushCfg];
    const defaultBrushIndex = brush.findIndex((item) => item.isDefault);
    let defaultBrush = null;
    if (defaultBrushIndex >= 0) {
      defaultBrush = brush[defaultBrushIndex];
      brush.splice(defaultBrushIndex, 1);
    }
    const parent = child.parent();
    const structureClass =
      parent instanceof BranchView ? parent.structureClass : null;
    let currentBrush = null;
    if (structureClass && child) {
      for (let i = 0; i < brush.length; i++) {
        const cfg = brush[i];
        if (cfg.test(structureClass, child, child.parent())) {
          currentBrush = cfg;
          break;
        }
      }
    }
    let params = [];
    if (typeof getAdditionalParams === "function") {
      params = getAdditionalParams(child, child.parent());
    }
    if (!currentBrush) {
      if (!defaultBrush) {
        return;
      }
      currentBrush = defaultBrush;
    }
    setConnectionAttr(
      currentBrush.brush,
      child,
      linePositions,
      tapered,
      special,
      params,
    );
  };
}
export function fixBightTaperedPoint(lineStyleGenerator) {
  return (child, linePositions, tapered, special) => {
    const parent = child.parent();
    const parentStructure =
      parent instanceof BranchView ? parent.getStructureClass() : null;
    const isParentStructureMapLike =
      parentStructure === null || parentStructure === undefined
        ? undefined
        : parentStructure.includes("map");
    const isParentStructureLogicLeft =
      parentStructure === STRUCTURECLASS.LOGICLEFT;
    if (!isParentStructureMapLike || !tapered || !isParentStructureLogicLeft) {
      return lineStyleGenerator(child, linePositions, tapered, special);
    }
    const fixedCtrlPt = Object.assign({}, linePositions.ctrlPt);
    // 将line向parent内部缩进的距离，避免出现垂直断口
    const fixDistance = Math.abs(fixedCtrlPt.y) || 2;
    if (fixedCtrlPt.x > 0) {
      fixedCtrlPt.x -= fixDistance;
    } else {
      fixedCtrlPt.x += fixDistance;
    }
    linePositions.ctrlPt = fixedCtrlPt;
    return lineStyleGenerator(child, linePositions, tapered, special);
  };
}
export function braceLineStyleTemplate(brush, forceTapered) {
  let {
    // eslint-disable-next-line prefer-const
    verticalBrush,
    // eslint-disable-next-line prefer-const
    fullVerticalBrush,
    taperedVerticalBrush,
    // eslint-disable-next-line prefer-const
    fullTaperedVerticalBrush,
  } = brush;
  return (childBranch, linePositions, tapered) => {
    const parent = childBranch.parent();
    const brotherList =
      parent instanceof BranchView ? parent.getChildrenBranchesByType() : [];
    const originChild = childBranch.originBranchView || childBranch;
    const isFirstChild = brotherList.indexOf(originChild) === 0;
    const isLastChild =
      brotherList.indexOf(originChild) === brotherList.length - 1;
    if (!isFirstChild && !isLastChild) {
      childBranch.getConnectionView().figure.setLinePath("");
      return;
    }
    const lineWidth =
      parent instanceof BranchView ? parent.figure.lineWidth : 1;
    let taperedLineWidth = lineWidth;
    if (forceTapered) {
      taperedVerticalBrush = verticalBrush;
      taperedLineWidth = lineWidth * 1.5;
    }
    const { ctrlPt: control, endPt: end } = linePositions;
    let d = "";
    if (isFirstChild && isLastChild) {
      const childTopicViewHeight = childBranch.topicView.bounds.height;
      const newEnd1Pt = {
        x: end.x,
        y: end.y - childTopicViewHeight / 2,
      };
      const newEnd2Pt = {
        x: end.x,
        y: end.y + childTopicViewHeight / 2,
      };
      if (tapered) {
        if (fullTaperedVerticalBrush) {
          d = fullTaperedVerticalBrush(
            control,
            newEnd1Pt,
            newEnd2Pt,
            taperedLineWidth,
            childBranch,
          );
        } else if (taperedVerticalBrush) {
          d =
            taperedVerticalBrush(
              control,
              newEnd1Pt,
              taperedLineWidth,
              childBranch,
            ) +
            taperedVerticalBrush(
              control,
              newEnd2Pt,
              taperedLineWidth,
              childBranch,
            );
        }
      } else if (fullVerticalBrush) {
        d = fullVerticalBrush(
          control,
          newEnd1Pt,
          newEnd2Pt,
          lineWidth,
          childBranch,
        );
      } else {
        d =
          verticalBrush(control, newEnd1Pt, lineWidth, childBranch) +
          verticalBrush(control, newEnd2Pt, lineWidth, childBranch);
      }
    } else if (tapered) {
      if (taperedVerticalBrush) {
        d = taperedVerticalBrush(
          control,
          Object.assign({}, end),
          taperedLineWidth,
          childBranch,
        );
      }
    } else {
      d = verticalBrush(
        control,
        Object.assign({}, end),
        lineWidth,
        childBranch,
      );
    }
    _setConnectionAttr(childBranch, {
      d,
      tapered: tapered || !!forceTapered,
    });
  };
}
