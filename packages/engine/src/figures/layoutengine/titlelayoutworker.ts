import {
  VIEW_TYPE,
  TOPIC_MAX_CUSTOM_WIDTH,
} from "../../common/constants/index";
import * as utils from "../../utils/index";

import Util from "../../util";
import { BoundaryTitleView } from "../../view/boundarytitleview";

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
const transToAttr = (info) => {
  const attr = {};
  Object.keys(info)
    .filter((key) => ATTR_MAP[key])
    .map((key) => {
      attr[ATTR_MAP[key]] = info[key];
    });
  return attr;
};

export const titleLayoutWorker = {
  work(viewController) {
    const titleView = viewController;
    if (!titleView.getContext()) {
      return;
    }
    if (viewController instanceof BoundaryTitleView) {
      const boundaryView = viewController.parent();
      if (
        boundaryView === null || boundaryView === undefined
          ? undefined
          : boundaryView.shouldPreventTitle()
      ) {
        return titleView.setSize({
          width: 0,
          height: 0,
        });
      }
    }
    const figure = titleView.figure;
    const text = figure.text;
    if (!titleView.forceCalcSize && !text) {
      return titleView.setSize(
        figure.prefSize
          ? Object.assign(figure.prefSize, {
              height: 0,
            })
          : {
              width: 0,
              height: 0,
            },
      );
    }
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
      const fontSize = Number.parseInt(fontInfo.fontSize || 0);
      fontInfo.fontSize = fontSize;
    }
    const resolvedText = getResolvedText(figure, text, fontInfo);
    // Chrome floor rounds the line-height when rendering text.
    // We do the same to make TextArea look the same as the topic.
    const lineHeight = Math.floor(fontInfo.fontSize * 1.34);
    let nodesArr;
    if (typeof resolvedText === "string") {
      nodesArr = Object(utils.str2NodesArr)(resolvedText, fontInfo);
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
      const { width } = Object(utils.getNodesSize)(nodes);
      return Math.max(maxWidth, width);
    }, 0);
    titleView.setSize(
      figure.prefSize
        ? Object.assign(figure.prefSize, {
            height,
          })
        : {
            width,
            height,
          },
    );
  },
};
function getResolvedText(figure, text, fontInfo) {
  const transformedText = Util.getTransformedText(text, figure.textTransform);
  let strArr;
  const parentBranchView = figure.viewController.parent().parent();
  if (figure.type === VIEW_TYPE.BOUNDARY_TITLE) {
    const maxTitleWidth = Object(utils.calcBoundaryTitleMaxWidth)(
      parentBranchView,
      figure.viewController.parent(),
    );
    if (maxTitleWidth >= fontInfo.fontSize) {
      strArr = Object(utils.resolveString)(
        transformedText,
        fontInfo,
        maxTitleWidth,
      );
    } else {
      strArr = Object(utils.resolveString)(
        transformedText,
        fontInfo,
        fontInfo.fontSize,
      );
    }
  } else if (figure.prefSize) {
    if (figure.prefSize.width >= fontInfo.fontSize) {
      strArr = Object(utils.resolveString)(
        transformedText,
        fontInfo,
        figure.prefSize.width,
      );
    } else {
      strArr = Object(utils.resolveString)(
        transformedText,
        fontInfo,
        fontInfo.fontSize,
      );
    }
  } else if (
    Object(utils.isBranch)(parentBranchView) &&
    (Object(utils.isMatrixMainBranch)(parentBranchView) ||
      Object(utils.isTreeTableStructure)(parentBranchView))
  ) {
    strArr = Object(utils.resolveString)(
      transformedText,
      fontInfo,
      TOPIC_MAX_CUSTOM_WIDTH,
    );
  } else {
    strArr = Object(utils.resolveString)(transformedText, fontInfo);
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
