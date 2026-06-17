import { getTopicShape } from "../figures/renderengine/svg/topicshapes/index";

import { logicLeftAndRight } from "./logicleftandright";

export const BraceLeftAndRight = Object.assign({}, logicLeftAndRight, {
  calAttachedChildrenPos(parentBranchView, parentBounds, isRight) {
    const attachedChildrenBranchViewList =
      parentBranchView.getChildrenBranchesByType();
    if (!attachedChildrenBranchViewList.length) {
      return;
    }
    const childrenSize = this.getChildrenSize(parentBranchView, isRight);
    const spacingMajor = this.calcSpacingMajor(parentBranchView);
    let childrenBaseX;
    if (isRight) {
      childrenBaseX = parentBounds.x + parentBounds.width + spacingMajor;
    } else {
      childrenBaseX = parentBounds.x - spacingMajor;
      parentBounds.x = childrenBaseX - childrenSize.width;
    }
    const topChildBranchView = attachedChildrenBranchViewList[0];
    const bottomChildBranchView =
      attachedChildrenBranchViewList[attachedChildrenBranchViewList.length - 1];
    const controlPositionY =
      getTopicShape(
        parentBranchView.topicView.figure.shapeClass,
      ).getControlPosition(parentBranchView, topChildBranchView).y -
      parentBranchView.linePosition.y;
    const topChildEndPositionY =
      getTopicShape(
        topChildBranchView.topicView.figure.shapeClass,
      ).getEndAnchorPosition(this, topChildBranchView).y -
      topChildBranchView.linePosition.y;
    const bottomChildEndPositionY =
      getTopicShape(
        bottomChildBranchView.topicView.figure.shapeClass,
      ).getEndAnchorPosition(this, bottomChildBranchView).y -
      bottomChildBranchView.linePosition.y;
    const childrenBaseY =
      (bottomChildBranchView.boundaryBounds.y +
        bottomChildBranchView.boundaryBounds.height -
        topChildEndPositionY -
        bottomChildEndPositionY -
        topChildBranchView.boundaryBounds.y -
        childrenSize.height) /
        2 +
      topChildBranchView.boundaryBounds.y +
      controlPositionY;
    let currentChildrenY = childrenBaseY;
    attachedChildrenBranchViewList.forEach((childBranchView) => {
      let childPositionX;
      let childPositionY;
      if (isRight) {
        childPositionX = childrenBaseX - childBranchView.bounds.x;
        childPositionY = currentChildrenY - childBranchView.boundaryBounds.y;
      } else {
        childPositionX =
          childrenBaseX -
          childBranchView.bounds.x -
          childBranchView.bounds.width;
        childPositionY = currentChildrenY - childBranchView.boundaryBounds.y;
      }
      childBranchView.setPosition(childPositionX, childPositionY);
      const spacingMinor = parseInt(
        `${parentBranchView.figure.minorSpacing || 0}`,
      );
      const lineWidth = parseInt(
        `${parentBranchView.topicView.figure.borderWidth || 0}`,
      );
      currentChildrenY +=
        childBranchView.boundaryBounds.height + spacingMinor + lineWidth;
    });
    const maxBottom = Math.max(
      parentBounds.y + parentBounds.height,
      childrenBaseY + childrenSize.height,
    );
    parentBounds.y = Math.min(parentBounds.y, childrenBaseY);
    parentBounds.height = maxBottom - parentBounds.y;
    parentBounds.width = parentBounds.width + spacingMajor + childrenSize.width;
  },
});
