import { getStructure } from "../../structures/helper/allstructures";
import { VIEW_TYPE } from "../../common/constants/index";
// 根据被选中的selections计算若它们被包裹后需要生成的selectBox的range
export function mergeParentAndRange(selections) {
  const result: any = {
    masterArr: [],
    rangeMap: {},
  };
  const branchMap = {};
  let toMergeRangeArr: any[] = [];
  selections.forEach((item) => {
    if (item.type === VIEW_TYPE.BRANCH && !item.isCentralBranch()) {
      branchMap[item.model.get("id")] = item;
    }
  });
  //排除祖孙关系的子节点
  for (const id in branchMap) {
    const item = branchMap[id];
    let parent = item.parent();
    while (!parent.isCentralBranch()) {
      if (branchMap[parent.model.get("id")]) {
        delete branchMap[id]; //如果父亲已经存在于selection中，则该branch不计入range中
        break;
      }
      parent = parent.parent();
    }
    if (parent.isCentralBranch()) {
      toMergeRangeArr.push(item);
    }
  }
  toMergeRangeArr = toMergeRangeArr.filter((item) => {
    if (
      item.isDetachedBranch() ||
      item.isSummaryBranch() ||
      item.isCalloutBranch()
    ) {
      result.masterArr.push(item);
      return false;
    }
    return true;
  });
  result.rangeMap = mergeRange(toMergeRangeArr);
  return result;
}
export function applyRuleForSpecificStructure(parent, ranges) {
  if (parent.isMapLike()) {
    const rightIndex = getStructure(parent.getStructureClass()).calcNumRight(
      parent,
    );
    const res = ranges.reduce((res, range) => {
      if (range.start < rightIndex && range.end >= rightIndex) {
        const range1 = {
          start: range.start,
          end: rightIndex - 1,
          count: rightIndex - range.start,
        };
        const range2 = {
          start: rightIndex,
          end: range.end,
          count: range.end - rightIndex + 1,
        };
        return [...res, range1, range2];
      } else {
        return [...res, range];
      }
    }, []);
    return res;
  }
  return ranges;
}
// 根据被选中的selections计算若它们被包裹后需要生成的selectBox的range
export function mergeRange(selections) {
  let range: number[] = [];
  let parent;
  let children;
  const divided = divideSelections(selections);
  Object.values(divided).forEach((complexObject: any) => {
    parent = complexObject.parent;
    children = complexObject.children;
    children.forEach((child) => {
      const attacheChildren = parent.getChildrenBranchesByType();
      const index = attacheChildren.indexOf(child);
      range.push(index);
    });
    complexObject.range = applyRuleForSpecificStructure(
      parent,
      mergeArray(range),
    );
    range = [];
  });
  return divided;
}
export function mergeArray(arrayRange) {
  const length = arrayRange.length;
  const range = {
    start: 0,
    end: 0,
    count: 1,
  };
  const merged: any[] = [];
  let i = 1;
  let index = 1;
  range.start = arrayRange[0];
  for (; i <= length; i++) {
    if (arrayRange[i] - arrayRange[i - 1] === 1) {
      range.count++;
    } else {
      range.end = range.start + range.count - 1;
      merged.push(Object.assign({}, range));
      range.start = arrayRange[index];
      range.count = 1;
    }
    index++;
  }
  return merged;
}
export function divideSelections(selections) {
  const divided = {};
  selections.forEach((selection) => {
    const parent = selection.parent();
    if (!divided[parent.cid]) {
      divided[parent.cid] = {};
      divided[parent.cid].children = [];
      divided[parent.cid].parent = parent;
    }
    divided[parent.cid].children.push(selection);
  });
  Object.values(divided).forEach((complexObject: any) => {
    Object.entries(complexObject).forEach(([name, object]) => {
      if (name === "children") {
        sortChildren(object);
      }
    });
  });
  return divided;
}
export function sortChildren(children) {
  const parent = children[0].parent();
  const attacheChildren = parent.getChildrenBranchesByType();
  children.sort((childA, childB) => {
    return attacheChildren.indexOf(childA) - attacheChildren.indexOf(childB);
  });
  return children;
}
export function changeAllStyle({ style, value, targets }) {
  targets.forEach((target) => {
    const model = target.model;
    model.changeStyle(style, value);
  });
}
