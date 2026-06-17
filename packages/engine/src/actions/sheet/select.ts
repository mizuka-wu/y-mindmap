import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";
export class SelectAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SELECT;
  }
  doExecute({ id, isSingle, noAutoMove, targets }) {
    let views: any[] = [];
    if (targets?.length) {
      views = targets;
    } else {
      const view = this._context.getComponentViewById(id);
      if (!view) {
        return;
      }
      views.push(view);
    }
    if (!views.length) {
      return;
    }
    const selectionModule = this._context.getModule(MODULE_NAME.SELECTION);
    const moveViewPortModule = this._context.getModule(
      MODULE_NAME.MOVE_VIEW_PORT,
    );
    if (noAutoMove) {
      moveViewPortModule.setAbleAutoMove(false);
    }
    if (selectionModule) {
      views.forEach((view) => {
        if (view.type === VIEW_TYPE.BRANCH) {
          Object(js_utils.showBranchIfHidden)(view);
        }
        if (isSingle) {
          selectionModule.selectSingle(view);
        } else {
          selectionModule.addSelection(view);
        }
      });
    }
    moveViewPortModule.setAbleAutoMove(true);
  }
}
