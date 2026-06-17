import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { keyboardNav } from "../../utils/business/keyboardnavigation";

export class SelectionNavigateAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SELECTION_NAVIGATE;
  }
  /**
   *
   * @param {string} direction - value of constant.DIRECTION, could be "left", "right", "up", "down"
   * @param {boolean} addNext - e.metaKey || e.ctrlKey, for multiselect
   */
  doExecute({ direction, addNext }: any = {}) {
    keyboardNav(
      direction,
      this._context.getModule(MODULE_NAME.SELECTION),
      addNext,
    );
  }
  queryStatus() {
    const targets = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections()
      .filter((target) => target.type === VIEW_TYPE.BRANCH);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
