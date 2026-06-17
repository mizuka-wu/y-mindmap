import { ACTION_NAMES, ACTION_STATUS } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class RemoveSheetAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_SHEET;
  }
  /**
   * @argument args.sheetId
   */
  doExecute({ sheetId }: { sheetId?: string } = {}) {
    if (!sheetId) {
      return ACTION_STATUS.ABORTED;
    }
    this._context.model.removeSheet(sheetId);
  }
}

export default RemoveSheetAction;
