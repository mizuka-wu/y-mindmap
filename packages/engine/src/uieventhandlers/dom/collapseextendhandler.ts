/* eslint-disable @typescript-eslint/no-unused-vars */
import { VIEW_TYPE, STYLE_KEYS } from "../../common/constants/index";
import styleManager from "../../utils/business/stylemanager/index";

export const viewType = VIEW_TYPE.COLLAPSE_EXTEND;
export const events = {
  click: "onClick",
  mousedown: "onMouseDown",
  dblclick: "onDblClick",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
};

export const eventHandlers = {
  onClick(e) {
    if (e.altKey) {
      const allToggleModelList = [
        this.model,
        ...this.model.getDescendantList(),
      ];
      const modelActionName = this.model.isCollapse()
        ? "extendBranch"
        : "collapseBranch";
      allToggleModelList.forEach((model) => {
        model[modelActionName]();
      });
    } else {
      this.model.toggleCollapse();
    }
  },
  onDblClick(e) {
    e.stopPropagation();
    return false;
  },
  onMouseover(e) {
    this.figure.setFillColor(
      styleManager.getStyleValue(this.parent().parent(), STYLE_KEYS.LINE_COLOR),
    );
    this.figure.setFillOpacity(0.15);
  },
  onMouseout(e) {
    this.figure.setFillColor("none");
    this.figure.setFillOpacity(null);
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
