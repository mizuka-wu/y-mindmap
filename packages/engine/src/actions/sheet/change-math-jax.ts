import {
  ACTION_NAMES,
  ACTION_STATUS,
  EXTENSION_PROVIDER,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeMathJaxAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_MATH_JAX;
  }
  doExecute({ targets = [], mathJaxText }: any) {
    if (!mathJaxText) {
      return;
    }
    targets = this.getFilterBranchViewList(targets);
    targets.forEach((branchView) => {
      branchView.model.updateMathJaxInfo({
        provider: EXTENSION_PROVIDER.MATH_JAX,
        content: {
          content: mathJaxText,
        },
      });
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
