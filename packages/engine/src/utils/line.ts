import {
  LINE_PATTERN,
  ARROW_CLASS,
  DIRECTION,
} from "../common/constants/index";
import * as utils from "./index";
import { patternManager } from "./patternmanager/index";

export function getLinePattenAttr(linePattern, lineWidth) {
  let linecap = "";
  let dasharray = "";
  lineWidth = parseInt(`${lineWidth}`);
  switch (linePattern) {
    case LINE_PATTERN.DASH:
    case LINE_PATTERN.HANDDRAWNDASH:
      dasharray = "9 3";
      break;
    case LINE_PATTERN.DOT:
      dasharray = "3 3";
      break;
    case LINE_PATTERN.DASHDOT:
      dasharray = "9 3 3 3";
      break;
    case LINE_PATTERN.DASHDOTDOT:
      dasharray = "9 3 3 3 3 3";
      break;
    case LINE_PATTERN.ROUNDDOT:
      dasharray = `0 ${lineWidth * 2} 0 ${lineWidth * 2}`;
      linecap = "round";
      break;
  }
  return {
    "stroke-linecap": linecap,
    "stroke-dasharray": dasharray,
  };
}
export function getComplexLinePatternAttr(linePattern, options) {
  const isHandDrawn = [
    LINE_PATTERN.HANDDRAWNDASH,
    LINE_PATTERN.HANDDRAWNSOLID,
  ].includes(linePattern);
  const linePattenAttr = getLinePattenAttr(linePattern, options.lineWidth);
  let strokeLinecap = linePattenAttr["stroke-linecap"];
  const storeDasharray = linePattenAttr["stroke-dasharray"];
  let d = options.linePath;
  let fill = undefined;
  let stroke = undefined;
  let strokeWidth = undefined;
  if (isHandDrawn) {
    if (options.isBorderLinePatten && options.figure) {
      d = patternManager.renderBorderLinePatternForTopic(
        linePattern,
        options.linePath,
        options.figure,
      );
      if (isHandDrawn) {
        strokeLinecap = "round";
      }
      if (Object(utils.isDashLinePattern)(linePattern)) {
        strokeLinecap = "butt";
      }
    } else if (options.isTaperedLine) {
      if (options.isFishboneHeadbone) {
        d = patternManager.renderHandDrawnTaperedLineForFishBone(
          options.linePath,
          options.lineWidth,
        );
      } else if (
        options.isFishboneMainbone &&
        options.startBranchPosition &&
        options.endBranchPosition
      ) {
        d = patternManager.renderHandDrawnTaperedLineForFishBoneMainLine(
          options.linePath,
          options.startBranchPosition,
          options.endBranchPosition,
          options.lineWidth,
        );
      } else if (options.startBranchPosition && options.endBranchPosition) {
        d = patternManager.renderHandDrawnTaperedLine(
          options.linePath,
          options.startBranchPosition,
          options.endBranchPosition,
          options.lineWidth,
        );
      }
    } else if (
      options.isTopicConnection &&
      options.structureClass &&
      options.figure
    ) {
      d = patternManager.renderLinePatternForConnection(
        linePattern,
        options.linePath,
        options.structureClass,
        options.figure,
      );
      strokeLinecap = Object(utils.isDashLinePattern)(linePattern)
        ? "butt"
        : "round";
    } else if (options.isFishboneHeadbone) {
      d = options.linePath;
    } else if (options.isFishboneMainbone) {
      d = patternManager.renderFillPattrenWithHandDrawnSolid(options.linePath);
    } else {
      d = patternManager.renderLinePatternForOthers(
        linePattern,
        options.linePath,
        options.isBoundary,
      );
    }
    if (options.lineColor) {
      if (options.isFishboneMainbone && !options.isTaperedLine) {
        fill = options.lineColor;
        stroke = "none";
        strokeWidth = 0;
      } else {
        fill = "none";
        stroke = options.lineColor;
        strokeWidth = options.lineWidth;
      }
    }
  } else if (options.lineColor) {
    if (options.isTaperedLine || options.isFishboneMainbone) {
      fill = options.lineColor;
      stroke = "none";
      strokeWidth = 0;
    } else {
      fill = "none";
      stroke = options.lineColor;
      strokeWidth = options.lineWidth;
    }
  }
  const result: any = {
    "stroke-linecap": strokeLinecap,
    "stroke-dasharray": storeDasharray,
    d: d,
  };
  if (typeof fill !== "undefined") {
    result.fill = fill;
  }
  if (typeof stroke !== "undefined") {
    result.stroke = stroke;
  }
  if (typeof strokeWidth !== "undefined") {
    result["stroke-width"] = strokeWidth;
  }
  return result;
}
export function getFillPatternAttr(fillPattern, options) {
  const isHandDrawn = Object(utils.isHandDrawnFillPattern)(fillPattern);
  let d = options.fillPath;
  if (isHandDrawn) {
    if (options.isForceHandDrawnSolid) {
      d = patternManager.renderFillPattrenWithHandDrawnSolid(
        options.fillPath,
        options.isBoundaryTitle,
      );
    } else {
      d = patternManager.renderFillPattrenForTopic(
        fillPattern,
        options.fillPath,
      );
    }
  }
  return {
    d,
  };
}
export function getUnDashableLinePattern(originalLinePattern) {
  switch (originalLinePattern) {
    case LINE_PATTERN.DASH:
    case LINE_PATTERN.DASHDOT:
    case LINE_PATTERN.DASHDOTDOT:
    case LINE_PATTERN.DOT:
    case LINE_PATTERN.ROUNDDOT:
    case LINE_PATTERN.SOLID:
      return LINE_PATTERN.SOLID;
    case LINE_PATTERN.HANDDRAWNDASH:
    case LINE_PATTERN.HANDDRAWNSOLID:
      return LINE_PATTERN.HANDDRAWNSOLID;
    default:
      return LINE_PATTERN.SOLID;
  }
}
function getLineEndSpacing(startBranchView) {
  const lineEndArrowType = startBranchView.figure.endArrowClass;
  const hasLineEndArrow =
    lineEndArrowType && lineEndArrowType !== ARROW_CLASS.NONE;
  if (Object(utils.isBraceStructure)(startBranchView) && !hasLineEndArrow) {
    return utils.layoutConstant.LINE.LINE_SPACING;
  }
  if (!hasLineEndArrow) {
    return 0;
  }

  const lineSpacing = Object(utils.isTimelineThroughStructure)(startBranchView)
    ? utils.layoutConstant.LINE.LINE_TIMELINE_THROUGH_SPACING
    : utils.layoutConstant.LINE.LINE_SPACING;
  const lineEndToArrowInfo =
    utils.ArrowSelector.getArrowStaticInfo(lineEndArrowType);
  const lineWidth = startBranchView.figure.lineWidth;
  return lineWidth * lineEndToArrowInfo.arrowSizeRatio + lineSpacing;
}
function shouldPatchLineSpacing(startBranchView) {
  if (Object(utils.isBraceStructure)(startBranchView)) {
    return true;
  }
  const connectionHaveLineEndClass = startBranchView.figure.endArrowClass;
  if (
    connectionHaveLineEndClass &&
    connectionHaveLineEndClass !== ARROW_CLASS.NONE
  ) {
    return true;
  }
  return false;
}
export function getLineEndSpacingPatchPoint(startBranchView, endBranchView) {
  let x = 0;
  let y = 0;
  if (shouldPatchLineSpacing(startBranchView)) {
    const structureObject = startBranchView.getStructureObject();
    const lineSpacing = getLineEndSpacing(startBranchView);
    const direction = structureObject.getChildTargetOrientation(
      startBranchView,
      endBranchView.branchIndex(),
    );
    switch (direction) {
      case DIRECTION.RIGHT: {
        x = lineSpacing;
        break;
      }
      case DIRECTION.LEFT: {
        x = -lineSpacing;
        break;
      }
      case DIRECTION.DOWN: {
        y = lineSpacing;
        break;
      }
      case DIRECTION.UP: {
        y = -lineSpacing;
        break;
      }
    }
  }
  return {
    x,
    y,
  };
}
export function getLineEndSpacingPatchGap(startBranchView) {
  if (shouldPatchLineSpacing(startBranchView)) {
    return getLineEndSpacing(startBranchView);
  } else {
    return 0;
  }
}
