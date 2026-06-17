import AbstractTopicShape from "./abstracttopicshape";

const corner = 8;
export class RoundedRectTopicShape extends AbstractTopicShape {
  /** @protected */
  calcTopicShapePath(bounds) {
    return (
      "M " +
      (bounds.x + corner) +
      " " +
      bounds.y +
      "L " +
      (bounds.x + bounds.width - corner) +
      " " +
      bounds.y +
      "Q " +
      (bounds.x + bounds.width) +
      " " +
      bounds.y +
      "  " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + corner) +
      "L " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.height - corner) +
      "Q " +
      (bounds.x + bounds.width) +
      " " +
      (bounds.y + bounds.height) +
      "  " +
      (bounds.x + bounds.width - corner) +
      " " +
      (bounds.y + bounds.height) +
      "L " +
      (bounds.x + corner) +
      " " +
      (bounds.y + bounds.height) +
      "Q " +
      bounds.x +
      " " +
      (bounds.y + bounds.height) +
      "  " +
      bounds.x +
      " " +
      (bounds.y + bounds.height - corner) +
      "L " +
      bounds.x +
      " " +
      (bounds.y + corner) +
      "Q " +
      bounds.x +
      " " +
      bounds.y +
      "  " +
      (bounds.x + corner) +
      " " +
      bounds.y +
      "Z"
    );
  }
}
