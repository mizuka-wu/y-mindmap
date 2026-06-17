import BranchView from "../../view/branchview";
import RelationshipView from "../../view/relationshipview";
import BoundaryView from "../../view/boundaryview";
import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class ClearPreSelectionAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CLEAR_PRE_SELECTION;
  }
  doExecute({ targets }) {
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return;
    }
    targets.forEach((view) => {
      if (view instanceof BranchView) {
        return this.clearPreSelectionOfBranchView(view);
      }
      if (view instanceof RelationshipView) {
        return this.clearPreSelectionOfRelationshipView(view);
      }
      if (view instanceof BoundaryView) {
        return this.clearPreSelectionOfBoundaryView(view);
      }
    });
  }
  clearPreSelectionOfBranchView(view) {
    // logic of mouseout event handler of branchhandler.ts
    if (!view.isSelected) {
      view.getProxy().displayDehover();
    }
    view.editDomain().eventBus.trigger("branchMouseOut", this);
  }
  clearPreSelectionOfRelationshipView(view) {
    // logic of mouseout event handler of relationshiphandler.ts
    view.isHovering = false;
    view._updateState();
    view.setIsHoveringStartPoint1(false);
    view.setIsHoveringStartPoint2(false);
    view.setIsHoveringControlPoint1(false);
    view.setIsHoveringControlPoint2(false);
  }
  clearPreSelectionOfBoundaryView(view) {
    // logic of mouseout event handler of boundaryhandler.ts
    if (!view.isSelected) {
      view.selectBox.hide();
      view.selectBox.stateMachine.transition(view.selectBox.event_out);
    }
  }
}
