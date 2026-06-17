import { BranchDragHandler } from "../draghandler/branchdraghandler";

import * as utils from "../../utils/index";

/**
 * @fileOverview floating topic拖拽处理
 * */

export class FreeBranchDragHandler extends BranchDragHandler {
  _isFreePositionBranch: boolean;
  _draggedViewNewParentView: any;
  _draggedViewNewIndex: number;
  _isCurrentAddToRight: boolean;
  indicatorView: any;
  _draggedViewOldParentView: any;
  centralBranch: any;
  _currentPolygon: any;
  constructor(context) {
    super(context);
    this._isFreePositionBranch = true;
  }
  dragStart(transferData) {
    transferData = super.dragStart(transferData);
    this.attachOldParent(transferData.position);
    this._setIsSelectionBranchStable(false);
    return transferData;
  }
  dragMoving(transferData) {
    const {
      dropView,
      draggedView,
      position: freePosition,
      keyPress: { shiftKey },
    } = transferData;
    const index = draggedView.branchIndex();
    const addToRight = freePosition.x > 0;
    if (shiftKey) {
      this._draggedViewNewParentView = null;
      this._draggedViewNewIndex = -1;
      this._isCurrentAddToRight = false;
    } else {
      this._draggedViewNewParentView = dropView;
      this._draggedViewNewIndex = index;
      this._isCurrentAddToRight = addToRight;
    }
    this.indicatorView.update(this._draggedViewNewParentView, {
      index: this._draggedViewNewIndex,
      addToRight: this._isCurrentAddToRight,
      freePosition: shiftKey ? null : freePosition,
    });
  }
  attachOldParent(position) {
    if (!this._draggedViewOldParentView) {
      return;
    }
    // detect if placeholder should be initially add to map right
    let addToRight = false;
    const oldParentStructure =
      this._draggedViewOldParentView.getStructureClass();
    if (oldParentStructure.includes("map")) {
      if (position.x > 0) {
        addToRight = true;
      }
      if (oldParentStructure.includes("anticlockwise")) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        addToRight = !addToRight;
      }
    }
  }
  getDragOverView(transferData) {
    const dropView = this.centralBranch;
    const { position: dragMouseRealPosition } = transferData;
    const basedPosition = dropView.getRealPosition();
    const cloneViewToBranchRelativePos = Object(utils.relativePositionFor)(
      dragMouseRealPosition,
      basedPosition,
    );
    const polygonPointsArray = dropView.getPolyPointsArr();
    const cloneViewSide = cloneViewToBranchRelativePos.x < 0 ? "left" : "right";
    this._currentPolygon = polygonPointsArray.find(
      (polygon) => polygon.side === cloneViewSide,
    );
    return dropView;
  }
}
