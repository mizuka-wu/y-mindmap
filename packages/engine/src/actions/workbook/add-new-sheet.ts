import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';
export class AddNewSheetAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_NEW_SHEET;
  }
  /**
   * create metadata and insert it
   * @param {string} id - id of sheet
   * @param {Object} sheetData - sheet json data
   * @param {Object} [options] - write to sheet meta data
   * @param {string} [options.title] - sheet title
   * @param {string} [options.at] - sheet index at sheets of workbook
   */
  doExecute({
    sheetId,
    sheetData,
    options,
  }: {
    sheetId: string;
    sheetData: any;
    options?: { title?: string; at?: number };
  }) {
    this._context.model.addSheet(sheetId, sheetData, options);
  }
}

export default AddNewSheetAction;
