/* eslint-disable @typescript-eslint/no-unused-vars */
import { VIEW_TYPE, UI_STATUS } from "../../common/constants/index";

export const viewType = VIEW_TYPE.INFORMATION_ICON;

export const events = {
  dblclick: "onDblClick",
  mousedown: "onMousedown",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};

export const eventHandlers = {
  onDblClick(e) {
    if (e) {
      e.stopPropagation();
    }
  },
  onMousedown(e) {
    e.stopPropagation();
    if (e.which === 3) {
      return this._dispatchContextMenu(e);
    }
  },
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail !== 100) {
      e.stopImmediatePropagation();
    }
  },
  onMouseover(e) {
    if (this._hovering) {
      return;
    }
    if (
      this.getContext()
        .getActiveUIStatus()
        .includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)
    ) {
      return;
    }
    this._hovering = true;
    this.figure.setSelectionAttr({
      display: "",
    });
  },
  onMouseout(e) {
    this._hovering = false;
    this.figure.setSelectionAttr({
      display: "none",
    });
  },
  onPress(e) {
    e.stopPropagation();
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
