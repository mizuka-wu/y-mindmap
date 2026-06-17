import rough from "roughjs/bin/rough";
import {
  svgPath,
  solidFillPolygon,
  patternFillPolygons,
} from "roughjs/bin/renderer";
import { pointsOnPath } from "points-on-path";
// Rough Function

export class PatternManagerBase {
  generateRoughLinePath: (
    originPath: any,
    roughOptions: any,
    skipedSealPoints?: any,
    smoothLinkPoint?: any,
  ) => any;
  roughContextElementInstance: any;
  constructor() {
    this.generateRoughLinePath = (
      originPath,
      roughOptions,
      skipedSealPoints,
      smoothLinkPoint,
    ) => {
      if (
        roughOptions &&
        "roughness" in roughOptions &&
        !roughOptions.roughness
      ) {
        delete roughOptions.roughness;
      }
      const roughContext = this.roughContextElementInstance;
      const gen = roughContext.generator;
      const opts = Object.assign({}, gen.defaultOptions, roughOptions || {});
      if (!originPath) {
        return "";
      }
      const opList = svgPath(originPath, opts).ops;
      let pathGroup = opList.reduce((pre, v, i) => {
        (v as any).index = i;
        if (v.op === "move") {
          pre.push([v]);
        } else {
          pre[pre.length - 1].push(v);
        }
        return pre;
      }, []);
      pathGroup = pathGroup.filter((item) => item.length > 1);
      let pathGroupList = [];
      if (opts.disableMultiStroke) {
        pathGroupList = [pathGroup];
      } else {
        pathGroupList = [
          pathGroup.filter((_, i) => i % 2 === 0),
          pathGroup.filter((_, i) => i % 2 !== 0),
        ];
      }
      pathGroupList.forEach((group) => {
        const groupInfo = group.map((group) => {
          const startInfo = group[0];
          const endInfo = group[group.length - 1];
          return {
            startIndex: startInfo.index,
            endIndex: endInfo.index,
            start: startInfo.data.slice(-2),
            end: endInfo.data.slice(-2),
          };
        });
        for (let i = 0; i < groupInfo.length; i++) {
          if (Array.isArray(skipedSealPoints) && skipedSealPoints.includes(i)) {
            continue;
          }
          const infoItem = groupInfo[i];
          let preItem;
          if (/z/i.test(originPath)) {
            preItem =
              i === 0 ? groupInfo[groupInfo.length - 1] : groupInfo[i - 1];
          } else {
            preItem = groupInfo[i - 1];
          }
          if (preItem) {
            const linkPoint = [
              (infoItem.start[0] + preItem.end[0]) / 2,
              (infoItem.start[1] + preItem.end[1]) / 2,
            ];
            const preEndPoint = opList[preItem.endIndex].data;
            const currStartPoint = opList[infoItem.startIndex].data;
            preEndPoint[preEndPoint.length - 2] = linkPoint[0];
            preEndPoint[preEndPoint.length - 1] = linkPoint[1];
            currStartPoint[currStartPoint.length - 2] = linkPoint[0];
            currStartPoint[currStartPoint.length - 1] = linkPoint[1];
            if (smoothLinkPoint) {
              preEndPoint[preEndPoint.length - 4] = linkPoint[0];
              preEndPoint[preEndPoint.length - 3] = linkPoint[1];
            }
          }
        }
      });
      return gen.opsToPath({
        type: "path",
        ops: opList,
      });
    };
    this.roughContextElementInstance = rough.svg(
      document.createElement("svg") as unknown as SVGSVGElement,
    );
  }
  generateRoughFillPath(originPath, roughOptions) {
    if (
      roughOptions &&
      "roughness" in roughOptions &&
      !roughOptions.roughness
    ) {
      delete roughOptions.roughness;
    }
    const roughContext = this.roughContextElementInstance;
    const gen = roughContext.generator;
    const opts = Object.assign({}, gen.defaultOptions, roughOptions || {});
    if (!originPath) {
      return "";
    }
    const distance = (1 + opts.roughness) / 2;
    let sets = pointsOnPath(originPath, 1, distance);
    if (/z/i.test(originPath)) {
      sets = sets.map((points) => points.slice(0, points.length - 1).reverse());
    }
    let opSet;
    if (opts.fillStyle === "solid") {
      opSet = solidFillPolygon(sets, opts);
    } else {
      opSet = patternFillPolygons(sets, opts);
    }
    return gen.opsToPath(opSet);
  }
}

export default PatternManagerBase;
