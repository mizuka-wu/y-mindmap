import * as layoututil from "../../utils/layoututil";

export const branchLayoutWorker = {
  work(viewController) {
    const branchView = viewController;
    branchView.isLayout = false;
    layoututil.doLayoutBranch(branchView);
    branchView.figure.setSize({
      width: branchView.bounds.width,
      height: branchView.bounds.height,
    });
    return branchView.bounds;
  },
};
