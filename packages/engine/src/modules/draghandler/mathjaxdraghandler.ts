import { ImageDragHandler } from "./imagedraghanlder";

export class MathJaxDragHandler extends ImageDragHandler {
  dragFinish(transferData) {
    if (!this.stashInfo.newParent) {
      return;
    }
    const { draggedView: targetMathJaxView } = transferData;
    const oldBranchView = targetMathJaxView.parent().parent();
    const oldTopicModel = oldBranchView.model;
    if (oldBranchView === this.stashInfo.newParent) {
      // set new align
      oldTopicModel.updateMathJaxAlign(this.stashInfo.direction);
    } else {
      const newMathJaxInfo = oldTopicModel.getMathJaxInfo();
      oldTopicModel.removeMathJaxInfo();
      newMathJaxInfo.content.align = this.stashInfo.direction;
      this.stashInfo.newParent.model.updateMathJaxInfo(newMathJaxInfo);
    }
    this._changeParent(null);
  }
}
