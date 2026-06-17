import { ACTION_NAMES, UI_STATUS, ACTION_STATUS } from '../../common/constants/index';
import BaseAction from '../../actions/action';

import type { WorkbookEditor } from '../../type.d';

export class RedoAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.REDO;
  }
  doExecute() {
    const undoManager = this._context.model.getUndo();
    undoManager.redo();
  }
  queryStatus() {
    const undoManager = this._context.model.getUndo();
    if (this._context.getActiveUIStatus().indexOf(UI_STATUS.DRAG) === -1 && undoManager.canRedo()) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}

export default RedoAction;
