import { flatten } from "./baseutil";
// CJK 字符
const CJK_REGS = [
  new RegExp("^[一-龥]*$"), // CJK Unified Ideographs 1.1
  // new RegExp("^[\uE7C7-\uE7F3]*$"),
];
// 标点符号
const PUN_REGS = [
  new RegExp("^[ -/]*$"),
  new RegExp("^[:-@]*$"),
  new RegExp("^[[-`]*$"),
  new RegExp("^[{-~]*$"),
  new RegExp("^[＀-￯]*$"),
  new RegExp("^[\u3000-〿]*$"), // CJK标点符号
];
// font weight string value to number value
const FONT_WEIGHT_STRING_TO_NUMBER = {
  normal: 400,
  regular: 400,
  bold: 700,
};
// 空格，tab，特殊空格，
const SPLIT_CHAR_CODE_ARR = [32, 9, 12288];
// trans code to string
const SPLIT_STR_ARR = String.fromCharCode(...SPLIT_CHAR_CODE_ARR).split("");
const last = (arr) => arr[arr.length - 1];
const isEmpty = (arr) => arr.length === 0;
const poorEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let i = 0; i < keys1.length; i++) {
    const key = keys1[i];
    const v1 = obj1[key];
    const v2 = obj2[key];
    if (v1 !== v2) {
      return false;
    }
  }
  return true;
};
export const getTextSize = (() => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  return (
    content,
    { fontStyle = "", fontWeight = "", fontSize, fontFamily },
  ) => {
    const fontWeightStr =
      (fontWeight === null || fontWeight === undefined
        ? undefined
        : fontWeight.toString()) ?? "0";
    let fontWeightNumber = parseInt(fontWeightStr);
    if (FONT_WEIGHT_STRING_TO_NUMBER[`${fontWeight}`.toLowerCase()]) {
      fontWeightNumber =
        FONT_WEIGHT_STRING_TO_NUMBER[fontWeightStr.toLowerCase()];
    } else if (/\dpt\b/.test(fontWeightStr)) {
      // 处理pt单位结尾的fontWeight
      fontWeightNumber = parseInt(fontWeightStr);
    }
    const preFontSize = (fontSize = Number.parseInt(fontSize));
    let ratio = 1;
    if (fontSize < 12) {
      ratio = fontSize / 12;
      fontSize = 12;
    }
    const fontSizePx = fontSize + "px";
    const fontArr = [fontStyle, fontWeightNumber, fontSizePx, fontFamily];
    ctx.font = fontArr.filter((item) => item).join(" ");
    const lines = content.split("\n");
    const widthArr = lines.map((line) => {
      return ctx.measureText(line).width;
    });
    const width = Math.max(...widthArr) * ratio;
    const height = lines.length * preFontSize;
    return {
      width,
      height,
    };
  };
})();
export const getNodesSize = (nodes) => {
  let width = 0;
  let height = 0;
  nodes.forEach((node) => {
    const { width: w, height: h } = getTextSize(node.content, node.style);
    width += w;
    height = Math.max(height, h);
  });
  return {
    width,
    height,
  };
};
/**
 * 将有相同样式的相邻 nodes 合并成一个的 node，返回一个新的 nodes
 * @param {nodes} nodes
 */
export const combineNodes = (nodes) => {
  const sameStyle = (n1, n2) => {
    const style1 = n1.style;
    const style2 = n2.style;
    if (style1 === undefined) {
      return true;
    }
    if (style2 === undefined) {
      return true;
    }
    return poorEqual(style1, style2);
  };
  const combine = (n1, n2) => {
    const style = n1.style || n2.style;
    return {
      content: n1.content + n2.content,
      style,
    };
  };
  if (isEmpty(nodes)) {
    return [];
  } else {
    const firstNode = nodes.shift();
    const result = [firstNode];
    nodes.forEach((n2) => {
      const n1 = result.pop();
      if (sameStyle(n1, n2)) {
        const newNode = combine(n1, n2);
        result.push(newNode);
      } else {
        result.push(n1);
        result.push(n2);
      }
    });
    return result;
  }
};
/**
 * 将所有 node 的 content 拆分成一个个 node，返回一个新的 nodes
 * @param {nodes} nodes
 */
