import {
  VIEW_TYPE,
  ACTION_NAMES,
  MODULE_NAME,
  ACTION_STATUS,
  TOPIC_TYPE,
  ADAPTERS,
} from "../../common/constants/index";
import BaseAction from "../action";
import mommonFuncs from "../../mommonfuncs";

export class PasteStyleAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.PASTE_STYLE;
  }
  doExecute(
    { targets }: any = {
      targets: [],
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const setTargetsStyleObject = (targets, styleObject) => {
      this._context.execAction(ACTION_NAMES.SET_STYLE_OBJECT, {
        targets,
        styleObj: {
          id: mommonFuncs.UUID(),
          properties: styleObject,
        },
        prue: true,
      });
    };
    targets.forEach((target) => {
      const styleClipboard = JSON.parse(
        localStorage.getItem("SBStyleClipboard") || "{}",
      );
      if (target.type === styleClipboard.type) {
        if (
          target.type === VIEW_TYPE.BRANCH &&
          target.model.type() === TOPIC_TYPE.SUMMARY
        ) {
          const summaryView = target.getAdapter(ADAPTERS.SUMMARY_VIEW);
          setTargetsStyleObject([summaryView], styleClipboard.summaryLineStyle);
        }
        setTargetsStyleObject([target], styleClipboard.style);
      }
    });
  }
  queryStatus(
    { targets }: any = {
      targets: [],
    },
  ) {
    if (!targets || targets.length < 1) {
      targets = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    }
    const styleClipboard = JSON.parse(
      localStorage.getItem("SBStyleClipboard") || "{}",
    );
    if (targets.length < 1 || !styleClipboard) {
      return ACTION_STATUS.DISABLE;
    }
    if (targets.some((target) => target.type === styleClipboard.type)) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}
