import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class RemoveSelectionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_SELECTION;
  }
  /**
   * remove view from selections
   * @param {string} id - id of sheet component
   */
  doExecute({ id }) {
    const view = this._context.getComponentViewById(id);
    const module = this._context.getModule(MODULE_NAME.SELECTION);
    module.removeFromSelection(view);
  }
}
