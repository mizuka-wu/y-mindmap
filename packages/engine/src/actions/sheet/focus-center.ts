import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
} from "../../common/constants/index";
import BaseAction from "../action";

const ENABLE_VIEW_LIST = [
  VIEW_TYPE.BRANCH,
  VIEW_TYPE.BOUNDARY,
  VIEW_TYPE.RELATIONSHIP,
];
export class FocusCenterAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.FOCUS_CENTER;
  }
  doExecute({ animated = true, finishToRun, targets = [] }: any = {}) {
    const targetView = this.getFilterViewList(targets)[0];
    let targetPosition = {
      x: 0,
      y: 0,
    };
    switch (targetView.type) {
      case VIEW_TYPE.BRANCH: {
        targetPosition = targetView.getRealPosition();
        break;
      }
      case VIEW_TYPE.BOUNDARY: {
        const size = targetView.figure.size;
        const realPosition = targetView.getRealPosition();
        targetPosition = {
          x: realPosition.x + size.width / 2,
          y: realPosition.y + size.height / 2,
        };
        break;
      }
      case VIEW_TYPE.RELATIONSHIP: {
        targetPosition = targetView.titleView.getRealPosition();
        break;
      }
    }
    this._context.getSVGView().getCanvasControl().center(targetPosition, {
      animate: animated,
      finishToRun,
    });
  }
  getFilterViewList(targets) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    targets = targets.filter((view) => ENABLE_VIEW_LIST.includes(view.type));
    if (!targets.length) {
      targets = [this._context.getSheetView().centralBranchView];
    }
    return targets;
  }
}
