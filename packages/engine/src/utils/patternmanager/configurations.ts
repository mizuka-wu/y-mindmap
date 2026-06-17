import {
  TOPICSHAPE,
  FILL_PATTERN,
  BRANCHCONNECTION,
  STRUCTURECLASS,
  LINE_PATTERN,
  STYLE_KEYS,
  VIEW_TYPE,
  HAND_DRAWN_FONT_FAMILY,
} from "../../common/constants/index";
import * as _branch__WEBPACK_IMPORTED_MODULE_1__ from "../branch";

import styleManager from "../business/stylemanager/index";
export enum RoughjsFillStyle {
  hachure = "hachure",
  solid = "solid",
  zigzag = "zigzag",
  crossHatch = "cross-hatch",
  dots = "dots",
  dashed = "dashed",
  zigzagLine = "zigzag-line",
}
class PatternConfigurations {
  defaultConfig: { fillWidth: number; seed: number; roughness: number };
  skipedSealPointsConfig: { [x: string]: number[] };
  fillPatternRoughConfig: {
    [x: string]:
      | {
          fillStyle: any;
          roughness?: undefined;
          hachureAngle?: undefined;
          hachureGap?: undefined;
          fillWidth?: undefined;
        }
      | {
          fillStyle: any;
          roughness: number;
          hachureAngle?: undefined;
          hachureGap?: undefined;
          fillWidth?: undefined;
        }
      | {
          fillStyle: any;
          roughness: number;
          hachureAngle: number;
          hachureGap?: undefined;
          fillWidth?: undefined;
        }
      | {
          fillStyle: any;
          hachureAngle: number;
          roughness?: undefined;
          hachureGap?: undefined;
          fillWidth?: undefined;
        }
      | {
          fillStyle: any;
          roughness: number;
          hachureAngle: number;
          hachureGap: number;
          fillWidth?: undefined;
        }
      | {
          fillStyle: any;
          roughness: number;
          fillWidth: number;
          hachureGap: number;
          hachureAngle?: undefined;
        }
      | {
          fillStyle: any;
          hachureAngle: number;
          roughness: number;
          fillWidth: number;
          hachureGap: number;
        };
  };
  handDrawnBreakLineConfig: { [x: string]: number[] };
  handDrawnNeedSmoothLinkPoint: string[];
  handDrawnShapeHackerConfig: { [x: string]: (bounds: any) => string };
  handDrawnConnectionRoughnessConfig: {
    test: (structure: any) => boolean;
    config: (connection: any) => number;
  }[];
  getSpecialBorderLinePatternPath: (shapeClass: any, bounds: any) => any;
  getHandDrawnConnectionRoughness: (structure: any, connection: any) => any;
  constructor() {
    this.defaultConfig = {
      fillWidth: 8,
      seed: 10,
      roughness: 1,
    };
    this.skipedSealPointsConfig = {
      [TOPICSHAPE.ROUNDEDRECT]: [6],
      [TOPICSHAPE.ELLIPSERECT]: [0],
      [TOPICSHAPE.ELLIPTICRECTANGLE]: [0, 1, 2, 3],
      [TOPICSHAPE.ROUNDEDHEXAGON]: [0, 1, 2, 3],
      [TOPICSHAPE.SIMPLECLOUD]: [0, 2, 4, 6],
      [TOPICSHAPE.HEART]: [0, 4],
      [TOPICSHAPE.SHIELD]: [0, 2, 4, 6],
      [TOPICSHAPE.STAR]: [8, 11, 14],
    };
    this.fillPatternRoughConfig = {
      [FILL_PATTERN.SOLID_HAND_DRAWN]: {
        fillStyle: RoughjsFillStyle.solid,
      },
      [FILL_PATTERN.HACHURE]: {
        fillStyle: RoughjsFillStyle.hachure,
        roughness: 1.4,
      },
      [FILL_PATTERN.HACHURE_LEFT_HAND]: {
        fillStyle: RoughjsFillStyle.hachure,
        roughness: 1.4,
        hachureAngle: 45,
      },
      [FILL_PATTERN.ZIGZAG]: {
        fillStyle: RoughjsFillStyle.zigzag,
      },
      [FILL_PATTERN.ZIGZAG_LEFT_HAND]: {
        fillStyle: RoughjsFillStyle.zigzag,
        hachureAngle: 45,
      },
      [FILL_PATTERN.CROSSING]: {
        fillStyle: RoughjsFillStyle.hachure,
        roughness: 0.9,
        hachureAngle: 90,
        hachureGap: 6,
      },
      [FILL_PATTERN.HACHURE_THIN]: {
        fillStyle: RoughjsFillStyle.hachure,
        roughness: 1.2,
        fillWidth: 2,
        hachureGap: 1.1,
      },
      [FILL_PATTERN.CROSSING_THIN]: {
        fillStyle: RoughjsFillStyle.hachure,
        hachureAngle: 90,
        roughness: 1.2,
        fillWidth: 2,
        hachureGap: 1,
      },
    };
    this.handDrawnBreakLineConfig = {
      [TOPICSHAPE.ROUNDEDRECT]: [6],
      [TOPICSHAPE.ELLIPSERECT]: [0],
      [TOPICSHAPE.ELLIPTICRECTANGLE]: [0, 1, 2, 3],
      [TOPICSHAPE.ROUNDEDHEXAGON]: [0, 1, 2, 3],
      [TOPICSHAPE.SIMPLECLOUD]: [0, 2, 4, 6],
      [TOPICSHAPE.HEART]: [0, 4],
      [TOPICSHAPE.SHIELD]: [0, 2, 4, 6],
      [TOPICSHAPE.STAR]: [8, 11, 14],
    };
    this.handDrawnNeedSmoothLinkPoint = [
      TOPICSHAPE.CURLYBRACKET,
      TOPICSHAPE.ROUNDEDRECT,
    ];
    this.handDrawnShapeHackerConfig = {
      [TOPICSHAPE.ELLIPSE]: (bounds) => {
        const capOffset = bounds.height * 0.03;
        const capPoint = {
          x: bounds.x + bounds.width * 0.8,
          y: bounds.y + bounds.height * 0.05,
        };
        return `
        M ${capPoint.x} ${capPoint.y + capOffset}
        C ${bounds.x - bounds.width / 7} ${bounds.y - bounds.height / 4}, ${bounds.x - bounds.width / 4} ${bounds.y + bounds.height} , ${bounds.x + bounds.width / 2} ${bounds.y + bounds.height}
        C ${bounds.x + bounds.width * 1.1} ${bounds.y + bounds.height} , ${bounds.x + bounds.width * 1.1} ${bounds.y + bounds.height / 6} , ${capPoint.x} ${capPoint.y - capOffset}
      `;
      },
      [TOPICSHAPE.CIRCLE]: (bounds) => {
        const { x, width } = bounds;
        const r = x + width;
        const c = Math.sqrt(Math.pow(r, 2) / 2);
        return `M ${c} ${-c} A ${r}, ${r} 0 1 , 0 ${-c} , ${c} A ${r}, ${r} 0 1 , 0 ${c + c * 0.05} , ${-c - c * 0.05} `;
      },
      [TOPICSHAPE.ELLIPTICRECTANGLE]: (bound) => {
        const x0 = bound.x;
        const x1 = bound.x + bound.width / 2;
        const x2 = bound.x + bound.width;
        const peak = Math.min(bound.height / 3, bound.width * 0.2);
        const y0 = bound.y + peak / 2;
        const y1 = bound.y + bound.height - peak / 2;
        return `
      M ${x0} ${y0}
      Q ${x1} ${y0 - peak}  ${x2} ${y0}
      L ${x2} ${y1}
      Q ${x1} ${y1 + peak}  ${x0} ${y1}
      Z
    `;
      },
      [TOPICSHAPE.ROUNDEDHEXAGON]: (bound) => {
        const x0 = bound.x;
        const x1 = bound.x + bound.width / 2;
        const x2 = bound.x + bound.width;
        const peak = Math.min(bound.height / 6, bound.width * 0.2);
        const y0 = bound.y + peak;
        const y1 = bound.y + bound.height - peak;
        return `
        M ${x0} ${y0}
        L ${x1} ${y0 - peak / 2}
        L ${x2} ${y0}
        L ${x2} ${y1}
        L ${x1} ${y1 + peak / 2}
        L ${x0} ${y1}
        Z
      `;
      },
    };
    this.handDrawnConnectionRoughnessConfig = [
      // Mind Map
      {
        test: (structure) =>
          [STRUCTURECLASS.MAP, STRUCTURECLASS.MAPUNBALANCED].includes(
            structure,
          ),
        config: (connection) =>
          ({
            [BRANCHCONNECTION.ROUNDEDELBOW]: 1,
            [BRANCHCONNECTION.ELBOW]: 1.5,
            [BRANCHCONNECTION.STRAIGHT]: 1.5,
            [BRANCHCONNECTION.CURVE]: 1.2,
            [BRANCHCONNECTION.BIGHT]: 1.5,
            [BRANCHCONNECTION.FOLD]: 1.2,
            [BRANCHCONNECTION.ROUNDEDFOLD]: 0.8,
          })[connection],
      },
      // Logic Chart
      {
        test: (structure) =>
          [STRUCTURECLASS.LOGICLEFT, STRUCTURECLASS.LOGICRIGHT].includes(
            structure,
          ),
        config: (connection) =>
          ({
            [BRANCHCONNECTION.ROUNDEDELBOW]: 1,
            [BRANCHCONNECTION.ELBOW]: 1.2,
            [BRANCHCONNECTION.STRAIGHT]: 1.2,
            [BRANCHCONNECTION.CURVE]: 1.2,
            [BRANCHCONNECTION.BIGHT]: 1.2,
            [BRANCHCONNECTION.FOLD]: 1.2,
            [BRANCHCONNECTION.ROUNDEDFOLD]: 0.6,
          })[connection],
      },
      // Brace Map
      {
        test: (structure) =>
          [STRUCTURECLASS.BRACELEFT, STRUCTURECLASS.BRACERIGHT].includes(
            structure,
          ),
        config: () => 0.5,
      },
      // Org Chart
      {
        test: (structure) =>
          [STRUCTURECLASS.ORGCHARTDOWN, STRUCTURECLASS.ORGCHARTUP].includes(
            structure,
          ),
        config: (connection) =>
          ({
            [BRANCHCONNECTION.ROUNDEDELBOW]: 0.8,
            [BRANCHCONNECTION.ELBOW]: 1.2,
            [BRANCHCONNECTION.STRAIGHT]: 1.5,
            [BRANCHCONNECTION.CURVE]: 1.5,
            [BRANCHCONNECTION.BIGHT]: 1.2,
            [BRANCHCONNECTION.FOLD]: 1.2,
            [BRANCHCONNECTION.ROUNDEDFOLD]: 0.6,
          })[connection],
      },
      // Tree Chart
      {
        test: (structure) =>
          [STRUCTURECLASS.TREELEFT, STRUCTURECLASS.TREERIGHT].includes(
            structure,
          ),
        config: (connection) =>
          ({
            [BRANCHCONNECTION.ROUNDEDELBOW]: 0.7,
            [BRANCHCONNECTION.ELBOW]: 1.2,
            [BRANCHCONNECTION.STRAIGHT]: 1.5,
            [BRANCHCONNECTION.CURVE]: 1.5,
            [BRANCHCONNECTION.BIGHT]: 1.5,
            [BRANCHCONNECTION.FOLD]: 1.2,
            [BRANCHCONNECTION.ROUNDEDFOLD]: 0.6,
          })[connection],
      },
      // Fishbone
      {
        test: (structure) =>
          [
            STRUCTURECLASS.FISHBONELEFTHEADED,
            STRUCTURECLASS.FISHBONERIGHTHEADED,
          ].includes(structure),
        config: () => 1.2,
      },
      // Default
      {
        test: () => true,
        config: () => 1,
      },
    ];
    this.getSpecialBorderLinePatternPath = (shapeClass, bounds) => {
      if (shapeClass in this.handDrawnShapeHackerConfig) {
        return this.handDrawnShapeHackerConfig[shapeClass](bounds);
      } else {
        return null;
      }
    };
    this.getHandDrawnConnectionRoughness = (structure, connection) => {
      const configPack = this.handDrawnConnectionRoughnessConfig.find(
        (config) => config.test(structure),
      );
      return configPack.config(connection);
    };
  }
  combineRoughOptions(...args) {
    return Object.assign.apply(null, [{}, ...args]);
  }
  getCompleteDefaultHandDrawnConfig() {
    return {
      fillWidth: this.defaultConfig.fillWidth,
      stroke: "white",
      strokeWidth: this.defaultConfig.fillWidth,
      fill: "white",
      fillStyle: RoughjsFillStyle.zigzag,
      seed: this.defaultConfig.seed,
      roughness: this.defaultConfig.roughness,
      disableMultiStroke: true,
      disableMultiStrokeFill: true,
      hachureGap: this.defaultConfig.fillWidth * 0.9,
    };
  }
  getFillPatternConfig(fillPattern) {
    const config: any = Object.assign(
      {},
      this.fillPatternRoughConfig[fillPattern] || {},
    );
    if (config.fillWidth) {
      config.strokeWidth = config.fillWidth;
      config.hachureGap = config.hachureGap || config.fillWidth * 0.9;
    }
    return config;
  }
  getSkipedSealPoints(topicShapeClass) {
    return [...(this.skipedSealPointsConfig[topicShapeClass] || [])];
  }
  getHandDrawnBreakLineConfig(topicShapeClass) {
    if (this.handDrawnBreakLineConfig[topicShapeClass]) {
      return [...this.handDrawnBreakLineConfig[topicShapeClass]];
    } else {
      return [];
    }
  }
  getIsNeedSmoothLinkPoint(topicShapeClass) {
    return this.handDrawnNeedSmoothLinkPoint.includes(topicShapeClass);
  }
  getCurrentHandDrawnDefaultFillWidth(fillPattern) {
    const { fillWidth } = this.combineRoughOptions(
      this.getCompleteDefaultHandDrawnConfig(),
      this.getFillPatternConfig(fillPattern),
    );
    return fillWidth;
  }
}
/* harmony default export */
export const patternConfigurations = new PatternConfigurations();
const getCurrentHandDrawnLinePattern = (
  defaultLinePattern,
  originLinePattern,
) => {
  if (!originLinePattern) {
    return defaultLinePattern;
  }
  if (
    Object(_branch__WEBPACK_IMPORTED_MODULE_1__.isHandDrawnLinePattern)(
      originLinePattern,
    )
  ) {
    return originLinePattern;
  }
  switch (originLinePattern) {
    case LINE_PATTERN.SOLID:
      return LINE_PATTERN.HANDDRAWNSOLID;
    case LINE_PATTERN.DASH:
      return LINE_PATTERN.HANDDRAWNDASH;
    default:
      return defaultLinePattern;
  }
};
export default {
  [STYLE_KEYS.FONT_FAMILY]: {
    [VIEW_TYPE.BRANCH]: HAND_DRAWN_FONT_FAMILY,
    [VIEW_TYPE.BOUNDARY]: HAND_DRAWN_FONT_FAMILY,
    [VIEW_TYPE.RELATIONSHIP]: HAND_DRAWN_FONT_FAMILY,
  },
  [STYLE_KEYS.LINE_PATTERN]: {
    [VIEW_TYPE.BRANCH]: (branchView) => {
      const originLinePattern = styleManager.getStyleValue(
        branchView,
        STYLE_KEYS.LINE_PATTERN,
        {
          ignoreDynamicPriorityOverridedStyle: true,
        },
      );
      return getCurrentHandDrawnLinePattern(
        LINE_PATTERN.HANDDRAWNSOLID,
        originLinePattern,
      );
    },
    [VIEW_TYPE.SUMMARY]: (summaryView) => {
      const originLinePattern = styleManager.getStyleValue(
        summaryView,
        STYLE_KEYS.LINE_PATTERN,
        {
          ignoreDynamicPriorityOverridedStyle: true,
        },
      );
      return getCurrentHandDrawnLinePattern(
        LINE_PATTERN.HANDDRAWNSOLID,
        originLinePattern,
      );
    },
    [VIEW_TYPE.RELATIONSHIP]: (relationshipView) => {
      const originLinePattern = styleManager.getStyleValue(
        relationshipView,
        STYLE_KEYS.LINE_PATTERN,
        {
          ignoreDynamicPriorityOverridedStyle: true,
        },
      );
      return getCurrentHandDrawnLinePattern(
        LINE_PATTERN.HANDDRAWNDASH,
        originLinePattern,
      );
    },
    [VIEW_TYPE.BOUNDARY]: (boundaryView) => {
      const originLinePattern = styleManager.getStyleValue(
        boundaryView,
        STYLE_KEYS.LINE_PATTERN,
        {
          ignoreDynamicPriorityOverridedStyle: true,
        },
      );
      return getCurrentHandDrawnLinePattern(
        LINE_PATTERN.HANDDRAWNDASH,
        originLinePattern,
      );
    },
  },
  [STYLE_KEYS.FILL_PATTERN]: {
    [VIEW_TYPE.BRANCH]: FILL_PATTERN.HACHURE,
    [VIEW_TYPE.BOUNDARY]: FILL_PATTERN.SOLID_HAND_DRAWN,
  },
  [STYLE_KEYS.BORDER_LINE_PATTERN]: {
    [VIEW_TYPE.BRANCH]: (branchView) => {
      const originalBorderLinePattern = styleManager.getStyleValue(
        branchView,
        STYLE_KEYS.BORDER_LINE_PATTERN,
        {
          ignoreDynamicPriorityOverridedStyle: true,
        },
      );
      return getCurrentHandDrawnLinePattern(
        LINE_PATTERN.HANDDRAWNSOLID,
        originalBorderLinePattern,
      );
    },
  },
};
