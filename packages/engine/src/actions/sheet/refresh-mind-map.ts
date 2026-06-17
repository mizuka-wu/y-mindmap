import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class RefreshMindMapAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REFRESH_MIND_MAP;
  }
  doExecute() {
    this._context.getSheetView().refreshStyles();
  }
}
