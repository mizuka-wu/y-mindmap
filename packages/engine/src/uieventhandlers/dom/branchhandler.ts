/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CONFIG,
  VIEW_TYPE,
  UI_STATUS,
  MODULE_NAME,
  ANIMATION_FLAGS,
} from "../../common/constants/index";
import * as uiEventsUtils from "../../uievents/utils";

export const viewType = VIEW_TYPE.BRANCH;
export const events = {
  dblclick: "onDblClick",
  mouseover: "onMouseover",
  mouseout: "onMouseout",
  mouseup: "onMouseup",
  mousedown: "onMousedown",
  contextmenu: "onContextMenu",
  press: "onPress",
  pressup: "onPressUp",
};
export const eventHandlers = {
  onDblClick(e) {
    if (e) {
      e.stopPropagation();
    }
    if (
      e &&
      e.target.getAttribute("data-name") === "collapse-extend-hover-area"
    ) {
      return;
    }
    const editDomain = this.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.selectSingle(this);
    }
  },
  onMouseover(e) {
    if (this.getContext().config(CONFIG.DISABLE_PRESELECTION_BOX)) {
      return;
    }
    if (
      this.getContext()
        .getActiveUIStatus()
        .includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)
    ) {
      return;
    }
    if (this.isSelected) {
      return;
    }
    if (
      e &&
      e.target.getAttribute("data-name") !== "collapse-extend-hover-area"
    ) {
      this.getProxy().displayHover();
    }
    if (this.collapseExtendView && this.getProxy() === this) {
      this.collapseExtendView.hover();
    }
    this.editDomain().eventBus.trigger("branchMouseOver", this);
  },
  onMouseout(e) {
    if (!this.isSelected) {
      this.getProxy().displayDehover();
    }
    this.editDomain().eventBus.trigger("branchMouseOut", this);
  },
  onMouseup(e) {
    if (
      e &&
      e.target.getAttribute("data-name") === "collapse-extend-hover-area"
    ) {
      return;
    }
    this.editDomain().eventBus.trigger("branchMouseUp", this);
  },
  onMousedown(e) {
    e.stopPropagation();
    if (this.originBranchView) {
      return e.preventDefault();
    }
    if (
      e &&
      e.target.getAttribute("data-name") === "collapse-extend-hover-area"
    ) {
      return;
    }
    // 若是右键
    if (
      e.which === 3 &&
      !Object(uiEventsUtils.isDragUIStatusActive)(this.getContext())
    ) {
      return this._dispatchContextMenu(e);
    }
    // 后面全是处理左键
    if (e.which !== 1) {
      return;
    }
    // if e.target is topicView.topicCustomWidthControlBar
    if (
      e &&
      e.target.getAttribute("data-name") === "topic-custom-width-control-bar"
    ) {
      return;
    }
    if (
      this.isCentralBranch() ||
      this === this.sheetView.activatedTopBranchView
    ) {
      const moveViewportModule = this.getModule(MODULE_NAME.MOVE_VIEW_PORT);
      if (moveViewportModule) {
        moveViewportModule.onDragViewPort(e, this);
      }
      return;
    }
    if (this.isSummaryBranch() || this.originBranchView) {
      return;
    }
    const dragModule = this.getModule(MODULE_NAME.DRAG);
    if (dragModule) {
      dragModule.prepareStartDrag(e, this);
    }
  },
  onContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.detail !== 100) {
      e.stopImmediatePropagation();
    }
  },
  /**
   * @description not for central branch or summary branch
   * */
  onPress(e) {
    e.stopPropagation();
    if (
      e &&
      e.target.getAttribute("data-name") === "collapse-extend-hover-area"
    ) {
      return;
    }
    this._pressContextMenuCheckHandle();
    if (!this.isCentralBranch() && !this.isSummaryBranch()) {
      const animationManager = this.getModule(MODULE_NAME.ANIMATION);
      if (animationManager === null || animationManager === undefined) {
        // do nothing
      } else {
        animationManager.startAnimation(ANIMATION_FLAGS.BRANCH_ZOOM_IN, {
          target: this,
        });
      }
      const dragModule = this.getModule(MODULE_NAME.DRAG);
      if (dragModule) {
        dragModule.prepareStartDrag(e, this);
      }
    }
  },
  onPressUp(e) {
    e.stopPropagation();
    const animationManager = this.getModule(MODULE_NAME.ANIMATION);
    if (animationManager === null || animationManager === undefined) {
      // do nothing
    } else {
      animationManager.reverseAnimationByFlag(ANIMATION_FLAGS.BRANCH_ZOOM_IN);
    }
    this._dispatchContextMenu(e);
  },
};

export default {
  viewType,
  events,
  eventHandlers,
};
