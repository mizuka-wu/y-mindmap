import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

export class CollapseBranchesAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.COLLAPSE_BRANCHES;
  }
  /**
   * @description 收缩 branch
   * 收缩指定 branch 时，不需要参数
   * relativeLayer: 收缩指定 branch 下的相对 layer 的 branch
   * spread: 递归收缩指定 branch 下的所有 branch
   * relativeLayer && spread: 递归收缩指定 branch 下的相对 layer 的 branch 下的所有 branch
   * 收缩所有： 选中或传入 centralBranch，传入参数 spread = true
   */
  doExecute(
    { relativeLayer = 0, spread = false, targets = [] }: any = {
      relativeLayer: 0,
      spread: false,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((target) => target.type === VIEW_TYPE.BRANCH);
    targets.forEach((branch) => {
      if (relativeLayer > 0 || spread) {
        const layer = branch.model.getLayer() + relativeLayer;
        const types = [
          TOPIC_TYPE.ATTACHED,
          TOPIC_TYPE.DETACHED,
          TOPIC_TYPE.SUMMARY,
        ];
        branch.model.traverseTopic(types, (topic) => {
          if (
            topic.getLayer() === layer ||
            (spread && topic.getLayer() >= layer)
          ) {
            topic.collapseBranch();
          }
        });
      } else {
        branch.model.collapseBranch();
      }
    });
  }
  queryStatus(
    { relativeLayer = 0, spread = false, targets = [] }: any = {
      relativeLayer: 0,
      spread: false,
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    if (relativeLayer > 0 || spread) {
      targets = targets.filter(
        (target) =>
          target.type === VIEW_TYPE.BRANCH &&
          target.model.type() !== TOPIC_TYPE.CALLOUT,
      );
    } else {
      targets = targets.filter(
        (target) =>
          target.type === VIEW_TYPE.BRANCH &&
          target.model.canCollapse() &&
          !target.isMatrixHeadCellBranch() &&
          !target.model.isCollapse(),
      );
    }
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
