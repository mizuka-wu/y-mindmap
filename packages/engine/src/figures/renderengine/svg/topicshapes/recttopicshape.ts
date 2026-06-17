import AbstractTopicShape from "./abstracttopicshape";

import * as brushes from "./brushes";

export class RectTopicShape extends AbstractTopicShape {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcTopicShapePath(bounds, topicView) {
    return brushes.rect(bounds);
  }
}
