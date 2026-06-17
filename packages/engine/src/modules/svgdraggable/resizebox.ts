import { SERVICE_NAME, MODULE_NAME } from "../../common/constants/index";
import { layoutConstant } from "../../utils/layoutconstant";
const DirectOpposite = {
  lt: "rb",
  lm: "rm",
  lb: "rt",
  ct: "cb",
  cb: "ct",
  rt: "lb",
  rm: "lm",
  rb: "lt",
};
const cursorMap = {
  lt: "nwse-resize",
  lb: "nesw-resize",
  rt: "nesw-resize",
  rb: "nwse-resize",
};
const f = {
  l: -1,
  c: 0,
  r: 1,
  t: -1,
  m: 0,
  b: 1,
};
export class ResizeBoxDrag {
  _cdd: number[];
  _resizeBoxView: any;
  _realTimeSize: { width: number; height: number };
  _resizeMinWidth: any;
  constructor() {
    /**
     * @description current dragging point's direction
     * @private
     * */
    this._cdd = [0, 0];
    /**
     * @param {ResizeBoxView}
     * @private
     * */
    this._resizeBoxView = null;
    /**
     * @description 记录拖拽时图片的实时尺寸
     * @private
     * */
    this._realTimeSize = {
      width: 0,
      height: 0,
    };
  }
  init(resizeBoxView /*View.ResizeBoxView*/) {
    this._resizeBoxView = resizeBoxView;
    this._resizeMinWidth = this._resizeBoxView.refView.getResizeMinWidth
      ? this._resizeBoxView.refView.getResizeMinWidth()
      : 0;
    // 刚开始拖拽的时候，被拖拽锚点和对角锚点间的距离
    let startDistance = 0;
    let dragedPoint: any = null;
    // 被拖拽的对角点位置
    let fixPoint: any = null;
    let oldWidth = resizeBoxView.width;
    let oldHeight = resizeBoxView.height;
    let cosA;
    let sinA;
    let $mask;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const createStartHandler = (direction) => (info, e) => {
      $mask = resizeBoxView.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
      $mask.show();
      $mask.css("cursor", cursorMap[direction]);
      this._cdd = direction;
      dragedPoint = this._getCornerPosition(direction);
      fixPoint = this._getCornerPosition(DirectOpposite[direction]);
      startDistance = this._distance(dragedPoint, fixPoint);
      oldWidth = resizeBoxView.width;
      oldHeight = resizeBoxView.height;
      this._realTimeSize = {
        width: resizeBoxView.width,
        height: resizeBoxView.height,
      };
      this._showAvatar();
      if (resizeBoxView.rotation) {
        const rotation = (resizeBoxView.rotation / 180) * Math.PI;
        cosA = Math.cos(rotation);
        sinA = Math.sin(rotation);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const movingHandler = (info, e) => {
      let cursorPos; //{x,y} relative to center.
      let newWidth;
      let newHeight;
      if (resizeBoxView.rotation) {
        //rotate vector @see http://blog.csdn.net/tangyongkang/article/details/5484636
        const rdx = info.deltaX * cosA + info.deltaY * sinA;
        const rdy = -info.deltaX * sinA + info.deltaY * cosA;
        cursorPos = Object.assign({}, dragedPoint);
        cursorPos.x += rdx;
        cursorPos.y += rdy;
      } else {
        cursorPos = info;
      }
      if (!this._resizeBoxView.lockRatio) {
        newWidth = Math.max(
          this._resizeMinWidth,
          f[this._cdd[0]] * (cursorPos.x - fixPoint.x) || oldWidth,
        );
        newHeight = Math.max(
          this._resizeMinWidth,
          f[this._cdd[1]] * (cursorPos.y - fixPoint.y) || oldHeight,
        );
      } else {
        const currentDistance = this._distance(cursorPos, fixPoint);
        const ratio = currentDistance / startDistance;
        newWidth = Math.ceil(oldWidth * ratio);
        newHeight = Math.ceil(oldHeight * ratio);
      }
      // resize width and height to max size
      const maxLength = Math.max(newWidth, newHeight);
      if (maxLength > layoutConstant.IMAGE_MAX_SIZE) {
        const radio = newWidth / newHeight;
        if (newWidth > newHeight) {
          newWidth = layoutConstant.IMAGE_MAX_SIZE;
          newHeight = newWidth / radio;
        } else {
          newHeight = layoutConstant.IMAGE_MAX_SIZE;
          newWidth = newHeight * radio;
        }
      }
      const offsetX = newWidth - oldWidth;
      const offsetY = newHeight - oldHeight;
      //previous dragPoint's new position.
      const newDragedPoint = this._getShrinked(dragedPoint, offsetX, offsetY);
      const newX = (newDragedPoint.x + fixPoint.x) / 2 - newWidth / 2;
      const newY = (newDragedPoint.y + fixPoint.y) / 2 - newHeight / 2;
      this._realTimeSize = {
        width: newWidth,
        height: newHeight,
      };
      this._setAvatarSize(
        Object.assign(Object.assign({}, this._realTimeSize), {
          x: newX,
          y: newY,
        }),
      );
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const endHandler = (info, e) => {
      $mask.hide();
      $mask.css("cursor", "");
      resizeBoxView.trigger("resize", this._realTimeSize);
      this._hideAvatar();
    };
    const svgDraggableModule = resizeBoxView.getModule(
      MODULE_NAME.SVG_DRAGGABLE,
    );
    if (svgDraggableModule) {
      Object.keys(resizeBoxView.anchors).forEach((k) => {
        svgDraggableModule
          .draggable(resizeBoxView.anchors[k])
          .dragStart(createStartHandler(k))
          .dragMove(movingHandler)
          .dragEnd(endHandler);
      });
    }
  }
  /**
   * 计算拖拽点和对角点距离，决定框的大小
   * @param {*} direction
   * @param {*} p1 the dragged
   * @param {*} p2 the fix point
   * @private
   */
  _distance(p1, p2) {
    return Math.max(
      Math.max(this._resizeMinWidth, f[this._cdd[0]] * (p1.x - p2.x)),
      Math.max(this._resizeMinWidth, f[this._cdd[1]] * (p1.y - p2.y)),
    );
  }
  /** @private */
  _getShrinked(point, offsetX, offsetY) {
    return {
      x: point.x + f[this._cdd[0]] * offsetX,
      y: point.y + f[this._cdd[1]] * offsetY,
    };
  }
  /** @private */
  _getCornerPosition(direction) {
    const width = this._resizeBoxView.width;
    const height = this._resizeBoxView.height;
    const pos = {
      l: 0,
      m: height / 2,
      r: width,
      t: 0,
      c: width / 2,
      b: height,
    };
    return {
      x: pos[direction[0]],
      y: pos[direction[1]],
    };
  }
  /** @private */
  _showAvatar() {
    this._resizeBoxView.showAvatar();
    // this._uniformPosition()
  }
  /** @private */
  _hideAvatar() {
    this._resizeBoxView.hideAvatar();
  }
  _setAvatarSize({ width, height, x, y }) {
    this._resizeBoxView.setAvatarSize({
      width,
      height,
      x,
      y,
    });
  }
}

export default ResizeBoxDrag;
