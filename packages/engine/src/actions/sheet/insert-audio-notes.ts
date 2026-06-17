import {
  ACTION_NAMES,
  ACTION_STATUS,
  CLASS_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class InsertAudioNotesAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.INSERT_AUDIO_NOTES;
  }
  doExecute({ audioNotesData, targets = [] }: any = {}) {
    if (!audioNotesData) {
      return;
    }
    const filterTargets = this.getFilterBranchViewList(targets);
    filterTargets.forEach((target) => {
      const model = target.model;
      model.addAudioNotes(audioNotesData);
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    targets = this.getFilterBranchViewList(targets);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  getFilterBranchViewList(targets) {
    return super.getFilterBranchViewList(targets).filter((branchView) => {
      const isNotCallOutTopic =
        styleManager.getClassName(branchView) !== CLASS_TYPE.CALLOUT_TOPIC;
      const hasHref = branchView.model.getHref();
      return isNotCallOutTopic && !hasHref;
    });
  }
}
