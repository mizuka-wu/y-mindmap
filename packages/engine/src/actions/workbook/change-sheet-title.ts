import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class ChangeSheetTitleAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_SHEET_TITLE;
  }
  doExecute({ sheetId, newTitle }: { sheetId: string; newTitle: string }) {
    this._context.model.changeSheetTitle(sheetId, newTitle);
  }
}

export default ChangeSheetTitleAction;
