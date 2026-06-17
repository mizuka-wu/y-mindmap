import BranchView from "../../../view/branchview";
export class PlaceHolderBranchView extends BranchView {
  isAttachToUnbalanceRight: boolean;
  isPlaceHolderView: boolean;
  constructor(topicView, model) {
    super(model);
    this.isAttachToUnbalanceRight = false;
    this.isPlaceHolderView = true;
  }
}

export default PlaceHolderBranchView;
