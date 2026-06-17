import {
  TOPICSHAPE,
  CALLOUTSHAPE,
  VIEW_TYPE,
  NUMBERFORMAT,
  TEXTTRANSFORM,
  TOPIC_TYPE,
} from "./common/constants/index";

import * as utils from "./utils/index";

import mommonFuncs from "./mommonfuncs";

import underscore from "underscore";

import * as boundUtils from "./utils/boundutils";

import { SVGPathData } from "svg-pathdata";

import { Bezier } from "svg-path-properties/src/bezier";

import { Arc } from "svg-path-properties/src/arc";

import * as commonUtils from "./common/utils/index";

const getSvgBezier = (ax, ay, bx, by, cx, cy, dx?, dy?) =>
  new Bezier(ax, ay, bx, by, cx, cy, dx, dy);
const getSvgArc = (
  x0,
  y0,
  rx,
  ry,
  xAxisRotate,
  LargeArcFlag,
  SweepFlag,
  x1,
  y1
) => new Arc(x0, y0, rx, ry, xAxisRotate, LargeArcFlag, SweepFlag, x1, y1);
const shapePolygonCache = ((cacheData) => (key, value?) => {
  const clone = (points) => points.map((p) => Object.assign({}, p));
  if (key && !value && key in cacheData) {
    return clone(cacheData[key]);
  }
  if (key && value) {
    if (key in cacheData) {
      return null;
    }
    if (Object.keys(cacheData).length > 10) {
      for (const key in cacheData) {
        delete cacheData[key];
      }
    }
    cacheData[key] = clone(value);
  }
  return null;
})({});
const base64Reg = /data:image[\s\S]*;base64/;
//两点确定一条直线方程
function twoPointToLine(point1, point2) {
  const line: any = {};
  if (point1.x === point2.x) {
    line.x = point1.x;
  } else if (point1.y === point2.y) {
    line.y = point1.y;
  } else {
    line.k = (point1.y - point2.y) / (point1.x - point2.x);
    line.b = point1.y - point1.x * line.k;
  }
  return line;
}
export const Util = {
  //把topic的形状转成line
  topicShapeToLine: {
    [TOPICSHAPE.RECT]: function (topicBranch) {
      const topicBoundsLines = [];
      const width = topicBranch.topicView.shapeBounds.width;
      const height = topicBranch.topicView.shapeBounds.height;
      const position = topicBranch.getRealPosition();
      //转换上部线段
      topicBoundsLines[0] = {
        y: position.y - height / 2,
        type: "line",
      };
      //转换右部线段
      topicBoundsLines[1] = {
        x: position.x + width / 2,
        type: "line",
      };
      //转换下部线段
      topicBoundsLines[2] = {
        y: position.y + height / 2,
        type: "line",
      };
      //转换左部线段
      topicBoundsLines[3] = {
        x: position.x - width / 2,
        type: "line",
      };
      return topicBoundsLines;
    },
    [TOPICSHAPE.ROUNDEDRECT]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [TOPICSHAPE.ELLIPSE]: function (topicBranch) {
      const topicBoundsLines = {};
      const width = topicBranch.shapeBounds.width;
      const height = topicBranch.shapeBounds.height;
      const position = topicBranch.getRealPosition();
      //圆心
      const x0 = position.x;
      const y0 = position.y;
      //长轴和短轴
      let a = width / 2;
      let b = height / 2;
      if (a < b) {
        const temp = a;
        a = b;
        b = temp;
      }
      topicBoundsLines[0] = {
        x0: x0,
        y0: y0,
        a: a,
        b: b,
        type: "arc",
      };
      return topicBoundsLines;
    },
    [TOPICSHAPE.DIAMOND]: function (topicBranch) {
      const topicBoundsLines = {};
      const width = topicBranch.shapeBounds.width;
      const height = topicBranch.shapeBounds.height;
      const position = topicBranch.getRealPosition();
      let point1;
      let point2;
      let line;
      // var
      //四条直线
      //左上
      point1 = {
        x: position.x,
        y: position.y - height / 2,
      };
      point2 = {
        x: position.x - width / 2,
        y: position.y,
      };
      line = twoPointToLine(point1, point2);
      line.type = "line";
      topicBoundsLines[0] = line;
      //右上
      point1 = {
        x: position.x,
        y: position.y - height / 2,
      };
      point2 = {
        x: position.x + width / 2,
        y: position.y,
      };
      line = twoPointToLine(point1, point2);
      line.type = "line";
      topicBoundsLines[1] = line;
      //右下
      point1 = {
        x: position.x,
        y: position.y + height / 2,
      };
      point2 = {
        x: position.x + width / 2,
        y: position.y,
      };
      line = twoPointToLine(point1, point2);
      line.type = "line";
      topicBoundsLines[2] = line;
      //左下
      point1 = {
        x: position.x,
        y: position.y + height / 2,
      };
      point2 = {
        x: position.x - width / 2,
        y: position.y,
      };
      line = twoPointToLine(point1, point2);
      line.type = "line";
      topicBoundsLines[3] = line;
      return topicBoundsLines;
    },
    // 没其他地方调用和这个const
    // [TOPICSHAPE.ELLISPEDIALOG]: function (topicBranch) {
    //   return this[TOPICSHAPE.ELLIPSE](topicBranch);
    // },
    // [TOPICSHAPE.RECTANGLEDIALOG]: function (topicBranch) {
    //   return this[TOPICSHAPE.RECT](topicBranch);
    // },
    [TOPICSHAPE.UNDERLINE]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [TOPICSHAPE.CIRCLE]: function (topicBranch) {
      return this[TOPICSHAPE.ELLIPSE](topicBranch);
    },
    [TOPICSHAPE.PARALLELOGRAM]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [TOPICSHAPE.CLOUD]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [CALLOUTSHAPE.RECT]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [CALLOUTSHAPE.ROUNDEDRECT]: function (topicBranch) {
      return this[TOPICSHAPE.RECT](topicBranch);
    },
    [CALLOUTSHAPE.ELLIPSE]: function (topicBranch) {
      return this[TOPICSHAPE.ELLIPSE](topicBranch);
    },
  },
  /**
   * @deprecated use pointUtils.distance instead
   * */
  calculateDistance: function (point1, point2) {
    const distance = Math.sqrt(
      (point2.x - point1.x) * (point2.x - point1.x) +
        (point2.y - point1.y) * (point2.y - point1.y)
    );
    return distance;
  },
  /**
   * path的pointAt的反函数
   * @param path 任意闭合的path
   * @param point path上的点,{x:Number,y:Number}
   * @returns {*} 返回在path上的位置，0～length
   */
  antiPointAt: function (path, point) {
    const rad = Util.getRadian(path.pointAt(0.0001)); //当path为circle时，得到的点为（0，0），所以这里不为0
    const length = path.length();
    const maxTimes = Math.log(length) / Math.log(2) + 1; //保证结果误差在一个px内,maxTimes ＝ log2(length)+1
    let targetRad = Util.getRadian(point);
    targetRad = targetRad < rad ? targetRad + Math.PI * 2 : targetRad;
    //开始二分
    let count = 0;
    let start = 0;
    let end = length;
    let half;
    let halfPointRad;
    while (count < maxTimes) {
      half = (end - start) / 2 + start;
      halfPointRad = Util.getRadian(path.pointAt(half));
      halfPointRad =
        halfPointRad < rad ? halfPointRad + Math.PI * 2 : halfPointRad;
      if (halfPointRad > targetRad) {
        end = half;
      } else {
        start = half;
      }
      count++;
    }
    return half;
  },
  /**
   * 获取一个点相对于x正轴的弧度，返回0到2PI
   * @param point
   */
  getRadian: function (point) {
    const cos = point.x / Math.sqrt(point.x * point.x + point.y * point.y);
    const rad = Math.acos(cos);
    if (point.y < 0) {
      return Math.PI * 2 - rad;
    } else {
      return rad;
    }
  },
  angleToRadian: function (angle) {
    return (angle / 180) * Math.PI;
  },
  /**
   * @description 获取topic中心点和relationship的controlPoint的连线在topic或者boundary path上的交点，根据弧度二分
   * @param {BranchView | BoundaryView} branchOrBoundaryView
   * @param {point} controlPoint
   * @returns {*}
   */
  topicInsectLine(branchOrBoundaryView, controlPoint) {
    if (
      !branchOrBoundaryView ||
      !controlPoint ||
      controlPoint.x === undefined ||
      controlPoint.y === undefined
    ) {
      // if (!branchOrBoundaryView || !controlPoint || controlPoint.x === undefined || !controlPoint.y === undefined) {
      throw new Error("incorrect arguments");
    }
    /** @type {SVG.Path} */
    let shapePath;
    let scale;
    let translate;
    let rotateTransform;
    let cosA;
    let sinA;
    let realPos = Object.assign({}, branchOrBoundaryView.getRealPosition());
    if (branchOrBoundaryView.type === VIEW_TYPE.BRANCH) {
      const { topicView } = branchOrBoundaryView;
      shapePath =
        Object(utils.isCalloutBranch)(branchOrBoundaryView) &&
        Object(utils.isHandDrawnLinePattern)(topicView.figure.borderLinePattern)
          ? Object(utils.getFillPatternAttr)(topicView.figure.fillPattern, {
              fillPath: topicView.figure.topicShapeFillPath,
              isForceHandDrawnSolid: true,
            }).d
          : topicView.figure.topicShapeFillPath;
      // 获取偏移量
      if (branchOrBoundaryView.isRotate()) {
        rotateTransform = topicView.topicGroup.transform();
        cosA = Math.cos(Util.angleToRadian(rotateTransform.rotation));
        sinA = Math.sin(Util.angleToRadian(rotateTransform.rotation));
      }
      if (topicView.figure.shapeClass === TOPICSHAPE.CLOUD) {
        scale = branchOrBoundaryView.topicView.topicShapeFill.transform();
        translate = scale;
      }
    } else if (branchOrBoundaryView.type === VIEW_TYPE.BOUNDARY) {
      shapePath = branchOrBoundaryView.figure.boundaryPath;
      const boundaryShapeSize = branchOrBoundaryView.figure.boundaryShapeSize;
      realPos = {
        x: realPos.x + boundaryShapeSize.width / 2,
        y: realPos.y + boundaryShapeSize.height / 2,
      };
      // boundary的bbox中心点在其shape左上角顶点
      translate = {
        x: -boundaryShapeSize.width / 2,
        y: -boundaryShapeSize.height / 2,
      };
    }
    // fixme shapePath有时候会为undefined，为什么？endView为什么会有boundary和branch之外的类型？
    if (!shapePath || Object(utils.getTotalLength)(shapePath) === 0) {
      return controlPoint;
    }
    // 初始化变量
    // 无论topic有没有旋转，坐标系都是以realPos为坐标系原点，且没有旋转
    let zeroPoint = {
      x: 0,
      y: 0,
    };
    if (rotateTransform) {
      const centerPoint = {
        x: rotateTransform.cx,
        y: rotateTransform.cy,
      };
      zeroPoint = rotatePoint(zeroPoint, centerPoint);
    }
    const outerPoint = {
      x: controlPoint.x - realPos.x,
      y: controlPoint.y - realPos.y,
    };
    const ssp = Object(utils.getSSP)(shapePath);
    // 当path为circle时，得到的点为（0，0），所以这里不为0
    const startPoint = translatePoint(ssp.getPointAtLength(0.0001));
    const rad = Util.getRadian({
      x: startPoint.x - zeroPoint.x,
      y: startPoint.y - zeroPoint.y,
    });
    let targetRad = Util.getRadian({
      x: outerPoint.x - zeroPoint.x,
      y: outerPoint.y - zeroPoint.y,
    });
    targetRad = targetRad < rad ? targetRad + Math.PI * 2 : targetRad;
    const length = ssp.getTotalLength();
    const maxTimes = Math.log(length) / Math.log(2) + 1; //等价于maxTimes = log2(length) 保证结果误差在一个px内
    //开始二分
    let count = 0;
    let start = 0;
    let end = length;
    let half = (end - start) / 2 + start;
    let halfPoint;
    let halfPointRad;
    let currentTangentX;
    let currentTangentY;
    const ng = pathIsClock() ? 1 : -1; //判断path是否顺时针画的
    while (count < maxTimes) {
      half = (end - start) / 2 + start;
      const { x, y, tangentX, tangentY } = ssp.getPropertiesAtLength(half);
      currentTangentX = tangentX;
      currentTangentY = tangentY;
      halfPoint = translatePoint({
        x,
        y,
      });
      halfPointRad = Util.getRadian({
        x: halfPoint.x - zeroPoint.x,
        y: halfPoint.y - zeroPoint.y,
      });
      halfPointRad =
        halfPointRad < rad ? halfPointRad + Math.PI * 2 : halfPointRad;
      if (halfPointRad * ng > targetRad * ng) {
        end = half;
      } else {
        start = half;
      }
      count++;
    }
    return {
      at: half,
      x: halfPoint.x + realPos.x,
      y: halfPoint.y + realPos.y,
      tangentX: currentTangentX,
      tangentY: currentTangentY,
    };
    function pathIsClock() {
      const oneQuarter = translatePoint(
        Object(utils.getPointAtLength)(shapePath, (end - start) / 4 + start)
      );
      let oneQuarterRad = Util.getRadian({
        x: oneQuarter.x - zeroPoint.x,
        y: oneQuarter.y - zeroPoint.y,
      });
      oneQuarterRad =
        oneQuarterRad < rad ? oneQuarterRad + Math.PI * 2 : oneQuarterRad;
      const threeQuarter = translatePoint(
        Object(utils.getPointAtLength)(
          shapePath,
          ((end - start) / 4) * 3 + start
        )
      );
      let threeQuarterRad = Util.getRadian({
        x: threeQuarter.x - zeroPoint.x,
        y: threeQuarter.y - zeroPoint.y,
      });
      threeQuarterRad =
        threeQuarterRad < rad ? threeQuarterRad + Math.PI * 2 : threeQuarterRad;
      return threeQuarterRad > oneQuarterRad;
    }
    function translatePoint(point) {
      if (scale && translate) {
        point.x = point.x * scale.scaleX;
        point.y = point.y * scale.scaleY;
      }
      if (translate) {
        point.x += translate.x;
        point.y += translate.y;
      }
      if (rotateTransform) {
        rotatePoint(point, {
          x: rotateTransform.cx,
          y: rotateTransform.cy,
        });
      }
      return point;
    }
    function rotatePoint(point, centerPoint) {
      const vector = {
        x: point.x - centerPoint.x,
        y: point.y - centerPoint.y,
      };
      point.x = centerPoint.x + (vector.x * cosA - vector.y * sinA);
      point.y = centerPoint.y + (vector.x * sinA + vector.y * cosA);
      return point;
    }
  },
  // 获取图形交点对应的法线
  getIntersectionNormal(targetView, intersection, tangent) {
    let realPos = targetView.getRealPosition();
    if (targetView.type === VIEW_TYPE.BOUNDARY) {
      realPos = {
        x: realPos.x + targetView.size.width / 2,
        y: realPos.y + targetView.size.height / 2,
      };
    }
    let tangentNormal = Object(utils.normal)(tangent);
    if (
      Object(utils.dot)(
        tangentNormal,
        Object(utils.sub)(intersection, realPos)
      ) < 0
    ) {
      tangentNormal = Object(utils.reverse)(tangentNormal);
    }
    return Object(utils.normalize)(tangentNormal);
  },
  // 将 svg path 转换为由若干个点组成的数组
  shapePolygon(shapePath) {
    if (shapePolygonCache(shapePath)) {
      return shapePolygonCache(shapePath);
    }
    const { commands } = new SVGPathData(shapePath);
    let startPoint = null;
    let pointList = [];
    const clone = (obj) => Object.assign({}, obj);
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      switch (command.type) {
        case SVGPathData.MOVE_TO: {
          const { x, y } = command;
          if (!startPoint) {
            startPoint = {
              x,
              y,
            };
          }
          pointList.push({
            x,
            y,
          });
          break;
        }
        case SVGPathData.CLOSE_PATH: {
          if (startPoint) {
            pointList.push(clone(startPoint));
          }
          break;
        }
        case SVGPathData.VERT_LINE_TO: {
          const lastPoint = clone(pointList[pointList.length - 1]);
          pointList.push({
            x: lastPoint.x,
            y: command.relative ? lastPoint.y + command.y : command.y,
          });
          break;
        }
        case SVGPathData.HORIZ_LINE_TO: {
          const lastPoint = clone(pointList[pointList.length - 1]);
          pointList.push({
            x: command.relative ? lastPoint.x + command.x : command.x,
            y: lastPoint.y,
          });
          break;
        }
        case SVGPathData.LINE_TO: {
          const lastPoint = clone(pointList[pointList.length - 1]);
          let { x, y } = command;
          if (command.relative) {
            x = lastPoint.x + x;
            y = lastPoint.y + y;
          }
          pointList.push({
            x,
            y,
          });
          break;
        }
        case SVGPathData.CURVE_TO:
        case SVGPathData.QUAD_TO: {
          let { x1, y1, x2, y2, x, y } = command as any;
          const lastPoint = clone(pointList[pointList.length - 1]);
          if (command.relative) {
            x1 = lastPoint.x + x1;
            y1 = lastPoint.y + y1;
            x = lastPoint.x + x;
            y = lastPoint.y + y;
            if (x2) {
              x2 = lastPoint.x + x2;
            }
            if (y2) {
              y2 = lastPoint.y + y2;
            }
          }
          const bezier =
            command.type === SVGPathData.QUAD_TO
              ? getSvgBezier(lastPoint.x, lastPoint.y, x1, y1, x, y)
              : getSvgBezier(lastPoint.x, lastPoint.y, x1, y1, x2, y2, x, y);
          pointList = pointList.concat(Util.getCurvePolygon(bezier));
          pointList.push({
            x,
            y,
          });
          break;
        }
        case SVGPathData.SMOOTH_CURVE_TO: {
          const lastCommand = commands[i - 1];
          let { x2, y2, x, y } = command;
          const lastPoint = clone(pointList[pointList.length - 1]);
          if (command.relative) {
            x2 = lastPoint.x + x2;
            y2 = lastPoint.y + y2;
            x = lastPoint.x + x;
            y = lastPoint.y + y;
          }
          let controlPoint1 = null;
          if (
            lastCommand.type !== SVGPathData.CURVE_TO &&
            lastCommand.type !== SVGPathData.SMOOTH_CURVE_TO
          ) {
            controlPoint1 = {
              x: x2,
              y: y2,
            };
          } else {
            controlPoint1 = Object(utils.add)(
              lastPoint,
              Object(utils.sub)(lastPoint, {
                x: lastCommand.x2,
                y: lastCommand.y2,
              })
            );
          }
          const bezier = getSvgBezier(
            lastPoint.x,
            lastPoint.y,
            controlPoint1.x,
            controlPoint1.y,
            x2,
            y2,
            x,
            y
          );
          pointList = pointList.concat(Util.getCurvePolygon(bezier));
          pointList.push({
            x,
            y,
          });
          break;
        }
        case SVGPathData.SMOOTH_QUAD_TO: {
          const lastCommand = commands[i - 1];
          let { x, y } = command;
          const lastPoint = clone(pointList[pointList.length - 1]);
          if (command.relative) {
            x = lastPoint.x + x;
            y = lastPoint.y + y;
          }
          let controlPoint1 = null;
          if (lastCommand.type === SVGPathData.QUAD_TO) {
            controlPoint1 = Object(utils.add)(
              lastPoint,
              Object(utils.sub)(lastPoint, {
                x: lastCommand.x1,
                y: lastCommand.y1,
              })
            );
          } else {
            controlPoint1 = {
              x,
              y,
            };
          }
          const bezier = getSvgBezier(
            lastPoint.x,
            lastPoint.y,
            controlPoint1.x,
            controlPoint1.y,
            x,
            y
          );
          pointList = pointList.concat(Util.getCurvePolygon(bezier));
          pointList.push({
            x,
            y,
          });
          break;
        }
        case SVGPathData.ARC: {
          const lastPoint = clone(pointList[pointList.length - 1]);
          let {
            // eslint-disable-next-line prefer-const
            rX,
            // eslint-disable-next-line prefer-const
            rY,
            // eslint-disable-next-line prefer-const
            xRot,
            // eslint-disable-next-line prefer-const
            lArcFlag,
            // eslint-disable-next-line prefer-const
            sweepFlag,
            x,
            y,
          } = command;
          if (command.relative) {
            x = lastPoint.x + x;
            y = lastPoint.y + y;
          }
          const arc = getSvgArc(
            lastPoint.x,
            lastPoint.y,
            rX,
            rY,
            xRot,
            Boolean(lArcFlag),
            Boolean(sweepFlag),
            x,
            y
          );
          pointList = pointList.concat(Util.getCurvePolygon(arc));
          pointList.push({
            x,
            y,
          });
          break;
        }
        default:
          break;
      }
    }
    shapePolygonCache(shapePath, pointList);
    return pointList;
  },
  // 将贝塞尔曲线, 弧线等曲线转换为由若干个点组成的数组
  getCurvePolygon(ssp) {
    // 曲线采样点间距, 数值越小精确度越高(性能越低)
    const CURVE_STEP = 5;
    // 采样点切线夹角累加阈值, 数值越小精确度越高(性能越低)
    const ANGLE_STEP = 2;
    const firstPointProperties = ssp.getPropertiesAtLength(0.001);
    const pointList = [
      {
        x: firstPointProperties.x,
        y: firstPointProperties.y,
      },
    ];
    const sspLength = ssp.getTotalLength();
    const zeroPoint = {
      x: 0,
      y: 0,
    };
    let lastPointProperties = Object.assign({}, firstPointProperties);
    let tmpTotalAngle = 0;
    for (let i = 1; i < sspLength; i += CURVE_STEP) {
      const { x, y, tangentX, tangentY } = ssp.getPropertiesAtLength(i);
      // lp: lastPoint, cp: currentPoint
      // dot(lp, cp) = |lp| * |cp| * cos(radian)
      const product =
        Math.abs(
          Object(utils.distance)(
            {
              x: tangentX,
              y: tangentY,
            },
            zeroPoint
          )
        ) *
        Math.abs(
          Object(utils.distance)(
            {
              x: lastPointProperties.tangentX,
              y: lastPointProperties.tangentY,
            },
            zeroPoint
          )
        );
      const dotLpCp =
        Object(utils.dot)(
          {
            x: tangentX,
            y: tangentY,
          },
          {
            x: lastPointProperties.tangentX,
            y: lastPointProperties.tangentY,
          }
        ) / product;
      const angle = (180 / Math.PI) * Math.acos(dotLpCp);
      // 将连续两个采样点的切线夹角累加直到超过阈值(ANGLE_STEP), 记录当前采样点并重置累加值
      // 此方法可以大量减少曲线平滑部分的记录点数量, 同时保持最终图形的形状特性不丢失
      tmpTotalAngle += angle;
      if (tmpTotalAngle > ANGLE_STEP) {
        tmpTotalAngle = 0;
        pointList.push({
          x,
          y,
        });
      }
      lastPointProperties = {
        x,
        y,
        tangentX,
        tangentY,
      };
    }
    return pointList;
  },
  // 线段与射线相交检测
  lineSegmentRayCast(p1, p2, ray) {
    const zeroPoint = {
      x: 0,
      y: 0,
    };
    // 剔除背面
    let originSegmentNormal = Object(utils.normal)({
      x: p1.x - p2.x,
      y: p1.y - p2.y,
    });
    // 修正法线方向, 保持法线向外
    if (Object(utils.dot)(originSegmentNormal, Object(utils.add)(p1, p2)) < 0) {
      originSegmentNormal = Object(utils.reverse)(originSegmentNormal);
    }
    // 法线方向与射线方向同向则为背面
    if (Object(utils.dot)(originSegmentNormal, ray.direction) > 0) {
      return null;
    }
    // 把线段两点转换到以 ray.startPoint 为原点的坐标系, 方便计算
    const transform = Object(utils.sub)(zeroPoint, ray.startPoint);
    p1 = Object(utils.add)(p1, transform);
    p2 = Object(utils.add)(p2, transform);
    // 射线法线与线段法线求叉积, 判断是否互相平行
    const rayNormal = Object(utils.normal)(ray.direction);
    const segmentNormal = Object(utils.normal)({
      x: p1.x - p2.x,
      y: p1.y - p2.y,
    });
    const denominator = Object(utils.cross)(rayNormal, segmentNormal);
    // 平行则无交点
    if (denominator === 0) {
      return null;
    }
    // 求线段两点在射线法线方向上的投影
    const distP1 = Object(utils.dot)(rayNormal, p1);
    const distP2 = Object(utils.dot)(rayNormal, p2);
    // 投影都为正/负则无交点
    if (distP1 * distP2 > 0) {
      return null;
    }
    // 联立线段与射线所在的直线方程求交点
    // 这里用的是直线方程的一般式: Ax + By + C = 0
    const a0 = ray.direction.y;
    const b0 = ray.direction.x;
    const c0 = Object(utils.cross)(ray.startPoint, zeroPoint);
    const a1 = p1.y - p2.y;
    const b1 = p1.x - p2.x;
    const c1 = Object(utils.cross)(p1, p2);
    const D = a0 * b1 - a1 * b0;
    const insectPoint = {
      x: (b0 * c1 - b1 * c0) / D,
      y: ((a1 * c0 - a0 * c1) / D) * -1, // Y 坐标轴正方向向下所以要取反
    };
    // 判断所得交点是否在射线起点后方(射线方向得反方向)
    if (Object(utils.dot)(insectPoint, ray.direction) < 0) {
      return null;
    }
    return Object(utils.add)(insectPoint, ray.startPoint);
  },
  // 对给定的 svg path 进行射线检测
  rayCast(shape, ray) {
    const { path: shapePath, transform: shapeTransform } = shape;
    ray.direction = Object(utils.normalize)(ray.direction);
    const polygon = Util.shapePolygon(shapePath);
    if (shapeTransform) {
      const { scale, translate } = shapeTransform;
      polygon.forEach((point) => {
        if (scale) {
          point.x = point.x * scale.scaleX;
          point.y = point.y * scale.scaleY;
        }
        if (translate) {
          point.x += translate.x;
          point.y += translate.y;
        }
      });
    }
    let insectPoint = null;
    let minDistance = Infinity;
    for (let i = 1; i < polygon.length; i++) {
      const p = Util.lineSegmentRayCast(polygon[i - 1], polygon[i], ray);
      if (!p) {
        continue;
      }
      const d = Object(utils.distance)(p, ray.startPoint);
      if (d < minDistance) {
        minDistance = d;
        const { x, y } = Object(utils.normalize)(
          Object(utils.sub)(polygon[i], polygon[i - 1])
        );
        insectPoint = Object.assign(Object.assign({}, p), {
          tangentX: x,
          tangentY: y,
        });
      }
    }
    return insectPoint;
  },
  // 对给定 branch 执行射线检测, 判断射线是否触碰到 branch, 并返回触碰交点或 null
  // 射线由 射线发射点(rayStartPoint) 和 射线发射方向(rayDirection) 组成
  branchRayCast(branchView, rayStartPoint, rayDirection) {
    let _a;
    rayDirection = Object(utils.normalize)(rayDirection);
    const shapePath =
      (_a = branchView.topicView) === null || _a === undefined
        ? undefined
        : _a.figure.topicShapeFillPath;
    if (!shapePath) {
      return null;
    }
    const realPosition = Object.assign({}, branchView.getRealPosition());
    let transform = undefined;
    if (branchView.topicView.figure.shapeClass === TOPICSHAPE.CLOUD) {
      const { scaleX, scaleY, x, y } =
        branchView.topicView.topicShapeFill.transform();
      transform = {
        scale: {
          scaleX,
          scaleY,
        },
        translate: {
          x,
          y,
        },
      };
    }
    const currentStartPoint = Object(utils.sub)(rayStartPoint, realPosition);
    let resultPoint = Util.rayCast(
      {
        path: shapePath,
        transform: transform,
      },
      {
        startPoint: currentStartPoint,
        direction: rayDirection,
      }
    );
    if (!resultPoint) {
      return resultPoint;
    }
    resultPoint = Object.assign(
      Object.assign({}, resultPoint),
      Object(utils.add)(realPosition, resultPoint)
    );
    return resultPoint;
  },
  boundaryRayCast(boundaryView, rayStartPoint, rayDirection) {
    rayDirection = Object(utils.normalize)(rayDirection);
    const shapePath = boundaryView.figure.boundaryPath;
    if (!shapePath) {
      return null;
    }
    let realPosition = Object.assign({}, boundaryView.getRealPosition());
    const boundaryShapeSize = boundaryView.figure.boundaryShapeSize;
    // boundary的bbox中心点在其shape左上角顶点
    realPosition = {
      x: realPosition.x + boundaryShapeSize.width / 2,
      y: realPosition.y + boundaryShapeSize.height / 2,
    };
    const transform = {
      translate: {
        x: -(boundaryShapeSize.width / 2),
        y: -(boundaryShapeSize.height / 2),
      },
    };
    const currentStartPoint = Object(utils.sub)(rayStartPoint, realPosition);
    let resultPoint = Util.rayCast(
      {
        path: shapePath,
        transform: transform,
      },
      {
        startPoint: currentStartPoint,
        direction: rayDirection,
      }
    );
    if (!resultPoint) {
      return resultPoint;
    }
    resultPoint = Object.assign(
      Object.assign({}, resultPoint),
      Object(utils.add)(realPosition, resultPoint)
    );
    return resultPoint;
  },
  getRelationshipOffsetPoint(targetView, intersectPoint, controlPoint, offset) {
    let controlPointNormal = Object(utils.normalize)(
      Object(utils.sub)(controlPoint, intersectPoint)
    );
    const intersectionNormal = Util.getIntersectionNormal(
      targetView,
      intersectPoint,
      {
        x: intersectPoint.tangentX,
        y: intersectPoint.tangentY,
      }
    );
    const dotResult = Object(utils.dot)(controlPointNormal, intersectionNormal); // -1 <= dotResult <= 1
    if (dotResult < 0) {
      controlPointNormal = Object(utils.reflect)(
        controlPointNormal,
        intersectionNormal
      );
    }
    let offsetPoint = Object(utils.add)(
      intersectPoint,
      Object(utils.normalize)(
        controlPointNormal,
        offset * ((dotResult + 1) / 2)
      )
    );
    let rayCastResult = null;
    if (targetView.type === VIEW_TYPE.BOUNDARY) {
      rayCastResult = Util.boundaryRayCast(
        targetView,
        intersectPoint,
        controlPointNormal
      );
    } else if (targetView.type === VIEW_TYPE.BRANCH) {
      rayCastResult = Util.branchRayCast(
        targetView,
        intersectPoint,
        controlPointNormal
      );
    }
    // 处理图形凹陷处的特殊情况
    if (rayCastResult) {
      const rayCastNormal = Util.getIntersectionNormal(
        targetView,
        rayCastResult,
        {
          x: rayCastResult.tangentX,
          y: rayCastResult.tangentY,
        }
      );
      const currentRayPoint = Object.assign({}, rayCastResult);
      const ratio =
        Math.abs(Object(utils.dot)(intersectionNormal, controlPointNormal)) /
        (Math.abs(Object(utils.dot)(intersectionNormal, controlPointNormal)) +
          Math.abs(Object(utils.dot)(rayCastNormal, controlPointNormal)));
      if (
        Object(commonUtils.getPointDistance)(intersectPoint, currentRayPoint) <=
        offset / ratio
      ) {
        offsetPoint = Object(utils.add)(
          intersectPoint,
          Object(utils.normalize)(
            controlPointNormal,
            Object(commonUtils.getPointDistance)(
              intersectPoint,
              currentRayPoint
            ) * ratio
          )
        );
      }
    }
    return offsetPoint;
  },
  getWindowSize: function () {
    let winWidth;
    let winHeight;
    // 获取窗口宽度
    if (window.innerWidth) {
      winWidth = window.innerWidth;
    } else if (document.body && document.body.clientWidth) {
      winWidth = document.body.clientWidth;
    }
    // 获取窗口高度
    if (window.innerHeight) {
      winHeight = window.innerHeight;
    } else if (document.body && document.body.clientHeight) {
      winHeight = document.body.clientHeight;
    }
    // 通过深入 Document 内部对 body 进行检测，获取窗口大小
    if (
      document.documentElement &&
      document.documentElement.clientHeight &&
      document.documentElement.clientWidth
    ) {
      winHeight = document.documentElement.clientHeight;
      winWidth = document.documentElement.clientWidth;
    }
    return {
      winWidth: winWidth,
      winHeight: winHeight,
    };
  },
  isIntersection: function (branchView, cloneG) {
    let rbox1;
    let rbox2;
    let isIntersection = false;
    function inside(border1, border2) {
      if (
        (!(border2.x < border1.x) ||
          !(border2.x + border2.width < border1.x)) &&
        (!(border2.x > border1.x + border1.width) ||
          !(border2.x + border2.width > border1.x + border1.width)) &&
        (!(border2.y < border1.y) ||
          !(border2.y + border2.height < border1.y)) &&
        (!(border2.y > border1.y + border1.height) ||
          !(border2.y + border2.height > border1.y + border1.height))
      ) {
        return true;
      }
      return false;
    }
    if (branchView.type === "branch") {
      rbox1 = branchView.topicView.topicGroup.rbox();
      rbox2 = cloneG.rbox();
      if (inside(rbox1, rbox2)) {
        isIntersection = true;
      }
    }
    return isIntersection;
  },
  //branch中topicshape上不包含infoitemcard部分的bound，坐标相对centralBranch.
  _getTopicShapeRealBound(branch) {
    let bound = branch.topicView.shapeBounds;
    const { rotation, cx, cy } = branch.topicView.topicGroup.trans;
    if (rotation) {
      bound = boundUtils.rotate(bound, rotation, cx, cy);
    }
    const position = branch.getRealPosition();
    const realBound = {
      x: bound.x + position.x,
      y: bound.y + position.y,
      width: bound.width,
      height: bound.height,
    };
    return realBound;
  },
  isTopicIntersectWithPoint: function (branch, point) {
    if (branch.type === "branch") {
      const realBound = Util._getTopicShapeRealBound(branch);
      if (Util.isBoundIntersectWithPoint(realBound, point)) {
        return true;
      }
    }
    return false;
  },
  isBoundIntersectWithPoint: function (bound, point) {
    return (
      point.x > bound.x &&
      point.x < bound.x + bound.width &&
      point.y > bound.y &&
      point.y < bound.y + bound.height
    );
  },
  calcDirectionInTopic(branch, point) {
    const realBound = Util._getTopicShapeRealBound(branch);
    const x0 = realBound.x;
    const x1 = x0 + realBound.width / 4;
    const x2 = x1 + realBound.width / 2;
    const y0 = realBound.y;
    const y1 = y0 + realBound.height / 2;
    if (point.x < x1) {
      return "left";
    }
    if (point.x > x2) {
      return "right";
    }
    if (point.y > y1) {
      return "bottom";
    }
    return "top";
  },
  isSelected(branchView, selectBox, direction) {
    // 平衡图 needs to be treat specially
    const borderInTest = {
      "org.xmind.ui.map.clockwise": true,
      "org.xmind.ui.map.anticlockwise": true,
      "org.xmind.ui.map": true,
      "org.xmind.ui.map.unbalanced": true,
    };
    const type = branchView.parent().structureClass in borderInTest ? 1 : 0;
    if (borderTest(type)) {
      branchView.onMouseover();
      return true;
    } else {
      branchView.onMouseout();
    }
    function borderTest(type) {
      const box1 = branchView.topicView.topicGroup.rbox();
      const box2 = selectBox.figure.renderWorker.selectBox.rbox();
      const test = direction === "UD" ? ["y", "height"] : ["x", "width"];
      const t0 = test[0];
      const t1 = test[1];
      let cp1;
      let cp2;
      const directIn =
        box2[t0] < box1[t0] + box1[t1] / 2 &&
        box2[t0] + box2[t1] > box1[t0] + box1[t1] / 2;
      if (type === 0) {
        return directIn;
      } else {
        // 通过计算两个矩形中心坐标与其两者宽与高的关系来确定是否相交
        cp1 = [box1.x + box1.width / 2, box1.y + box1.height / 2];
        cp2 = [box2.x + box2.width / 2, box2.y + box2.height / 2];
        const borderIn =
          Math.abs(cp1[0] - cp2[0]) <= (box1.width + box2.width) / 2 &&
          Math.abs(cp1[1] - cp2[1]) <= (box1.height + box2.height) / 2;
        return directIn && borderIn;
      }
    }
  },
  /**
   * 判断两矩形相交
   * 用两矩形的共同外廓是否大于两矩形分别的长宽
   * @param rbox1
   * @param rbox2
   */
  isBoxIntersect: function (rbox1, rbox2) {
    const outWidth =
      (rbox1.x2 > rbox2.x2 ? rbox1.x2 : rbox2.x2) -
      (rbox1.x < rbox2.x ? rbox1.x : rbox2.x);
    const outHeight =
      (rbox1.y2 > rbox2.y2 ? rbox1.y2 : rbox2.y2) -
      (rbox1.y < rbox2.y ? rbox1.y : rbox2.y);
    return (
      outHeight < rbox1.height + rbox2.height &&
      outWidth < rbox1.width + rbox2.width
    );
  },
  cloneMarker: function (markerView) {
    const markerGroup = markerView.editDomain().content().getCloneG();
    const cloneMarkerView = markerView.markerImage.clone();
    // if(markerGroup.get(0)){
    //   // markerGroup.clear();
    // } else {
    markerGroup.add(cloneMarkerView);
    // }
    return markerGroup;
  },
  cloneImage: function (imageView) {
    const ImageGroup = imageView.editDomain().content().getCloneG();
    const cloneImageView = imageView.image.clone();
    // if(ImageGroup.get(0)){
    //   // ImageGroup.clear();
    // } else {
    ImageGroup.add(cloneImageView);
    // }
    return ImageGroup;
  },
  getNumberText: function (format, index) {
    let number = "";
    let mapping;
    let result;
    let keys;
    let ordA;
    let ordZ;
    let len;
    switch (format) {
      case NUMBERFORMAT.ARABIC:
        number += index;
        break;
      case NUMBERFORMAT.ROMAN:
        mapping = {
          1000: "M",
          900: "CM",
          500: "D",
          400: "CD",
          100: "C",
          90: "XC",
          50: "L",
          40: "XL",
          10: "X",
          9: "IX",
          5: "V",
          4: "IV",
          1: "I",
        };
        result = [];
        keys = underscore.keys(mapping).reverse();
        underscore.each(keys, (k) => {
          const div = Math.floor(index / k);
          const mod = index % k;
          Object(underscore)(div).times(() => {
            result.push(mapping[k]);
          });
          index = mod;
        });
        number = result.join("");
        break;
      case NUMBERFORMAT.LOWERCASE:
        ordA = "a".charCodeAt(0);
        ordZ = "z".charCodeAt(0);
        len = ordZ - ordA + 1;
        while (index >= 0) {
          number = String.fromCharCode((index % len) + ordA - 1) + number;
          index = Math.floor(index / len) - 1;
        }
        break;
      case NUMBERFORMAT.UPPERCASE:
        ordA = "A".charCodeAt(0);
        ordZ = "Z".charCodeAt(0);
        len = ordZ - ordA + 1;
        while (index >= 0) {
          number = String.fromCharCode((index % len) + ordA - 1) + number;
          index = Math.floor(index / len) - 1;
        }
        break;
      default:
        break;
    }
    return number;
  },
  capitalizeEachWord: function (str) {
    /**
     * This regex is for franch character support.
     * see: https://gitlab.xmind.cn/xmind/snowbrush/merge_requests/623
     */
    return str.replace(/[a-z0-9_àâäçéèêëîïôûùüÿñæœ]\S*/gi, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },
  newton: function (coefs, x) {
    const max = 10000;
    const eps = 1e-8;
    if (!coefs && coefs.length <= 1) {
      return;
    }
    let current = x;
    let last = current;
    let sig = 1;
    let i = 0;
    while (Math.abs(sig) > eps) {
      i++;
      if (i >= max) {
        break;
      }
      current = last - this.f(coefs, last) / this.df(coefs, last);
      sig = current - last;
      last = current;
    }
    return current;
  },
  f: function (coefs, x) {
    let y = 0;
    const length = coefs.length;
    let i;
    for (i = 0; i < length; i++) {
      y += coefs[i] * Math.pow(x, length - 1 - i);
    }
    return y;
  },
  df: function (coefs, x) {
    let y = 0;
    const length = coefs.length;
    let i;
    for (i = 0; i < length; i++) {
      y += coefs[i] * (length - 1 - i) * Math.pow(x, coefs.length - 2 - i);
    }
    return y;
  },
  /**
   * @description 判断某个点是否在多边形内部
   * @deprecated 请使用pointutils.isPointInPolygon
   */
  pointInPolygon: function (point, polygonPoints) {
    let i;
    let j = polygonPoints.length - 1;
    let oddNodes = false;
    const x = point.x;
    const y = point.y;
    let iPoint;
    let jPoint;
    for (i = 0; i < polygonPoints.length; i++) {
      iPoint = polygonPoints[i];
      jPoint = polygonPoints[j];
      if (
        ((iPoint.y < y && jPoint.y >= y) || (jPoint.y < y && iPoint.y >= y)) &&
        (iPoint.x <= x || jPoint.x <= x)
      ) {
        if (
          iPoint.x +
            ((y - iPoint.y) / (jPoint.y - iPoint.y)) * (jPoint.x - iPoint.x) <
          x
        ) {
          oddNodes = !oddNodes;
        }
      }
      j = i;
    }
    return oddNodes;
  },
  /**
   * @description 凸包算法 还不知道算法效率级别
   * @param {x:number,y:number}[] points
   * @deprecated use pointUtils.convexHull
   * @returns {Array}
   */
  convexHull: function (points) {
    points = points.slice();
    points.sort((a, b) => {
      if (a.x !== b.x) {
        return a.x - b.x;
      } else {
        return a.y - b.y;
      }
    });
    const n = points.length;
    const hull = [];
    for (let i = 0; i < n * 2; i++) {
      const j = i < n ? i : n * 2 - 1 - i;
      while (
        hull.length >= 2 &&
        removeMiddle(hull[hull.length - 2], hull[hull.length - 1], points[j])
      ) {
        hull.pop();
      }
      hull.push(points[j]);
    }
    hull.pop();
    return hull;
    function removeMiddle(a, b, c) {
      const cross = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
      const dot = (a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y);
      return cross < 0 || (cross === 0 && dot <= 0);
    }
  },
  setFillColor: function (svgView, path, fillData, fillGradient) {
    if (!fillGradient && path.remember("fillGradient")) {
      path.remember("fillGradient").remove();
      path.forget("fillGradient");
    }
    if (fillGradient) {
      Util._setGradientFill(svgView, path, fillGradient);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const isGradient = svgView.content().isGradient();
    if (fillData === "none" || fillData === "$none$") {
      path.attr({
        opacity: 0,
      });
    }
    // else if (isGradient) {
    //   Util._setAutoGradient(svgView, path, fillData)
    // }
    else {
      path.attr({
        fill: fillData,
        stroke: "none",
        opacity: 1,
      });
    }
    return this;
  },
  /**
   *
   * @param {*} svgView
   * @param {*} path
   * @param {direction: number; stops: {color:string; offset:number; opacity:number}[] } gradient
   */
  _setGradientFill(svgView, path, gradient) {
    const svgDoc = svgView.svg;
    const gradientDef = Util.setGradient(svgDoc, path, gradient);
    if (gradientDef) {
      path.attr({
        fill: gradientDef,
      });
    }
  },
  _setAutoGradient(svgView, path, fillData) {
    const svg = svgView.svg;
    const startHsb = mommonFuncs.hexToHsb(fillData);
    const endHsb = underscore.extend({}, startHsb);
    let gradient;
    startHsb.B = Math.min(startHsb.B + 0.05, 1);
    endHsb.B = Math.max(endHsb.B - 0.05, 0);
    const startHex = mommonFuncs.hsbToHex(startHsb.H, startHsb.S, startHsb.B);
    const endHex = mommonFuncs.hsbToHex(endHsb.H, endHsb.S, endHsb.B);
    if (!path.remember("gradient")) {
      gradient = svg.gradient("linear", (stop) => {
        stop.at(0, startHex);
        stop.at(1, endHex);
      });
      gradient.from(0, 0).to(0, 1);
      path.remember("gradient", gradient);
    } else {
      gradient = path.remember("gradient");
      gradient.get(0).update(0, startHex);
      gradient.get(1).update(1, endHex);
    }
    path.attr({
      fill: gradient,
      stroke: "none",
      opacity: 1,
    });
  },
  //  * @param {direction: number; stops: {color:string; offset:number; opacity:number}[] } gradientDesc
  setGradient(svgDoc, path, gradientDesc) {
    const oldGradient = path.remember("borderGradient");
    //clear ref
    if (!gradientDesc && oldGradient) {
      oldGradient.remove();
      path.forget("borderGradient");
    }
    if (!gradientDesc) {
      return;
    }
    const { direction, stops } = gradientDesc;
    let gradientDef;
    if (oldGradient) {
      gradientDef = oldGradient;
    } else {
      gradientDef = svgDoc.gradient("linear");
    }
    gradientDef.update((stopCreator) => {
      stops.forEach((stopInfo) => {
        stopCreator.at(stopInfo);
      });
    });
    const sinA = Math.sin((direction * Math.PI) / 180);
    const cosA = Math.cos((direction * Math.PI) / 180);
    const x1 = 0.5 - cosA;
    const y1 = 0.5 - sinA;
    const x2 = 0.5 + cosA;
    const y2 = 0.5 + sinA;
    gradientDef.from(x1, y1).to(x2, y2);
    path.remember("borderGradient");
    return gradientDef;
  },
  getTransformedText(text, transform) {
    switch (transform) {
      case TEXTTRANSFORM.MANUAL:
        return text;
      case TEXTTRANSFORM.UPPERCASE:
        return text.toUpperCase();
      case TEXTTRANSFORM.LOWERCASE:
        return text.toLowerCase();
      case TEXTTRANSFORM.CAPITALIZE:
        return Util.capitalizeEachWord(text);
      default:
        return text;
    }
  },
  /**
   *
   * @param {legendData} legendData
   * @returns {Object} key is markerId, value
   */
  formUserMarkerIdMap(legendData) {
    return getUserMarkerIdMap(legendData);
  },
  getXapInData(dataObj, legendData) {
    const userMarkerIdMap = getUserMarkerIdMap(legendData);
    const asTopicResult = underscore.uniq(
      getXapInTopicData(dataObj, userMarkerIdMap),
      false,
      (item) => item.path.join("/")
    );
    const asImageResult = getXapInImageData(dataObj);
    const asMarkerResult = getXapInMarkerData(dataObj, userMarkerIdMap);
    return [...asTopicResult, ...asImageResult, ...asMarkerResult];
  },
  //TODO: add sheetbackground image
  getXapInSheetData(sheetData) {
    const userMarkerIdMap = getUserMarkerIdMap(sheetData.legend);
    const rootTopicResult = underscore.uniq(
      getXapInTopicData(sheetData.rootTopic, userMarkerIdMap),
      false,
      (item) => item.path.join("/")
    );
    return rootTopicResult.map((xapInfo) => {
      const path = xapInfo.path;
      if (path[0] !== "/") {
        path.unshift("rootTopic");
      }
      return xapInfo;
    });
  },
  isBase64Url(str) {
    return base64Reg.test(str);
  },
  /**
   *
   *
   * @param {Object} obj - plain JS object
   * @param {String[]} path - Array of String, are keys in Object
   * @param {Fnction} replaceFn
   */
  replaceValueInObject(obj, path, replaceFn) {
    if (path[0] === "/") {
      path = path.slice(1);
    }
    const result = path.reduce((result, key, index) => {
      if (index === path.length - 1) {
        return result;
      }
      return result[key];
    }, obj);
    const val = result[path[path.length - 1]];
    result[path[path.length - 1]] = replaceFn(val);
  },
  /**
   * base64 to Blob object
   * @param {any} b64Data
   * @param {any} contentType
   * @param {any} sliceSize
   * @returns
   */
  b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || "";
    sliceSize = sliceSize || 512;
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, {
      type: contentType,
    });
    return blob;
  },
  /**
   *
   * @param {any} proGeneratorArr
   * @param {Boolean} isEvery - true will return when catch error
   *                          false will return when success
   * @returns
   */
  promiseQueue(proGeneratorArr, isEvery = true) {
    return new Promise((resolve, reject) => {
      let i = -1;
      thenFn();
      function thenFn() {
        i++;
        const proGenerator = proGeneratorArr[i];
        if (isEvery) {
          if (proGenerator) {
            proGenerator().then(thenFn).catch(reject);
          } else {
            resolve(null);
          }
        } else if (proGenerator) {
          proGenerator()
            .then(() => resolve(null))
            .catch(thenFn);
        } else {
          reject();
        }
      }
    });
  },
  /**
   * @param {ArrayBuffer} buffer
   * @returns
   */
  arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },
  base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  },
  nextTick: (() => {
    const taskQueue = [];
    let isPending = true;
    return (fn) => {
      if (typeof fn !== "function") {
        return;
      }
      taskQueue.push(fn);
      if (isPending) {
        isPending = false;
        Promise.resolve().then(() => {
          isPending = true;
          const copies = taskQueue.slice(0);
          taskQueue.length = 0;
          for (let i = 0; i < copies.length; i++) {
            copies[i]();
          }
        });
      }
    };
  })(),
  /**
   * as its name
   * @param {{x: Number, y: Number}} ep1 end point 1
   * @param {{x: Number, y: Number}} ep2 end point 2
   * @param {{x: Number, y: Number}} cp1 control point 1
   * @param {{x: Number, y: Number}} cp2 control point 2
   * @returns
   */
  calcCubicBezierBoundingBox(ep1, ep2, cp1, cp2) {
    const { x: x0, y: y0 } = ep1;
    const { x: x1, y: y1 } = cp1;
    const { x: x2, y: y2 } = cp2;
    const { x: x3, y: y3 } = ep2;
    const tvalues = [];
    const xvalues = [];
    const yvalues = [];
    let a;
    let b;
    let c;
    let t;
    let t1;
    let t2;
    let b2ac;
    let sqrtb2ac;
    for (let i = 0; i < 2; ++i) {
      if (i === 0) {
        b = x0 * 6 - x1 * 12 + x2 * 6;
        a = x0 * -3 + x1 * 9 - x2 * 9 + x3 * 3;
        c = x1 * 3 - x0 * 3;
      } else {
        b = y0 * 6 - y1 * 12 + y2 * 6;
        a = y0 * -3 + y1 * 9 - y2 * 9 + y3 * 3;
        c = y1 * 3 - y0 * 3;
      }
      if (Math.abs(a) < 1e-12) {
        if (Math.abs(b) < 1e-12) {
          continue;
        }
        t = -c / b;
        if (t > 0 && t < 1) {
          tvalues.push(t);
        }
        continue;
      }
      b2ac = b * b - c * 4 * a;
      if (b2ac < 0) {
        continue;
      }
      sqrtb2ac = Math.sqrt(b2ac);
      t1 = (-b + sqrtb2ac) / (a * 2);
      if (t1 > 0 && t1 < 1) {
        tvalues.push(t1);
      }
      t2 = (-b - sqrtb2ac) / (a * 2);
      if (t2 > 0 && t2 < 1) {
        tvalues.push(t2);
      }
    }
    let j = tvalues.length;
    let mt;
    while (j--) {
      t = tvalues[j];
      mt = 1 - t;
      xvalues[j] =
        mt * mt * mt * x0 +
        mt * 3 * mt * t * x1 +
        mt * 3 * t * t * x2 +
        t * t * t * x3;
      yvalues[j] =
        mt * mt * mt * y0 +
        mt * 3 * mt * t * y1 +
        mt * 3 * t * t * y2 +
        t * t * t * y3;
    }
    xvalues.push(x0, x3);
    yvalues.push(y0, y3);
    const min = {
      x: Math.min.apply(0, xvalues),
      y: Math.min.apply(0, yvalues),
    };
    const max = {
      x: Math.max.apply(0, xvalues),
      y: Math.max.apply(0, yvalues),
    };
    return {
      x: min.x,
      y: min.y,
      width: Math.abs(max.x - min.x),
      height: Math.abs(max.y - min.y),
    };
  },
};
function getXapInImageData(imageData) {
  if (mommonFuncs.isXapResource(imageData.src)) {
    return [
      {
        path: ["src"],
        content: [imageData.src],
      },
    ];
  }
  return [];
}
function getXapInMarkerData(markerData, userMarkerIdMap) {
  if (userMarkerIdMap[markerData.markerId]) {
    return [
      {
        path: ["/", "legend", "markers", markerData.markerId, "resource"],
        content: userMarkerIdMap[markerData.markerId],
      },
    ];
  }
  return [];
}
/**
 * @param {Object} topicData
 * @param {Object} userMarkerIdMap key is userMarkerId, value is XAP
 * @returns
 */
