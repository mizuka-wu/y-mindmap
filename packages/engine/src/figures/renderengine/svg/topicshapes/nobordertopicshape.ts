import mommonFuncs from "../../../../mommonfuncs";
import AbstractTopicShape from "./abstracttopicshape";
export class NoBorderTopicShape extends AbstractTopicShape {
  _render(topicView /*TopicView*/) {
    topicView.setTopicShapePath("");
    const bounds = topicView.shapeBounds;
    const topicShapeFillPath =
      "M " +
      bounds.x +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width) +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.height) +
      "L " +
      bounds.x +
      " " +
      (bounds.y + bounds.height) +
      "z";
    topicView.setTopicShapeFillPath(topicShapeFillPath);
    const borderWidth = parseInt(topicView.figure.borderWidth || 0);
    const topicShapeSelectBoxD = mommonFuncs.generateRect(bounds, borderWidth);
    topicView.setTopicShapeSelectBoxPath(topicShapeSelectBoxD);
  }
}
