/* eslint-disable @typescript-eslint/no-unused-vars */
export class BaseHandler {
  context: any;
  centralBranch: any;
  constructor(context) {
    this.context = context;
    this.centralBranch = this.context.getSheetView().centralBranchView;
  }
  dragStart(...args) {}
  dragMoving(...args) {}
  dragFinish(...args) {}
  dragCancel(...args) {
    return false;
  }
  getDragOverView(transferData) {
    return null;
  }
}

export default BaseHandler;
