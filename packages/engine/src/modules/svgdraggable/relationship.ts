import {
  TOPIC_TYPE,
  MODULE_NAME,
  EVENTS,
  RELATIONSHIPSHAPE,
} from "../../common/constants/index";
import * as commonUtils from "../../common/utils/index";
import Util from "../../util";
import * as utils from "../../utils/index";
import * as pointUtils from "../../utils/pointutils";
import BoundaryView from "../../view/boundaryview";
import { getRelationshipLineType } from "../../render/relationshiplinetype";

enum ControlPointEnum {
  startPoint = "0",
  endPoint = "1",
}

const POLYGON_PADDING = 60;
const MAGNET_RATIO = POLYGON_PADDING * 0.7;
const allTopicTypeList = [
  TOPIC_TYPE.ATTACHED,
  TOPIC_TYPE.DETACHED,
  TOPIC_TYPE.CALLOUT,
  TOPIC_TYPE.SUMMARY,
];
function setDragEndMaskStyle($mask) {
  $mask.hide();
}
/* harmony default export */
export class Relationship {
  init(relationshipView) {
    this.bindControlDraggable(relationshipView);
    this.bindEndDraggable(relationshipView);
    this.getAllBoundaryPolygonData(relationshipView);
  }
  getAllBranchViewList(relationshipView) {
    const centralBranchView = relationshipView
      .getContext()
      .getSheetView()
      .getCentralBranchView();
    const branchViewList = [
      centralBranchView,
      ...centralBranchView.getDescendantBranchesByType(allTopicTypeList),
    ];
    return branchViewList;
  }
  getAllBoundayViewList(relationshipView) {
    const allView = relationshipView.getContext().getSVGView().model2View;
    const allBoundayViewList = Object.values(allView).filter(
      (view) => view instanceof BoundaryView,
    );
    return allBoundayViewList;
  }
  filterHiddenView(polygon) {
    return polygon.filter((item) => !item.targetView.shouldHide());
  }
  // 遍历所有 branch view 并计算每一个对应的感应区, 所有感应区都简化为矩形
  getAllTopicPolygonData(relationshipView, hasBoundary) {
    const allBranchViewList = this.getAllBranchViewList(relationshipView);
    const result = allBranchViewList.map((branch) => {
      const pos = branch.getRealPosition();
      const { x, y, width, height } = branch.topicView.bounds;
      const { boundaryBounds } = branch;
      // 在 boundary 内的 topic, 感应区不能超出 boundaryBounds
      if (hasBoundary && Object(utils.isInBoundary)(branch)) {
        return {
          targetView: branch,
          pointList: [
            {
              x: pos.x + Math.max(x - POLYGON_PADDING, boundaryBounds.x),
              y: pos.y + Math.max(y - POLYGON_PADDING, boundaryBounds.y),
            },
            {
              x:
                pos.x +
                Math.min(
                  x + width + POLYGON_PADDING,
                  boundaryBounds.x + boundaryBounds.width,
                ),
              y: pos.y + Math.max(y - POLYGON_PADDING, boundaryBounds.y),
            },
            {
              x:
                pos.x +
                Math.min(
                  x + width + POLYGON_PADDING,
                  boundaryBounds.x + boundaryBounds.width,
                ),
              y:
                pos.y +
                Math.min(
                  y + height + POLYGON_PADDING,
                  boundaryBounds.y + boundaryBounds.height,
                ),
            },
            {
              x: pos.x + Math.max(x - POLYGON_PADDING, boundaryBounds.x),
              y:
                pos.y +
                Math.min(
                  y + height + POLYGON_PADDING,
                  boundaryBounds.y + boundaryBounds.height,
                ),
            },
          ],
        };
      } else {
        return {
          targetView: branch,
          pointList: [
            {
              x: pos.x + x - POLYGON_PADDING,
              y: pos.y + y - POLYGON_PADDING,
            },
            {
              x: pos.x + x + width + POLYGON_PADDING,
              y: pos.y + y - POLYGON_PADDING,
            },
            {
              x: pos.x + x + width + POLYGON_PADDING,
              y: pos.y + y + height + POLYGON_PADDING,
            },
            {
              x: pos.x + x - POLYGON_PADDING,
              y: pos.y + y + height + POLYGON_PADDING,
            },
          ],
        };
      }
    });
    return result;
  }
  getAllBoundaryPolygonData(relationshipView) {
    const allBoundaryViewList = this.getAllBoundayViewList(relationshipView);
    const result = allBoundaryViewList.map((boundary) => {
      const { BOUNDARYGAP } = utils.layoutConstant;
      const INNERGAP = BOUNDARYGAP + 5;
      const OUTERGAP = BOUNDARYGAP + 5;
      const { size } = boundary;
      const halfWidth = size.width / 2;
      const halfHeight = size.height / 2;
      const pos = Object(pointUtils.add)(boundary.getRealPosition(), {
        x: halfWidth,
        y: halfHeight,
      });
      return {
        targetView: boundary,
        pointList: [
          {
            x: pos.x - halfWidth - OUTERGAP,
            y: pos.y - halfHeight - OUTERGAP,
          },
          {
            x: pos.x + halfWidth + OUTERGAP,
            y: pos.y - halfHeight - OUTERGAP,
          },
          {
            x: pos.x + halfWidth + OUTERGAP,
            y: pos.y + halfHeight + OUTERGAP,
          },
          {
            x: pos.x - halfWidth - OUTERGAP,
            y: pos.y + halfHeight + OUTERGAP,
          },
        ],
        innerPointList: [
          {
            x: pos.x - halfWidth + INNERGAP,
            y: pos.y - halfHeight + INNERGAP,
          },
          {
            x: pos.x + halfWidth - INNERGAP,
            y: pos.y - halfHeight + INNERGAP,
          },
          {
            x: pos.x + halfWidth - INNERGAP,
            y: pos.y + halfHeight - INNERGAP,
          },
          {
            x: pos.x - halfWidth + INNERGAP,
            y: pos.y + halfHeight - INNERGAP,
          },
        ],
      };
    });
    return result;
  }
  getRelationshipLineType(relationshipView) {
    return relationshipView.figure.lineStyle;
  }
  // 计算给定的 position 是否"贴近"某个 topic , 并返回交点等数据, 主要用于判断是否磁吸
  getInPolygonIntersection(type, relationshipView, position, polygonList) {
    let intersection: any | null = null;
    for (let i = 0; i < polygonList.length; i++) {
      const polygonItem = polygonList[i];
      // 利用感应区快速过滤出可能"贴近"的 topic 或 boundary
      const isIntersection =
        polygonItem.innerPointList &&
        Object(pointUtils.isPointInPolygon)(
          position,
          polygonItem.innerPointList,
        )
          ? false
          : Object(pointUtils.isPointInPolygon)(
              position,
              polygonItem.pointList,
            );
      // 对于可能"贴近"的 topic 或 boundary 分别计算精确的交点
      if (isIntersection) {
        const { targetView } = polygonItem;
        const realPos = targetView.getRealPosition();
        const originInsectPos = Util.topicInsectLine(targetView, position);
        const relativeDistance = Object(pointUtils.normalize)(
          relationshipView[
            type === "start" ? "relativeDistance1" : "relativeDistance2"
          ],
        );
        const offset = relationshipView.getBranchOffset(type, targetView);
        const insectPos = Util.getRelationshipOffsetPoint(
          targetView,
          originInsectPos,
          Object(pointUtils.add)(originInsectPos, relativeDistance),
          offset,
        );
        const insectDistance = Object(commonUtils.getPointDistance)(
          originInsectPos,
          realPos,
        );
        const mouseDistance = Object(commonUtils.getPointDistance)(
          position,
          realPos,
        );
        const distance = mouseDistance - insectDistance;
        // 最后挑选出距离 position 最近的一组数据返回
        if (!intersection || distance < intersection.distance) {
          intersection = {
            targetView,
            distance,
            insectPos,
            originInsectPos,
          };
        }
      }
    }
    return intersection;
  }
  dragEndPoint1(
    view,
    insectPoint1,
    insectPoint2,
    controlPoint1,
    controlPoint2,
  ) {
    const lineType = this.getRelationshipLineType(view);
    Object(getRelationshipLineType)(lineType).updatePath(
      view,
      insectPoint1,
      insectPoint2,
      controlPoint1,
      controlPoint2,
    );
    view.renderTitleText({
      insectPoint1,
      insectPoint2,
      controlPoint1: controlPoint1,
      controlPoint2: controlPoint2,
    });
    view.startPoint1Package.translate(insectPoint1.x, insectPoint1.y);
    const controlLine1Path = `M ${insectPoint1.x} ${insectPoint1.y}L ${controlPoint1.x} ${controlPoint1.y}`;
    view.controlPoint1Package.translate(controlPoint1.x, controlPoint1.y);
    view.setControlLine1Path(controlLine1Path);
  }
  dragEndPoint2(
    view,
    insectPoint1,
    insectPoint2,
    controlPoint1,
    controlPoint2,
  ) {
    const lineType = this.getRelationshipLineType(view);
    Object(getRelationshipLineType)(lineType).updatePath(
      view,
      insectPoint1,
      insectPoint2,
      controlPoint1,
      controlPoint2,
    );
    view.renderTitleText({
      insectPoint1,
      insectPoint2,
      controlPoint1: controlPoint1,
      controlPoint2: controlPoint2,
    });
    view.startPoint2Package.translate(insectPoint2.x, insectPoint2.y);
    const controlLine2Path = `M ${insectPoint2.x} ${insectPoint2.y}L ${controlPoint2.x} ${controlPoint2.y}`;
    view.controlPoint2Package.translate(controlPoint2.x, controlPoint2.y);
    view.setControlLine2Path(controlLine2Path);
  }
  // 针对 zigzag 业务的调整方法
  // 为了避免逻辑代码太过散乱, zigzag 拖动过程中相关的业务逻辑都归类到该方法
  fixZigzagControlPoint(
    type,
    view,
    mousePoint,
    controlPoint,
    // 假如 controlPoint 是 controlPoint1 (起点的 controlPoint )
    anotherControlPoint,
    // 那么 anotherControlPoint 就是 controlPoint2 ( 终点的 controlPoint ), 下同
    insectPoint,
    anotherInsectPoint,
    needRayCast = false, // 拖动控制点时, 需要执行射线检测, 用于调整端点位置
  ) {
    let originInsectPoint = Object.assign({}, insectPoint);
    const isStartPoint = type === ControlPointEnum.startPoint;
    if (needRayCast) {
      const branchView = isStartPoint ? view.end1View : view.end2View;
      const realPos = branchView.getRealPosition();
      const rayDirection = this.getRayDirection(controlPoint, realPos);
      const rayCastResult = Util.branchRayCast(
        branchView,
        controlPoint,
        rayDirection,
      );
      if (rayCastResult) {
        originInsectPoint = Object.assign({}, rayCastResult);
        const offset = view.getBranchOffset(
          isStartPoint ? "start" : "end",
          branchView,
        );
        const point = Object(pointUtils.add)(
          rayCastResult,
          Object(pointUtils.normalize)(
            Object(pointUtils.reverse)(rayDirection),
            offset,
          ),
        );
        // 调整端点为射线检测结果
        Object.assign(insectPoint, point);
        view[isStartPoint ? "startPoint1Package" : "startPoint2Package"]
          .cx(insectPoint.x)
          .cy(insectPoint.y);
      }
    }
    const diffPoint = Object(pointUtils.diff)(mousePoint, insectPoint);
    // 计算 zigzag 控制点与端点的连线方向(水平或垂直)
    if (Math.abs(diffPoint.x) > Math.abs(diffPoint.y)) {
      controlPoint.x = mousePoint.x;
      controlPoint.y = insectPoint.y;
      anotherControlPoint.x = mousePoint.x;
      anotherControlPoint.y = anotherInsectPoint.y;
    } else {
      controlPoint.x = insectPoint.x;
      controlPoint.y = mousePoint.y;
      anotherControlPoint.x = anotherInsectPoint.x;
      anotherControlPoint.y = mousePoint.y;
    }
    // 调整两个控制点在同一 水平/垂直 线上
    view[
      isStartPoint ? "controlPoint1Package" : "controlPoint2Package"
    ].translate(controlPoint.x, controlPoint.y);
    view[
      isStartPoint ? "controlPoint2Package" : "controlPoint1Package"
    ].translate(anotherControlPoint.x, anotherControlPoint.y);
    // 更新非当前控制点对应 line path
    const controlLinePath = `M ${anotherInsectPoint.x} ${anotherInsectPoint.y}L ${anotherControlPoint.x} ${anotherControlPoint.y}`;
    view[isStartPoint ? "setControlLine2Path" : "setControlLine1Path"](
      controlLinePath,
    );
    return originInsectPoint;
  }
  getRayDirection(controlPoint, realPosition) {
    const diffPoint = Object(pointUtils.diff)(controlPoint, realPosition);
    let rayDirection: { x: number; y: number } | null = null;
    if (Math.abs(diffPoint.x) < Math.abs(diffPoint.y)) {
      rayDirection = {
        x: 0,
        y: diffPoint.y < 0 ? -1 : 1,
      };
    } else {
      rayDirection = {
        x: diffPoint.x < 0 ? -1 : 1,
        y: 0,
      };
    }
    return rayDirection;
  }
  updateAllPosition(view, type, lineEndPoint, controlPoint, startPoint) {
    view.model.changeLineEndPosition({
      [type]: {
        x: lineEndPoint.x - startPoint.x,
        y: lineEndPoint.y - startPoint.y,
      },
    });
    view.model.changeControlPosition({
      [type]: {
        x: controlPoint.x - startPoint.x,
        y: controlPoint.y - startPoint.y,
      },
    });
  }
  bindControlDraggable(relationshipView) {
    // relationship 关联的两个 branch view 的 real position
    let startPos;
    let endPos; // 控制点
    let controlPoint1;
    let controlPoint2; // 端点
    let lineEndPoint1;
    let lineEndPoint2; // relationship 端点与 topic 中心的连线在 topic shape 上的交点(用于储存到 model 中)
    let originInsectPoint1;
    let originInsectPoint2; // originInsectPoint 加上 offset 后的坐标(主要用于拖动时显示端点位置)
    let insectPoint1;
    let insectPoint2;
    const view = relationshipView;
    let lineType;
    const svgDraggableModule = relationshipView.getModule(
      MODULE_NAME.SVG_DRAGGABLE,
    );
    if (!svgDraggableModule) {
      return;
    }
    const updateInfoBeforeMove = () => {
      const { end1View, end2View } = view;
      startPos =
        end1View === null || end1View === undefined
          ? undefined
          : end1View.getRealPosition();
      endPos =
        end2View === null || end2View === undefined
          ? undefined
          : end2View.getRealPosition();
      ({
        insectPoint1,
        insectPoint2,
        controlPoint1,
        controlPoint2,
        lineEndPoint1,
        lineEndPoint2,
      } = view.posInfo);
      lineType = this.getRelationshipLineType(view);
      const selectionManager = view
        .getContext()
        .getModule(MODULE_NAME.SELECTION);
      if (!selectionManager.getSelections().includes(view)) {
        selectionManager.selectSingle(view);
      }
      view.setPointerEventsNone(true);
      relationshipView
        .getContext()
        .trigger(EVENTS.RELATIONSHIP_CONTROL_POINT_DRAG_START);
    };
    // 兼容旧文件, 没有端点数据时创建端点数据并写入 model
    const createEndPositionDataBeforeMove = () => {
      if (!view.model.hasFullLineEndPositionData()) {
        const { lineEndPoint1, lineEndPoint2 } = view.posInfo;
        view.model.changeLineEndPosition({
          [ControlPointEnum.startPoint]: Object(pointUtils.sub)(
            lineEndPoint1,
            startPos,
          ),
          [ControlPointEnum.endPoint]: Object(pointUtils.sub)(
            lineEndPoint2,
            endPos,
          ),
        });
      }
    };
    // 为控制点1添加可拖拽
    svgDraggableModule
      .draggable(view.controlPoint1Package, {
        draggingMask: true,
      })
      .dragStart(() => {
        updateInfoBeforeMove();
        createEndPositionDataBeforeMove();
        view.setIsDraggingControlPoint1(true);
      })
      .dragMove((info) => {
        const { x, y } = info;
        controlPoint1.x = x;
        controlPoint1.y = y;
        // 根据拖动的控制点获取交点
        if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
          originInsectPoint1 = this.fixZigzagControlPoint(
            ControlPointEnum.startPoint,
            view,
            {
              x,
              y,
            },
            controlPoint1,
            controlPoint2,
            insectPoint1,
            insectPoint2,
            true,
          );
        } else {
          const { x, y, tangentX, tangentY } =
            view.intersectOriginPointWithTopic("start", lineEndPoint1);
          originInsectPoint1 = {
            x,
            y,
          };
          insectPoint1 = view.applyIntersectOriginPointOffset(
            "start",
            {
              x,
              y,
              tangentX,
              tangentY,
            },
            controlPoint1,
          );
        }
        // 即时更新 relationship 相关的显示数据, path / title / 端点位置 等等
        Object(getRelationshipLineType)(lineType).updatePath(
          view,
          insectPoint1,
          insectPoint2,
          controlPoint1,
          controlPoint2,
        );
        view.renderTitleText({
          insectPoint1,
          insectPoint2,
          controlPoint1: controlPoint1,
          controlPoint2: controlPoint2,
        });
        view.startPoint1Package.translate(insectPoint1.x, insectPoint1.y);
        view.relativeDistance1 = {
          x: controlPoint1.x - insectPoint1.x,
          y: controlPoint1.y - insectPoint1.y,
        };
        const controlLine1Path = `M ${insectPoint1.x} ${insectPoint1.y}L ${controlPoint1.x} ${controlPoint1.y}`;
        view.setControlLine1Path(controlLine1Path);
      })
      .dragEnd(() => {
        setDragEndMaskStyle(view.callService("getViewPortCover"));
        view.setIsDraggingControlPoint1(false);
        view.model.changeControlPosition({
          [ControlPointEnum.startPoint]: {
            x: controlPoint1.x - startPos.x,
            y: controlPoint1.y - startPos.y,
          },
        });
        // zigzag 线形其中一个点移动了会影响到其他点的位置
        if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
          view.model.changeControlPosition({
            [ControlPointEnum.endPoint]: {
              x: controlPoint2.x - endPos.x,
              y: controlPoint2.y - endPos.y,
            },
          });
          view.model.changeLineEndPosition({
            [ControlPointEnum.startPoint]: Object(pointUtils.sub)(
              originInsectPoint1,
              startPos,
            ),
          });
        }
        view.setPointerEventsNone(false);
        relationshipView
          .getContext()
          .trigger(EVENTS.RELATIONSHIP_CONTROL_POINT_DRAG_END);
      });
    // 为控制点2添加可拖拽
    svgDraggableModule
      .draggable(view.controlPoint2Package, {
        draggingMask: true,
      })
      .dragStart(() => {
        updateInfoBeforeMove();
        createEndPositionDataBeforeMove();
        view.setIsDraggingControlPoint2(true);
      })
      .dragMove((info) => {
        const { x, y } = info;
        controlPoint2.x = x;
        controlPoint2.y = y;
        if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
          originInsectPoint2 = this.fixZigzagControlPoint(
            ControlPointEnum.endPoint,
            view,
            {
              x,
              y,
            },
            controlPoint2,
            controlPoint1,
            insectPoint2,
            insectPoint1,
            true,
          );
        } else {
          const { x, y, tangentX, tangentY } =
            view.intersectOriginPointWithTopic("end", lineEndPoint2);
          originInsectPoint2 = {
            x,
            y,
          };
          insectPoint2 = view.applyIntersectOriginPointOffset(
            "end",
            {
              x,
              y,
              tangentX,
              tangentY,
            },
            controlPoint2,
          );
        }
        Object(getRelationshipLineType)(lineType).updatePath(
          view,
          insectPoint1,
          insectPoint2,
          controlPoint1,
          controlPoint2,
        );
        view.renderTitleText({
          insectPoint1,
          insectPoint2,
          controlPoint1: controlPoint1,
          controlPoint2: controlPoint2,
        });
        view.startPoint2Package.translate(insectPoint2.x, insectPoint2.y);
        view.relativeDistance2 = {
          x: controlPoint2.x - insectPoint2.x,
          y: controlPoint2.y - insectPoint2.y,
        };
        const controlLine2Path = `M ${insectPoint2.x} ${insectPoint2.y}L ${controlPoint2.x} ${controlPoint2.y}`;
        view.setControlLine2Path(controlLine2Path);
      })
      .dragEnd(() => {
        setDragEndMaskStyle(view.callService("getViewPortCover"));
        view.setIsDraggingControlPoint2(false);
        view.model.changeControlPosition({
          [ControlPointEnum.endPoint]: {
            x: controlPoint2.x - endPos.x,
            y: controlPoint2.y - endPos.y,
          },
        });
        if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
          view.model.changeControlPosition({
            [ControlPointEnum.startPoint]: {
              x: controlPoint1.x - startPos.x,
              y: controlPoint1.y - startPos.y,
            },
          });
          view.model.changeLineEndPosition({
            [ControlPointEnum.endPoint]: Object(pointUtils.sub)(
              originInsectPoint2,
              endPos,
            ),
          });
        }
        view.setPointerEventsNone(false);
        relationshipView
          .getContext()
          .trigger(EVENTS.RELATIONSHIP_CONTROL_POINT_DRAG_END);
      });
  }
  bindEndDraggable(relationshipView) {
    // relationship 关联的两个 branch view 的 real position
    let startPos;
    let endPos; // 交点, 控制点, 端点
    let insectPoint1;
    let insectPoint2;
    let controlPoint1;
    let controlPoint2;
    let lineEndPoint1;
    let lineEndPoint2; // 上一轮设置的 控制点 和 端点
    let lastControlPoint1;
    let lastControlPoint2;
    let lastLineEndPoint1;
    let lastLineEndPoint2; // 所有 topic 的磁吸感应区
    let allBranchPolygon;
    // 所有 boundary 的磁吸感应区
    let allBoundaryPolygon;
    let intersection: any = null;
    // 是否"非磁吸"
    let isNoMagnet = true;
    // relationship 链接线形
    let lineType;
    const view = relationshipView;
    const svgDraggableModule = relationshipView.getModule(
      MODULE_NAME.SVG_DRAGGABLE,
    );
    if (!svgDraggableModule) {
      return;
    }
    const updateInfoBeforeMove = () => {
      const { end1View, end2View } = view;
      startPos =
        end1View === null || end1View === undefined
          ? undefined
          : end1View.getRealPosition();
      endPos =
        end2View === null || end2View === undefined
          ? undefined
          : end2View.getRealPosition();
      ({
        insectPoint1,
        insectPoint2,
        controlPoint1,
        controlPoint2,
        lineEndPoint1,
        lineEndPoint2,
      } = view.posInfo);
      lineType = this.getRelationshipLineType(view);
      lastControlPoint1 = Object.assign({}, controlPoint1);
      lastControlPoint2 = Object.assign({}, controlPoint2);
      lastLineEndPoint1 = Object.assign({}, lineEndPoint1);
      lastLineEndPoint2 = Object.assign({}, lineEndPoint2);
      const selectionManager = view
        .getContext()
        .getModule(MODULE_NAME.SELECTION);
      if (!selectionManager.getSelections().includes(view)) {
        selectionManager.selectSingle(view);
      }
      // 每次拖动开始时, 计算感应区并缓存
      allBoundaryPolygon = this.filterHiddenView(
        this.getAllBoundaryPolygonData(relationshipView),
      );
      allBranchPolygon = this.filterHiddenView(
        this.getAllTopicPolygonData(
          relationshipView,
          !!allBoundaryPolygon.length,
        ),
      );
      view.setPointerEventsNone(true);
    };
    // 端点1可拖拽
    svgDraggableModule
      .draggable(view.startPoint1Package, {})
      .dragStart(() => {
        updateInfoBeforeMove();
        view.setIsDraggingStartPoint1(true);
      })
      .dragMove((info) => {
        const { x, y } = info;
        // 端点拖拽时计算交点
        if (allBoundaryPolygon.length) {
          intersection = this.getInPolygonIntersection(
            "start",
            relationshipView,
            {
              x,
              y,
            },
            allBoundaryPolygon,
          );
        }
        if (!allBoundaryPolygon.length || !intersection) {
          intersection = this.getInPolygonIntersection(
            "start",
            relationshipView,
            {
              x,
              y,
            },
            allBranchPolygon,
          );
        }
        // 判断是否磁吸, 注意 isNoMagnet 代表非磁吸
        isNoMagnet =
          // 拖拽位置没有和 topic 区域相交
          !intersection ||
          // 相交但距离超过了磁吸最大允许距离
          intersection.distance > MAGNET_RATIO ||
          // 相交但目标 topic 已经被 relationship 链接
          intersection.targetView === view.end2View;
        controlPoint2 = {
          x: insectPoint2.x + view.relativeDistance2.x,
          y: insectPoint2.y + view.relativeDistance2.y,
        };
        if (isNoMagnet) {
          // 无磁吸时, 端点简单赋值为鼠标位置并更新显示
          controlPoint1 = {
            x: x + view.relativeDistance1.x,
            y: y + view.relativeDistance1.y,
          };
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.fixZigzagControlPoint(
              ControlPointEnum.startPoint,
              view,
              controlPoint1,
              controlPoint1,
              controlPoint2,
              {
                x,
                y,
              },
              insectPoint2,
            );
          }
          this.dragEndPoint1(
            view,
            {
              x,
              y,
            },
            insectPoint2,
            controlPoint1,
            controlPoint2,
          );
        } else {
          // 有磁吸时, 端点赋值为上面计算得到的交点, 并更新显示
          const { insectPos, originInsectPos } = intersection;
          insectPoint1 = insectPos;
          controlPoint1 = Object(pointUtils.add)(
            insectPoint1,
            view.relativeDistance1,
          );
          Object.assign(lineEndPoint1, originInsectPos);
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.fixZigzagControlPoint(
              ControlPointEnum.startPoint,
              view,
              controlPoint1,
              controlPoint1,
              controlPoint2,
              insectPoint1,
              insectPoint2,
            );
          }
          this.dragEndPoint1(
            view,
            insectPoint1,
            insectPoint2,
            controlPoint1,
            controlPoint2,
          );
        }
      })
      .dragEnd(() => {
        view.setPointerEventsNone(false);
        view.setIsDraggingStartPoint1(false);
        const dragEndBranch = intersection?.targetView;
        const isChangedEndBranch =
          dragEndBranch &&
          dragEndBranch !== view.end1View &&
          dragEndBranch !== view.end2View;
        if (isNoMagnet) {
          // 无磁吸结束拖拽时, 将各点位置设置为上一次的数据
          this.updateAllPosition(
            view,
            ControlPointEnum.startPoint,
            lastLineEndPoint1,
            lastControlPoint1,
            startPos,
          );
        } else if (isChangedEndBranch) {
          setTimeout(() => {
            const currentStartPos = dragEndBranch.getRealPosition();
            this.updateAllPosition(
              view,
              ControlPointEnum.startPoint,
              lineEndPoint1,
              controlPoint1,
              currentStartPos,
            );
            if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
              this.updateAllPosition(
                view,
                ControlPointEnum.endPoint,
                lineEndPoint2,
                controlPoint2,
                endPos,
              );
            }
            view.model.changeEndPoint({
              end1Id:
                dragEndBranch === null || dragEndBranch === undefined
                  ? undefined
                  : dragEndBranch.model.get("id"),
            });
          }, 0);
        } else {
          this.updateAllPosition(
            view,
            ControlPointEnum.startPoint,
            lineEndPoint1,
            controlPoint1,
            startPos,
          );
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.updateAllPosition(
              view,
              ControlPointEnum.endPoint,
              lineEndPoint2,
              controlPoint2,
              endPos,
            );
          }
        }
      });
    // 端点2可拖拽
    svgDraggableModule
      .draggable(view.startPoint2Package, {})
      .dragStart(() => {
        updateInfoBeforeMove();
        view.setIsDraggingStartPoint2(true);
      })
      .dragMove((info) => {
        const { x, y } = info;
        if (allBoundaryPolygon.length) {
          intersection = this.getInPolygonIntersection(
            "end",
            relationshipView,
            {
              x,
              y,
            },
            allBoundaryPolygon,
          );
        }
        if (!allBoundaryPolygon.length || !intersection) {
          intersection = this.getInPolygonIntersection(
            "end",
            relationshipView,
            {
              x,
              y,
            },
            allBranchPolygon,
          );
        }
        isNoMagnet =
          !intersection ||
          intersection.distance > MAGNET_RATIO ||
          intersection.targetView === view.end1View;
        controlPoint1 = {
          x: insectPoint1.x + view.relativeDistance1.x,
          y: insectPoint1.y + view.relativeDistance1.y,
        };
        if (isNoMagnet) {
          controlPoint2 = {
            x: x + view.relativeDistance2.x,
            y: y + view.relativeDistance2.y,
          };
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.fixZigzagControlPoint(
              ControlPointEnum.endPoint,
              view,
              controlPoint2,
              controlPoint2,
              controlPoint1,
              {
                x,
                y,
              },
              insectPoint1,
            );
          }
          this.dragEndPoint2(
            view,
            insectPoint1,
            {
              x,
              y,
            },
            controlPoint1,
            controlPoint2,
          );
        } else {
          const { insectPos, originInsectPos } = intersection;
          insectPoint2 = insectPos;
          controlPoint2 = Object(pointUtils.add)(
            insectPoint2,
            view.relativeDistance2,
          );
          Object.assign(lineEndPoint2, originInsectPos);
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.fixZigzagControlPoint(
              ControlPointEnum.endPoint,
              view,
              controlPoint2,
              controlPoint2,
              controlPoint1,
              insectPoint2,
              insectPoint1,
            );
          }
          this.dragEndPoint2(
            view,
            insectPoint1,
            insectPoint2,
            controlPoint1,
            controlPoint2,
          );
        }
      })
      .dragEnd(() => {
        view.setPointerEventsNone(false);
        view.setIsDraggingStartPoint2(false);
        const dragEndBranch = intersection?.targetView;
        const isChangedEndBranch =
          dragEndBranch &&
          dragEndBranch !== view.end1View &&
          dragEndBranch !== view.end2View;
        if (isNoMagnet) {
          this.updateAllPosition(
            view,
            ControlPointEnum.endPoint,
            lastLineEndPoint2,
            lastControlPoint2,
            endPos,
          );
        } else if (isChangedEndBranch) {
          setTimeout(() => {
            const currentEndPos = dragEndBranch.getRealPosition();
            this.updateAllPosition(
              view,
              ControlPointEnum.endPoint,
              lineEndPoint2,
              controlPoint2,
              currentEndPos,
            );
            if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
              this.updateAllPosition(
                view,
                ControlPointEnum.startPoint,
                lineEndPoint1,
                controlPoint1,
                startPos,
              );
            }
            view.model.changeEndPoint({
              end2Id:
                dragEndBranch === null || dragEndBranch === undefined
                  ? undefined
                  : dragEndBranch.model.get("id"),
            });
          }, 0);
        } else {
          this.updateAllPosition(
            view,
            ControlPointEnum.endPoint,
            lineEndPoint2,
            controlPoint2,
            endPos,
          );
          if (lineType === RELATIONSHIPSHAPE.ZIGZAG) {
            this.updateAllPosition(
              view,
              ControlPointEnum.startPoint,
              lineEndPoint1,
              controlPoint1,
              startPos,
            );
          }
        }
      });
  }
}

export default Relationship;
