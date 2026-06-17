import {
  ACTION_NAMES,
  MODULE_NAME,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import mommonFuncs from "../../mommonfuncs";

export class SelectAllAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SELECT_ALL;
  }
  doExecute() {
    const selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
    const moveViewPortModule = this._context.getModule(
      MODULE_NAME.MOVE_VIEW_PORT,
    );
    selectionManager.setIsSilent(true);
    moveViewPortModule.setAbleAutoMove(false);
    selectionManager.selectNone();
    mommonFuncs.preorderIterate(
      this._context.getSheetView().centralBranchView,
      Object.values(TOPIC_TYPE),
      (branch) => selectionManager.addSelection(branch),
    );
    moveViewPortModule.setAbleAutoMove(true);
    selectionManager.setIsSilent(false);
    selectionManager.notify();
  }
}
