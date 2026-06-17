import { ANIMATION_FLAGS } from "../../common/constants/index";
import * as utils from "../../utils/index";
import anime from "animejs/lib/anime.es";
import { executeHighLightSelectBoxProcess } from "./util";

export const branch = {
  [ANIMATION_FLAGS.BRANCH_ZOOM_IN]({ target }) {
    const dummyAnimationBranchView = Object(utils.animationStandin)(target);
    const timeline = anime.timeline({
      easing: "easeInQuad",
      duration: 200,
    });
    const fadeOutSelectBoxNode =
      target.topicView.topicShapeSelectBox.figure.renderWorker.svg.node;
    timeline.add({
      targets: [fadeOutSelectBoxNode],
      opacity: 0,
    });
    const zoomInShapeNode =
      dummyAnimationBranchView.topicView.figure.renderWorker.topicShapeGroup
        .node;
    timeline.add(
      {
        targets: [zoomInShapeNode],
        transformOrigin: "center",
        scale: 1.05,
      },
      "+=200",
    );
    return {
      reverse: () => {
        timeline.reverse();
        timeline.play();
        timeline.finished.then(() => {
          dummyAnimationBranchView.remove();
        });
      },
      kill: () => {
        dummyAnimationBranchView.remove();
      },
    };
  },
  [ANIMATION_FLAGS.BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX]({ target }) {
    const hightLightSelectBoxNode =
      target.topicView.topicShapeSelectBox.figure.renderWorker.tsb.node;
    const branchSelectBoxTimeLine = executeHighLightSelectBoxProcess(
      hightLightSelectBoxNode,
    );
    let summarySelectBoxTimeLine;
    if (Object(utils.isSummaryBranch)(target)) {
      const summarySelectBoxNode =
        target.selectBox.figure.renderWorker.selectBox.node;
      summarySelectBoxTimeLine =
        executeHighLightSelectBoxProcess(summarySelectBoxNode);
    }
    return {
      reverse: () => {},
      kill: () => {
        branchSelectBoxTimeLine.kill();
        if (
          summarySelectBoxTimeLine === null ||
          summarySelectBoxTimeLine === undefined
        ) {
          // do nothing
        } else {
          summarySelectBoxTimeLine.kill();
        }
      },
    };
  },
};
