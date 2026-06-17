import * as lib from "../lib/index";
import {
  MAP_LIKE_STRUCTURES,
  STRUCTURECLASS,
  ALL_DIRECTION,
  DIRECTION,
  CONFIG,
  TOPIC_TYPE,
  MODEL_TYPE,
  MASTER_RANGE,
} from "../common/constants/index";
import config from "../common/config";
import { parseTopic } from "./business/parsetopic";
import { rangeUtils } from "./rangeutils";
import * as pointutils from "./pointutils"; // EXTERNAL MODULE: ./js/utils/branch.ts
import * as utils_branch from "./branch"; // EXTERNAL MODULE: ./js/common/utils/index.ts + 4 modules
import * as utils from "../common/utils/index"; // EXTERNAL MODULE: ./js/mommonfuncs.ts
import mommonFuncs from "../mommonfuncs";
const DRAG_START_THRESHOLD = 5;
const IS_SHOW_POLYGON = false;
const getInsertIndex = (arr, v) => {
  let index = 0;
  arr.forEach((item, i) => {
    if (item < v) {
      index = i + 1;
    }
  });
  return index;
};
//filter central callout summary
//filter childrens
/**
 * @description 在branch周围显示拖拽识别多边形
 * @param {BranchView} branch
 * @param {Array} [points] 多边形关键点
 * */
export function showPolygon(branch, points?) {
  if (!IS_SHOW_POLYGON) {
    return;
  }
  const pointsList = points
    ? [
        {
          points,
        },
      ]
    : branch.getPolyPointsArr();
  pointsList.forEach((item, index) => {
    const points = [...item.points];
    if (points.length === 0) {
      return;
    }
    const startPoint = points.pop();
    let d = "M " + startPoint.x + " " + startPoint.y;
    points.forEach((item) => {
      d += " L " + item.x + " " + item.y;
    });
    d += " Z";
    if (branch[`_polygonPath_${index}`]) {
      branch[`_polygonPath_${index}`].remove();
      branch[`_polygonPath_${index}`] = null;
    }
    branch[`_polygonPath_${index}`] = branch.svg.put(new lib.SVG.Path());
    branch[`_polygonPath_${index}`].attr({
      d: d,
      stroke: "blue",
      fill: "none",
    });
  });
}
/**
 * 如果要看，请结合功能文档
 * @param targetBranchView 被拖拽的branch
 * @param polygon 多边形判断区，含relatedBranch
 * @param mouseRealPosition cloneG的位置
 * @returns {*}
 */