function getXapInTopicData(topicData, userMarkerIdMap) {
  const result = getXapInTopicItSelf(topicData, userMarkerIdMap);
  let allChildrenResult = [];
  if (topicData.children) {
    const children = topicData.children;
    const getXapResultInChildren = (type) => {
      return (children[type] || []).reduce((arr, topic, index) => {
        return arr.concat(
          getXapInTopicData(topic, userMarkerIdMap).map((item) => {
            if (item.path[0] === "/") {
              return item;
            }
            item.path = ["children", type, index].concat(item.path);
            return item;
          })
        );
      }, []);
    };
    allChildrenResult = [
      ...getXapResultInChildren(TOPIC_TYPE.ATTACHED),
      ...getXapResultInChildren(TOPIC_TYPE.CALLOUT),
      ...getXapResultInChildren(TOPIC_TYPE.DETACHED),
      ...getXapResultInChildren(TOPIC_TYPE.SUMMARY),
    ];
  }
  return [...result, ...allChildrenResult];
}
/**
 * @param {Object} topicData
 * @param {Object} userMarkerIdMap key is userMarkerId, value is XAP
 * @returns
 */
function getXapInTopicItSelf(topicData, userMarkerIdMap) {
  const result = [];
  //href
  if (mommonFuncs.isXapResource(topicData.href)) {
    result.push({
      path: ["href"],
      content: topicData.href,
    });
  }
  //TODO: think about user marker
  if (topicData.markers) {
    topicData.markers.forEach((item) => {
      if (userMarkerIdMap[item.markerId]) {
        result.push({
          path: ["/", "legend", "markers", item.markerId, "resource"],
          content: userMarkerIdMap[item.markerId],
        });
      }
    });
  }
  //image
  if (topicData.image && mommonFuncs.isXapResource(topicData.image.src)) {
    result.push({
      path: ["image", "src"],
      content: topicData.image.src,
    });
  }
  //audio xap
  if (topicData.extensions) {
    topicData.extensions.forEach((item, index) => {
      if (
        item.resourceRefs &&
        mommonFuncs.isXapResource(item.resourceRefs[0])
      ) {
        result.push({
          path: ["extensions", index, "resourceRefs", 0],
          content: item.resourceRefs[0],
        });
      }
    });
  }
  //xap in note, [WARN] storage format is unstable
  if (
    topicData.notes &&
    topicData.notes.html &&
    topicData.notes.html.content &&
    topicData.notes.html.content.paragraphs
  ) {
    const paragraphs = topicData.notes.html.content.paragraphs;
    const notePath = ["notes", "html", "content", "paragraphs"];
    paragraphs.forEach((item, paraIndex) => {
      if (item.spans) {
        item.spans.forEach((span, spanIndex) => {
          if (mommonFuncs.isXapResource(span.image)) {
            result.push({
              path: notePath.concat([paraIndex, "spans", spanIndex, "image"]),
              content: span.image,
            });
          }
        });
      }
    });
  }
  return result;
}
/**
 *
 * @param {Object} legendData
 * @returns {Object} marker id map, key is markerId, value is xap resource
 */
function getUserMarkerIdMap(legendData) {
  const result = {};
  if (legendData && legendData.markers) {
    for (const markerId in legendData.markers) {
      const item = legendData.markers[markerId];
      if (mommonFuncs.isXapResource(item.resource)) {
        result[markerId] = item.resource;
      }
    }
  }
  return result;
}

export default Util;