export const separateNodes = (nodes) => {
  const arr = nodes.map((node) => {
    const { content = "", style } = node;
    const contents = content.split("");
    return contents.map((content) => {
      return {
        content,
        style,
      };
    });
  });
  return flatten(arr);
};
/**
 * 类似数组方法中的 join('')，但操作的是 nodesArr，返回一个 nodes
 * @param {nodesArr} strArr nodesArr 为由 nodes 组成的数组
 * @param {*} sep
 */
export const nodesArrJoin = (strArr) =>
  strArr.reduce((ns1, ns2) => [...ns1, ...ns2], []);
/**
 * 类似普通 string 的 split 方法，但是会保留 split 的字符，返回一个 nodesArr
 * @param {nodes} str nodes 是由 node 组成的数组
 * @param {string} sep
 */
export const nodesSplit = (str, sepArr, keepSep?) => {
  const inArr = (arr, item) => arr.indexOf(item) >= 0;
  if (isEmpty(sepArr)) {
    return [str];
  } else if (inArr(sepArr, "")) {
    return str.map((node) => [node]);
  } else {
    const result = [];
    result.push([]);
    if (keepSep) {
      str.forEach((node, i) => {
        last(result).push(node);
        // when node is a sepCode and next is not a sepCode,
        // should push a new empty arr to result
        if (inArr(sepArr, node.content)) {
          const next = str[i + 1];
          if (next !== undefined && !inArr(sepArr, next.content)) {
            result.push([]);
          }
        }
      });
    } else {
      str.forEach((node) => {
        if (inArr(sepArr, node.content)) {
          result.push([]);
        } else {
          last(result).push(node);
        }
      });
    }
    return result;
  }
};
/**
 * 和 nodesArrJoin 类似，但操作的是普通的 string数组
 * @param {*} arr
 */
export const strArrJoin = (arr) => {
  return arr.join("");
};
export const nodes2Str = (nodes) =>
  nodes.reduce((str, node) => str + node.content, "");
export const str2NodesArr = (str, fontInfo) =>
  str.split("\n").map((str) =>
    str === ""
      ? []
      : [
          {
            content: str,
            style: fontInfo,
          },
        ],
  );
export class Word {
  nodes: any[];
  constructor(nodes = []) {
    this.nodes = nodes;
  }
  getNodes() {
    return this.nodes;
  }
  isEmpty() {
    return this.nodes.length === 0;
  }
  insert(node) {
    this.nodes.push(node);
  }
  insertNodes(nodes) {
    this.nodes = this.nodes.concat(nodes);
  }
  getWidth() {
    return getNodesSize(this.nodes).width;
  }
  getContent() {
    return this.nodes.reduce((str, n) => str + n.content, "");
  }
}
const _isCJK = (str) => CJK_REGS.some((reg) => reg.test(str));
const _isPunctuation = (str) =>
  SPLIT_STR_ARR.indexOf(str) >= 0
    ? true
    : PUN_REGS.some((reg) => reg.test(str));
export const nodes2Words = (nodes) => {
  const CJK = "C";
  const PUNCTUATION = "P";
  const ALPHABET = "A";
  const pattern = /[CPA]:C|[CP]:A/; // 分隔 word 的规则
  const nodeTypes = nodes.map((node) => {
    const c = node.content;
    if (_isCJK(c)) {
      return CJK;
    }
    if (_isPunctuation(c)) {
      return PUNCTUATION;
    } else {
      return ALPHABET;
    }
  });
  // insertTags 用于判断在合适的地方创建新 word
  const insertTags = nodeTypes.map((type, i) => {
    if (i === 0) {
      return true;
    } else {
      const prev = nodeTypes[i - 1];
      const checkType = `${prev}:${type}`;
      return pattern.test(checkType);
    }
  });
  const result = [];
  nodes.forEach((node, i) => {
    if (insertTags[i]) {
      result.push(new Word());
    }
    last(result).insert(node);
  });
  return result;
};
export const sepWord = (word) => {
  return word.nodes.map((node) => new Word([node]));
};
export const combineWords = (words) => {
  const word = new Word();
  words.forEach((w) => word.insertNodes(w.nodes));
  return word;
};