export function getTargetIndex(targetBranchView, polygon, mouseRealPosition) {
  const getRangeGrowthDirection = (relatedBranchViewList) => {
    const realIndex = relatedBranchViewList[0].branchIndex();
    return targetBranchView.getRangeGrowthDirection(realIndex);
  };
  const removePlaceHolderViewFromList = (list) => {
    const placeHolderIndex = list.findIndex((v) => v.isPlaceHolderView);
    if (placeHolderIndex !== -1) {
      list.splice(placeHolderIndex, 1);
    }
  };
  const targetBranchChildrenList = [
    ...targetBranchView.getChildrenBranchesByType(),
  ];
  removePlaceHolderViewFromList(targetBranchChildrenList);
  const polygonRelatedBranchList = [...polygon.relatedBranchViewList];
  removePlaceHolderViewFromList(polygonRelatedBranchList);
  if (polygonRelatedBranchList.length === 0) {
    const targetStructureClass = targetBranchView.getStructureClass();
    if (MAP_LIKE_STRUCTURES.includes(targetStructureClass)) {
      const isAntiClockwise =
        targetBranchView.getStructureClass() ===
        STRUCTURECLASS.MAPANTICLOCKWISE;
      if (
        (polygon.side === "right" && isAntiClockwise) ||
        (polygon.side === "left" && !isAntiClockwise)
      ) {
        return targetBranchChildrenList.length;
      } else {
        return 0;
      }
    } else if (Object(utils_branch.isFishBoneHead)(targetBranchView)) {
      if (polygon.side === ALL_DIRECTION.DOWN) {
        return targetBranchChildrenList.length;
      } else {
        return 0;
      }
    }
    return 0;
  } else {
    const rangeGrowthDirection = getRangeGrowthDirection(
      polygonRelatedBranchList,
    );
    // 获取需要用来对比位置的属性
    const attrToCompare =
      rangeGrowthDirection === DIRECTION.UP ||
      rangeGrowthDirection === DIRECTION.DOWN
        ? "y"
        : "x";
    const ng =
      rangeGrowthDirection === DIRECTION.DOWN ||
      rangeGrowthDirection === DIRECTION.RIGHT
        ? 1
        : -1;
    // get all info need for comparison
    const branchInfoList = polygonRelatedBranchList.map((branch) => {
      const branchIndex = targetBranchChildrenList.indexOf(branch);
      const pos = branch.getRealPosition();
      return {
        branchIndex,
        pos,
      };
    });
    // ascending order
    branchInfoList.sort((a, b) => a.branchIndex - b.branchIndex);
    // prepare for comparison
    const insertValue = mouseRealPosition[attrToCompare] * ng;
    const existValueList = branchInfoList
      .map((info) => info.pos[attrToCompare] * ng)
      // 比如在平衡图下，某个方向上的branch被挤到另一侧之后，它依然在polygonRelatedBranchList里
      // 但是它的位置不应该再参与index计算了，所以应该简单排除掉
      // 根本解决方案是直接在每次layout之后重新计算polygon的polygonRelatedBranchList
      .filter((value, index, list) => {
        if (index === 0) {
          return true;
        }
        return value > list[index - 1];
      });
    const index = getInsertIndex(existValueList, insertValue);
    const length = branchInfoList.length;
    if (index === length) {
      let resultIndex = branchInfoList[length - 1].branchIndex + 1;
      // fix fishbone head side result index
      if (Object(utils_branch.isFishBoneHead)(targetBranchView)) {
        const bottomSideIsNotEmpty =
          targetBranchView.getChildrenBranchesByType().length > 1;
        const hasNextBrotherInChildrenList =
          !!targetBranchView.getChildrenBranchesByType()[resultIndex];
        if (bottomSideIsNotEmpty && hasNextBrotherInChildrenList) {
          resultIndex = resultIndex + 1;
        }
      }
      return resultIndex;
    } else {
      return branchInfoList[index].branchIndex;
    }
  }
}
/**
 * @description 当鼠标拖拽移动超过阈值时触发 callback 函数，阈值为 DRAG_START_THRESHOLD
 * @param {event} event
 * @param {function} callBack 接收 event 的 client position
 * @param {SheetEditor} context
 */
