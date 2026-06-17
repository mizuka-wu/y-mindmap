import { getTopicShape } from "../renderengine/svg/topicshapes/index";
const DEFAULT_BOUNDS = {
  x: -30,
  y: -12,
  width: 60,
  height: 24,
};
/* harmony default export */
export const placeholderTopicLayoutWorker = {
  work(viewController) {
    const topicView = viewController;
    if (!topicView.getContext()) {
      return;
    }
    const figure = topicView.figure;
    topicView.contentBounds = DEFAULT_BOUNDS;
    topicView.shapeBounds = DEFAULT_BOUNDS;
    topicView.bounds = DEFAULT_BOUNDS;
    topicView.figure.setSize(Object.assign({}, DEFAULT_BOUNDS));
    // work effect
    if (figure.shapeClassDirty || figure.sizeDirty) {
      Object(getTopicShape)(figure.shapeClass).render(figure.viewController);
    }
    return topicView.bounds;
  },
};
