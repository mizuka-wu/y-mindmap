import Figure from "./figure";
import { DIRECTION } from "../common/constants/index";
import * as commonUtils from "../common/utils/index";

const BOX_WIDTH = 40;
const BOX_HEIGHT = 15;
const getOffset = (dir) => {
  switch (dir) {
    case DIRECTION.UP:
      return {
        x: -BOX_WIDTH / 2,
        y: 0,
      };
    case DIRECTION.DOWN:
      return {
        x: -BOX_WIDTH / 2,
        y: -BOX_HEIGHT,
      };
    case DIRECTION.RIGHT:
      return {
        x: -BOX_WIDTH,
        y: -BOX_HEIGHT / 2,
      };
    case DIRECTION.LEFT:
      return {
        x: 0,
        y: -BOX_HEIGHT / 2,
      };
    case DIRECTION.NONE:
    default:
      return {
        x: -BOX_WIDTH / 2,
        y: -BOX_HEIGHT / 2,
      };
  }
};
const TREE_LIKE_BOX_ATTRS = {
  fill: "#2ebdff",
  rx: "3",
  width: BOX_WIDTH,
  height: BOX_HEIGHT,
};
const TABLE_LIKE_BOX_ATTRS = {
  fill: "#2ebdff",
  rx: "0",
};
export class IndicatorFigure extends Figure {
  startBranch: null;
  isBranchDirty: boolean;
  isTableLike: boolean;
  isTableLikeDirty: boolean;
  lineAttrs: { "stroke-width": string; stroke: string; fill: string };
  boxAttrs: any;
  constructor(viewController) {
    super(viewController);
    this.startBranch = null;
    this.isBranchDirty = false;
    this.isTableLike = false;
    this.isTableLikeDirty = false;
    this.lineAttrs = {
      "stroke-width": "2",
      stroke: "#2ebdff",
      fill: "none",
    };
    this.boxAttrs = {};
  }
  updateLineAttrs(attrs) {
    this.lineAttrs = Object.assign(Object.assign({}, this.lineAttrs), attrs);
    this.invalidatePaint();
  }
  updateBoxAttrs(attrs, isTableLike) {
    const baseStyleAttrs = isTableLike
      ? TABLE_LIKE_BOX_ATTRS
      : TREE_LIKE_BOX_ATTRS;
    this.boxAttrs = Object.assign(Object.assign({}, baseStyleAttrs), attrs);
    this.invalidatePaint();
  }
  updateBoxPos(pos, jointDir) {
    const offset = getOffset(jointDir);
    const boxStartPos = Object(commonUtils.addPoint)(pos, offset);
    this.boxAttrs = Object.assign(
      Object.assign({}, TREE_LIKE_BOX_ATTRS),
      boxStartPos,
    );
    this.invalidatePaint();
  }
  updateStartBranch(startBranch) {
    if (this.startBranch !== startBranch) {
      this.startBranch = startBranch;
      this.isBranchDirty = true;
      this.invalidatePaint();
    }
  }
}