export function dragThreshold(event, callBack, context) {
  const isUseTouch = event.type === "press";
  const eventClientPosition = context.getDragEventClientPosition(
    event,
    isUseTouch,
  );
  if (!eventClientPosition) {
    return config.get(CONFIG.LOGGER).error("寻找pointer失败");
  }
  const dragStartPosition = {
    x: eventClientPosition.x,
    y: eventClientPosition.y,
  };
  const moveEvent = isUseTouch ? "touchmove" : "mousemove";
  const moveEndEvent = isUseTouch ? "touchend" : "mouseup";
  // todo docDrag
  const onCursorMove = (e) => {
    e.preventDefault();
    const currentPointer = context.getDragEventClientPosition(e, isUseTouch);
    const dx = eventClientPosition.x - currentPointer.x;
    const dy = eventClientPosition.y - currentPointer.y;
    if (dx * dx + dy * dy >= DRAG_START_THRESHOLD * DRAG_START_THRESHOLD) {
      document.removeEventListener(moveEvent, onCursorMove);
      document.removeEventListener(moveEndEvent, onCursorMoveEnd);
      callBack(dragStartPosition);
    }
  };
  const onCursorMoveEnd = () => {
    document.removeEventListener(moveEvent, onCursorMove);
    document.removeEventListener(moveEndEvent, onCursorMoveEnd);
  };
  document.addEventListener(moveEvent, onCursorMove, {
    passive: false,
  });
  document.addEventListener(moveEndEvent, onCursorMoveEnd);
}
export class BranchRebuildManager {
  replaceIdMap: any;
  _context: any;
  _selections: any[];
  _options: any;
  _topicOriginDataList: any;
  _selectionsPositionMap: any;
  _relationShipOriginDataList: any;
  _startDragRealPosition: any;
  _isMountedAsDetach: boolean;
  _boundaryAndSummaryOriginInfoList: any[];
  _topicRebuildModelList: any[];
  _newParentBranchModel: any;
  _droppedMatrixCellInfo: any;
  /**
   * @param options.rememberSibilingRange see issue https://gitlab.xmind.cn/xmind/snowbrush/issues/528
   * @param options.isDuplicate
   */
  constructor(context, transferData, options = {}) {
    this.replaceIdMap = {};
    this._context = context;
    this._selections = [...transferData.selections];
    this._options = Object.assign({}, options);
    this._topicOriginDataList = this._selections.map((branchView) =>
      branchView.model.toJSON(),
    );
    this._selectionsPositionMap = {};
    this._saveSelectionsPositionMap();
    this._relationShipOriginDataList = this._context
      .getSheetModel()
      .relationships()
      .map((model) => model.toJSON());
    this._startDragRealPosition = Object.assign({}, transferData.position);
    this._isMountedAsDetach = false;
    this._boundaryAndSummaryOriginInfoList = [];
    this._saveSelectionsOwnBoundariesAndSummariesInfo();
    this._topicRebuildModelList = [];
    this._newParentBranchModel = null;
    this._droppedMatrixCellInfo = null;
  }
  /**
   * @description 挂载为floating topic
   * @public
   * */
  mountAsDetach(mouseEndRealPosition) {
    this._isMountedAsDetach = true;
    const positionOffset = pointutils.diff(
      this._startDragRealPosition,
      mouseEndRealPosition,
    );
    const newTopicModelList = this._getTopicRebuildModelList();
    newTopicModelList.forEach((model) => {
      const oldTopicId = Object.keys(this.replaceIdMap).find((oldId) => {
        return this.replaceIdMap[oldId] === model.id;
      });
      const oldPosition = this._selectionsPositionMap[oldTopicId || model.id];
      const newPosition = oldPosition
        ? pointutils.add(oldPosition, positionOffset)
        : mouseEndRealPosition;
      model.set("position", newPosition);
    });
    this._mount(
      this._context.getSheetView().centralBranchView,
      newTopicModelList,
      {
        noAnimation: true,
        type: TOPIC_TYPE.DETACHED,
      },
    );
  }
  /**
   * @description 挂载为子topic
   * @param parentBranchView
   * @param {Object} options
   * @param {number} options.at 作为attached结果，必然有这个参数
   * @param {boolean} options.addToRight 是否是挂载为unbalance右侧位置
   * @param options.droppedMatrixCellInfo （可能存在）被挂载到的matrixCell信息
   * @public
   * */
  mountAsAttach(parentBranchView, options) {
    const newTopicModelList = this._getTopicRebuildModelList();
    // 若存在matrixCell信息
    if (
      options.droppedMatrixCellInfo &&
      // 且headBranch就是即将被挂载到的new parent Branch
      options.droppedMatrixCellInfo.headBranch === parentBranchView
    ) {
      // 直接set，避免触发连锁
      newTopicModelList.forEach((model) => {
        model.set(
          "labels",
          options.droppedMatrixCellInfo.label.trim().split(","),
        );
      });
    }
    this._mount(parentBranchView, newTopicModelList, options);
  }
  /**
   * @param parentBranchView
   * @param {Object} options
   * @param {Position} options.position
   * @param {number} options.at
   * @param {boolean} options.addToRight
   * */
  mountAsFreePosition(parentBranchView, options) {
    const newTopicModelList = this._getTopicRebuildModelList();
    newTopicModelList.forEach((model) => {
      model.set("position", options.position);
    });
    this._mount(parentBranchView, newTopicModelList, options);
  }
  /**
   * @param {number} options.at
   * @param {boolean} options.addToRight
   * @private
   * */
  _mount(parentBranchView, newTopicModelList, options) {
    this._newParentBranchModel = parentBranchView.model;
    options.side = options.addToRight ? "right" : "left";
    [...newTopicModelList].reverse().forEach((model) => {
      parentBranchView.model.addChildTopic(model, options);
    });
    if (!this._isMountedAsDetach) {
      this._updateSelectBoxRange(
        parentBranchView,
        options.at,
        newTopicModelList.length,
      );
    }
    this._rebuildBoundaryAndSummary();
    this._rebuildRelationShip();
  }
  /** @private */
  _getTopicRebuildModelList() {
    if (!this._topicRebuildModelList.length) {
      this._topicRebuildModelList = this._topicOriginDataList.map(
        (jsonData) => {
          if (this._options.isDuplicate) {
            Object.assign(
              this.replaceIdMap,
              mommonFuncs.replaceId(jsonData, utils.UUID),
            );
          }
          return Object(parseTopic)(jsonData, this._context.getSheetModel());
        },
      );
    }
    return this._topicRebuildModelList;
  }
  /** @private */
  _saveSelectionsPositionMap() {
    this._selections.forEach((branchView) => {
      this._selectionsPositionMap[branchView.model.id] =
        branchView.getRealPosition();
    });
  }
  /** @private */
  _saveSelectionsOwnBoundariesAndSummariesInfo() {
    const infoMap = {};
    // 提取infoMap
    this._selections.forEach((branchView) => {
      /** @type {TopicModel} */
      const model = branchView.model;
      if (model.type() !== TOPIC_TYPE.ATTACHED) {
        return;
      }
      const parentTopicModel = model.parent();
      const parentModelCid = parentTopicModel.cid;
      const indexInParent = model.getIndexInParent();
      if (parentModelCid in infoMap) {
        infoMap[parentModelCid].childrenIndexList.push(indexInParent);
      } else {
        infoMap[parentModelCid] = {
          parentTopicModel: parentTopicModel,
          childrenIndexList: [indexInParent],
        };
      }
    });
    // 判断会被删除的summary和boundary
    const affectedRangeModelList = [];
    const infoList = Object.keys(infoMap).map(
      (parentModelCid) => infoMap[parentModelCid],
    );
    infoList.forEach((info) => {
      const { parentTopicModel, childrenIndexList } = info;
      const allSummaryModelList = parentTopicModel.summaries();
      const allBoundaryModelList = parentTopicModel.boundaries();
      const rangeModelList = [
        ...allSummaryModelList,
        ...allBoundaryModelList,
      ].filter((model) => {
        const selectedRangeList =
          rangeUtils.indexArrToRangeArr(childrenIndexList);
        return selectedRangeList.some((range) => {
          return rangeUtils.isSubRange(range, [
            model.rangeStart,
            model.rangeEnd,
          ]);
        });
      });
      affectedRangeModelList.push(...rangeModelList);
    });
    // 保存重建时候需要的boundary和summary的信息
    this._boundaryAndSummaryOriginInfoList = affectedRangeModelList.map(
      (model) => {
        const parentTopicModel = model.parent();
        const { rangeStart, rangeEnd, componentType } = model;
        const attachedTopicModelList = parentTopicModel.children();
        const startId = attachedTopicModelList[rangeStart].id;
        const endId = attachedTopicModelList[rangeEnd].id;
        let ownTopicData;
        if (componentType === MODEL_TYPE.SUMMARY) {
          const summaryTopicModelList = parentTopicModel.children(
            TOPIC_TYPE.SUMMARY,
          );
          ownTopicData = summaryTopicModelList
            .find(
              (summaryTopicModel) =>
                summaryTopicModel.getId() === model.get("topicId"),
            )
            .toJSON();
          if (this._options.isDuplicate) {
            Object.assign(
              this.replaceIdMap,
              mommonFuncs.replaceId(ownTopicData, utils.UUID),
            );
          }
        }
        const modelData = model.toJSON();
        if (this._options.isDuplicate) {
          modelData.id = Object(utils.UUID)();
        }
        return {
          type: componentType,
          startId,
          endId,
          modelData,
          ownTopicData,
        };
      },
    );
  }
  /** @private */
  _rebuildRelationShip() {
    const sheetModel = this._context.getSheetModel();
    const currentRelationShipDataMap = {};
    sheetModel.relationships().forEach((model) => {
      currentRelationShipDataMap[model.id] = model.toJSON();
    });
    const model2ViewMap = this._context.getSVGView().model2View;
    this._relationShipOriginDataList.forEach((data) => {
      if (this._options.isDuplicate) {
        data.end1Id = this.replaceIdMap[data.end1Id];
        data.end2Id = this.replaceIdMap[data.end2Id];
        if (!data.end1Id || !data.end2Id) {
          return;
        }
        data.id = Object(utils.UUID)();
        sheetModel.addRelationship(data);
      } else {
        const isEndViewExist =
          model2ViewMap[data.end1Id] && model2ViewMap[data.end2Id];
        if (!currentRelationShipDataMap[data.id] && isEndViewExist) {
          sheetModel.addRelationship(data);
        }
      }
    });
  }
  /** @private */
  _rebuildBoundaryAndSummary() {
    this._boundaryAndSummaryOriginInfoList.forEach((info) => {
      if (info.type === MODEL_TYPE.SUMMARY) {
        this._rebuildSummary(info);
      } else {
        this._rebuildBoundary(info);
      }
    });
    this._rebuildMasterBoundaryIntoNormal();
  }
  /** @private */
  _rebuildSummary(summaryRebuildInfo) {
    // floating topic上不会存在summary
    if (this._isMountedAsDetach) {
      return;
    }
    let { startId, endId } = summaryRebuildInfo;
    const { modelData, ownTopicData } = summaryRebuildInfo;
    if (this._options.isDuplicate) {
      startId = this.replaceIdMap[startId];
      endId = this.replaceIdMap[endId];
    }
    if (!this._newParentBranchModel) return;
    const startIndex = this._newParentBranchModel.getChildrenIndexById(startId);
    const endIndex = this._newParentBranchModel.getChildrenIndexById(endId);
    if (startIndex === -1 || endIndex === -1) {
      return config.get(CONFIG.LOGGER).error("rebuild summary error");
    }
    modelData.topicId = ownTopicData.id;
    modelData.range = `(${startIndex},${endIndex})`;
    const newSummaryTopicModel = Object(parseTopic)(
      ownTopicData,
      this._context.getSheetModel(),
    );
    this._newParentBranchModel.addSummary(
      modelData,
      null,
      newSummaryTopicModel,
    );
  }
  /** @private */
  _rebuildBoundary(boundaryRebuildInfo) {
    let { startId, endId } = boundaryRebuildInfo;
    const { modelData } = boundaryRebuildInfo;
    if (this._options.isDuplicate) {
      startId = this.replaceIdMap[startId];
      endId = this.replaceIdMap[endId];
    }
    // 若结果成了floating topic
    if (this._isMountedAsDetach) {
      // 只有range长度为1的时候才会保留boundary，否则boundary直接消失
      if (startId !== endId) {
        return;
      }
      modelData.range = MASTER_RANGE;
      const targetTopic = this._topicRebuildModelList.find(
        (model) => model.id === startId,
      );
      targetTopic.addBoundary(modelData);
    } else {
      const startIndex =
        this._newParentBranchModel.getChildrenIndexById(startId);
      const endIndex = this._newParentBranchModel.getChildrenIndexById(endId);
      if (startIndex === -1 || endIndex === -1) {
        return config.get(CONFIG.LOGGER).error("rebuild boundary error");
      }
      modelData.range = `(${startIndex},${endIndex})`;
      this._newParentBranchModel.addBoundary(modelData);
    }
  }
  /**
   * @description 当带有master boundary的free branch变成attached状态的时候，需要进入此流程
   * @private
   * */
  _rebuildMasterBoundaryIntoNormal() {
    if (this._isMountedAsDetach) {
      return;
    }
    const parentModel = this._newParentBranchModel;
    this._topicRebuildModelList.forEach((newTopicModel) => {
      const newTopicBoundariesModelList = newTopicModel.boundaries();
      const targetBoundaryModel = newTopicBoundariesModelList.find(
        (boundaryModel) => boundaryModel.getRange() === MASTER_RANGE,
      );
      if (targetBoundaryModel) {
        // 从该topic上移除master boundary数据
        newTopicModel.removeBoundary(targetBoundaryModel);
        // 在parent model上添加对应的boundary
        const startIndex = parentModel.getChildrenIndexById(
          newTopicModel.getId(),
        );
        targetBoundaryModel.setRange(`(${startIndex},${startIndex})`);
        parentModel.addBoundary(targetBoundaryModel);
      }
    });
  }
  /**
   * @description 拖拽结束后，如果被拖拽到的那个位置原来在summary或者boundary的包裹范围内，那么需要扩展range的范围
   * @private
   * */
  _updateSelectBoxRange(parentBranchView, targetIndex, insertCount) {
    const rangeViewList = [
      ...parentBranchView.boundaries,
      ...parentBranchView.summaries,
    ];
    rangeViewList.forEach((rangeView) => {
      let insertCountCopy = insertCount;
      if (targetIndex <= rangeView.model.rangeEnd) {
        const changeRangeMethodName =
          rangeView.type === "summary"
            ? "changeSummaryRange"
            : "changeBoundaryRange";
        // todo 为什么要用while?
        while (insertCountCopy--) {
          rangeView.model[changeRangeMethodName](targetIndex - 1);
        }
      }
    });
  }
  getRelatedBoundaryAndSummaryInfo() {
    return this._boundaryAndSummaryOriginInfoList;
  }
}
