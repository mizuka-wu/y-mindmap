import { ACTION_NAMES, UI_STATUS, ACTION_STATUS } from '../../common/constants/index';
import BaseAction from '../../actions/action';

import type { WorkbookEditor } from '../../type.d';

export class UndoAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.UNDO;
  }
  doExecute({ needClearRedo = false }: { needClearRedo?: boolean } = {}) {
    const undoManager = this._context.model.getUndo();
    undoManager.undo();
    if (needClearRedo) {
      undoManager.clearRedo();
    }
  }
  queryStatus() {
    const undoManager = this._context.model.getUndo();
    if (this._context.getActiveUIStatus().indexOf(UI_STATUS.DRAG) === -1 && undoManager.canUndo()) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}

export default UndoAction;
