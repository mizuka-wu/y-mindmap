import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class CloseUndoKeepModeAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.CLOSE_UNDO_KEEP_MODE;
  }
  doExecute() {
    const sheetModel = this._context.getCurrentSheetEditor().getSheetModel();
    sheetModel.getUndo().keepAllInOne(false);
  }
}

export default CloseUndoKeepModeAction;
