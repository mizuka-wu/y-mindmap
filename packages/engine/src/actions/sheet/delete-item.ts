import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";
import * as uieventsUtils from "../../uievents/utils";
import * as js_utils from "../../utils/index";

function toDeleteViewFilter(viewArr) {
  const copy = viewArr.slice();
  // removeRootTopic
  copy.some((view, index) => {
    if (Object(js_utils.isCentralBranch)(view)) {
      copy.splice(index, 1);
      return true;
    }
  });
  const _copy = copy.slice();
  // filter viewArr start
  copy.forEach((view) => {
    let parentView = view.parent();
    // if parentView is not central branch
    while (parentView && !Object(js_utils.isCentralBranch)(parentView)) {
      const pIndex = copy.indexOf(parentView);
      const cIndex = _copy.indexOf(view);
      // if current topicView's parentView is in the copy,
      if (pIndex !== -1) {
        _copy.splice(cIndex, 1);
        break;
      }
      parentView = parentView.parent();
    }
  });
  return _copy;
}

export class DeleteItemAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.DELETE_ITEM;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) => target.type !== VIEW_TYPE.BRANCH || !target.isCentralBranch(),
    );
    toDeleteViewFilter([...targets]).forEach((item) => {
      this._deleteSingleItem(item);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) => target.type !== VIEW_TYPE.BRANCH || !target.isCentralBranch(),
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  _deleteSingleItem(target) {
    if (!target.parent()) {
      return false;
    }
    const targetModel = target.model;
    const type = target.type;
    // if target has model
    if (targetModel) {
      if (
        type === VIEW_TYPE.RELATIONSHIP &&
        Object(uieventsUtils.isDragUIStatusActive)(this._context)
      ) {
        return;
      }
      targetModel.removeSelf();
    } else if (type === VIEW_TYPE.MATRIX_LABEL) {
      target.removeColumnItems();
    } else if (type === VIEW_TYPE.MARKER) {
      const topicModel = target.parent().parent().model;
      topicModel.removeMarker(target.markerId);
    } else if (type) {
      const parentModel = target.parent().model;
      parentModel.removePendantItem(type);
    }
  }
}
