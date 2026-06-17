import {
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeComponentPreInstallStyleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_COMPONENT_PRE_INSTALL_STYLE;
  }
  doExecute({ styleMap, targets = [] }: any = {}) {
    if (styleMap === undefined) {
      return;
    }
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets.forEach((target) => {
      Object.keys(styleMap).forEach((styleKey) => {
        target.model.changeStyle(styleKey, styleMap[styleKey]);
      });
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
