import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class WorkbookModifiedAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.WORKBOOK_MODIFIED;
  }
  doExecute() {
    Object.values(this._context.sheetEditors).forEach((sheetEditor: any) => {
      if (sheetEditor) {
        sheetEditor.execAction(ACTION_NAMES.SHEET_MODIFIED, {
          prue: true,
        });
      }
    });
  }
}

export default WorkbookModifiedAction;
