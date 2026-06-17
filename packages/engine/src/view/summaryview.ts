import process from "process";
import { VIEW_TYPE } from "../common/constants/index";

import SvgComponentView from "./svgcomponentview";
/**
 * for summary branchview or callout branchview, if you want to hide it in some situation
 * you should modify BranchView.shouldHide() method
 */
export class SummaryView extends SvgComponentView {
  model: any;
  constructor(model) {
    super({
      model,
    });
    this.model = model;
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(this.model, "change:range", this.onRangeChange);
    }
  }
  get type() {
    return VIEW_TYPE.SUMMARY;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  remove() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const parent = this.parent();
    if (parent === null || parent === undefined) {
      // do nothing
    } else {
      parent.summaries.forEach((sv, index) => {
        if (sv === this) {
          parent.summaries.splice(index, 1);
        }
      });
    }
    const editDomain = self.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.removeFromSelection(self);
    }
    if (editDomain && editDomain.model2View) {
      delete editDomain.model2View[self.model.id];
    }
    this.stopListening();
    self.parent(null);
    return this;
  }
  onRangeChange() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      // do noting
    } else {
      _a.refresh();
    }
  }
}

export default SummaryView;
