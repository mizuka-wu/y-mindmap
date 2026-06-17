import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type';

/** @description 多sheet客户端保存数据之后调用，用以更新modifycheck基准值 */
export class WorkbookSavedAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.WORKBOOK_SAVED;
  }
  doExecute() {
    Object.values(this._context.sheetEditors).forEach((sheetEditor: any) => {
      if (sheetEditor) {
        sheetEditor.execAction(ACTION_NAMES.SHEET_SAVED, {
          prue: true,
        });
      }
    });
    this._context.updateBaseUndoIndex();
  }
}

export default WorkbookSavedAction;
