import { VIEW_TYPE, CONFIG, UI_STATUS } from "../../common/constants/index";
export const viewType = VIEW_TYPE.RELATIONSHIP;

export const events = {
  dblclick: "onDblClick",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
  mouseup: "onMouseup",
  mousedown: "onMouseDown",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};

export const eventHandlers = {
  onDblClick(e) {
    e.stopPropagation();
    return false;
  },
  onMouseover(e) {
    e.stopPropagation();
    if (
      this.getContext().isReadOnly() &&
      !this.config(CONFIG.ENABLE_SELECT_IN_READONLY)
    ) {
      return;
    }
    if (
      this.getContext()
        .getActiveUIStatus()
        .includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)
    ) {
      return false;
    }
    this.isHovering = true;
    this._updateState();
    switch (e.target.getAttribute("data-name")) {
      case "shadow-startPoint-1":
        this.setIsHoveringStartPoint1(true);
        break;
      case "shadow-startPoint-2":
        this.setIsHoveringStartPoint2(true);
        break;
      case "shadow-controlPoint-1":
        this.setIsHoveringControlPoint1(true);
        break;
      case "shadow-controlPoint-2":
        this.setIsHoveringControlPoint2(true);
        break;
      default:
        break;
    }
    return false;
  },
  onMouseout(e) {
    e.stopPropagation();
    this.isHovering = false;
    this._updateState();
    switch (e.target.getAttribute("data-name")) {
      case "shadow-startPoint-1":
        this.setIsHoveringStartPoint1(false);
        break;
      case "shadow-startPoint-2":
        this.setIsHoveringStartPoint2(false);
        break;
      case "shadow-controlPoint-1":
        this.setIsHoveringControlPoint1(false);
        break;
      case "shadow-controlPoint-2":
        this.setIsHoveringControlPoint2(false);
        break;
      default:
        break;
    }
    return false;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseup(e) {},
  onMousemove(e) {
    e.stopPropagation();
    return false;
  },
  onMouseDown(e) {
    e.stopPropagation();
    // 若是右键
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
  onPress(e) {
    e.stopPropagation();
    this._pressContextMenuCheckHandle();
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
