import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
} from "../../common/constants/index";
import BaseAction from "../action";

const viewTypeFilter = [
  VIEW_TYPE.BRANCH,
  VIEW_TYPE.BOUNDARY,
  VIEW_TYPE.RELATIONSHIP,
  VIEW_TYPE.SHEET,
  VIEW_TYPE.SUMMARY,
];
/**
 * 设置自定义样式对象，传null时表示清空用户自定义样式。
 * 可作用于 BranchView | BoundaryView | RelationshipView | SheetView
 * @param {Object|null} styleObj Style Object. If no obj passed in, use the default value "null", which means clear user defined styles.
 * @param {BranchView|BoundaryView|RelationshipView} [targets] , optional. If no view passed in, this action will apply to all selections.
 */
export class SetStyleObjectAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SET_STYLE_OBJECT;
  }
  doExecute(
    { styleObj = null, targets = [] }: any = {
      styleObj: null,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((target) => viewTypeFilter.includes(target.type));
    targets.forEach((target) => {
      const model = target.model;
      model.setStyleObj(styleObj);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((target) => viewTypeFilter.includes(target.type));
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
