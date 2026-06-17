import { VIEW_TYPE } from "../../common/constants/index";

export const viewType = VIEW_TYPE.CONNECTION;

export const events = {
  click: "onClick",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
};

export const eventHandlers = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClick(e) {
    this.editDomain().selectionManager.selectSingle(this.endBranch);
  },
  onMouseover(e) {
    this.endBranch.onMouseover(e);
  },
  onMouseout(e) {
    this.endBranch.onMouseout(e);
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
