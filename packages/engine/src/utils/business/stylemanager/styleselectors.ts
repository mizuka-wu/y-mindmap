import { VIEW_TYPE } from "../../../common/constants/index";
import { MindMapStyleSelector } from "./mindmapstyleselector";
import { topicStyleSelector } from "./topicstyleselector";
import { boundaryStyleSelector } from "./boundarystyleselector";
import { relationhipStyleSelector } from "./relationshipstyleselector";

import { sheetStyleSelector } from "./sheetstyleselector";
import { summaryStyleSelector } from "./summarystyleselector";

const allStyleSelectors = {
  topic: topicStyleSelector,
  boundary: boundaryStyleSelector,
  relationship: relationhipStyleSelector,
  summary: summaryStyleSelector,
  sheet: sheetStyleSelector,
  mindmap: new MindMapStyleSelector(),
};
export function styleSelectors(target) {
  switch (target.type) {
    case VIEW_TYPE.BRANCH:
      return allStyleSelectors.topic;
    case VIEW_TYPE.BOUNDARY:
      return allStyleSelectors.boundary;
    case VIEW_TYPE.RELATIONSHIP:
      return allStyleSelectors.relationship;
    case VIEW_TYPE.SHEET:
      return allStyleSelectors.sheet;
    case VIEW_TYPE.SUMMARY:
      return allStyleSelectors.summary;
  }
  return allStyleSelectors.mindmap;
}

export default styleSelectors;
