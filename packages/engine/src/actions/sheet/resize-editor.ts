import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ResizeEditorAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.RESIZE_EDITOR;
  }
  doExecute({ visibleAreaBounds }: any = {}) {
    if (visibleAreaBounds) {
      const cc = this._context.getSVGView().getCanvasControl();
      cc.setVisibleAreaBounds(visibleAreaBounds);
      cc.setScrollContainerBounds(visibleAreaBounds);
    }
  }
}
