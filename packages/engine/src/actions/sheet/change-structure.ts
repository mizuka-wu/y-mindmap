import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeStrutureAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_STRUCTURE;
  }
  /**
   * @argument args.targets
   * @argument args.structureClass
   */
  doExecute({ targets = [], structureClass }: any = {}) {
    if (!targets || targets.length <= 0) {
      targets = this._context
        .getModule(MODULE_NAME.SELECTION)
        .selections.filter((view) => view.type === VIEW_TYPE.BRANCH);
    }
    targets.forEach((view) => view.model.changeStructure(structureClass));
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length <= 0) {
      targets = this._context
        .getModule(MODULE_NAME.SELECTION)
        .selections.filter((view) => view.type === VIEW_TYPE.BRANCH);
    }
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
