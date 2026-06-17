import { DIRECTION } from "../../common/constants/index";

/**
 * @fileOverview 拖拽多边形区域计算模块
 * */

// 虚拟的connection的长度
const virtualConnLen = 40;
//注意：这里的点都是按顺时针顺序获取
export const dragAreaUtil = {
  virtualConnLen: virtualConnLen,
  /**
   * @description get four corner point of topicView's bounds
   * @description 获取topicView四个角的点
   * @param {BranchView} branch
   * @param {{ top: number, left: number, bottom: number, right: number }} margin
   * @param {point} [baseVector]
   * @returns {point} - points Array
   */
  getCornerPoints(
    branch,
    baseVector = {
      x: 0,
      y: 0,
    },
    margin = {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
    },
  ) {
    const bounds = branch.getPolygonBounds();
    const { top, left, bottom, right } = margin;
    return [
      {
        x: bounds.x - left + baseVector.x,
        y: bounds.y - top + baseVector.y,
      },
      {
        x: bounds.x + bounds.width + right + baseVector.x,
        y: bounds.y - top + baseVector.y,
      },
      {
        x: bounds.x + bounds.width + right + baseVector.x,
        y: bounds.y + bounds.height + bottom + baseVector.y,
      },
      {
        x: bounds.x - left + baseVector.x,
        y: bounds.y + bounds.height + bottom + baseVector.y,
      }, //left-bottom
    ];
  },
  /**
   * @description get two points of topicView bounds's one side
   * @description 获取topic bounds指定方向上的两个点
   * @param {BranchView} branch
   * @param {String} direction - constant.DIRECTION
   * @param {point} [offset={x: 0, y: 0}] 偏移量
   * @returns {Array.<point>}
   */
  getSidePoints(
    branch,
    direction,
    offset = {
      x: 0,
      y: 0,
    },
  ) {
    const { x, y, width, height } = branch.getPolygonBounds();
    const points = [];
    switch (direction) {
      case DIRECTION.UP:
        points.push({
          x: offset.x + x,
          y: offset.y + y,
        });
        points.push({
          x: offset.x + x + width,
          y: offset.y + y,
        });
        break;
      case DIRECTION.DOWN:
        points.push({
          x: offset.x + x + width,
          y: offset.y + y + height,
        });
        points.push({
          x: offset.x + x,
          y: offset.y + y + height,
        });
        break;
      case DIRECTION.LEFT:
        points.push({
          x: offset.x + x,
          y: offset.y + y + height,
        });
        points.push({
          x: offset.x + x,
          y: offset.y + y,
        });
        break;
      case DIRECTION.RIGHT:
        points.push({
          x: offset.x + x + width,
          y: offset.y + y,
        });
        points.push({
          x: offset.x + x + width,
          y: offset.y + y + height,
        });
    }
    return points;
  },
  /**
   * 计算获取bounds矩形direction方向的，加上间距的两点
   * @param {BranchView} child
   * @returns {{x:Number, y:Number}[]}
   */
  getSidePointsWithGap(child, direction, gap = 30) {
    const { width } = child.getPolygonBounds();
    const offset = Object.assign({}, child.position);
    switch (direction) {
      case DIRECTION.LEFT:
        offset.x -= gap;
        break;
      case DIRECTION.RIGHT:
        offset.x += width + gap;
        break;
      case DIRECTION.UP:
        offset.y -= gap;
        break;
      case DIRECTION.DOWN:
        offset.y += gap;
        break;
    }
    return dragAreaUtil.getSidePoints(child, direction, offset);
  },
  /**
   * 获取上下分布的children的bounds边界点
   * @param children
   * @param isLeft 收敛方向
   */
  getPointsOfUDChildren: function (children, isLeft) {
    const points = [];
    let realPos;
    let bounds;
    const k = isLeft ? 1 : -1;
    children.sort((a, b) => (k * a.position.y < k * b.position.y ? 1 : -1));
    const k1 = isLeft ? 0 : 1;
    children.forEach((item) => {
      if (!item.isPlaceHolderView) {
        realPos = item.position;
        bounds = item.getPolygonBounds();
        points.push({
          x: realPos.x + bounds.x + k1 * bounds.width,
          y: realPos.y + bounds.y + (-k1 + 1) * bounds.height,
        });
        points.push({
          x: realPos.x + bounds.x + k1 * bounds.width,
          y: realPos.y + bounds.y + k1 * bounds.height,
        });
      }
    });
    return points;
  },
  //TODO
  getPointsOfLRChildren: function (children, isUp) {
    const points = [];
    let realPos;
    let bounds;
    const k = isUp ? 1 : -1;
    children.sort((a, b) => {
      if (k * a.position.x > k * b.position.x) {
        return 1;
      } else {
        return -1;
      }
    });
    children.forEach((item) => {
      //realPos = item.getRealPosition();
      if (!item.isPlaceHolderView) {
        realPos = item.position;
        bounds = item.getPolygonBounds();
        points.push({
          x: realPos.x - (k * bounds.width) / 2,
          y: realPos.y - k * (bounds.y + bounds.height),
        });
        points.push({
          x: realPos.x + (k * bounds.width) / 2,
          y: realPos.y - k * (bounds.y + bounds.height),
        });
      }
    });
    return points;
  },
  getPointsOfNoChildren: function (branch, direction) {
    const points = [];
    //var realPos = branch.getRealPosition();
    const realPos = {
      x: 0,
      y: 0,
    };
    const bounds = branch.getPolygonBounds();
    switch (direction) {
      case DIRECTION.LEFT: {
        points.push({
          x: realPos.x - bounds.width - virtualConnLen,
          y: realPos.y + (bounds.height * 2) / 3,
        });
        points.push({
          x: realPos.x - bounds.width - virtualConnLen,
          y: realPos.y - (bounds.height * 2) / 3,
        });
        break;
      }
      case DIRECTION.RIGHT: {
        points.push({
          x: realPos.x + bounds.width + virtualConnLen,
          y: realPos.y - (bounds.height * 2) / 3,
        });
        points.push({
          x: realPos.x + bounds.width + virtualConnLen,
          y: realPos.y + (bounds.height * 2) / 3,
        });
        break;
      }
      case DIRECTION.UP: {
        points.push({
          x: realPos.x - (bounds.width * 2) / 3,
          y: realPos.y + bounds.y - virtualConnLen,
        });
        points.push({
          x: realPos.x + (bounds.width * 2) / 3,
          y: realPos.y + bounds.y - virtualConnLen,
        });
        break;
      }
      case DIRECTION.DOWN: {
        points.push({
          x: realPos.x + (bounds.width * 2) / 3,
          y: realPos.y + (bounds.y + bounds.height) + virtualConnLen,
        });
        points.push({
          x: realPos.x - (bounds.width * 2) / 3,
          y: realPos.y + (bounds.y + bounds.height) + virtualConnLen,
        });
        break;
      }
      default:
    }
    return points;
  },
  getOppositeDirection(direction) {
    if (direction === DIRECTION.LEFT) {
      return DIRECTION.RIGHT;
    }
    if (direction === DIRECTION.RIGHT) {
      return DIRECTION.LEFT;
    }
    if (direction === DIRECTION.UP) {
      return DIRECTION.DOWN;
    }
    if (direction === DIRECTION.DOWN) {
      return DIRECTION.UP;
    }
  },
};
