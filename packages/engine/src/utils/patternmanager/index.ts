import {
  HAND_DRAWN_FILL_PATTERN,
  FILL_PATTERN,
  TOPICSHAPE,
  LINE_PATTERN,
} from "../../common/constants/index";
import * as utils from "../../utils/index";
import { patternConfigurations } from "./configurations";
import { PatternManagerBase } from "./core";

enum PatternBranch {
  normal = "normal",
  handDrawn = "handDrawn",
}

const PATTERN_TYPES = {
  NORMAL: "normal",
  HAND_DRAWN: "hand-drawn",
};
class PatternManager extends PatternManagerBase {
  sliceOriginPath(originPath) {
    if (!originPath) {
      return null;
    }
    const matchResult = originPath.match(/m[^m]*/gi);
    if (!matchResult) {
      return null;
    }
    return matchResult.map((item) => item);
  }
  combineSlicedPath(paths, transformCallback) {
    return paths.reduce((result, item) => {
      const transformed = transformCallback(item);
      return result + transformed;
    }, "");
  }
  fillPatternNormalRenderer(originPath) {
    return originPath;
  }
  fillPatternHandDrawnRenderer(originPath, options) {
    const slicedPaths = this.sliceOriginPath(originPath);
    if (!slicedPaths) {
      return originPath;
    }
    return this.combineSlicedPath(slicedPaths, (item) =>
      this.generateRoughFillPath(item, Object.fromEntries(options || [])),
    );
  }
  applyFillPatternMode(fillPattern, originPath, applyConfigs) {
    if (Object.values(HAND_DRAWN_FILL_PATTERN).includes(fillPattern)) {
      return this.fillPatternHandDrawnRenderer(
        originPath,
        applyConfigs[PatternBranch.handDrawn],
      );
    } else {
      return this.fillPatternNormalRenderer(originPath);
    }
  }
  getFillPatternHandDrawnConfigForTopic(fillPattren, isBoundaryTitle?) {
    const roughtOptions = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      patternConfigurations.getFillPatternConfig(fillPattren),
    );
    if (isBoundaryTitle) {
      roughtOptions.roughness = 1.2;
    }
    return [roughtOptions];
  }
  renderFillPattrenForTopic(fillPattren, originPath) {
    const config = {
      [PatternBranch.handDrawn]:
        this.getFillPatternHandDrawnConfigForTopic(fillPattren),
    };
    return this.applyFillPatternMode(fillPattren, originPath, config);
  }
  renderFillPattrenWithHandDrawnSolid(originPath, isBoundaryTitle?) {
    const fillPattren = FILL_PATTERN.SOLID_HAND_DRAWN;
    const config = {
      [PatternBranch.handDrawn]: this.getFillPatternHandDrawnConfigForTopic(
        fillPattren,
        isBoundaryTitle,
      ),
    };
    return this.applyFillPatternMode(fillPattren, originPath, config);
  }
  borderLinePattrenNormalRenderer(originPath) {
    return originPath;
  }
  borderLinePatternHandDrawnRenderer(originPath, topicFigure, options) {
    let currentPath = originPath;
    const spShapePath = patternConfigurations.getSpecialBorderLinePatternPath(
      topicFigure.shapeClass,
      topicFigure.viewController.bounds,
    );
    if (spShapePath) {
      currentPath = spShapePath;
    }
    const slicedPaths = this.sliceOriginPath(currentPath);
    if (!slicedPaths) {
      return currentPath;
    }
    return this.combineSlicedPath(slicedPaths, (item) =>
      this.generateRoughLinePath(item, Object.fromEntries(options || [])),
    );
  }
  applyBorderLinePatternMode(
    borderLinePattern,
    originPath,
    topicFigure,
    applyConfigs,
  ) {
    const currentLinePattern = Object(utils.isHandDrawnLinePattern)(
      borderLinePattern,
    )
      ? PATTERN_TYPES.HAND_DRAWN
      : PATTERN_TYPES.NORMAL;
    switch (currentLinePattern) {
      case PATTERN_TYPES.NORMAL:
        return this.borderLinePattrenNormalRenderer(originPath);
      case PATTERN_TYPES.HAND_DRAWN:
        return this.borderLinePatternHandDrawnRenderer(
          originPath,
          topicFigure,
          applyConfigs[PatternBranch.handDrawn],
        );
    }
  }
  getBorderLinePatternHandDrawnConfigForTopic(topicFigure) {
    const { shapeClass } = topicFigure;
    const roughOptions = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      {
        disableMultiStroke: false,
      },
    );
    // issue: #1122
    if (
      [TOPICSHAPE.DOUBLEQUOTE, TOPICSHAPE.ROUNDBRACKET].includes(shapeClass)
    ) {
      roughOptions.disableMultiStroke = true;
    }
    const skipedSealPoints =
      patternConfigurations.getHandDrawnBreakLineConfig(shapeClass);
    const smoothLinkPoint =
      patternConfigurations.getIsNeedSmoothLinkPoint(shapeClass);
    return [roughOptions, skipedSealPoints, smoothLinkPoint];
  }
  renderBorderLinePatternForTopic(borderLinePattern, originPath, topicFigure) {
    const config = {
      [PatternBranch.handDrawn]:
        this.getBorderLinePatternHandDrawnConfigForTopic(topicFigure),
    };
    return this.applyBorderLinePatternMode(
      borderLinePattern,
      originPath,
      topicFigure,
      config,
    );
  }
  shapeLinePatternNormalRenderer(originPath) {
    return originPath;
  }
  linePatternHandDrawnRenderer(originPath, options) {
    const slicedPaths = this.sliceOriginPath(originPath);
    if (!slicedPaths) {
      return originPath;
    }
    return this.combineSlicedPath(slicedPaths, (item) =>
      this.generateRoughLinePath(item, Object.fromEntries(options || [])),
    );
  }
  applyLinePatternMode(linePattern, originPath, applyConfigs) {
    const currentLinePattern = Object(utils.isHandDrawnLinePattern)(linePattern)
      ? PATTERN_TYPES.HAND_DRAWN
      : PATTERN_TYPES.NORMAL;
    switch (currentLinePattern) {
      case PATTERN_TYPES.HAND_DRAWN:
        return this.linePatternHandDrawnRenderer(
          originPath,
          applyConfigs[PatternBranch.handDrawn],
        );
      case PATTERN_TYPES.NORMAL:
        return this.shapeLinePatternNormalRenderer(originPath);
    }
  }
  getLinePatternHandDrawnConfigForConnection(structureClass, figure) {
    const roughConfig = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      {
        roughness: patternConfigurations.getHandDrawnConnectionRoughness(
          structureClass,
          figure.connectionLineShape,
        ),
        disableMultiStroke: false,
        preserveVertices: true,
      },
    );
    return [roughConfig, [], true];
  }
  renderLinePatternForConnection(
    linePattren,
    originPath,
    structureClass,
    figure,
  ) {
    const config = {
      [PatternBranch.handDrawn]:
        this.getLinePatternHandDrawnConfigForConnection(structureClass, figure),
    };
    return this.applyLinePatternMode(linePattren, originPath, config);
  }
  getLinePatternHandDrawnConfigForOthers(isBoundary) {
    const config = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      {
        roughness: isBoundary ? 1.2 : 1,
      },
    );
    return [config, [], false];
  }
  renderLinePatternForOthers(linePattern, originPath, isBoundary = false) {
    const applyConfig = {
      [PatternBranch.handDrawn]:
        this.getLinePatternHandDrawnConfigForOthers(isBoundary),
    };
    return this.applyLinePatternMode(linePattern, originPath, applyConfig);
  }
  getFillPatternHandDrawnConfigForTaperedLine(
    startBranchPos,
    endBranchPos,
    lineWidth,
  ) {
    const roughtOptions = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      patternConfigurations.getFillPatternConfig(FILL_PATTERN.HACHURE),
    );
    const normal = Object(utils.normalize)(
      Object(utils.sub)(endBranchPos, startBranchPos),
    );
    roughtOptions.hachureAngle = normal.x * normal.y > 0 ? 135 : 45;
    roughtOptions.strokeWidth = lineWidth;
    roughtOptions.hachureGap = lineWidth * 1.1;
    return [roughtOptions];
  }
  renderHandDrawnTaperedLine(
    originPath,
    startBranchPos,
    endBranchPos,
    lineWidth,
  ) {
    const lineApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getLinePatternHandDrawnConfigForOthers(false),
    };
    const lineResult = this.applyLinePatternMode(
      LINE_PATTERN.HANDDRAWNSOLID,
      originPath,
      lineApplyConfig,
    );
    if (!startBranchPos || !endBranchPos) {
      return lineResult;
    }
    const fillApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getFillPatternHandDrawnConfigForTaperedLine(
          startBranchPos,
          endBranchPos,
          lineWidth,
        ),
    };
    const fillResult = this.applyFillPatternMode(
      FILL_PATTERN.HACHURE,
      originPath,
      fillApplyConfig,
    );
    return lineResult + fillResult;
  }
  getFillPatternHandDrawnConfigForFishBoneTaperedLine(lineWidth) {
    const roughtOptions = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      patternConfigurations.getFillPatternConfig(FILL_PATTERN.HACHURE),
    );
    roughtOptions.strokeWidth = lineWidth;
    roughtOptions.hachureGap = lineWidth * 1.1;
    return [roughtOptions];
  }
  renderHandDrawnTaperedLineForFishBone(originPath, lineWidth) {
    const lineApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getLinePatternHandDrawnConfigForOthers(false),
    };
    const lineResult = this.applyLinePatternMode(
      LINE_PATTERN.HANDDRAWNSOLID,
      originPath,
      lineApplyConfig,
    );
    const fillApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getFillPatternHandDrawnConfigForFishBoneTaperedLine(lineWidth),
    };
    const fillResult = this.applyFillPatternMode(
      FILL_PATTERN.HACHURE,
      originPath,
      fillApplyConfig,
    );
    return lineResult + fillResult;
  }
  getFillPatternHandDrawnConfigForFishBoneMainLineTaperedLine(
    startPosition,
    endPosition,
    lineWidth,
  ) {
    const roughtOptions = patternConfigurations.combineRoughOptions(
      patternConfigurations.getCompleteDefaultHandDrawnConfig(),
      patternConfigurations.getFillPatternConfig(FILL_PATTERN.HACHURE),
    );
    const normal = Object(utils.normalize)(
      Object(utils.sub)(endPosition, startPosition),
    );
    roughtOptions.hachureAngle = normal.x * normal.y > 0 ? 135 : 45;
    roughtOptions.strokeWidth = lineWidth;
    roughtOptions.hachureGap = lineWidth * 1.1;
    return [roughtOptions];
  }
  renderHandDrawnTaperedLineForFishBoneMainLine(
    originPath,
    startPosition,
    endPosition,
    lineWidth,
  ) {
    const lineApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getLinePatternHandDrawnConfigForOthers(false),
    };
    const lineResult = this.applyLinePatternMode(
      LINE_PATTERN.HANDDRAWNSOLID,
      originPath,
      lineApplyConfig,
    );
    const fillApplyConfig = {
      [PatternBranch.handDrawn]:
        this.getFillPatternHandDrawnConfigForFishBoneMainLineTaperedLine(
          startPosition,
          endPosition,
          lineWidth,
        ),
    };
    const fillResult = this.applyFillPatternMode(
      FILL_PATTERN.HACHURE,
      originPath,
      fillApplyConfig,
    );
    return lineResult + fillResult;
  }
}
export const patternManager = new PatternManager();
export default patternManager;
