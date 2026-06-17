import { VIEW_TYPE, MODULE_NAME } from "../../common/constants/index";
import * as uiEventsUtils from "../../uievents/utils";

export const viewType = VIEW_TYPE.MATH_JAX;
export const events = {
  mouseover: "onMouseOver",
  mouseout: "onMouseOut",
  mousedown: "onMouseDown",
  mouseup: "onMouseUp",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};
export const eventHandlers = {
  onMouseOver(e) {
    e.stopPropagation();
    if (!this.resizeBox.isActive) {
      this.resizeBox.show();
    }
  },
  onMouseOut(e) {
    e.stopPropagation();
    if (!this.resizeBox.isActive || !this.isSelected) {
      this.resizeBox.hide();
    }
  },
  onMouseUp(e) {
    e.stopPropagation();
  },
  onMouseDown(e) {
    e.stopPropagation();
    if (e.which === 3) {
      return this._dispatchContextMenu(e);
    }
    if (
      e.which !== 1 &&
      !Object(uiEventsUtils.isDragUIStatusActive)(this.getContext())
    ) {
      return;
    }
    if (this.parent().parent().originBranchView) {
      return;
    }
    const dragModule = this.getModule(MODULE_NAME.DRAG);
    if (dragModule) {
      dragModule.prepareStartDrag(e, this);
    }
  },
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail !== 100) {
      e.stopImmediatePropagation();
    }
  },
  onPress(e) {
    e.stopPropagation();
    if (this.parent().parent().originBranchView) {
      return;
    }
    const dragModule = this.getModule(MODULE_NAME.DRAG);
    if (dragModule) {
      dragModule.prepareStartDrag(e, this);
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
