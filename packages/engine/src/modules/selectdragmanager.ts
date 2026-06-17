import jquery from "jquery";

import underscore from "underscore";

import backbone from "backbone";

import { MODULE_NAME } from "../common/constants/index";

/**
 * 本模块针对boundary和summary所属的selectBox的拖拽进行处理
 */
export class SelectDragManager {
  static identifier: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(context) {
    const SelectDragManager = underscore.extend({}, backbone.Events, {
      selectedBranches: [],
      hasStarted: function () {
        return !!this.selectBox;
      },
      selectedHasChanged: function () {
        return (
          JSON.stringify(this.startContains) !==
          JSON.stringify(this.selectBox.relationBranch)
        );
      },
      onSelectDragStart: function (selectBox, context, direction) {
        // View of current selectBox
        this.selectBox = selectBox;
        // View of current boundary or summary
        this.context = context;
        // draggable direction
        this.direction = direction;
        // original relation branch
        this.startContains = jquery.extend(
          true,
          {},
          this.selectBox.relationBranch,
        );
      },
      onSelectDragEnd: function () {
        if (!this.selectedHasChanged()) {
          this.resetManager();
          return false;
        }
        const context = this.context;
        const typeParam =
          context.type === "boundary"
            ? ["model", "boundaries"]
            : ["summaryModel", "summaries"];
        const contextModel = context[typeParam[0]];
        const parent = this.context.parent();
        // // old range start
        // const rangeStart = contextModel.rangeStart
        // // old range end
        // const rangeEnd = contextModel.rangeEnd
        const newIndex = this.calcRangeIndex();
        // new range start
        const minIndex = newIndex[0];
        // new range end
        const maxIndex = newIndex[1];
        const refViewModels = underscore.extend(
          {},
          parent.model[typeParam[1]](),
        );
        if (!this.hasSameRange(refViewModels, newIndex)) {
          const newRange = "(" + minIndex + "," + maxIndex + ")";
          contextModel.setRange(newRange);
        }
        this.resetManager();
      },
      // 计算selectBox所产生的新的range值
      calcRangeIndex: function () {
        let maxIndex;
        let minIndex;
        let tempIndex;
        let i;
        const length = this.selectedBranches.length;
        // 获取当前selectBox的父View对象和所有的同级branch View对象
        const parent = this.context.parent();
        const children = parent.getChildrenBranchesByType();
        // 初始化selectBox的range数值,设置初始值均为选择范围内顺位第一的branch所在位置
        maxIndex = minIndex = children.indexOf(this.selectedBranches[0]);
        // 按照所选择的branch在children中的位置设置最终range数值
        for (i = 1; i < length; i++) {
          tempIndex = children.indexOf(this.selectedBranches[i]);
          if (tempIndex > maxIndex) {
            maxIndex = tempIndex;
          }
          if (tempIndex < minIndex) {
            minIndex = tempIndex;
          }
        }
        return [minIndex, maxIndex];
      },
      addSelectBranch: function (branchView) {
        if (this.selectedBranches.indexOf(branchView) === -1) {
          this.selectedBranches.push(branchView);
        }
      },
      removeSelectBranch: function (branchView) {
        if (this.selectedBranches.indexOf(branchView) !== -1) {
          this.selectedBranches = underscore.without(
            this.selectedBranches,
            branchView,
          );
        }
      },
      resetManager: function () {
        underscore.each(this.selectedBranches, (branch) => {
          branch.onMouseout();
        });
        this.selectedBranches = [];
        if (this.selectBox) {
          this.selectBox.selectBoxOneG.move(0, 0);
          this.selectBox.selectBoxTwoG.move(0, 0);
          this.selectBox.render(this.direction);
          this.selectBox.relationBranch = [];
          this.selectBox = null;
        }
        this.context = null;
        this.direction = null;
      },
      hasSameRange: function (contexts, newIndex) {
        let result = false;
        underscore.each(contexts, (context) => {
          if (
            context.rangeStart === newIndex[0] &&
            context.rangeEnd === newIndex[1]
          ) {
            result = true;
            return false;
          }
        });
        return result;
      },
    });
    // register events
    SelectDragManager.on("start", SelectDragManager.onSelectDragStart);
    SelectDragManager.on("end", SelectDragManager.onSelectDragEnd);
    SelectDragManager.on(
      "addSelectedBranch",
      SelectDragManager.addSelectBranch,
    );
    SelectDragManager.on(
      "removeSelectedBranch",
      SelectDragManager.removeSelectBranch,
    );
    return SelectDragManager;
  }
}
SelectDragManager.identifier = MODULE_NAME.SELECT_DRAG;

export default SelectDragManager;
