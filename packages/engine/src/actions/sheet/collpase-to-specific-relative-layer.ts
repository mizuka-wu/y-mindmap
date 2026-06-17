import { ACTION_NAMES, ACTION_STATUS } from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";

function collpaseToTargetLayerBranchView(
  currentBranchView /*View.BranchView*/,
  specificLayer,
) {
  currentBranchView.model.extendBranch();
  currentBranchView.getChildrenBranchesByType().forEach((branchView) => {
    const currentLayer = branchView.model.getLayer();
    if (currentLayer === specificLayer) {
      branchView.model.collapseBranch();
    } else {
      collpaseToTargetLayerBranchView(branchView, specificLayer);
    }
  });
}
export class CollapseToSpecificRelativeLayerAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.COLLAPSE_TO_SPECIFIC_RELATIVE_LAYER;
  }
  doExecute({ targets, relativeLayer }) {
    if (!relativeLayer) {
      return;
    }
    const targetBranchView = this.getFilterBranchViewList(targets)[0];
    const specificLayer = targetBranchView.model.getLayer() + relativeLayer;
    collpaseToTargetLayerBranchView(targetBranchView, specificLayer);
  }
  queryStatus({ targets }) {
    if (this.getFilterBranchViewList(targets).length === 1) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  getFilterBranchViewList(targets) {
    return super.getFilterBranchViewList(targets).filter((branchView) => {
      return !Object(js_utils.isCalloutBranch)(branchView);
    });
  }
}
