import {
  ACTION_NAMES,
  MODULE_NAME,
  TOPIC_TYPE,
  UI_STATUS,
  FILTER_MODE_OPACITY,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";

const allTopicTypeList = [
  TOPIC_TYPE.ATTACHED,
  TOPIC_TYPE.DETACHED,
  TOPIC_TYPE.CALLOUT,
  TOPIC_TYPE.SUMMARY,
];
const NORMAL_OPACITY = 1;
export class FilterBranchAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.FILTER_BRANCH;
  }
  /**
   * @param idList topic model's id list, if pass undefind or empty array, quit filter mode
   */
  doExecute({ idList }) {
    if (!idList) {
      idList = [];
    }
    const isQuitFilterMode = !idList.length;
    const allCouldBeFilteredViewList = this.getAllCouldBeFilteredViewList();
    allCouldBeFilteredViewList.forEach((view) => {
      let shouldFilterCurrentView = !isQuitFilterMode;
      if (Object(js_utils.isBranch)(view) && !isQuitFilterMode) {
        shouldFilterCurrentView = !idList.includes(view.model.getId());
      }
      view.figure.setOpacity(
        shouldFilterCurrentView ? FILTER_MODE_OPACITY : NORMAL_OPACITY,
      );
    });
    this.updateFilterModeUIStatus(isQuitFilterMode);
  }
  getAllCouldBeFilteredViewList() {
    const centralBranchView = this._context.getSheetView().centralBranchView;
    const branchViewList = [
      centralBranchView,
      ...centralBranchView.getDescendantBranchesByType(allTopicTypeList),
    ];
    const boundaryViewList = branchViewList.reduce((pre, branchView) => {
      pre.push(...branchView.boundaries);
      return pre;
    }, []);
    const relationshipView = [...this._context.getSheetView().relationships];
    const connectionViewList = branchViewList.map((branchView) =>
      branchView.getConnectionView(),
    );
    const getSpecialStructureViewList = (getMethod) => {
      return branchViewList.reduce((pre, branchView) => {
        const specialStructureView = getMethod(branchView);
        if (specialStructureView) {
          pre.push(specialStructureView);
        }
        return pre;
      }, []);
    };
    const treeTableCellViewList = getSpecialStructureViewList((branchview) =>
      branchview.getTreeTableCellView(),
    );
    const fishboneHeadLineViewList = getSpecialStructureViewList((branchview) =>
      branchview.getFishboneHeadLineView(),
    );
    const fishboneMainLineViewList = getSpecialStructureViewList((branchview) =>
      branchview.getFishboneMainLineView(),
    );
    const matrixViewList = getSpecialStructureViewList((branchview) =>
      branchview.getMatrixView(),
    );
    return [
      ...branchViewList,
      ...boundaryViewList,
      ...relationshipView,
      ...connectionViewList,
      ...treeTableCellViewList,
      ...fishboneHeadLineViewList,
      ...fishboneMainLineViewList,
      ...matrixViewList,
    ];
  }
  updateFilterModeUIStatus(isQuitFilterMode) {
    const semaphoreModule = this._context.getModule(MODULE_NAME.SEMAPHORE);
    if (isQuitFilterMode) {
      return semaphoreModule.decrease(UI_STATUS.FILTER_MODE);
    }
    if (!semaphoreModule.isStatusActive(UI_STATUS.FILTER_MODE)) {
      return semaphoreModule.increase(UI_STATUS.FILTER_MODE);
    }
  }
}
