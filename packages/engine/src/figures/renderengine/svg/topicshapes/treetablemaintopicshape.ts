import * as topicShapesUtils from "./utils";

import { NoBorderTopicShape } from "./nobordertopicshape";

export class TreeTableMainTopicShape extends NoBorderTopicShape {
  getEndAnchorPosition(structure, branchView /*BranchView*/) {
    const parentBranchView = branchView.parent();
    const direction = Object(topicShapesUtils.getEndDirection)(
      parentBranchView,
      branchView,
    );
    const treeTableBounds = Object.assign({}, branchView.bounds);
    const pos = Object(topicShapesUtils.relativePositionToRealPosition)(
      Object(topicShapesUtils.getJointPosition)(treeTableBounds, direction),
      branchView,
    );
    return Object(topicShapesUtils.addPositionByDirection)(pos, direction, 0);
  }
}
