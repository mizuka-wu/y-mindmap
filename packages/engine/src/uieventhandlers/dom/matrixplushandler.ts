import { VIEW_TYPE } from "../../common/constants/index";

export const viewType = VIEW_TYPE.MATRIX_PLUS;

export const events = {
  click: "onClick",
  tap: "onTap",
};

export const eventHandlers = {
  onClick(e) {
    this._clickEvent(e);
  },
  onTap(e) {
    this._clickEvent(e);
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
