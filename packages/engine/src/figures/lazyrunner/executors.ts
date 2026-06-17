import constants from "./constants";
import { FIGURE_TYPE } from "../../common/constants/index";
import {
  AlignmentByLevelLayoutInjector,
  validateLayoutBranchFigures,
} from "./executorinjectors";

const alignmentByLevelLayoutInjector = new AlignmentByLevelLayoutInjector();
const executes = {
  [constants.PRIORITY.LAYOUT]: layoutExecute,
  [constants.PRIORITY.RENDER]: renderExecute,
};
/* harmony default export */
export const executors = (type, tasks) => {
  if (tasks && tasks.length > 0) {
    const execute = executes[type] || defaultExecute;
    execute(tasks);
  }
};
function defaultExecute(tasks) {
  new Set<any>(tasks).forEach((task) => task.execute());
}
function layoutExecute(tasks) {
  // first step: layout
  const figuresToLayout = tasks;
  const toLayouts = {
    titles: [],
    markers: [],
    topics: [],
    branches: [],
    relationships: [],
    // relationshipTitles: [],
    // boundaryTitles: [],
    boundaries: [],
    connections: [],
    matrixLabels: [],
    mathJaxes: [],
    others: [],
  };
  new Set<any>(figuresToLayout).forEach((figure) => {
    switch (figure.type) {
      case FIGURE_TYPE.TOPIC:
      case FIGURE_TYPE.PLACE_HOLDER_TOPIC:
        toLayouts.topics.push(figure);
        break;
      case FIGURE_TYPE.BRANCH:
        if (figure.viewController.getContext()) {
          toLayouts.branches.push(figure);
        }
        break;
      case FIGURE_TYPE.MARKERS:
        toLayouts.markers.push(figure);
        break;
      case FIGURE_TYPE.RELATIONSHIP:
        toLayouts.relationships.push(figure);
        break;
      case FIGURE_TYPE.TOPIC_TITLE:
        toLayouts.titles.push(figure);
        break;
      case FIGURE_TYPE.RELATIONSHIP_TITLE:
        toLayouts.titles.push(figure);
        break;
      case FIGURE_TYPE.BOUNDARY_TITLE:
        toLayouts.titles.push(figure);
        break;
      case FIGURE_TYPE.NUMBERING:
        toLayouts.titles.push(figure);
        break;
      case FIGURE_TYPE.BOUNDARY:
        toLayouts.boundaries.push(figure);
        break;
      case FIGURE_TYPE.CONNECTION:
        toLayouts.connections.push(figure);
        break;
      case FIGURE_TYPE.MATRIX_LABEL:
        toLayouts.matrixLabels.push(figure);
        break;
      case FIGURE_TYPE.MATH_JAX:
        toLayouts.mathJaxes.push(figure);
        break;
      default:
        toLayouts.others.push(figure);
    }
  });
  toLayouts.titles.forEach((f) => f.validateLayout());
  toLayouts.markers.forEach((f) => f.validateLayout());
  toLayouts.mathJaxes.forEach((f) => f.validateLayout());
  toLayouts.topics.forEach((f) => f.validateLayout());
  toLayouts.matrixLabels.forEach((f) => f.validateLayout());
  toLayouts.branches = toLayouts.branches.filter((f) =>
    f.viewController.parent(),
  );
  alignmentByLevelLayoutInjector.start(toLayouts.branches);
  validateLayoutBranchFigures(toLayouts.branches);
  // toLayouts.relationshipTitles.forEach(f => f.validateLayout())
  toLayouts.relationships.forEach((f) => f.validateLayout());
  // toLayouts.connections.forEach(f => f.validateLayout())
  toLayouts.others.forEach((f) => f.validateLayout());
  toLayouts.boundaries.forEach((boundaryFigure) => {
    if (!boundaryFigure.isVisible && boundaryFigure.viewController.selectBox) {
      boundaryFigure.viewController.selectBox.figure.setVisible(false);
    }
    boundaryFigure.validateLayout();
  });
}
function renderExecute(tasks) {
  // second step:
  const figuresToRender = tasks;
  const toRenders = {
    marker: [],
    markers: [],
    topics: [],
    branches: [],
    connections: [],
    others: [],
  };
  new Set<any>(figuresToRender).forEach((figure) => {
    switch (figure.type) {
      case FIGURE_TYPE.MARKER:
        toRenders.marker.push(figure);
        break;
      // case FIGURE_TYPE.MARKERS:
      //   toRenders.markers.push(figure)
      //   break
      case FIGURE_TYPE.TOPIC:
      case FIGURE_TYPE.PLACE_HOLDER_TOPIC:
        toRenders.topics.push(figure);
        break;
      case FIGURE_TYPE.BRANCH:
        toRenders.branches.push(figure);
        break;
      case FIGURE_TYPE.CONNECTION:
        toRenders.connections.push(figure);
        break;
      default:
        toRenders.others.push(figure);
    }
  });
  const sortedToRender = [
    "marker",
    "markers",
    "topics",
    "branches",
    "connections",
    "others",
  ];
  for (const renderType of sortedToRender) {
    toRenders[renderType].forEach((figure) => {
      figure.validatePaint();
    });
  }
}
