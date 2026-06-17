import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ResizeMathJaxAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.RESIZE_MATH_JAX;
  }
  /**
   * @param {Array} targets
   * @param {number} newWidth
   **/
  doExecute(
    { targets = [], newWidth }: any = {
      newWidth: 0,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets.forEach((target) => {
      const topicModel =
        target.type === VIEW_TYPE.BRANCH ? target.model : target.parent().model;
      topicModel.updateMathJaxWidth(Math.max(newWidth, 0));
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const isBranchOrMathJax = (view) =>
      view.type === VIEW_TYPE.BRANCH || view.type === VIEW_TYPE.MATH_JAX;
    if (targets.every(isBranchOrMathJax)) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
