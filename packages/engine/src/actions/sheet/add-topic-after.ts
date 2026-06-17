import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  CLASS_TYPE,
  STRUCTURECLASS,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";

export class AddTopicAfterAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_TOPIC_AFTER;
  }
  /**
   * @param options.isTitleEdited {bool}
   * */
  doExecute({ topicData, targets = [], options = {} }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC &&
        styleManager.getClassName(view) !== CLASS_TYPE.SUMMARY_TOPIC,
    );
    targets.forEach((target) => {
      if (target.isCentralBranch()) {
        this._context.execAction(ACTION_NAMES.ADD_SUB_TOPIC, {
          topicData,
          targets: [target],
          prue: true,
          options,
        });
        return;
      }
      if (target.type === VIEW_TYPE.BRANCH) {
        const broModel = target.model.addBrotherTopic(topicData, {
          before: false,
          position: target.position,
          title: target.getBrotherDefaultTitle(),
          isTitleEdited: options.isTitleEdited,
        });
        // add by Ray, not good enough
        const parent = target.parent();
        const structure =
          parent.getStructureClass && parent.getStructureClass();
        if (
          structure === STRUCTURECLASS.SPREADSHEETROW ||
          structure === STRUCTURECLASS.SPREADSHEETCOLUMN
        ) {
          const labels = target.model.getLabel();
          broModel.changeLabel(labels);
        }
      }
    });
  }
  queryStatus({ targets = [] }: any = {}) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    // 只在选中单个的时候能调用
    if (targets.length !== 1) {
      return ACTION_STATUS.DISABLE;
    }
    targets = targets.filter(
      (view) =>
        view.type === VIEW_TYPE.BRANCH &&
        styleManager.getClassName(view) !== CLASS_TYPE.CALLOUT_TOPIC &&
        styleManager.getClassName(view) !== CLASS_TYPE.SUMMARY_TOPIC,
    );
    if (targets.length > 0) {
      //Show Branch Only mode
      const atb = this._context.getSheetView().activatedTopBranchView;
      if (atb && targets[0] === atb) {
        return ACTION_STATUS.DISABLE;
      }
      return ACTION_STATUS.NORMAL;
    }
    return ACTION_STATUS.DISABLE;
  }
}
