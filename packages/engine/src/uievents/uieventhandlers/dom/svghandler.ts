import process from "process";

import { VIEW_TYPE, MODULE_NAME } from "../../../common/constants/index";
import mommonFuncs from "../../../mommonfuncs";
export const viewType = VIEW_TYPE.SVG;
export const events = {
  click: "onClick",
  dblclick: "onDblClick",
  wheel: "onMouseWheel",
  mouseup: "onMouseup",
  mousedown: "onMouseDown",
  touchmove: "onTouchMove",
  contextmenu: "onContextMenu",
  touchend: "onTouchEnd",
  press: "onPress",
  pressup: "onPressUp",
  doubletap: "onDoubleTap",
  pinchstart: "onPinchStart",
  pinchmove: "onPinch",
  pinchend: "onPinchEnd",
};
export const eventHandlers = {
  onClick() {
    this.clickCount++;
    setTimeout(() => {
      this.clickCount = 0;
    }, 500);
  },
  onDblClick(e) {
    if (e.target !== this.svg.node) {
      return;
    }
    if (this.clickCount !== 2) {
      this.clickCount = 0;
      return;
    }
    this.clickCount = 0;
    this.createFloatingTopic({
      x: e.clientX,
      y: e.clientY,
    });
  },
  onDoubleTap(e) {
    if (this._context.isMobilePlatform()) {
      return;
    }
    if (e.target !== this.svg.node) {
      return;
    }
    this.createFloatingTopic({
      x: e.center.x,
      y: e.center.y,
    });
  },
  onMouseWheel(e) {
    e.stopPropagation();
    // 在mac端上，meta键加滚轮操作一样可以触发缩放
    if (this.isEnableScaleByWheel(e)) {
      e.preventDefault();
      return this.setScaleByWheel(e);
    }
  },
  onMouseDown(e) {
    if (e.currentTarget !== this.el) {
      return;
    }
    const moveViewportModule = this.getModule(MODULE_NAME.MOVE_VIEW_PORT);
    if (process.env.SELECT_BOX === "skip") {
      if (moveViewportModule) {
        moveViewportModule.onDragViewPort(e, this, (e) => {
          this._dispatchContextMenu(e);
        });
      }
      return;
    }
    // 点击鼠标右键，可能为右键拖拽画布操作，可能为右键菜单操作
    if (e.which === 3) {
      if (moveViewportModule) {
        moveViewportModule.onDragViewPort(e, this, (e) => {
          this._dispatchContextMenu(e);
        });
      }
    }
    // 点击鼠标左键
    if (e.which === 1) {
      // mac上，鼠标左键+ctrl按钮，触发右键菜单
      if (mommonFuncs.isMac && e.ctrlKey) {
        return this._dispatchContextMenu(e);
      }
      // 暂时先屏蔽iOS上鼠标左键操作
      if (this.getContext().isBrowniePlatform()) {
        return;
      }
      const isAllShift = e.shiftKey;
      // 触发多区域框选
      const mouseBoxSelectModule = this.getModule(MODULE_NAME.MOUSE_BOX_SELECT);
      if (mommonFuncs.isFunctionEnabled(e) || isAllShift) {
        if (mouseBoxSelectModule) {
          mouseBoxSelectModule.start(
            {
              x: e.clientX,
              y: e.clientY,
            },
            true,
          );
        }
      } // 否则就是但区域框选
      else if (mouseBoxSelectModule) {
        mouseBoxSelectModule.start({
          x: e.clientX,
          y: e.clientY,
        });
      }
    }
  },
  onTouchMove(e) {
    if (this._context.isMobileAppPlatform()) {
      return;
    }
    if (this._pinchStartScale) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  },
  onTouchEnd() {
    if (this._context.isMobileAppPlatform()) {
      return;
    }
    this._pinchStartScale = null;
    this._context.setScrollEnable();
  },
  onPress(e) {
    if (e.target !== this.svg.node) {
      return;
    }
    this._pressContextMenuCheckHandle();
  },
  onPinchStart() {
    if (this._context.isMobileAppPlatform()) {
      return;
    }
    this._pinchStartScale = this.currentScale;
    this._context.setScrollDisable();
  },
  onPinch(e) {
    if (this._context.isMobileAppPlatform()) {
      return;
    }
    // todo 有时候pinch end之后依然会触发pinch move事件
    if (!this._pinchStartScale) {
      return;
    }
    e.preventDefault();
    const speedLimitValue = 0.02;
    this.setScale(
      this._pinchStartScale * 100 * e.scale * (1 - speedLimitValue),
    );
  },
  onPinchEnd() {
    if (this._context.isMobileAppPlatform()) {
      return;
    }
    this._pinchStartScale = null;
    this._context.setScrollEnable();
  },
  onContextMenu(e) {
    e.preventDefault();
    if (e.detail !== 100) {
      //100 indicate custom event
      e.stopImmediatePropagation();
    }
  },
  onPressUp(e) {
    e.stopPropagation();
    this._dispatchContextMenu(e);
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
