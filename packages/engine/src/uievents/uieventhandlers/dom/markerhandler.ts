import { UI_STATUS, VIEW_TYPE } from "../../../common/constants/index";
export const viewType = VIEW_TYPE.MARKER;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.figure.setSelectionArr({
      display: "",
    });
    if (!this._stable) {
      this.figure.setNeedToForward();
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseout(e) {
    if (!this._hovering) {
      return;
    }
    this._hovering = false;
    this.figure.setSelectionArr({
      display: "none",
    });
    if (!this._stable) {
      this.figure.setNeedToBackward();
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
