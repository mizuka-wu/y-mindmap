import { FIGURE_TYPE } from "../../common/constants/index";

import { branchLayoutWorker } from "./branchlayoutworker";

import { topicLayoutWorker } from "./topiclayoutworker";
import { markersLayoutWorker } from "./markerslayoutworker";

import { titleLayoutWorker } from "./titlelayoutworker";

import { relationshipLayoutWorker } from "./relationshiplayoutworker";

import { boundaryLayoutWorker } from "./boundarylayoutworker";

import { placeholderTopicLayoutWorker } from "./placeholdertopiclayoutworker";

import { matrixLayoutWorker } from "./matrixlayoutworker";

import { matrixLabelLayoutWorker } from "./matrixlabellayoutworker";

import { mathjaxLayoutWorker } from "./mathjaxlayoutworker";

import { connectionLayoutWorker } from "./connectionlayoutworker";

export const layoutEngine = {
  createLayoutWorker(type: FIGURE_TYPE) {
    switch (type) {
      case FIGURE_TYPE.BRANCH:
        return branchLayoutWorker;
      case FIGURE_TYPE.TOPIC:
        return topicLayoutWorker;
      case FIGURE_TYPE.MARKERS:
        return markersLayoutWorker;
      case FIGURE_TYPE.TOPIC_TITLE:
      case FIGURE_TYPE.RELATIONSHIP_TITLE:
      case FIGURE_TYPE.NUMBERING:
      case FIGURE_TYPE.BOUNDARY_TITLE:
        return titleLayoutWorker;
      case FIGURE_TYPE.RELATIONSHIP:
        return relationshipLayoutWorker;
      case FIGURE_TYPE.BOUNDARY:
        return boundaryLayoutWorker;
      case FIGURE_TYPE.PLACE_HOLDER_TOPIC:
        return placeholderTopicLayoutWorker;
      case FIGURE_TYPE.MATRIX:
        return matrixLayoutWorker;
      case FIGURE_TYPE.MATRIX_LABEL:
        return matrixLabelLayoutWorker;
      case FIGURE_TYPE.MATH_JAX:
        return mathjaxLayoutWorker;
      case FIGURE_TYPE.CONNECTION:
        return connectionLayoutWorker;
      default:
        return {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          work(viewController) {
            return {
              width: -1,
              height: -1,
            };
          },
        };
    }
  },
};
