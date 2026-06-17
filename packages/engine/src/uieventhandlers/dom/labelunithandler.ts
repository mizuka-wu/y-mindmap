import {
  VIEW_TYPE,
  UI_STATUS,
  MODULE_NAME,
} from "../../common/constants/index";
import * as utils from "../../utils/index";

const labelUnitFillColor = "rgba(255, 255, 255, 0.7)";
const labelUnitHoverFillColor = "rgba(255, 255, 255, 0.7)";
const labelUnitBorderColor = "rgba(0, 0, 0, 0.1)";
const labelUnitHoverBorderColorInLightBg = "rgba(0, 0, 0, 0.3)";
const labelUnitHoverBorderColorInDarkBg = "rgba(255, 255, 255, 1)";
const labelUnitTextColor = "#434b54";
const labelUnitHoverTextColor = "#434b54";
export const viewType = VIEW_TYPE.LABELUNIT;
export const events = {
  click: "onClick",
  mousedown: "onMousedown",
  mouseover: "onMouseover",
  mouseenter: "onMouseenter",
  mouseout: "onMouseout",
  contextmenu: "onContextMenu",
  press: "onPress",
};

export const eventHandlers = {
  onClick(e) {
    e.stopPropagation();
  },
  onMouseover(e) {
    e.stopPropagation();
    const context = this.getContext();
    if (context.getActiveUIStatus().includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)) {
      return;
    }
    const sheetBackgroundColorHEX = context
      .getSheetView()
      .getBlendingBackgroundColor();
    const sheetBackgroundColorHSL = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBALL,
    ).snowballUtil.hexStringToHSLObject(sheetBackgroundColorHEX);
    const isDarkBackground = sheetBackgroundColorHSL.l < 50;
    this.figure.setBackgroudAttr({
      fill: labelUnitHoverFillColor,
      stroke: isDarkBackground
        ? labelUnitHoverBorderColorInDarkBg
        : labelUnitHoverBorderColorInLightBg,
      "stroke-width": 1,
    });
    this.figure.setTextAttr({
      color: labelUnitHoverTextColor,
    });
  },
  onMouseout() {
    this.figure.setBackgroudAttr({
      fill: labelUnitFillColor,
      stroke: labelUnitBorderColor,
    });
    this.figure.setTextAttr({
      color: labelUnitTextColor,
    });
  },
  onMouseenter(e) {
    e.stopPropagation();
  },
  onPress(e) {
    e.stopPropagation();
  },
  onMousedown(e) {
    e.stopPropagation();
  },
  onContextMenu(e) {
    e.stopPropagation();
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
