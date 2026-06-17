import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
  ADAPTERS,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class CopyStyleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.COPY_STYLE;
  }
  doExecute({ targets }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
      if (targets.length !== 1) {
        return;
      }
    }
    const target = targets[0];
    const styleData = styleManager.getComputedStyle(target);
    let summaryLineStyle = null;
    if (target.type === VIEW_TYPE.BRANCH) {
      if (target.model.type() === TOPIC_TYPE.SUMMARY) {
        const summaryLineView = target.getAdapter(ADAPTERS.SUMMARY_VIEW);
        summaryLineStyle = styleManager.getComputedStyle(summaryLineView);
      }
    }
    localStorage.setItem(
      "SBStyleClipboard",
      JSON.stringify({
        style: JSON.parse(JSON.stringify(styleData)),
        type: target.type,
        summaryLineStyle: summaryLineStyle,
      }),
    );
  }
  queryStatus({ targets }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
      if (targets.length === 1) {
        return ACTION_STATUS.NORMAL;
      } else {
        return ACTION_STATUS.DISABLE;
      }
    }
    return ACTION_STATUS.NORMAL;
  }
}
