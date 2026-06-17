import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';
import type { WorkbookEditor } from '../../type.d';

export class SetExtColIconDisplayAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.SET_EXT_COL_ICON_DISPLAY;
  }
  doExecute({ isShow }: { isShow: boolean }) {
    Object.values(this._context.sheetEditors).forEach((sheetEditor: any) => {
      if (sheetEditor) {
        sheetEditor.execAction(ACTION_NAMES.SET_EXT_COL_ICON_DISPLAY, {
          isShow,
          prue: true,
        });
      }
    });
  }
}

export default SetExtColIconDisplayAction;
