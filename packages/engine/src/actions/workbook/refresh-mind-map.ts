import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class RefreshMindMapAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.REFRESH_MIND_MAP;
  }
  doExecute() {
    Object.values(this._context.sheetEditors).forEach((sheetEditor: any) => {
      if (sheetEditor) {
        sheetEditor.execAction(ACTION_NAMES.REFRESH_MIND_MAP, {
          prue: true,
        });
      }
    });
  }
}

export default RefreshMindMapAction;
