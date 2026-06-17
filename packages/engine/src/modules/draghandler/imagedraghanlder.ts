import * as lib from "../../lib/index";
import underscore from "underscore";
import Util from "../../util";
import * as boundutils from "../../utils/boundutils";
import { forEachBranch } from "../draghandler/utils";
import BaseHandler from "../draghandler/basehandler";

const IMAGEGRID_FILL_COLOR = "rgba(46, 189, 255, 0.15)";
const IMAGEGRID_STROKE_COLOR = "rgba(46, 189, 255, 1)";
const IMAGEGRID_ACTIVEFILE_COLOR = "rgba(46, 189, 255, 0.5)";
export class ImageDragHandler extends BaseHandler {
  _draggedViewOldParentView: any;
  stashInfo: { newParent: any; direction: string };
  dragStart(transferData) {
    this._draggedViewOldParentView = transferData.draggedView.parent().parent();
    this.stashInfo = {
      newParent: null,
      direction: "",
    };
    return {};
  }
  getDragOverView(transferData) {
    const { pos: cloneGPos } = transferData;
    let targetView = null;
    forEachBranch(this.centralBranch, (branch) => {
      const isIntersection = Util.isTopicIntersectWithPoint(branch, cloneGPos);
      if (isIntersection) {
        targetView = branch;
        return true;
      } else {
        return false;
      }
    });
    return targetView;
  }
  // centralBranch(centralBranch: any, arg1: (branch: any) => boolean) {
  //   throw new Error("Method not implemented.");
  // }
  _changeParent(branch) {
    const oldParent = this.stashInfo.newParent;
    if (oldParent === branch) {
      return;
    }
    if (oldParent) {
      oldParent.onLeave();
      this._removeCrossGrids(oldParent);
    }
    this.stashInfo.newParent = branch;
    if (branch) {
      this._addCrossGrids(branch);
      branch.onIntersect();
    }
  }
  _addCrossGrids(branch) {
    if (branch.s$crossGrids) {
      return;
    }
    const crossGrids = new lib.SVG.G().data("name", "cross-grids");
    let bound = branch.topicView.shapeBounds;
    const { rotation, cx, cy } = branch.topicView.topicGroup.trans;
    if (rotation) {
      bound = boundutils.rotate(bound, rotation, cx, cy);
    }
    const x0 = bound.x;
    const x1 = x0 + bound.width / 4;
    const x2 = x1 + bound.width / 2;
    const y0 = bound.y;
    const y1 = y0 + bound.height / 2;
    const blocks = {
      left: crossGrids
        .rect()
        .move(x0, y0)
        .size(bound.width / 4, bound.height)
        .data("name", "left"),
      right: crossGrids
        .rect()
        .move(x2, y0)
        .size(bound.width / 4, bound.height)
        .data("name", "right"),
      top: crossGrids
        .rect()
        .move(x1, y0)
        .size(bound.width / 2, bound.height / 2)
        .data("name", "top"),
      bottom: crossGrids
        .rect()
        .move(x1, y1)
        .size(bound.width / 2, bound.height / 2)
        .data("name", "bottom"),
    };
    underscore.values(blocks).forEach((rect) => {
      rect.attr({
        fill: IMAGEGRID_FILL_COLOR,
        stroke: IMAGEGRID_STROKE_COLOR,
        "stroke-width": 2,
        opacity: 0.5,
      });
    });
    crossGrids.__blocks = blocks;
    crossGrids.__direction = "";
    branch.s$crossGrids = branch.svg.put(crossGrids);
  }
  _changeCrossGridColor(branch, direction) {
    const crossGrids = branch.s$crossGrids;
    if (!crossGrids || crossGrids.__direction === direction) {
      return;
    }
    const oldDirection = crossGrids.__direction;
    crossGrids.__direction = direction;
    const blocks = crossGrids.__blocks;
    if (oldDirection) {
      blocks[oldDirection].fill(IMAGEGRID_FILL_COLOR);
    }
    blocks[direction].fill(IMAGEGRID_ACTIVEFILE_COLOR);
  }
  _removeCrossGrids(branch) {
    if (branch.s$crossGrids) {
      branch.s$crossGrids.remove();
      delete branch.s$crossGrids;
    }
  }
  dragMoving(transferData) {
    const { dropView: branch, pos: cloneGPos } = transferData;
    if (branch === null) {
      this._changeParent(branch);
      return;
    }
    //intersect with other branch or self.
    const dir = Util.calcDirectionInTopic(branch, cloneGPos);
    this.stashInfo.direction = dir;
    this._changeParent(branch);
    this._changeCrossGridColor(branch, dir);
    // return true;
  }
  dragCancel() {
    const newParent = this.stashInfo.newParent;
    if (newParent) {
      newParent.onLeave();
      this._removeCrossGrids(newParent);
    }
    this._draggedViewOldParentView.onLeave();
    this._removeCrossGrids(this._draggedViewOldParentView);
    return true;
  }
  dragFinish(transferData) {
    const { dragedView } = transferData;
    if (!this.stashInfo.newParent) {
      //todo 移动回去的动画效果
      return;
    }
    const draggedBranch = dragedView.parent().parent();
    const originModel = draggedBranch.model;
    const originImage = originModel.get("image");
    if (draggedBranch === this.stashInfo.newParent) {
      originModel.getImageModel().align(this.stashInfo.direction);
    } else {
      originModel.removeImage();
      this.stashInfo.newParent.model.addImage(
        Object.assign({}, originImage, {
          align: this.stashInfo.direction,
        }),
      );
    }
    this._changeParent(null);
  }
}
