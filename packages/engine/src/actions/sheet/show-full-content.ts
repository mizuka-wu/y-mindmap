import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";
export class ShowFullContentAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SHOW_FULL_CONTENT;
  }
  doExecute() {
    js_utils.showBranchOnlyUtil.showFullContent(this._context);
  }
  queryStatus() {
    return ACTION_STATUS.NORMAL;
  }
}
