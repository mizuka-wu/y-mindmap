import {
  STRUCTURECLASS,
  DIRECTION,
  TOPIC_TYPE,
  STYLE_KEYS,
  CLASS_TYPE,
} from "../common/constants/index";
import * as utils from "../figures/renderengine/svg/topicshapes/utils";
import * as js_utils from "../utils/index";
import styleManager from "../utils/business/stylemanager/index";

import { getTopicLineStyle } from "../render/topiclinestyle/index";

import underscore from "underscore";
import * as boundutils from "../utils/boundutils";
import * as common_utils from "../common/utils/index";
import { AbstractStructure } from "./abstractstructure";

import defaultStyles from "../utils/business/stylemanager/defaultstyles";
export const TimelineThroughVertical = Object(underscore.extend)(
  {},
  AbstractStructure,
  {
    STRUCTURECLASS: STRUCTURECLASS.TIMELINETHROUGHVERTICAL,
    getChildStructure(structure, index, branch) {
      if (
        Object(js_utils.getFinalTimelineChildDirection)(branch, index) ===
        DIRECTION.LEFT
      ) {
        return STRUCTURECLASS.LOGICLEFT;
      } else {
        return STRUCTURECLASS.LOGICRIGHT;
      }
    },
    getSummaryDirection(branch, index) {
      return Object(js_utils.getFinalTimelineChildDirection)(branch, index);
    },
    getSourceOrientation: () => DIRECTION.DOWN,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getAvailableChildStructure(parentBranch, child) {
      return [];
    },
    getTopicSpacing(parentBranch) {
      const className = styleManager.getClassName(parentBranch);
      const designPadding = className === CLASS_TYPE.CENTRAL_TOPIC ? 60 : 36;
      const lineEndSpacing = Object(js_utils.getLineEndSpacingPatchGap)(
        parentBranch,
      );
      return (
        (parseInt(
          styleManager.getStyleValue(parentBranch, STYLE_KEYS.SPACING_MINOR),
        ) *
          designPadding) /
          parseInt(
            defaultStyles.getStyleValue(className, STYLE_KEYS.SPACING_MINOR),
          ) +
        lineEndSpacing
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getChildTargetOrientation: (parent, childIndex) => {
      return DIRECTION.UP;
    },
    calAttachedChildrenPos(parentBranch, newBounds) {
      const TOPIC_SPACING = this.getTopicSpacing(parentBranch);
      const attachedBranchListWithParentBranch = [
        parentBranch,
        ...parentBranch.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED),
      ];
      const posList = attachedBranchListWithParentBranch.reduce(
        (result, currentBranch, index) => {
          if (index === 0) {
            return result;
          }
          const prevBranchView = attachedBranchListWithParentBranch[index - 1];
          const { x: prevPosX, y: prevPosY } = result[index - 1];
          const { x: prevShapeOffsetX, y: prevShapeOffsetY } = Object(
            js_utils.getTopicShape,
          )(prevBranchView).getBasePoint(prevBranchView, DIRECTION.DOWN);
          const { height: prevBoundsHeight, y: prevBoundsY } =
            index > 1
              ? prevBranchView.boundaryBounds
              : prevBranchView.topicView.shapeBounds;
          const { y: currBoundsY } = currentBranch.boundaryBounds;
          const { x: currShapeOffsetX } = Object(js_utils.getTopicShape)(
            prevBranchView,
          ).getBasePoint(prevBranchView, DIRECTION.UP);
          const x = prevPosX + prevShapeOffsetX + -currShapeOffsetX;
          const offsetYOfTopics =
            prevShapeOffsetY + TOPIC_SPACING + -currBoundsY;
          const offsetYOfBounds =
            prevShapeOffsetY + prevBoundsHeight + prevBoundsY + -currBoundsY;
          const y = prevPosY + Math.max(offsetYOfBounds, offsetYOfTopics);
          return [
            ...result,
            {
              x,
              y,
            },
          ];
        },
        [
          {
            x: 0,
            y: 0,
          },
        ],
      );
      posList.forEach(
        (pos, index) =>
          index > 0 &&
          attachedBranchListWithParentBranch[index].setPosition(pos),
      );
      const childrenSize = this.getChildrenSize(parentBranch);
      Object.assign(
        newBounds,
        Object(boundutils.getUnionBoundingBox)(newBounds, childrenSize),
      );
    },
    drawAttachedConnectLine(parentBranch, childBranch) {
      const children = parentBranch.getChildrenBranchesByType(
        TOPIC_TYPE.ATTACHED,
      );
      const index = children.indexOf(childBranch);
      // not re-render line for temporary branch view
      if (index < 0) {
        return;
      }
      const prevBranch = index > 0 ? children[index - 1] : parentBranch;
      const topicLineStyle = childBranch.getConnectionView().figure.lineShape;
      const lineRenderer = getTopicLineStyle(topicLineStyle);
      const prevShape = Object(js_utils.getTopicShape)(prevBranch);
      const startPt = Object(utils.relativePositionToRealPosition)(
        Object(common_utils.addPoint)(
          prevShape.getBasePoint(prevBranch, DIRECTION.DOWN),
          prevShape.getPointOffset(prevBranch, DIRECTION.DOWN),
        ),
        prevBranch,
      );
      const endPt = Object(js_utils.getTopicShape)(
        childBranch,
      ).getEndAnchorPosition(
        STRUCTURECLASS.TIMELINETHROUGHVERTICAL,
        childBranch,
      );
      lineRenderer(
        childBranch,
        {
          startPt,
          ctrlPt: startPt,
          endPt,
        },
        false,
        false,
      );
    },
  },
);
