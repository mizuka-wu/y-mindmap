import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
  TOPICSHAPE,
  TOPIC_MAX_CUSTOM_WIDTH,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

import * as js_utils from "../../utils/index";

function setAlignmentBrotherCustomWidth(
  branchView,
  customWidth,
  alignemntCustomWidthSettledBranchViewList,
) {
  const sheetView = branchView.getContext().getSheetView();
  if (!branchView.getContext().isAlignmentByLevelMode()) {
    return;
  }
  if (alignemntCustomWidthSettledBranchViewList.includes(branchView)) {
    return;
  }
  if (Object(js_utils.isDetachedBranch)(branchView)) {
    return;
  }
  const currentLayer = branchView.getLayer();
  const headAlignmentBranchView = sheetView.getCentralBranchView();
  const headLayer =
    headAlignmentBranchView === null || headAlignmentBranchView === undefined
      ? undefined
      : headAlignmentBranchView.getLayer();
  let layerDistance = currentLayer - headLayer;
  let sameLevelCustomWidthSettledBranchViewList = [headAlignmentBranchView];
  while (layerDistance > 0) {
    sameLevelCustomWidthSettledBranchViewList =
      sameLevelCustomWidthSettledBranchViewList
        .map((branchView) => {
          if (branchView === null || branchView === undefined) {
            return undefined;
          } else {
            return branchView.getChildrenBranchesByType();
          }
        })
        .reduce((a, b) => a.concat(b), []);
    if (layerDistance === 1) {
      sameLevelCustomWidthSettledBranchViewList =
        sameLevelCustomWidthSettledBranchViewList.filter((branchView) => {
          return branchView.model.customWidth();
        });
    }
    layerDistance--;
  }
  alignemntCustomWidthSettledBranchViewList.push(
    ...sameLevelCustomWidthSettledBranchViewList,
  );
  sameLevelCustomWidthSettledBranchViewList.forEach((branchView) =>
    branchView.model.customWidth(customWidth),
  );
}
export class ChangeTopicCustomWidthAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_TOPIC_CUSTOM_WIDTH;
  }
  doExecute({ customWidth, targets = [] }: any = {}) {
    if (customWidth === undefined) {
      return;
    }
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) =>
        target.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(target) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    const shapeCannotCustomWidth = [
      TOPICSHAPE.DIAMOND,
      TOPICSHAPE.ELLIPSE,
      TOPICSHAPE.CLOUD,
    ];
    const topics = targets
      .map((branch) => branch.topicView)
      .filter((view) => !shapeCannotCustomWidth.includes(view.topicShapeStyle));
    if (customWidth <= 0) {
      topics.forEach((view) => {
        view.model.customWidth(0); // 0: reset the topic's width to auto.
      });
    } else {
      const alignemntCustomWidthSettledBranchViewList: any[] = [];
      topics.forEach((view) => {
        const minWidth = view.getTopicMinWidth();
        if (customWidth >= TOPIC_MAX_CUSTOM_WIDTH) {
          customWidth = TOPIC_MAX_CUSTOM_WIDTH;
        } else if (customWidth <= minWidth) {
          customWidth = minWidth;
        }
        const branchView = view.parent();
        setAlignmentBrotherCustomWidth(
          branchView,
          customWidth,
          alignemntCustomWidthSettledBranchViewList,
        );
        view.model.customWidth(customWidth);
      });
    }
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (target) =>
        target.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(target) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
