/* eslint-disable @typescript-eslint/no-unused-vars */
import { VIEW_TYPE, CONFIG, UI_STATUS } from "../../common/constants/index";

export const viewType = VIEW_TYPE.BOUNDARY;
export const events = {
  mouseover: "onMouseOver",
  mouseout: "onMouseOut",
  mouseup: "onMouseup",
  mousedown: "onMouseDown",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};

export const eventHandlers = {
  onMouseOver() {
    if (
      this.getContext().isReadOnly() &&
      !this.config(CONFIG.ENABLE_SELECT_IN_READONLY)
    ) {
      return;
    }
    if (
      !this.isSelected &&
      !this.getContext()
        .getActiveUIStatus()
        .includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)
    ) {
      this.selectBox.show().transparent(true);
      this.selectBox.stateMachine.transition(this.selectBox.event_hover);
    }
  },
  onMouseOut(e) {
    e.stopPropagation();
    if (!this.isSelected) {
      this.selectBox.hide();
      this.selectBox.stateMachine.transition(this.selectBox.event_out);
    }
  },
  /**
   * @param {MouseEvent} e
   * @private
   * */
  onMouseDown(e) {
    e.stopPropagation();
    if (e.which === 3) {
      return this._dispatchContextMenu(e);
    }
  },
  onMouseup(e) {
    this.editDomain().eventBus.trigger("boundaryMouseUp", this);
  },
  onPress(e) {
    e.stopPropagation();
    this._pressContextMenuCheckHandle();
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
