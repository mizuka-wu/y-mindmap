import * as constants from "../common/constants/index";
import { flatten } from "./baseutil";
import Util from "../util";
import {
  getNodesSize,
  getTextSize,
  sepWord,
  combineWords,
  nodes2Str,
  nodes2Words,
  separateNodes,
  str2NodesArr,
  nodesSplit,
} from "./strnodes";
import { layoutConstant } from "./layoutconstant";

const title_getWidth = (nodes) => getNodesSize(nodes).width;
// 文本宽度计算误差宽容度
const TEXT_WIDTH_CALC_TOLERANCE = 1;
export function resolveStrNodes(nodes, maxWidth) {
  maxWidth = maxWidth ?? constants.TITLE_MAX_WIDTH;
  // 寻找合适的 end，使得对于从 start 到 end 的 string 刚好小于 maxWidth
  const findNext = (words, start, maxWidth) => {
    let tmp = maxWidth;
    for (let i = start; i < words.length; i++) {
      const width = words[i].getWidth();
      tmp = tmp - width;
      if (Math.ceil(tmp) < -TEXT_WIDTH_CALC_TOLERANCE) {
        return i;
      }
    }
    return false;
  };
  const scan1 = (words, start) => {
    const word = words[start];
    const fullWordCheckOverflowPass =
      Math.ceil(word.getWidth() - maxWidth) > TEXT_WIDTH_CALC_TOLERANCE;
    const singleWordCheckOverflowPass =
      typeof findNext(sepWord(word), 0, maxWidth) === "number";
    if (fullWordCheckOverflowPass && singleWordCheckOverflowPass) {
      // fix maximum call stack overflow bug
      if (word.getContent().length === 1) {
        const end = start + 1;
        const line = words.slice(start, end);
        return [end, [line]];
      }
      const sepWords = sepWord(word);
      const lines = scan(sepWords);
      const lastLine = lines.pop(); // a line is an arr of word
      const restWord = combineWords(lastLine);
      words.splice(start, 1, restWord); // replace the origin word with restWord
      return [start, lines]; // reScan in the start
    } else {
      const end = findNext(words, start, maxWidth) || words.length;
      const line = words.slice(start, end);
      return [end, [line]];
    }
  };
  const scan = (words) => {
    let allLines = [];
    for (let i = 0; i < words.length; ) {
      const [newStart, lines] = scan1(words, i);
      allLines = allLines.concat(lines);
      i = newStart;
    }
    return allLines;
  };
  const newLine = (splitNodes) => {
    const splitNodesWidth = title_getWidth(splitNodes);
    if (splitNodesWidth < maxWidth) {
      return [splitNodes];
    }
    const splitWords = nodes2Words(splitNodes);
    const lines = scan(splitWords);
    return lines.map((words) => {
      return words.reduce((nodes, word) => nodes.concat(word.getNodes()), []);
    });
  };
  const splitNodesList = nodesSplit(separateNodes(nodes), ["\n"]);
  const lineList = splitNodesList.map((splitNodes) => newLine(splitNodes));
  return flatten(lineList);
}
/**
 * @description 算法作用: 作用于 string，分割字符串. 以空格为分割符分割,当没有空格的长文本则以单个字符累加.
 * @param {string} content
 * @param {Object} fontInfo
 * @param {number} maxWidth topic文本部分的最大宽度
 * @return {Array.<string>}
 * */
