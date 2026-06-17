import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class CopyAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.COPY;
  }
  doExecute({ e, targets = [] }: any = {}) {
    this._context.getModule(MODULE_NAME.COPY_PASTE).copy(e, targets);
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context
        .getModule(MODULE_NAME.SELECTION)
        .getSelections()
        .filter((view) => view.type !== VIEW_TYPE.MATRIX_LABEL);
    }
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
