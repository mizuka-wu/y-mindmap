import mommonFuncs from "../mommonfuncs";

import {
  TOPIC_ATTACHED,
  TOPIC_SUMMARY,
  TOPIC_DETACHED,
  TOPIC_CALLOUT,
  MODULE_NAME,
  UI_STATUS,
} from "../common/constants/index";

import * as layoutUtil from "../utils/layoututil";

import Util from "../util";

const { nextTick } = Util;

const allType = [TOPIC_ATTACHED, TOPIC_SUMMARY, TOPIC_DETACHED, TOPIC_CALLOUT];
//Description: collect layout requests, merge them, and do layout asynchronously
// FIXME DEPRECATED
export class Layout {
  static identifier: string;
  constructor(context) {
    const layoutTaskList: any[] = [];
    const callbackTaskList: any[] = [];
    let isWaitingOrRunning;
    let isFirstLayout = true;
    const setting = {
      isSync: false,
    };
    let semaphore;
    return {
      layout: function (branch, options) {
        semaphore ||= context.getModule(MODULE_NAME.SEMAPHORE);
        branch.isLayout = false;
        //todo 二分插入优化
        layoutTaskList.push({
          branch: branch,
          layer: branch.getLayer(),
          options: options,
        });
        layoutTaskList.sort((a, b) => {
          return a.layer - b.layer;
        });
        if (!isWaitingOrRunning) {
          isWaitingOrRunning = true;
          semaphore.increase(UI_STATUS.LAYOUT);
          if (setting.isSync) {
            doLayout();
          } else {
            nextTick(doLayout);
          }
        }
      },
      config(key, value) {
        if (value !== undefined) {
          setting[key] = value;
        }
        return setting[key];
      },
    };
    function doLayout() {
      const { centralBranchView } = context.getSheetView();
      while (layoutTaskList.length > 0) {
        const task = layoutTaskList.pop(); //因为数组是降序排列的
        if (task.options && typeof task.options.afterward === "function") {
          callbackTaskList.push(task.options.afterward);
        }
        if (task.branch.parent()) {
          layoutUtil.doLayoutBranch(task.branch);
        }
      }
      mommonFuncs.preorderIterate(centralBranchView, allType, (branch) => {
        if (branch._noAnimation || isFirstLayout) {
          moveNoAnimation(branch);
          delete branch._noAnimation;
          return mommonFuncs.SKIP;
        } else {
          const noAnimation = false;
          return branch.refreshView(noAnimation);
        }
      });
      callbackTaskList.forEach((callback) => {
        callback();
      });
      callbackTaskList.length = 0;
      isWaitingOrRunning = false;
      if (isFirstLayout) {
        isFirstLayout = false;
      }
      semaphore.decrease(UI_STATUS.LAYOUT);
    }
    function moveNoAnimation(branch) {
      const noAnimation = true;
      mommonFuncs.preorderIterate(branch, allType, (br) => {
        return br.refreshView(noAnimation);
      });
    }
  }
}
Layout.identifier = MODULE_NAME.LAYOUT;

export default Layout;
