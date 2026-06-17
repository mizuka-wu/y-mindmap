/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  MODULE_NAME,
  ANIMATION_FLAGS,
  TOPIC_TYPE,
} from "../../common/constants";
import { getTargetIndex } from "../../utils/dragutils";
import * as lazyrunner from "../../figures/lazyrunner/index";
import Util from "../../util";
import { BranchDragHandler } from "../draghandler/branchdraghandler";

export class FileDragHandler extends BranchDragHandler {
  context: any;
  _draggedViewNewParentView: any;
  _draggedViewNewIndex: any;
  _isCurrentAddToRight: boolean;
  indicatorView: any;
  constructor(context) {
    super(context);
  }
  dragStart(transferData) {
    // 结束动画
    const animationManager = this.context.getModule(MODULE_NAME.ANIMATION);
    if (animationManager) {
      animationManager.killAnimationByFlag(ANIMATION_FLAGS.BRANCH_ZOOM_IN);
    }
    lazyrunner.lazyRunner.work(lazyrunner.runnerConstants.PRIORITY.AFTER_EACH, {
      execute: () => {
        this.context.getSVGView().eventBus.trigger("dragStart.dragManager");
      },
    });
    return transferData;
  }
  onDragMoving(dropView, position) {
    // 若dropView为null，说明被拖拽branch没有处于任何branch的响应区域内
    if (dropView === null) {
      this._clearDropInfo();
      return {
        position,
      };
    }
    const newIndex = getTargetIndex(dropView, this._currentPolygon, position);
    const structure = dropView.getStructureClass();
    const isAnticlockwise = structure.match("anticlockwise");
    let isAddToRight = this._currentPolygon?.side === "right";
    if (isAnticlockwise) {
      isAddToRight = !isAddToRight;
    }
    this.updatePlaceholder(dropView, newIndex, isAddToRight);
    this._draggedViewNewParentView = dropView;
    this._draggedViewNewIndex = newIndex;
    this._isCurrentAddToRight = isAddToRight;
    return {
      index: newIndex,
      isAddToRight,
      position,
    };
  }

  _currentPolygon: any = (
    dropView: any,
    _currentPolygon: any,
    position: any,
  ): any => {
    throw new Error("Method not implemented.");
  };
  dragFinish() {
    this.indicatorView.clear();
  }
  isIntersectWithTopic(position) {
    // @ts-ignore not-exists-on-type
    const branchList = [this.centralBranch];
    while (branchList.length) {
      const branch = branchList.shift();
      if (branch.isPlaceHolderView) {
        continue;
      }
      if (Util.isTopicIntersectWithPoint(branch, position)) {
        return true;
      }
      const type = [
        TOPIC_TYPE.CALLOUT,
        TOPIC_TYPE.SUMMARY,
        TOPIC_TYPE.DETACHED,
        TOPIC_TYPE.ATTACHED,
      ];
      const children = branch.getChildrenBranchesByType(type);
      branchList.push(...children);
    }
    return false;
  }
  getDropView(dragMouseRealPosition) {
    const dragOverView = this.getDragOverView({
      position: dragMouseRealPosition,
      selections: [],
    });
    if (this.isIntersectWithTopic(dragMouseRealPosition)) {
      // Point intersect with topic view
      return null;
    } else {
      return dragOverView;
    }
  }
}
