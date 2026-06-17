import styleManager from "../utils/business/stylemanager/index";
import { VIEW_TYPE, FIGURE_TYPE } from "../common/constants/index";

import TextView from "./textview";
export class NumberingView extends TextView {
  figure: any;
  get type() {
    return VIEW_TYPE.NUMBERING;
  }
  get figureType() {
    return FIGURE_TYPE.NUMBERING;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  afterAncestorChange() {
    const topicView = this.parent();
    if (!topicView) {
      return;
    }
    const branch = topicView.parent();
    this.setText(
      (branch === null || branch === undefined
        ? undefined
        : branch.getNumberingText()) || "",
    );
    this.refreshFontInfo(styleManager.getFontInfo(branch) || {});
    super.afterAncestorChange.bind(this)();
  }
  getSvg() {
    return this.figure.getContent();
  }
}

export default NumberingView;
