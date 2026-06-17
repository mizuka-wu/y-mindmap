/* eslint-disable @typescript-eslint/no-unused-vars */
import styleManager from "../../utils/business/stylemanager/index";
import BranchView from "../../view/branchview";
import { PlaceHolderBranchView } from "../svgdraggable/view/placeholderbranch";

import config from "../../common/config";
import * as constants from "../../common/constants/index";
import TopicView from "../../view/topicview";
import {
  BranchRebuildManager,
  getTargetIndex,
  showPolygon,
} from "../../utils/dragutils";
import { parseTopic } from "../../utils/business/parsetopic";
import BaseHandler from "./basehandler";
import * as lazyrunner from "../../figures/lazyrunner/index";
import * as pointutils from "../../utils/pointutils";
import * as utils from "../../utils/index";
import { forEachBranch, forEachBranchArray } from "./utils";
import { IndicatorView } from "../../view/indicatorview";

class PlaceHolderTopicView extends TopicView {
  get figureType() {
    return constants.FIGURE_TYPE.PLACE_HOLDER_TOPIC;
  }
}
class PlaceHolderManager {
  _placeholderBranchView: any;
  _context: any;
  constructor(context, oldParentBranchView) {
    this._placeholderBranchView = null;
    this._context = context;
  }
  _createPlaceHolderBranchView(label) {
    const modelData: any = {
      style: {
        type: "topic",
        properties: {
          [constants.STYLE_KEYS.SHAPE_CLASS]:
            "org.xmind.topicShape.roundedRect",
          [constants.STYLE_KEYS.FILL_COLOR]: "#2ebdff",
          [constants.STYLE_KEYS.LINE_COLOR]: "#2ebdff",
          [constants.STYLE_KEYS.BORDER_LINE_COLOR]: "#2ebdff",
          [constants.STYLE_KEYS.BORDER_LINE_WIDTH]: "0px",
          [constants.STYLE_KEYS.FONT_SIZE]: "12pt",
        },
      },
      customWidth: 60,
    };
    // label 需要用来在matrix里帮助palceholder准确定位
    if (label) {
      modelData.labels = label.trim().split(",");
    }
    /** @type {TopicModel} */
    const model = Object(parseTopic)(modelData, this._context.getSheetModel());
    this._placeholderBranchView = new PlaceHolderBranchView(
      new PlaceHolderTopicView(model),
      model,
    );
  }
  getPlaceHolderBranchView() {
    return this._placeholderBranchView;
  }
  attachTo(parentBranchView, options) {
    this._createPlaceHolderBranchView(options.label ?? "");
    if (options.addToRight) {
      this._placeholderBranchView.isAttachToUnbalanceRight = true;
      parentBranchView.setUnbalanceRightNumber(
        parentBranchView.figure.unbalanceRightNumber + 1,
      );
    }
    parentBranchView.addChildBranch(this._placeholderBranchView, {
      at: options.index,
    });
    if (options.position) {
      const isFreePositionEnabled = this._context.model.isFreePositionEnabled();
      if (
        isFreePositionEnabled &&
        Object(utils.isRootBranch)(parentBranchView)
      ) {
        this._placeholderBranchView.model.isFree = () => true;
        this._placeholderBranchView.model.changePosition(options.position);
      }
    }
  }
  detach() {
    if (!this._placeholderBranchView) {
      return;
    }
    const parentBranchView = this._placeholderBranchView.parent();
    if (parentBranchView) {
      parentBranchView.removeChildBranch(this._placeholderBranchView);
      if (this._placeholderBranchView.isAttachToUnbalanceRight) {
        parentBranchView.setUnbalanceRightNumber(
          parentBranchView.figure.unbalanceRightNumber - 1,
        );
      }
    }
    this._placeholderBranchView = null;
  }
}
const OPACITY_WHEN_STABLE = 1;
const OPACITY_WHEN_DRAGGING = 0.5;
export class BranchDragHandler extends BaseHandler {
  indicatorView: IndicatorView;
  _startedMatrixCellInfo: any;
  _droppedMatrixCellInfo: any;
  _draggedViews: any[];
  _draggedViewOldIndex: any;
  _draggedViewOldParentView: any;
  _relatedDraggingViewsSet: Set<unknown>;
  _draggedViewAttachDisabled: boolean;
  _draggedViewNewIndex: any;
  _draggedViewNewParentView: any;
  _isFreePositionBranch: boolean;
  _branchRebuildManager: any;
  _isCurrentAddToRight: boolean;
  _isDuplicate: boolean;
  _noChangeIfDropping: boolean;
  _isSelectionBranchStable: boolean;
  _isSelectionBranchStableDirty: boolean;
  _currentPolygon: any;
  context: any;
  constructor(context) {
    super(context);
    this.indicatorView = new IndicatorView();
    this._startedMatrixCellInfo = null;
    /**
     * @description matrix拖动环境下将会被挂载的matrixCellInfo信息
     * */
    this._droppedMatrixCellInfo = null;
    this._draggedViews = [];
    /**
     * @description 被拖拽的branch的初始index
     * @type {number}
     * */
    this._draggedViewOldIndex = null;
    /**
     * @description 被拖拽的branch的初始parentView，若branch是detached类型，则此值为null
     * @type {BranchView}
     * */
    this._draggedViewOldParentView = null;
    /**
     * @description record flattened selection branches when start dragging
     * when checking drop area during drag moving, we skip these branch.
     */
    this._relatedDraggingViewsSet = new Set();
    /**
     * @description 被拖拽的topic是否可以挂载到其它Topic上
     * @description 在free position的sheet图下，floating topic无法被挂载到任何topic上
     * @type {boolean}
     * */
    this._draggedViewAttachDisabled = false;
    /**
     * @description 被拖拽的branch的实时最新index
     * @type {number}
     * */
    this._draggedViewNewIndex = null;
    /**
     * @description 被拖拽的branch的实时最新parent
     * @type {BranchView}
     * */
    this._draggedViewNewParentView = null;
    /**
     * @description overwrite to true in FreePositionDragHandler
     * @type {Boolean}
     * */
    this._isFreePositionBranch = false;
    /**
     * @description branch重建管理
     * @type {BranchRebuildManager}
     * */
    this._branchRebuildManager = null;
    this._isCurrentAddToRight = false;
    this._isDuplicate = false;
    this._noChangeIfDropping = false;
    // use dirty check flag to avoid set visible value every time during drag move process
    this._isSelectionBranchStable = true;
    this._isSelectionBranchStableDirty = false;
    /**
     * @description 当前位置所处于的branch的响应区域坐标集合
     * @private
     * */
    this._currentPolygon = null;
  }
  dragStart(transferData) {
    this.context.trigger(constants.EVENTS.SE_BRANCH_DRAG_START);
    // 结束动画
    const animationManager = this.context.getModule(
      constants.MODULE_NAME.ANIMATION,
    );
    if (animationManager) {
      animationManager.killAnimationByFlag(
        constants.ANIMATION_FLAGS.BRANCH_ZOOM_IN,
      );
    } // 记录被拖拽对象branch的初始信息
    this._draggedViews = transferData.selections ?? [];
    this._draggedViewOldIndex = transferData.draggedView.branchIndex();
    this._draggedViewOldParentView = Object(utils.isDetachedBranch)(
      transferData.draggedView,
    )
      ? null
      : transferData.draggedView.parent();
    this._draggedViewAttachDisabled =
      this.context.getSheetModel().isFloatingTopicFlexible() &&
      styleManager.getClassName(transferData.draggedView) ===
        constants.CLASS_TYPE.FLOATING_TOPIC;
    this._isDuplicate = transferData.event.altKey;
    this._branchRebuildManager = new BranchRebuildManager(
      this.context,
      transferData,
      {
        isDuplicate: this._isDuplicate,
      },
    );
    this._relatedDraggingViewsSet = this._getRelatedDraggingViewsSet(
      this._draggedViews,
    );
    this._startedMatrixCellInfo = null;
    this._noChangeIfDropping = false;
    lazyrunner.lazyRunner.work(lazyrunner.runnerConstants.PRIORITY.AFTER_EACH, {
      execute: () => {
        this.context.getSVGView().eventBus.trigger("dragStart.dragManager");
      },
    });
    return transferData;
  }
  dragMoving(transferData) {
    // the branch on dragging could attached to another branch or not
    // user can temporarily reverse by press SHIFT
    const disableAttaching = transferData.keyPress.shiftKey
      ? !this._draggedViewAttachDisabled
      : this._draggedViewAttachDisabled;
    const { draggedView, dropView } = transferData;
    // 若 dropView 为 null，说明被拖拽 branch 没有处于任何 branch 的响应区域内
    const noDropView = dropView === null;
    if (disableAttaching || noDropView) {
      this.updatePlaceholder(dropView, -1, false);
      this._clearDropInfo();
      return;
    }
    // process dropping data
    const newIndex = getTargetIndex(
      dropView,
      this._currentPolygon,
      transferData.position,
    );
    const structure = dropView.getStructureClass();
    const isAnticlockwise = structure.match("anticlockwise");
    let isAddToRight = this._currentPolygon.side === "right";
    if (isAnticlockwise) {
      isAddToRight = !isAddToRight;
    }
    this.updatePlaceholder(dropView, newIndex, isAddToRight);
    this._draggedViewNewParentView = dropView;
    this._draggedViewNewIndex = newIndex;
    this._isCurrentAddToRight = isAddToRight;
  }
  dragCancel() {
    this._setIsSelectionBranchStable(true);
    this._clearDropInfo();
    this.context.trigger(constants.EVENTS.SE_BRANCH_DRAG_END);
    return true;
  }
  dragFinish(transferData) {
    this.context.trigger(constants.EVENTS.SE_BRANCH_DRAG_END);
    this._setIsSelectionBranchStable(true);
    this.indicatorView.clear();
    if (this._noChangeIfDropping) {
      return;
    }
    if (!this._draggedViewNewParentView) {
      // drop to generate floating topic(s)
      if (!this._isDuplicate) {
        this._draggedViews.forEach((view) => view.model.removeSelf());
      }
      config.get(constants.CONFIG.LOGGER).info(this._droppedMatrixCellInfo);
      this._branchRebuildManager.mountAsDetach(transferData.position);
    } else if (this._isFreePositionBranch) {
      // drop as free position topic(s)
      if (!this._isDuplicate) {
        this._draggedViews.forEach((view) => view.model.removeSelf());
      }
      this._branchRebuildManager.mountAsFreePosition(
        this._draggedViewNewParentView,
        {
          at: this._draggedViewNewIndex,
          type: constants.TOPIC_TYPE.ATTACHED,
          position: transferData.position,
          addToRight: this._isCurrentAddToRight,
        },
      );
    } else {
      // drop as attached topic(s)
      /**
       * The target index in TransferData will not make sense when more than 1 topics
       * were dragged, so we re-compute the target index before remove dragged
       * topic(s), and rebuild topics later.
       */
      const newIndex = this._getNewTargetIndex();
      if (!this._isDuplicate) {
        this._draggedViews.forEach((view) => view.model.removeSelf());
      }
      this._branchRebuildManager.mountAsAttach(this._draggedViewNewParentView, {
        at: newIndex,
        noAnimation: true,
        type: constants.TOPIC_TYPE.ATTACHED,
        addToRight: this._isCurrentAddToRight,
        droppedMatrixCellInfo: this._droppedMatrixCellInfo,
      });
    }
  }
  updatePlaceholder(dropView, index, addToRight) {
    this._noChangeIfDropping = this._predictIfResultIsStable(
      dropView,
      index,
      addToRight,
    );
    if (this._noChangeIfDropping) {
      this._setIsSelectionBranchStable(true);
      this.indicatorView.clear();
    } else {
      this._setIsSelectionBranchStable(false);
      if (dropView) {
        const opts: any = {
          index,
          addToRight,
          freePosition: null,
        };
        const structure = dropView.getStructureClass();
        if (structure.match("anticlockwise")) {
          opts.addToRight = !opts.addToRight;
        }
        opts.matrixDroppedCellInfo = this._droppedMatrixCellInfo;
        this.indicatorView.update(dropView, opts);
      } else {
        this.indicatorView.clear();
      }
    }
  }
  _traverseViews(
    branchViews,
    cb,
    childrenTypes = [
      constants.TOPIC_TYPE.ATTACHED,
      constants.TOPIC_TYPE.SUMMARY,
      constants.TOPIC_TYPE.CALLOUT,
    ],
  ) {
    branchViews.forEach((branchView) => {
      this._traverseViews(
        branchView.getChildrenBranchesByType(childrenTypes),
        cb,
      );
      cb(branchView);
    });
  }
  /**
   * This function must called after initialization of branch rebuild manager
   */
  _getRelatedDraggingViewsSet(selections) {
    // collect boundary & summary branch views
    const boundaryAndSummaryInfo =
      this._branchRebuildManager.getRelatedBoundaryAndSummaryInfo();
    const boundaryAndSummaryViews = boundaryAndSummaryInfo.map((info) => {
      if (info.type === constants.MODEL_TYPE.BOUNDARY) {
        return this.context.getComponentViewById(info.modelData.id);
      } else {
        return this.context.getComponentViewById(info.modelData.topicId);
      }
    });
    // collect branchviews
    const branchViews = [];
    const collect = (view) => branchViews.push(view);
    this._traverseViews(
      [
        ...selections,
        ...boundaryAndSummaryViews.filter((view) => view instanceof BranchView),
      ],
      collect,
    );
    return new Set([...branchViews, ...boundaryAndSummaryViews]);
  }
  _setIsSelectionBranchStable(isStable) {
    if (this._isSelectionBranchStable !== isStable) {
      this._isSelectionBranchStable = isStable;
      this._isSelectionBranchStableDirty = true;
    }
    if (this._isSelectionBranchStableDirty) {
      this._updateSelectionBranchOpacity();
      this._isSelectionBranchStableDirty = false;
    }
  }
  _updateSelectionBranchOpacity() {
    if (!this._isSelectionBranchStableDirty) {
      return;
    }
    const opacity = this._isSelectionBranchStable
      ? OPACITY_WHEN_STABLE
      : OPACITY_WHEN_DRAGGING;
    this._relatedDraggingViewsSet.forEach((view: any) => {
      view.figure.setOpacity(opacity);
      if (view instanceof BranchView && !this._draggedViews.includes(view)) {
        view.getConnectionView().figure.setOpacity(opacity);
      }
    });
  }
  _clearDropInfo() {
    this._draggedViewNewParentView = null;
    this._draggedViewNewIndex = null;
    this.indicatorView.clear();
  }
  _predictIfResultIsStable(dropView, dropIndex, isAddToRight) {
    if (this._draggedViews.length > 1) {
      return false;
    } else {
      const dropToSameParent = dropView === this._draggedViewOldParentView;
      const dropToSamePosition =
        dropIndex === -1 && this._draggedViewOldIndex === -1
          ? false
          : dropIndex === this._draggedViewOldIndex ||
            dropIndex === this._draggedViewOldIndex + 1;
      // For Matrix only
      const dropToSameLabel =
        this._startedMatrixCellInfo && this._droppedMatrixCellInfo
          ? this._startedMatrixCellInfo.label ===
            this._droppedMatrixCellInfo.label
          : true;
      // handle special case of map-like structure
      if (
        dropView === null || dropView === undefined
          ? undefined
          : dropView.isMapLike()
      ) {
        const rightSideEndIndex =
          dropView.getStructureClass() ===
          constants.STRUCTURECLASS.MAPUNBALANCED
            ? Number(dropView.figure.unbalanceRightNumber)
            : Number(dropView.figure.balanceRightNumber);
        const isFromLeftBottom =
          this._draggedViewOldIndex === rightSideEndIndex;
        const isFromRightBottom =
          this._draggedViewOldIndex === rightSideEndIndex - 1;
        const isDropToRightBottom =
          dropIndex === rightSideEndIndex && isAddToRight;
        const isDropToLeftBottom =
          dropIndex === rightSideEndIndex && !isAddToRight;
        const fromBottomToBottom =
          (isFromRightBottom && isDropToLeftBottom) ||
          (isFromLeftBottom && isDropToRightBottom);
        return dropToSameParent && !fromBottomToBottom && dropToSamePosition;
      }
      return dropToSameParent && dropToSamePosition && dropToSameLabel;
    }
  }
  /** @private */
  _traverseMatrix(transferData) {
    // 只有在matrix拖动环境下，cellInfo才有意义
    this._droppedMatrixCellInfo = null;
    const { position: dragMouseRealPosition } = transferData;
    forEachBranch(this.centralBranch, (branchView) => {
      if (branchView.isPlaceHolderView) {
        return;
      }
      const matrixView = branchView.getMatrixView();
      if (!matrixView || !matrixView.figure.isVisible) {
        return;
      }
      const cellInfo = matrixView.getCellByPos(dragMouseRealPosition);
      if (!cellInfo) {
        return;
      }
      if (!this._startedMatrixCellInfo) {
        this._startedMatrixCellInfo = cellInfo;
      }
      this._droppedMatrixCellInfo = cellInfo;
    });
  }
  // centralBranch(centralBranch: any, arg1: (branchView: any) => void) {
  //   throw new Error("Method not implemented.");
  // }
  /**
   * @description 获取拖拽目标View，于dragManager的dragMoving方法中调用
   * */
  getDragOverView(transferData) {
    // update cellInfo
    this._traverseMatrix(transferData);
    // dragMouseRealPosition 拖拽阴影相对于centralBranch中心点的相对位置
    const { position: dragMouseRealPosition } = transferData;
    let rootView = this.centralBranch;
    // for show branch only mode.
    const atbv = this.context.getSheetView().activatedTopBranchView;
    if (atbv) {
      rootView = atbv;
    }
    const rootViewList = this._droppedMatrixCellInfo
      ? this._droppedMatrixCellInfo.items
      : [rootView];
    let targetView = null;
    const checkIsInBranchPolygonArea = (branchView) => {
      // 跳过this._draggedViewNewParentView为null的情况
      if (!branchView) {
        return false;
      }
      // 跳过place holder
      if (branchView.isPlaceHolderView) {
        return false;
      }
      // skip callout branch
      if (Object(utils.isCalloutBranch)(branchView)) {
        return false;
      }
      // 跳过正在被拖拽的对象 branch 以及所有的子 branch
      if (this._relatedDraggingViewsSet.has(branchView)) {
        return false;
      }
      showPolygon(branchView);
      const basedPosition = branchView.getRealPosition();
      const cloneViewToBranchRelativePos = Object(utils.relativePositionFor)(
        dragMouseRealPosition,
        basedPosition,
      );
      // 下面判断是否和多边形判断区相交
      let polygon;
      const polygonPointsArray = branchView.getPolyPointsArr();
      for (const item of polygonPointsArray) {
        const isIntersection = pointutils.isPointInPolygon(
          cloneViewToBranchRelativePos,
          item.pointList,
        );
        if (isIntersection) {
          polygon = item;
          break;
        }
      }
      if (polygon) {
        this._currentPolygon = polygon;
        targetView = branchView;
        return true;
      } else {
        return false;
      }
    };
    // see https://hq.xmind.cn:30000/xmind/snowbrush/issues/146
    forEachBranchArray(rootViewList, checkIsInBranchPolygonArea);
    // Matrix case
    if (this._droppedMatrixCellInfo && targetView === null) {
      const polygon = {
        side: null,
        relatedBranchViewList: this._droppedMatrixCellInfo.items,
      };
      targetView = this._droppedMatrixCellInfo.headBranch;
      this._currentPolygon = polygon;
    }
    return targetView;
  }
  /**
   * Called before removing dragged branch.
   *
   * Since dragged topic(s) not been removed at drag start, the target index generated during
   * dragging can't using in drag finish stage, so we re-calculate the REAL target index the
   * topic(s) will be dropped to.
   */
  _getNewTargetIndex() {
    if (this._draggedViews.length > 1) {
      const children =
        this._draggedViewNewParentView.getChildrenBranchesByType();
      const sortedRestChildrenIndex = children
        .filter((child) => !this._draggedViews.includes(child))
        .map((child) => child.branchIndex())
        .sort((a, b) => a - b);
      // find out the index of topic index which it should insert before
      for (let i = 0; i < sortedRestChildrenIndex.length; i++) {
        if (sortedRestChildrenIndex[i] >= this._draggedViewNewIndex) {
          return i;
        }
      }
      return sortedRestChildrenIndex.length;
    } else if (
      this._draggedViewNewParentView !== this._draggedViewOldParentView
    ) {
      return this._draggedViewNewIndex;
    } else if (this._draggedViewNewIndex > this._draggedViewOldIndex) {
      return this._draggedViewNewIndex - 1;
    } else {
      return this._draggedViewNewIndex;
    }
  }
}

export default BranchDragHandler;
