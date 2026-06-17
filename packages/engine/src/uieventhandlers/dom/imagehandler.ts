import { VIEW_TYPE, MODULE_NAME } from "../../common/constants/index";
import * as uiEventsUtils from "../../uievents/utils";

export const viewType = VIEW_TYPE.IMAGE;
export const events = {
  mousedown: "onMousedown",
  dblclick: "onDblClick",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
  mouseup: "onMouseup",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};
export const eventHandlers = {
  onMouseover(e) {
    e.stopPropagation();
    if (!this.resizeBox.isActive && e.which !== 1) {
      this.resizeBox.show();
    }
  },
  onMouseout(e) {
    e.stopPropagation();
    if (!this.resizeBox.isActive) {
      this.resizeBox.hide();
    }
    if (!this.isSelected) {
      this.resizeBox.hide();
    }
  },
  onDblClick(e) {
    e.stopPropagation();
  },
  onMouseup(e) {
    e.stopPropagation();
  },
  onMousedown(e) {
    e.stopPropagation();
    if (
      e.which === 3 &&
      !Object(uiEventsUtils.isDragUIStatusActive)(this.getContext())
    ) {
      return this._dispatchContextMenu(e);
    }
    if (e.which !== 1) {
      return;
    }
    if (this.parent().parent().originBranchView) {
      return;
    }
    const target = e.target || e.srcElement;
    if (
      target.nodeName === "image" ||
      target.getAttribute("data-name") === "fullBox"
    ) {
      const dragModule = this.getModule(MODULE_NAME.DRAG);
      if (dragModule) {
        dragModule.prepareStartDrag(e, this);
      }
    }
  },
  onPress(e) {
    e.stopPropagation();
    this._pressContextMenuCheckHandle();
    if (this.parent().parent().originBranchView) {
      return;
    }
    const target = e.target || e.srcElement;
    if (
      target.nodeName === "image" ||
      target.getAttribute("data-name") === "fullBox"
    ) {
      const dragModule = this.getModule(MODULE_NAME.DRAG);
      if (dragModule) {
        dragModule.prepareStartDrag(e, this);
      }
    }
  },
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail !== 100) {
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
