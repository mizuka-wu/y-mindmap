import { ACTION_NAMES, MODULE_NAME } from "../../common/constants/index";
import BaseAction from "../action";

export class ToggleSelectAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.TOGGLE_SELECT;
  }
  /**
   * If the view is selected, it would deselect. if the view is not selected, it would select
   * @param {string} id - id of sheet component
   * @param {Boolean} [noAutoMove] - whether move viewport automaticaly
   */
  doExecute({ id, noAutoMove }) {
    const view = this._context.getComponentViewById(id);
    const module = this._context.getModule(MODULE_NAME.SELECTION);
    if (noAutoMove) {
      this._context
        .getModule(MODULE_NAME.MOVE_VIEW_PORT)
        .setAbleAutoMove(false);
    }
    module.toggleSelection(view);
    this._context.getModule(MODULE_NAME.MOVE_VIEW_PORT).setAbleAutoMove(true);
  }
}
