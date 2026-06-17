import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  UI_STATUS,
  EVENTS,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";
export class ShowBranchOnlyAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHOW_BRANCH_ONLY;
  }
  doExecute({ target }: any = {}) {
    const selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
    target = target || selectionManager.getSelections()[0];
    if (!target) {
      return;
    }
    if (target.isCentralBranch()) {
      js_utils.showBranchOnlyUtil.showFullContent(this._context);
      selectionManager.selectSingle(target);
      return;
    }
    js_utils.showBranchOnlyUtil.focusTargetBranchView(target);
    selectionManager.selectSingle(target);
    const sheetView = this._context.getSheetView();
    const semaphoreModule = this._context.getModule(MODULE_NAME.SEMAPHORE);
    if (this._context.model.getUndo().getLastGroup()) {
      this._context.model.getUndo().append({
        undo: () => {
          if (semaphoreModule.isStatusActive(UI_STATUS.SHOW_BRANCH_ONLY)) {
            js_utils.showBranchOnlyUtil.showFullContent(this._context);
          }
        },
        redo: () => {},
      });
    }
    target.model.listenTo(
      sheetView.model,
      EVENTS.AFTER_REMOVE_TOPIC,
      (info) => {
        if (
          info.topic === target.model &&
          semaphoreModule.isStatusActive(UI_STATUS.SHOW_BRANCH_ONLY)
        ) {
          js_utils.showBranchOnlyUtil.showFullContent(this._context);
        }
      },
    );
  }
  queryStatus() {
    return ACTION_STATUS.NORMAL;
  }
}
