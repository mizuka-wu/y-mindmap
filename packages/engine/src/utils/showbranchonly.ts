import * as constants from "../common/constants/index";

/**
 * all need to change is BranchView.setRelatedViewsVisible(isVisible: boolean)
 * about view.setForcedInvisible
 * target view should have
 * 'setVisible' function and 'isVisible' property, and use this function to call figure.setVisible
 * 'setForcedInvisible' function and 'isForcedInvisible' property (inherit from SVGComponentView)
 * example: ConnectionView.setVisible(isVisible: boolean)
 *          ConnectionView.setForcedInvisible(forcedInvisible: boolean)
 */
class ShowBranchOnlyUtil {
  focusTargetBranchView(targetBranchView) {
    const context = targetBranchView.getContext();
    let parent = targetBranchView.parent();
    const targetParents = [];
    while (!parent.isCentralBranch()) {
      targetParents.push(parent);
      parent = parent.parent();
    }
    this.showTargetContent(targetBranchView);
    const sheetView = context.getSheetView();
    const centralBranch = sheetView.getCentralBranchView();
    setBranchViewsVisibility(centralBranch);
    centralBranch.setRelatedViewsVisible(true);
    centralBranch.figure.setLayoutable(true, false);
    // relationship
    sheetView.relationships.forEach((rView) => {
      const end1View = rView.end1View;
      const end2View = rView.end2View;
      if (
        (!(end1View === null || end1View === undefined
          ? undefined
          : end1View.figure.isVisible) ||
          !(end2View === null || end2View === undefined
            ? undefined
            : end2View.figure.isVisible)) &&
        rView.figure.isVisible
      ) {
        rView.setForcedInvisible(true);
      }
    });
    sheetView.setActivatedTopBranchView(targetBranchView);
    this.center(targetBranchView);
    const semaphoreModule = context.getModule(constants.MODULE_NAME.SEMAPHORE);
    if (!semaphoreModule.isStatusActive(constants.UI_STATUS.SHOW_BRANCH_ONLY)) {
      context
        .getModule(constants.MODULE_NAME.SEMAPHORE)
        .increase(constants.UI_STATUS.SHOW_BRANCH_ONLY);
    }
    function setBranchViewsVisibility(branch) {
      const topicTypes = [
        constants.TOPIC_TYPE.ATTACHED,
        constants.TOPIC_TYPE.DETACHED,
        constants.TOPIC_TYPE.CALLOUT,
        constants.TOPIC_TYPE.SUMMARY,
      ];
      const childBranchViewList = branch.getChildrenBranchesByType(topicTypes);
      childBranchViewList.forEach((branchView) => {
        if (branchView === targetBranchView) {
          targetBranchView.getConnectionView().setForcedInvisible(true);
          targetBranchView.figure.setLayoutable(true, false);
        } else {
          setBranchViewsVisibility(branchView);
          if (!targetParents.includes(branchView)) {
            branchView.setLayoutVisible(false);
          }
          branchView.setRelatedViewsVisible(true, {});
          branchView.figure.setLayoutable(false, false);
        }
      });
    }
  }
  showFullContent(context) {
    const sheetView = context.getSheetView();
    const cb = sheetView.getCentralBranchView();
    this.showTargetContent(cb);
    // relationship
    sheetView.relationships.forEach((rView) => {
      rView.setForcedInvisible(false);
    });
    sheetView.setActivatedTopBranchView(null);
    this.center(cb);
    this.dispose(cb);
  }
  showTargetContent(targetBranchView) {
    if (!targetBranchView) {
      return;
    }
    if (!targetBranchView.isCentralBranch()) {
      targetBranchView.getConnectionView().setForcedInvisible(false);
    }
    targetBranchView.setRelatedViewsVisible(false, {});
    targetBranchView.setLayoutVisible(true);
    targetBranchView.figure.setLayoutable(true, true);
    const topicTypes = [
      constants.TOPIC_TYPE.ATTACHED,
      constants.TOPIC_TYPE.DETACHED,
      constants.TOPIC_TYPE.CALLOUT,
      constants.TOPIC_TYPE.SUMMARY,
    ];
    for (const b of targetBranchView.getChildrenBranchesByType(topicTypes)) {
      this.showTargetContent(b);
    }
  }
  center(branchView) {
    let x = 0;
    let y = 0;
    if (branchView && branchView.getRealPosition()) {
      const realPosition = branchView.getRealPosition();
      x = realPosition.x;
      y = realPosition.y;
    }
    branchView.getContext().getSVGView().getCanvasControl().center(
      {
        x,
        y,
      },
      {
        animate: true,
      },
    );
  }
  dispose(targetBranchView) {
    const sheet = targetBranchView.getContext().getSheetView().model;
    targetBranchView.model.stopListening(
      sheet,
      constants.EVENTS.AFTER_REMOVE_TOPIC,
    );
    sheet.trigger(constants.EVENTS.EXIT_BRANCH_ONLY_MODE);
    targetBranchView
      .getContext()
      .getModule(constants.MODULE_NAME.SEMAPHORE)
      .decrease(constants.UI_STATUS.SHOW_BRANCH_ONLY);
  }
}
export const showBranchOnlyUtil = new ShowBranchOnlyUtil();
