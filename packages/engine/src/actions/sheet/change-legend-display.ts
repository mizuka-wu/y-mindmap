import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeLegendDisplayAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_LEGEND_DISPLAY;
  }
  doExecute(
    { display } = {
      display: false,
    },
  ) {
    const sheetView = this._context.getSVGView().content();
    const sheetModel = sheetView.model;
    if (!sheetModel.get("legend")) {
      sheetModel.set("legend", {});
    }
    sheetView.initLegend();
    sheetModel.getLegendModel().setLegendDisplay(display);
  }
}
