import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class CutAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CUT;
  }
  doExecute({ targets = [] }: any = {}) {
    if (this._context.getModule(MODULE_NAME.COPY_PASTE).copy(null, targets)) {
      this._context.execAction(ACTION_NAMES.DELETE_ITEM, {
        prue: true,
        targets,
      });
    }
  }
  queryStatus({ targets = [] }: any = {}) {
    const canCopy = this._context.queryActionStatus(ACTION_NAMES.COPY, {
      targets,
    });
    const canDelete = this._context.queryActionStatus(
      ACTION_NAMES.DELETE_ITEM,
      {
        targets,
      },
    );
    if (canCopy && canDelete) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
