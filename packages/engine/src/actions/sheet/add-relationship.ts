import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class AddRelationshipAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_RELATIONSHIP;
  }
  doExecute() {
    const addRelationshipManager = this._context.getModule(
      MODULE_NAME.ADD_RELATIONSHIP,
    );
    addRelationshipManager.start();
  }
  queryStatus() {
    const addRelationshipManager = this._context.getModule(
      MODULE_NAME.ADD_RELATIONSHIP,
    );
    if (!addRelationshipManager.isReady()) {
      return ACTION_STATUS.DISABLE;
    }
    const selections = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections();
    if (
      selections.length <= 2 &&
      selections.length >= 0 &&
      selections.every(
        (item) =>
          item.type === VIEW_TYPE.BRANCH || item.type === VIEW_TYPE.BOUNDARY,
      )
    ) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
