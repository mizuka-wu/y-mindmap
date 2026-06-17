import underscore from "underscore";
import { CLASS_TYPE } from "../../common/constants/index";
import * as boundutils from "../../utils/boundutils";
import styleManager from "../../utils/business/stylemanager/index";

enum ALIGN_DIRECTION {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
  EQUALSPACING_VERTICAL = "equalspacing-vertical",
  EQUALSPACING_HORIZONTAL = "equalspacing-horizontal",
}

export class TopicAlignment {
  constructor() {}
  align(direction, branches) {
    const descArr = this.extractInfo(branches);
    let alignResults;
    switch (direction) {
      case ALIGN_DIRECTION.TOP:
        alignResults = alignTop(descArr);
        break;
      case ALIGN_DIRECTION.MIDDLE:
        alignResults = alignMiddle(descArr);
        break;
      case ALIGN_DIRECTION.BOTTOM:
        alignResults = alignBottom(descArr);
        break;
      case ALIGN_DIRECTION.LEFT:
        alignResults = alignLeft(descArr);
        break;
      case ALIGN_DIRECTION.CENTER:
        alignResults = alignCenter(descArr);
        break;
      case ALIGN_DIRECTION.RIGHT:
        alignResults = alignRight(descArr);
        break;
      case ALIGN_DIRECTION.EQUALSPACING_HORIZONTAL:
        alignResults = alignEqualSpacingHorizontal(descArr);
        break;
      case ALIGN_DIRECTION.EQUALSPACING_VERTICAL:
        alignResults = alignEqualSpacingVertical(descArr);
        break;
      default:
        return;
    }
    this.applyPositioning(alignResults);
  }
  divide(direction, branches) {
    switch (direction) {
      case "horizon":
        this.divideHorizon(branches);
        break;
      case "vertical":
        this.divideVertical(branches);
        break;
      default:
        return;
    }
  }
  divideHorizon(branches) {
    let descArr: any[] = this.extractFloatingInfo(branches);
    descArr = underscore.sortBy(descArr, (desc) => desc.bound.x);
    // if(descArr.length === branches.length) {  //选中的都是floating
    //   this._divideHorizonByShapeBound(descArr);
    // } else {  //还选中了floating 的孩子， （判断的不太准确)
    //   this._divideHorizonByBoundaryBound(descArr);
    // }
    const results = this._divideHorizonByBoundaryBound(descArr);
    this.applyPositioning(results);
  }
  //策略1， 各个floating topic之间的boundaryBound的间距相同
  _divideHorizonByBoundaryBound(descArr) {
    let PADDING = 20;
    const cnt = descArr.length;
    if (cnt < 2) {
      return;
    }
    let wholeWidth = descArr
      .map((desc) => desc.boundaryBound.width)
      .reduce((a, b) => a + b);
    wholeWidth += (cnt - 1) * PADDING;
    const bbox = boundutils.getUnionBoundingBoxFromAllBounds(
      descArr.map((desc) => desc.boundaryBound),
    );
    const curWidth = bbox.width;
    const cx = bbox.x + bbox.width / 2;
    const results: any[] = [];
    let finalWidth = wholeWidth;
    if (curWidth > wholeWidth) {
      PADDING += (curWidth - wholeWidth) / (cnt - 1);
      finalWidth = curWidth;
    }
    let curBranchleft = cx - finalWidth / 2;
    descArr.forEach(({ src, boundaryBound }) => {
      results.push({
        x: curBranchleft - boundaryBound.x,
        y: 0,
        src,
      });
      curBranchleft += boundaryBound.width + PADDING;
    });
    return results;
  }
  //策略2， 各个floating topic之间的shapeBounds间距相同
  //Not used now.
  _divideHorizonByShapeBound(descArr) {
    const cnt = descArr.length;
    const PADDING = 20;
    // let cx = bbox.x + bbox.width/2;
    //计算各个shapeBound之间的最大间距。
    //将是最终应有的最小间距
    let maxMargin = 0;
    const margins: number[] = [];
    for (let i = 0; i < cnt - 1; i++) {
      const descLeft = descArr[i];
      const descRight = descArr[i + 1];
      const margin =
        boundRight(descLeft.boundaryBound) -
        boundRight(descLeft.bound) +
        (descRight.bound.x - descRight.boundaryBound.x);
      // if(margin > maxMargin) maxMargin = margin;
      margins.push(margin);
    }
    maxMargin = Math.max(...margins);
    maxMargin += PADDING;
    //现有宽度下的所有margin和
    const leftMost = descArr[0];
    const rightMost = descArr[cnt - 1];
    const innerWidth = rightMost.bound.x - boundRight(leftMost.bound);
    const innerShapeWidth = descArr
      .slice(1, cnt - 1)
      .map((desc) => desc.bound.width)
      .reduce((a, b) => a + b, 0);
    const curAllMargin = innerWidth - innerShapeWidth;
    //首尾两个shape之间的宽度，不包括首尾两个shape本身。
    let finalInnerWidth = innerWidth;
    let finalMargin = maxMargin;
    if (curAllMargin < maxMargin * (cnt - 1)) {
      finalInnerWidth = innerShapeWidth + maxMargin * (cnt - 1);
    } else {
      finalMargin = curAllMargin / (cnt - 1);
    }
    const cx = (boundRight(leftMost.bound) + rightMost.bound.x) / 2;
    //实际上是在第一个shape的右侧
    let curShapeLeft = cx - finalInnerWidth / 2;
    const results: any[] = [];
    results.push({
      x: curShapeLeft - boundRight(leftMost.bound),
      y: 0,
      src: leftMost.src,
    });
    curShapeLeft += finalMargin; //现在在第二个shape的左侧了
    descArr.slice(1).forEach((desc) => {
      results.push({
        x: curShapeLeft - desc.bound.x,
        y: 0,
        src: desc.src,
      });
      curShapeLeft += finalMargin + desc.bound.width;
    });
    return results;
  }
  divideVertical(branches) {
    let descArr = this.extractFloatingInfo(branches);
    descArr = underscore.sortBy(descArr, (desc) => desc.bound.y);
    const results = this._divideVerticalByBoundaryBound(descArr);
    this.applyPositioning(results);
  }
  _divideVerticalByBoundaryBound(descArr) {
    let PADDING = 20;
    const cnt = descArr.length;
    if (cnt < 2) {
      return;
    }
    let wholeHeight = descArr
      .map((desc) => desc.boundaryBound.height)
      .reduce((a, b) => a + b);
    wholeHeight += (cnt - 1) * PADDING;
    const bbox = boundutils.getUnionBoundingBoxFromAllBounds(
      descArr.map((desc) => desc.boundaryBound),
    );
    const curHeight = bbox.height;
    const cy = bbox.y + bbox.height / 2;
    const results: any[] = [];
    let finalHeight = wholeHeight;
    if (curHeight > wholeHeight) {
      PADDING += (curHeight - wholeHeight) / (cnt - 1);
      finalHeight = curHeight;
    }
    let curBranchTop = cy - finalHeight / 2;
    descArr.forEach(
      ({
        src,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        bound,
        boundaryBound,
      }) => {
        results.push({
          x: 0,
          y: curBranchTop - boundaryBound.y,
          src,
        });
        curBranchTop += boundaryBound.height + PADDING;
      },
    );
    return results;
  }
  //只提取floating topic，不管fixed
  extractFloatingInfo(branches): any[] {
    const ret: any[] = [];
    branches.forEach((branch) => {
      if (styleManager.getClassName(branch) !== CLASS_TYPE.FLOATING_TOPIC) {
        return;
      }
      const realPos = branch.getRealPosition();
      const shapeBounds = branch.topicView.shapeBounds;
      const boundaryBounds = branch.boundaryBounds;
      ret.push({
        bound: {
          x: shapeBounds.x + realPos.x,
          y: shapeBounds.y + realPos.y,
          width: shapeBounds.width,
          height: shapeBounds.height,
        },
        boundaryBound: {
          x: boundaryBounds.x + realPos.x,
          y: boundaryBounds.y + realPos.y,
          width: boundaryBounds.width,
          height: boundaryBounds.height,
        },
        src: branch,
      });
    });
    return ret;
  }
  extractInfo(branches) {
    return branches.map((branch) => {
      const realPos = branch.getRealPosition();
      const shapeBounds = branch.topicView.shapeBounds;
      return {
        bound: {
          x: shapeBounds.x + realPos.x,
          y: shapeBounds.y + realPos.y,
          width: shapeBounds.width,
          height: shapeBounds.height,
        },
        fixed: styleManager.getClassName(branch) !== CLASS_TYPE.FLOATING_TOPIC,
        src: branch,
      };
    });
  }
  applyPositioning(alignResults) {
    alignResults.forEach((result) => {
      if (!result) {
        return;
      } //fixed will return undefined.
      const { src, x, y } = result;
      if (x === 0 && y === 0) {
        return;
      }
      src.model.changePosition({
        x: src.position.x + x,
        y: src.position.y + y,
      });
    });
  }
}
// functions really work for alignment.
function alignTop(descArr) {
  const top = topMost(descArr);
  const ret: any[] = [];
  descArr.forEach((desc) => {
    if (desc.fixed) {
      return;
    }
    ret.push({
      src: desc.src,
      x: 0,
      y: top.bound.y - desc.bound.y,
    });
  });
  return ret;
}
function alignBottom(descArr) {
  const bottom = bottomMost(descArr);
  return descArr.map(({ src, bound, fixed }) => {
    if (fixed) {
      return;
    }
    return {
      src,
      x: 0,
      y: bottom.bound.y + bottom.bound.height - (bound.y + bound.height),
    };
  });
}
function alignMiddle(descArr) {
  const middleY = verticalMiddle(descArr);
  return descArr.map(({ src, bound, fixed }) => {
    if (fixed) {
      return;
    }
    return {
      src,
      x: 0,
      y: middleY - (bound.y + bound.height / 2),
    };
  });
}
function alignLeft(descArr) {
  const left = leftMost(descArr);
  const leftPos = left.bound.x;
  return descArr.map(({ src, bound, fixed }) => {
    if (fixed) {
      return;
    }
    return {
      src,
      x: leftPos - bound.x,
      y: 0,
    };
  });
}
function alignRight(descArr) {
  const right = rightMost(descArr);
  const rightPos = right.bound.x + right.bound.width;
  return descArr.map(({ src, bound, fixed }) => {
    if (fixed) {
      return;
    }
    return {
      src,
      x: rightPos - (bound.x + bound.width),
      y: 0,
    };
  });
}
function alignCenter(descArr) {
  const centerPos = horizonalCenter(descArr);
  // const leftPos = left.bound.x;
  return descArr.map(({ src, bound, fixed }) => {
    if (fixed) {
      return;
    }
    return {
      src,
      x: centerPos - (bound.x + bound.width / 2),
      y: 0,
    };
  });
}
function alignEqualSpacingHorizontal(descArr) {
  const left = leftMost(descArr);
  const right = rightMost(descArr);
  const sortedOtherItem = descArr
    .reduce(
      (res, cur) =>
        cur === left || cur === right || cur.fixed ? res : [...res, cur],
      [],
    )
    .sort((a, b) => a.bound.x - b.bound.x);
  const spacing = (right.bound.x - left.bound.x) / (sortedOtherItem.length + 1);
  const leftPos = left.bound.x + left.bound.width / 2;
  return sortedOtherItem.map(
    (
      {
        src,
        bound,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fixed,
      },
      i,
    ) => {
      const currPos = bound.x + bound.width / 2;
      const targetPos = leftPos + (i + 1) * spacing;
      const offsetX = targetPos - currPos;
      return {
        src,
        x: offsetX,
        y: 0,
      };
    },
  );
}
function alignEqualSpacingVertical(descArr) {
  const top = topMost(descArr);
  const bottom = bottomMost(descArr);
  const sortedOtherItem = descArr
    .reduce(
      (res, cur) =>
        cur === top || cur === bottom || cur.fixed ? res : [...res, cur],
      [],
    )
    .sort((a, b) => a.bound.y - b.bound.y);
  const topPosY = top.bound.y + top.bound.height / 2;
  const spacing = (bottom.bound.y - top.bound.y) / (sortedOtherItem.length + 1);
  return sortedOtherItem.map(
    (
      {
        src,
        bound,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        fixed,
      },
      i,
    ) => {
      const currPosY = bound.y + bound.height / 2;
      const targetPosY = topPosY + (i + 1) * spacing;
      const offsetY = targetPosY - currPosY;
      return {
        src,
        x: 0,
        y: offsetY,
      };
    },
  );
}
//utils
//如果存在fixed，那么以fiexed这些topic的topMost为准。
//如果floating topic 下的fixed topic存在，那么忽视这些fixed的topic.
function topicInfluence(descArr) {
  const fixedArr: any[] = [];
  const floatingArr: any[] = [];
  descArr.forEach((desc) => {
    if (desc.fixed) {
      fixedArr.push(desc);
    } else {
      floatingArr.push(desc);
    }
  });
  const filteredFixArr: any[] = [];
  const floatingArrPath = floatingArr.map((desc) => desc.src.getBranchPath());
  fixedArr.forEach((fixDesc) => {
    const fixBranchPath = fixDesc.src.getBranchPath();
    if (floatingArrPath.every((p) => !fixBranchPath.includes(p))) {
      filteredFixArr.push(fixDesc);
    }
  });
  if (filteredFixArr.length) {
    return filteredFixArr;
  } else {
    return floatingArr;
  }
}
function topMost(descs) {
  descs = topicInfluence(descs);
  return underscore.min(descs, (desc) => desc.bound.y);
}
function bottomMost(descs) {
  descs = topicInfluence(descs);
  return underscore.max(descs, (desc) => desc.bound.y + desc.bound.height);
}
/**
 * @param {src, bound, fixed} descs
 */
function verticalMiddle(descs) {
  descs = topicInfluence(descs);
  const boundArr = descs.map((desc) => desc.bound);
  //boundArr should not be a empty array.
  const outBound = boundutils.getUnionBoundingBoxFromAllBounds(boundArr);
  return outBound.y + outBound.height / 2;
}
function leftMost(descArr) {
  descArr = topicInfluence(descArr);
  return underscore.min(descArr, (desc) => desc.bound.x);
}
function rightMost(descArr) {
  descArr = topicInfluence(descArr);
  return underscore.max(descArr, (desc) => desc.bound.x + desc.bound.width);
}
function horizonalCenter(descArr) {
  descArr = topicInfluence(descArr);
  const boundArr = descArr.map((desc) => desc.bound);
  const outBound = boundutils.getUnionBoundingBoxFromAllBounds(boundArr);
  return outBound.x + outBound.width / 2;
}
function boundRight(bound) {
  return bound.x + bound.width;
}

export default TopicAlignment;
