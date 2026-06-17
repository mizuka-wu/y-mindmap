import { VIEW_TYPE } from "../../common/constants/index";
import * as baseUtil from "../../utils/baseutil";
import mommonFuncs from "../../mommonfuncs";

const { isMobile } = mommonFuncs;
export const viewType = VIEW_TYPE.MATRIX_CELL;

export const events = {
  dblclick: "onDoubleClick",
  doubletap: "onDoubleTap",
};

export const eventHandlers = {
  onDoubleClick(e) {
    if (isMobile) {
      return;
    } // 禁用事件，主要是 mouseOver
    const handler = this._cellEvents[e.type];
    if (!Object(baseUtil.isUndef)(handler)) {
      return handler(e);
    }
    if (this.isNull) {
      return;
    }
    if (e.type === "mouseover") {
      this.displayHover();
    } else if (e.type === "mouseout") {
      this.displayDehover();
    }
  },
  onDoubleTap(e) {
    const handler = this._cellEvents[e.type];
    if (!Object(baseUtil.isUndef)(handler)) {
      return handler(e);
    }
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