export function resolveString(content, fontInfo, maxWidth) {
  if (fontInfo.fontSize > maxWidth) {
    throw new Error("'fontInfo.fontSize' must be less than 'maxWidth'");
  }
  const nodes = [
    {
      content,
      style: fontInfo,
    },
  ];
  const nodesArr = resolveStrNodes(nodes, maxWidth);
  return nodesArr.map((nodes) => nodes2Str(nodes));
}
export function wrapTextWithEllipsis(text, fontInfo, maxWidth) {
  if (fontInfo.fontSize > maxWidth) {
    throw new Error("'fontInfo.fontSize' must be less than 'maxWidth'");
  }
  const getWidth = (content) => getTextSize(content, fontInfo).width;
  const sliceText = (textToSlice, maxWidth) => {
    if (textToSlice.length === 1) {
      const width = getWidth(textToSlice);
      if (maxWidth >= width) {
        return textToSlice;
      } else {
        return "";
      }
    } else {
      const slicePart1 = textToSlice.slice(
        0,
        parseInt(`${textToSlice.length / 2}`),
      );
      const slicePart2 = textToSlice.replace(slicePart1, "");
      const width1 = getWidth(slicePart1);
      if (maxWidth >= width1) {
        return slicePart1 + sliceText(slicePart2, maxWidth - width1);
      } else {
        return sliceText(slicePart1, maxWidth);
      }
    }
  };
  if (getWidth(text) <= maxWidth) {
    return text;
  }
  const ellipsis = "...";
  maxWidth = maxWidth - getWidth(ellipsis);
  const slicedText = sliceText(text, maxWidth);
  return slicedText + ellipsis;
}
const ATTR_MAP = {
  fontWeight: "font-weight",
  fontFamily: "font-family",
  fontStyle: "font-style",
  fontSize: "font-size",
  color: "fill",
  textDecoration: "text-decoration",
};
const ANGHOR_MAP = {
  left: "start",
  center: "middle",
  right: "end",
};
function transToAttr(info) {
  const attr = {};
  Object.keys(info)
    .filter((key) => ATTR_MAP[key])
    .map((key) => {
      attr[ATTR_MAP[key]] = info[key];
    });
  return attr;
}
function getResolvedText(text, fontInfo, maxWidth) {
  let strArr;
  if (maxWidth >= Number(fontInfo.fontSize)) {
    strArr = resolveString(text, fontInfo, maxWidth);
  } else {
    strArr = resolveString(text, fontInfo, Number(fontInfo.fontSize));
  }
  return strArr.join("\n");
}
function setAttr(figure, fontInfo) {
  const attr = transToAttr(fontInfo);
  figure.attr(attr);
  const { textAlign } = fontInfo;
  if (textAlign) {
    figure.attr({
      "text-anchor": ANGHOR_MAP[textAlign],
    });
  }
}
export function calcTitleSize(titleView, maxWidth) {
  const figure = titleView.figure;
  const text = figure.text;
  const fontInfo = {
    fontFamily: figure.fontFamily,
    fontSize: figure.fontSize,
    fontWeight: figure.fontWeight,
    fontStyle: figure.fontStyle,
    textAlign: figure.textAlign,
    textDecoration: figure.textDecoration,
    textTransform: figure.textTransform,
  };
  // make sure fontSize to be int
  if (fontInfo.fontSize) {
    fontInfo.fontSize = Number.parseInt(fontInfo.fontSize) || 0;
  }
  const transformedText = Util.getTransformedText(text, figure.textTransform);
  const resolvedText = getResolvedText(
    transformedText,
    fontInfo,
    maxWidth || 0,
  );
  // Chrome floor rounds the line-height when rendering text.
  // We do the same to make TextArea look the same as the topic.
  const lineHeight = Math.floor(fontInfo.fontSize * 1.34);
  let nodesArr;
  if (typeof resolvedText === "string") {
    nodesArr = str2NodesArr(resolvedText, fontInfo);
  } else {
    nodesArr = resolvedText;
  }
  // fill empty nodes with ' ' for multiple newline in tspan
  nodesArr = nodesArr.map((nodes) => {
    if (nodes.length === 0) {
      return [
        {
          content: " ",
          style: fontInfo,
        },
      ];
    } else {
      return nodes;
    }
  });
  titleView.figure.setTextFn((add) => {
    nodesArr.forEach((nodes, j) => {
      const dy = j === 0 ? parseInt(fontInfo.fontSize || 0) : lineHeight;
      nodes.forEach((node, i) => {
        const attr = transToAttr(node.style);
        // \u200E for Left-to-right-mark,
        // check more detail in https://stackoverflow.com/questions/48327687/
        const tspan = add.tspan("‎" + node.content).attr(attr);
        tspan.style({
          "white-space": "pre",
        }); // 支持多空格显示
        if (i === 0) {
          tspan.dy(dy).x(0);
        }
      });
    });
  });
  setAttr(figure, fontInfo);
  const height = nodesArr.length * lineHeight;
  const width = nodesArr.reduce((maxWidth, nodes) => {
    const { width } = getNodesSize(nodes);
    return Math.max(maxWidth, width);
  }, 0);
  return {
    width,
    height,
  };
}
export function calcBoundaryTitleMaxWidth(parentBranchView, boundaryView) {
  let boundaryWidth;
  if (boundaryView.model.getRange() === constants.MASTER_RANGE) {
    const allChildrenBranchList = parentBranchView
      .getChildrenBranchesByType()
      .filter((item) => !item.isPlaceHolderView);
    const branchWidthList = [];
    allChildrenBranchList.forEach((branch) => {
      branchWidthList.push(branch.bounds.width);
    });
    boundaryWidth =
      parentBranchView.topicView.bounds.width +
      Math.max(...branchWidthList) +
      layoutConstant.BOUNDARYGAP * 2;
  } else {
    const boundaryRangeStart = boundaryView.model.rangeStart;
    const boundaryRangeEnd = boundaryView.model.rangeEnd;
    // error data defend
    if (boundaryRangeStart > boundaryRangeEnd) {
      return;
    }
    const allChildrenBranchList = parentBranchView
      .getChildrenBranchesByType()
      .filter((item) => !item.isPlaceHolderView);
    const rangeStartChildBranchView = allChildrenBranchList[boundaryRangeStart];
    if (!rangeStartChildBranchView) {
      return;
    }
    const direction = parentBranchView.getDirection();
    if (direction === "UD") {
      const branchWidthList = [];
      for (let i = boundaryRangeStart; i <= boundaryRangeEnd; i++) {
        // also error data defend
        branchWidthList.push(
          allChildrenBranchList[i] ? allChildrenBranchList[i].bounds.width : 0,
        );
      }
      boundaryWidth =
        Math.max(...branchWidthList) + layoutConstant.BOUNDARYGAP * 2;
    } else {
      boundaryWidth = 0;
      // in left to right structure, use the minimal x position holder branch as the start branch
      const [startChildBranchView, endChildBranchView] = [
        allChildrenBranchList[boundaryRangeStart],
        allChildrenBranchList[boundaryRangeEnd],
      ].sort((a, b) => {
        if (a.position.x < b.position.x) {
          return 1;
        } else {
          return 0;
        }
      });
      boundaryWidth =
        endChildBranchView.position.x -
        startChildBranchView.position.x -
        startChildBranchView.bounds.x +
        endChildBranchView.bounds.width +
        endChildBranchView.bounds.x +
        layoutConstant.BOUNDARYGAP * 2;
    }
  }
  const titleMaxWidth =
    boundaryWidth -
    parseInt(boundaryView.figure.borderWidth) -
    layoutConstant.BOUNDARY_TITLE.TO_BOUNDARY_BORDER_DISTANCE * 2 -
    layoutConstant.BOUNDARY_TITLE.CONTENT_PADDING_HORIZON * 2;
  return titleMaxWidth;
}
export function calcBoundaryTitleSize(parentBranchView, boundaryView) {
  if (
    boundaryView.shouldPreventTitle() ||
    !boundaryView.titleView.figure.text
  ) {
    return {
      width: 0,
      height: 0,
    };
  }
  const titleMaxWidth = calcBoundaryTitleMaxWidth(
    parentBranchView,
    boundaryView,
  );
  return calcTitleSize(boundaryView.titleView, titleMaxWidth);
}
