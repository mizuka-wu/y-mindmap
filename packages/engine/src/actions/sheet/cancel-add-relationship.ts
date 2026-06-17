import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class CancelAddRelationshipAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CANCEL_ADD_RELATIONSHIP;
  }
  doExecute() {
    this._context.getModule(MODULE_NAME.ADD_RELATIONSHIP).cancel();
  }
  queryStatus() {
    if (this._context.getModule(MODULE_NAME.ADD_RELATIONSHIP).isReady()) {
      return ACTION_STATUS.DISABLE;
    } else {
      return ACTION_STATUS.NORMAL;
    }
  }
}
