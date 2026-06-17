import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class PasteAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.PASTE;
  }
  doExecute({
    toImage,
    toMathJax,
    toMarker,
    toBranch,
    e,
    clientPosition,
  }: any = {}) {
    // parse prams
    if (
      toImage === undefined &&
      toMarker === undefined &&
      toBranch === undefined &&
      toMathJax === undefined
    ) {
      toImage = true;
      toMarker = true;
      toBranch = true;
      toMathJax = true;
    }
    this._context.getModule(MODULE_NAME.COPY_PASTE).paste(e || null, {
      toImage,
      toMarker,
      toBranch,
      toMathJax,
      clientPosition,
    });
  }
  queryStatus() {
    const selections = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections();
    if (selections.length === 0) {
      return ACTION_STATUS.NORMAL;
    }
    const targets = selections.filter((view) => view.type === VIEW_TYPE.BRANCH);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
