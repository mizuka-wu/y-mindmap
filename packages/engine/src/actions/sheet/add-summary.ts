import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

import { mergeParentAndRange } from "./utils";

import * as js_utils from "../../utils/index";
export class AddSummaryAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_SUMMARY;
  }
  doExecute() {
    // summary's addition is same like boundary
    const selections = this._context.getModule(
      MODULE_NAME.SELECTION,
    ).selections;
    const length = selections.length;
    if (length === 0) {
      return;
    }
    const sheet = selections[0].model.ownerSheet();
    if (length === 1 && selections[0].type === VIEW_TYPE.BRANCH) {
      const selection = selections[0];
      if (selection.isCentralBranch()) {
        return;
      }
      const parent = selection.parent();
      const index = parent.getChildrenBranchesByType().indexOf(selection);
      if (index < 0) {
        return;
      }
      const { summaryData, summaryTopic } = generateSummaryDataAndTopic.call(
        this,
        `(${index},${index})`,
      );
      parent.model.addSummary(summaryData, false, summaryTopic);
    } else {
      const divided = mergeParentAndRange(selections).rangeMap;
      Object.values(divided).forEach((complexObject: any) => {
        const parent = complexObject.parent;
        const drange = complexObject.range;
        drange.forEach((r) => {
          const { summaryData, summaryTopic } =
            generateSummaryDataAndTopic.call(this, `(${r.start},${r.end})`);
          parent.model.addSummary(summaryData, null, summaryTopic);
        });
      });
    }
    function generateSummaryDataAndTopic(range) {
      const defaultTitle = this._context.getTranslatedText(
        "DEFAULT_SUMMARY_TOPIC_TITLE",
      );
      const summaryTopic = sheet.createComponent("topic", {
        title: defaultTitle,
        titleUnedited: true,
      });
      const summaryData = {
        // class: 'summary',
        id: sheet.generateComponentId(),
        range,
        topicId: summaryTopic.get("id"),
      };
      return {
        summaryData,
        summaryTopic,
      };
    }
  }
  queryStatus() {
    const targets = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections()
      .filter(
        (view) =>
          view.type === VIEW_TYPE.BRANCH &&
          view.model.type() === TOPIC_TYPE.ATTACHED,
      )
      .filter((view) => !Object(js_utils.isTreeTableCell)(view));
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
