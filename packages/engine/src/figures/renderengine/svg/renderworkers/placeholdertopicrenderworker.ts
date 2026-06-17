import * as lib from "../../../../lib/index";
import { TopicRenderWorker } from "./topicrenderworker";

export class PlaceHolderTopicRenderWorker extends TopicRenderWorker {
  protectedCreateTopicShapeFill() {
    const path = new lib.SVG.Path();
    path.attr({
      "fill-opacity": "0.5",
    });
    return path;
  }
}
