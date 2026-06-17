/* eslint-disable @typescript-eslint/no-unused-vars */
import dateformat from "dateformat";

import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class InsertAudioNotesOnNewTopicAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.INSERT_AUDIO_NOTES_ON_NEW_TOPIC;
  }
  doExecute({ audioNotesData, title, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    targets.forEach((target) => {
      const model = target.model;
      // 设置默认title
      if (!title) {
        const titlePrefix = this._context.getTranslatedText(
          "RECORD_TITLE_PREFIX",
        );
        title = `${titlePrefix} ${dateformat(new Date(), "dd/mm/yy hh:MM TT")}`;
      }
      const newTopicModel = model.createEmptyTopic({
        title,
        titleUnedited: true,
      });
      newTopicModel.addAudioNotes(audioNotesData);
      model.addChildTopic(newTopicModel);
    });
  }
  queryStatus({ title, targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
