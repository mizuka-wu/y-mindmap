import * as utils from "../../utils/index";
import BranchView from "../../view/branchview";

import { getStructure } from "../../structures/helper/allstructures";

export const connectionLayoutWorker = {
  work(connectionView) {
    const endBranchView = connectionView.parent();
    if (
      !(endBranchView instanceof BranchView) ||
      Object(utils.isSummaryBranch)(endBranchView)
    ) {
      return;
    }
    const startBranchView = endBranchView.parent();
    if (!(startBranchView instanceof BranchView)) {
      return;
    }
    getStructure(startBranchView.getStructureClass()).drawConnectLine(
      startBranchView,
      endBranchView,
    );
  },
};
