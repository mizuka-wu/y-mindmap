import * as topicLineStyleUtils from "../../render/topiclinestyle/utils";
import * as brushes from "../../render/brushes";

export const brace4 = Object(topicLineStyleUtils.braceLineStyleTemplate)(
  {
    verticalBrush: brushes.brace4Vertical,
  },
  true,
);
