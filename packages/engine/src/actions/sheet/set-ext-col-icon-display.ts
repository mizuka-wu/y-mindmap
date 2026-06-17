import { ACTION_NAMES, TOPIC_TYPE } from "../../common/constants/index";
import BaseAction from "../action";
import mommonFuncs from "../../mommonfuncs";

export class SetExtColIconDisplayAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_EXT_COL_ICON_DISPLAY;
  }
  doExecute({ isShow }: any = {}) {
    mommonFuncs.postorderIterate(
      this._context.getSheetView().centralBranchView,
      Object.values(TOPIC_TYPE),
      (branch) => {
        if (branch.collapseExtendView) {
          branch.collapseExtendView[isShow ? "show" : "hide"]();
        }
      },
    );
  }
}
