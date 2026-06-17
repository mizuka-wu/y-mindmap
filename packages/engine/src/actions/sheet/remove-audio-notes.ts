import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class RemoveAudioNotesAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_AUDIO_NOTES;
  }
  doExecute({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC,
    );
    targets.forEach((target) => {
      target.model.removeAudioNotes();
    });
  }
  queryStatus({ targets = [] }: any = {}) {
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
