import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";

const highLightAbleViewTypeList = [
  VIEW_TYPE.BRANCH,
  VIEW_TYPE.BOUNDARY,
  VIEW_TYPE.RELATIONSHIP,
];
function getRelatedBranchViewOfBoundary(boundaryView) {
  const rangeStart = boundaryView.model.rangeStart;
  return boundaryView.parent().getChildrenBranchesByType()[rangeStart];
}
export class HighLightSelectAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.HIGH_LIGHT_SELECT;
  }
  doExecute({ id }) {
    const view = this._context.getComponentViewById(id);
    if (!highLightAbleViewTypeList.includes(view.type)) {
      return;
    }
    const selectionModule = this._context.getModule(MODULE_NAME.SELECTION);
    if (!selectionModule) {
      return;
    }
    this.showRelatedBranchView(view);
    selectionModule.selectSingle(view);
    view.displayHighLightSelect();
  }
  showRelatedBranchView(view) {
    const relatedBranchViewListToShow: any[] = [];
    switch (view.type) {
      case VIEW_TYPE.BRANCH: {
        relatedBranchViewListToShow.push(view);
        break;
      }
      case VIEW_TYPE.BOUNDARY: {
        relatedBranchViewListToShow.push(getRelatedBranchViewOfBoundary(view));
        break;
      }
      case VIEW_TYPE.RELATIONSHIP: {
        const relatedBranchView1 = Object(js_utils.isBranch)(view.end1View)
          ? view.end1View
          : getRelatedBranchViewOfBoundary(view.end1View);
        const relatedBranchView2 = Object(js_utils.isBranch)(view.end2View)
          ? view.end2View
          : getRelatedBranchViewOfBoundary(view.end2View);
        relatedBranchViewListToShow.push(relatedBranchView1);
        relatedBranchViewListToShow.push(relatedBranchView2);
        break;
      }
    }
    relatedBranchViewListToShow.forEach((branchView) =>
      Object(js_utils.showBranchIfHidden)(branchView),
    );
  }
}
