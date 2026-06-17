import { VIEW_TYPE, MODULE_NAME } from "../../common/constants/index";

export const viewType = VIEW_TYPE.MATRIX_LABEL;

export const events = {
  mousedown: "onMouseDown",
  mouseover: "onMouseOver",
  mouseout: "onMouseOut",
};

export const eventHandlers = {
  onMouseDown(e) {
    if (e.which === 1 || e.isPress) {
      this.getModule(MODULE_NAME.DRAG).prepareStartDrag(e, this);
    }
  },
  onMouseOver() {
    if (!this.isSelected) {
      if (this.getProxy()) {
        this.getProxy().displayHover();
      }
    }
  },
  onMouseOut() {
    if (!this.isSelected) {
      if (this.getProxy()) {
        this.getProxy().displayDehover();
      }
    }
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
