import { VIEW_TYPE } from "../../common/constants/index";
export const viewType = VIEW_TYPE.LABEL;
export const events = {
  mouseover: "onMouseover",
  click: "onClick",
};
export const eventHandlers = {
  onMouseover(e) {
    e.stopPropagation();
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
