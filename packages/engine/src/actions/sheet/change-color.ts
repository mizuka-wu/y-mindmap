import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeColorAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_COLOR;
  }
  doExecute({ key, color, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const typeArr = [
      VIEW_TYPE.BRANCH,
      VIEW_TYPE.BOUNDARY,
      VIEW_TYPE.RELATIONSHIP,
      VIEW_TYPE.SHEET,
    ];
    targets = targets.filter((view) => typeArr.includes(view.type));
    if (targets.length > 0) {
      targets.forEach((target) => {
        let modelName;
        let styleKey;
        if (key === "summaryLineColor") {
          modelName = "summaryModel";
          styleKey = STYLE_KEYS.LINE_COLOR;
        } else {
          modelName = "model";
          styleKey = key;
        }
        target[modelName].changeStyle(styleKey, color);
        if (modelName === "model" && styleKey === STYLE_KEYS.FILL_COLOR) {
          //Reset fillGradient, because it has higher priority.
          target.model.changeStyle(STYLE_KEYS.FILL_GRADIENT, null);
        }
        if (
          modelName === "model" &&
          styleKey === STYLE_KEYS.BORDER_LINE_COLOR
        ) {
          target.model.changeStyle(STYLE_KEYS.BORDER_GRADIENT, null);
        }
      });
    }
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const typeArr = [
      VIEW_TYPE.BRANCH,
      VIEW_TYPE.BOUNDARY,
      VIEW_TYPE.RELATIONSHIP,
      VIEW_TYPE.SHEET,
    ];
    targets = targets.filter((view) => typeArr.includes(view.type));
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
