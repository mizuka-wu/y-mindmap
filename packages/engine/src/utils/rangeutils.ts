/**
  preface:
  我们项目中range的使用比较奇怪。
  比如正常来说表示数组中第一个元素的range应该是： 【0,1]。
  但在我们项目中的表示为： [0, 0]。
  @typedef {[number,number]} Range
*/
/**
 * 给定一无序的index数组， 排序后将其中连续的部分用range表示。
 * [1,2,3,7,8,10] -> [[1,3], [7,8], [10,10]]
 * @param {number[]} indexArr
 * @return {Range[]}
 */
function indexArrToRangeArr(indexArr) {
  const ret = [];
  if (!indexArr || indexArr.length === 0) {
    return ret;
  }
  const sorted = indexArr.concat().sort((a, b) => a - b);
  let low = sorted[0];
  let curRange = [low];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur - low === 1) {
      //range grow
      low = cur;
      if (i === sorted.length - 1) {
        //last one
        curRange[1] = cur;
        ret.push(curRange);
      }
    } else {
      curRange[1] = low;
      ret.push(curRange);
      low = cur;
      curRange = [low];
    }
  }
  if (curRange.length === 1) {
    curRange[1] = curRange[0];
    ret.push(curRange);
  }
  return ret;
}
/**
 * sort ranges
 * @param {Range[]} rangeArr
 */
function sortRange(rangeArr) {
  return rangeArr.concat().sort((r1, r2) => {
    if (r1[0] > r2[0]) {
      return 1;
    } else if (r1[0] === r2[0]) {
      return r1[1] - r2[1];
    } else {
      return -1;
    }
  });
}
/**
 * pick ranges in wantRangeArr each of which is subRange of one of selectedRange
 * @param {Range[]} selectedRangeArr
 * @param {Range[]} wantRangeArr
 */
function pickRangeContained(selectedRangeArr, wantRangeArr) {
  const ret = [];
  // Can be optimized by using sorted rangeArr, but it seems there is no need.
  for (let w = 0; w < wantRangeArr.length; w++) {
    for (let s = 0; s < selectedRangeArr.length; s++) {
      if (isSubRange(selectedRangeArr[s], wantRangeArr[w])) {
        ret.push(wantRangeArr[w]);
        s = selectedRangeArr.length;
      }
    }
  }
  return ret;
}
/**
 * Check if "x" is a subRange of "master".
 * Edge is include which means will return true if equal.
 */
function isSubRange(master, x) {
  // return !( x[1] < master[0] || x[0] > master[1])
  return master[0] <= x[0] && master[1] >= x[1];
}

export const rangeUtils = {
  indexArrToRangeArr,
  sortRange,
  pickRangeContained,
  isSubRange,
};

export default rangeUtils;
