import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  STYLE_KEYS,
} from "../../common/constants/index";
import BaseAction from "../action";

import { changeAllStyle } from "./utils";

export class ChangeShapeClassAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_SHAPE_CLASS;
  }
  doExecute({ shape, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    // todo 判断shape是否属于call out topic的shape，暂时使用字符串直接量
    if (shape.indexOf("calloutTopicShape") !== -1) {
      const filterFunc = (view) =>
        view.type === VIEW_TYPE.BRANCH && view.isCalloutBranch();
      changeAllStyle({
        style: STYLE_KEYS.CALLOUT_SHAPE_CLASS,
        value: shape,
        targets: targets.filter(filterFunc),
      });
    } else {
      const filterFunc = (view) =>
        view.type === VIEW_TYPE.BRANCH ||
        view.type === VIEW_TYPE.BOUNDARY ||
        view.type === VIEW_TYPE.RELATIONSHIP;
      changeAllStyle({
        style: STYLE_KEYS.SHAPE_CLASS,
        value: shape,
        targets: targets.filter(filterFunc),
      });
    }
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH ||
        view.type === VIEW_TYPE.BOUNDARY ||
        view.type === VIEW_TYPE.RELATIONSHIP,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
