import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import { layoutConstant } from "../../../../utils/layoutconstant";

import { NoBorderTopicShape } from "./nobordertopicshape";

export class MatrixMainTopicShape extends NoBorderTopicShape {
  getEndAnchorPosition(structure, branchView /*BranchView*/) {
    const matrixView = branchView.getMatrixView();
    const isFolded = branchView.model.get("branch") === "folded";
    if (
      !matrixView ||
      !matrixView.matrixGrid ||
      (isFolded && !matrixView.matrixGrid)
    ) {
      return super.getEndAnchorPosition(structure, branchView);
    }
    const parent = branchView.parent();
    const direction = Object(topicShapesUtils.getEndDirection)(
      parent,
      branchView,
    );
    const matrixViewBounds = Object.assign({}, matrixView.matrixGrid.size);
    matrixViewBounds.x = branchView.topicView.shapeBounds.x;
    matrixViewBounds.y = branchView.topicView.shapeBounds.y;
    const halfCellViewBorderWidth =
      parseInt(branchView.getProxy().figure.borderWidth || 2) / 2;
    switch (direction) {
      case constants.DIRECTION.UP: {
        matrixViewBounds.y -=
          layoutConstant.MATRIX_CELL_PADDING + halfCellViewBorderWidth;
        break;
      }
      case constants.DIRECTION.DOWN: {
        matrixViewBounds.y -=
          layoutConstant.MATRIX_CELL_PADDING - halfCellViewBorderWidth;
        break;
      }
      case constants.DIRECTION.LEFT: {
        matrixViewBounds.x -=
          layoutConstant.MATRIX_CELL_PADDING + halfCellViewBorderWidth;
        break;
      }
      case constants.DIRECTION.RIGHT: {
        matrixViewBounds.x -=
          layoutConstant.MATRIX_CELL_PADDING - halfCellViewBorderWidth;
        break;
      }
    }
    const pos = Object(topicShapesUtils.relativePositionToRealPosition)(
      Object(topicShapesUtils.getJointPosition)(matrixViewBounds, direction),
      branchView,
    );
    return Object(topicShapesUtils.addPositionByDirection)(
      pos,
      direction,
      topicShapesUtils.END_OFFSET,
    );
  }
}
