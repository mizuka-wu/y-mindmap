import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';

import type { WorkbookEditor } from '../../type.d';

export class OpenUndoKeepModeAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.OPEN_UNDO_KEEP_MODE;
  }
  doExecute() {
    const sheetModel = this._context.getCurrentSheetEditor().getSheetModel();
    sheetModel.getUndo().keepAllInOne(true);
  }
}
export default OpenUndoKeepModeAction;
