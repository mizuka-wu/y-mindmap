import {
  ACTION_NAMES,
  STYLE_KEYS,
  LINE_PATTERN,
  LINETAPERED,
  HAND_DRAWN_LINE_PATTERN,
  NORMAL_LINE_PATTERN,
} from "../../common/constants/index";
import BaseAction from "../action";

export class ChangeLineTaperedAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_LINE_TAPERED;
  }
  /**
   * @param {string} tapered - "tapered" or "none"
   */
  doExecute({ tapered }: any = {}) {
    if (tapered === undefined) {
      return;
    }
    this._context
      .getSVGView()
      .content()
      .model.changeStyle(STYLE_KEYS.LINE_TAPERED, tapered);
    if (tapered === LINETAPERED.TAPERED) {
      this.clearCentralBranchViewLinePattern();
    }
  }
  clearCentralBranchViewLinePattern() {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    const linePattern = centralBranchView.figure.linePattern;
    let targetNewLinePattern;
    // @ts-ignore
    if (Object.values(HAND_DRAWN_LINE_PATTERN).includes(linePattern)) {
      if (linePattern !== LINE_PATTERN.HANDDRAWNSOLID) {
        targetNewLinePattern = LINE_PATTERN.HANDDRAWNSOLID;
      }
    }
    // @ts-ignore
    if (Object.values(NORMAL_LINE_PATTERN).includes(linePattern)) {
      if (linePattern !== LINE_PATTERN.SOLID) {
        targetNewLinePattern = LINE_PATTERN.SOLID;
      }
    }
    if (targetNewLinePattern) {
      this._context.execAction(ACTION_NAMES.CHANGE_LINE_PATTERN, {
        linePattern: targetNewLinePattern,
        targets: [centralBranchView],
      });
    }
  }
}
