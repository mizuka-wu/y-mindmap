import { VIEW_TYPE } from "../../common/constants/index";

export const viewType = VIEW_TYPE.LEGEND;
export const events = {
  dblclick: "onDbClick",
};
export const eventHandlers = {
  onDbClick(e) {
    e.stopPropagation();
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
