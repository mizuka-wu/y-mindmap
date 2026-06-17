import {
  CONFIG,
  TOPIC_ATTACHED,
  TOPIC_DETACHED,
  TOPIC_CALLOUT,
  TOPIC_SUMMARY,
} from "../../common/constants/index";
import Util from "../../util";
import config from "../../common/config";

const linefeed = "\r\n";
const reg = new RegExp(linefeed + "$");
const b64Reg = /data:image[\s\S]*;base64,/;
export const cpUtil = {
  linefeed: linefeed,
  formChildIdMap(branch, map) {
    if (!branch) {
      return;
    }
    const children = branch.getChildrenBranchesByType([
      TOPIC_ATTACHED,
      TOPIC_DETACHED,
      TOPIC_CALLOUT,
      TOPIC_SUMMARY,
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    children.forEach((item, index) => {
      const id = item.model.get("id");
      if (id) {
        map[id] = true;
      }
      cpUtil.formChildIdMap(item, map);
    });
  },
  /**
   * 将branch序列化成文本
   *                    +-----------+
   *                 +-->sub topic1 |
   *                 |  +-----------+
   *                 |
   * +-----------+   |
   * |main topic +---+
   * +-----------+   |                   +------------+
   *                 |                +-->sub topic2.1|
   *                 |  +-----------+ |  +------------+
   *                 +-->sub topic2 +-+
   *                    +-----------+ |  +------------+
   *                                  +-->sub topic2.2|
   *                                     +------------+
   * 序列化为
   * main topic
   *   sub topic1
   *   sub topic2
   *     sub topic2.1
   *     sub topic2.2
   * @param branch
   * @returns {string}
   */
  serializeBranch(branch) {
    let result = "";
    _serializeBranch(branch, "");
    return result.replace(reg, "");
    function _serializeBranch(branch, prefix) {
      if (branch.isSelected) {
        result += prefix + branch.model.get("title") + linefeed;
        const children = branch.getChildrenBranchesByType([
          TOPIC_ATTACHED,
          TOPIC_DETACHED,
          TOPIC_CALLOUT,
          TOPIC_SUMMARY,
        ]);

        children.forEach((item) => {
          _serializeBranch(item, prefix + "\t");
        });
      }
    }
  },
  serializeBranchToString(branchData) {
    let result = "";
    _toString(branchData, "");
    return result.replace(reg, "");
    function _toString(branchData, prefix) {
      result += prefix + (branchData.title ? branchData.title : "") + linefeed;
      const children: any[] = [];
      if (branchData.children) {
        if (branchData.children[TOPIC_ATTACHED]) {
          children.push(...branchData.children[TOPIC_ATTACHED]);
        }
        if (branchData.children[TOPIC_DETACHED]) {
          children.push(...branchData.children[TOPIC_DETACHED]);
        }
        if (branchData.children[TOPIC_CALLOUT]) {
          children.push(...branchData.children[TOPIC_CALLOUT]);
        }
        if (branchData.children[TOPIC_SUMMARY]) {
          children.push(...branchData.children[TOPIC_SUMMARY]);
        }
      }
      children.forEach((item) => {
        _toString(item, prefix + "\t");
      });
    }
  },
  toJson(branch) {
    const result = {};
    _toJson(branch, result);
    return JSON.parse(JSON.stringify(result));
    function _toJson(branch, result) {
      const attachedChildren = branch.getChildrenBranchesByType(TOPIC_ATTACHED);
      for (const key in branch.model.attributes) {
        if (branch.collapse) {
          result[key] = branch.model.attributes[key];
          continue;
        }
        if (key === "boundaries") {
          result.boundaries = _transRange(
            branch,
            attachedChildren,
            "boundaries",
          );
          continue;
        }
        if (key === "summaries") {
          result.summaries = _transRange(branch, attachedChildren, "summaries");
          continue;
        }
        if (key !== "children") {
          result[key] = branch.model.attributes[key];
        }
      }
      _transBranchChildren(branch, result, TOPIC_ATTACHED);
      _transBranchChildren(branch, result, TOPIC_CALLOUT);
      _transBranchChildren(branch, result, TOPIC_DETACHED);
      if (result.summaries && result.summaries.length > 0) {
        _transBranchChildren(branch, result, TOPIC_SUMMARY);
      }
    }
    function _transRange(branch, attachedChildren, type) {
      const rangeModels = branch.model.attributes[type];
      return rangeModels.filter((b) => {
        if (b.range) {
          try {
            const r = b.range.substr(1, 4).split(",");
            const r1 = Number.parseInt(r[0]);
            const r2 = Number.parseInt(r[1]);
            for (let i = r1; i <= r2; i++) {
              const child = attachedChildren[i];
              const selected = cpUtil.isAllSelected(child);
              if (!selected) {
                return false;
              }
            }
            return true;
          } catch {
            //
          }
        }
        return false;
      });
    }
    function _transBranchChildren(branch, result, type) {
      const children = branch.getChildrenBranchesByType(type);
      if (children) {
        children.forEach((item) => {
          if (item.isSelected || type === TOPIC_SUMMARY) {
            if (!result.children) {
              result.children = {};
            }
            if (!result.children[type]) {
              result.children[type] = [];
            }
            const itemModelJson = {};
            result.children[type].push(itemModelJson);
            _toJson(item, itemModelJson);
          }
        });
      }
    }
  },
  isAllSelected(branch) {
    if (!branch.isSelected) {
      return false;
    }
    if (branch.collapse) {
      return true;
    }
    const children = branch.getChildrenBranchesByType(TOPIC_ATTACHED);
    for (const child of children) {
      const result = cpUtil.isAllSelected(child);
      if (!result) {
        return result;
      }
    }
    return true;
  },
  /**
   * 将系统剪贴板的数据反序列化
   * @param str
   * @param workbook
   * @returns {Array}
   */
  deserialize(str, sheet) {
    const strArr = str.split(/\r\n|\n|\r/); //不同操作系统平台下会有不同的换行符
    const pathStack: any[] = []; //一个栈，记录遍历过程中经历的topic节点
    const modelArr: any[] = []; //结果数组
    strArr.forEach((item) => {
      if (item === "") {
        return;
      }
      const layer = item.match(/^\t*/)[0].length; //layer表示一个topic节点的层级，0为顶级节点，有多个顶级节点
      const title = item.substr(layer);
      const modelData = cpUtil.createTopicData(title, sheet);
      let parent = pathStack.pop();
      if (!parent) {
        modelArr.push(modelData);
        pathStack.push(modelData);
      } else if (layer > pathStack.length) {
        cpUtil.appendChildTopic(parent, modelData);
        pathStack.push(parent);
        pathStack.push(modelData);
      } else {
        while (layer < pathStack.length) {
          pathStack.pop();
        }
        if (layer === pathStack.length) {
          parent = pathStack[pathStack.length - 1];
          if (!parent) {
            modelArr.push(modelData);
          } else {
            cpUtil.appendChildTopic(parent, modelData);
          }
          pathStack.push(modelData);
        }
      }
    });
    return modelArr;
  },
  createTopicData(title, sheet) {
    return {
      // "class": "topic",
      id: sheet.generateComponentId(),
      title: title,
    };
  },
  appendChildTopic(parent, child) {
    if (!parent.children) {
      parent.children = {};
    }
    const children = parent.children;
    if (!children.attached) {
      children.attached = [];
    }
    children.attached.push(child);
  },
  /**
   *
   *
   * @param {any} url
   * @returns
   */
  loadUrlAsBuffer(url) {
    return new Promise((resolve, reject) => {
      if (Util.isBase64Url(url)) {
        resolve(
          Util.base64ToArrayBuffer(url.slice(url.match(b64Reg)[0].length)),
        );
      } else if (url.indexOf("blob:") === 0) {
        //TODO:
        reject("can not load blob objectUrl");
      } else {
        const req = new XMLHttpRequest();
        req.addEventListener("readystatechange", (e) => {
          if (req.readyState === XMLHttpRequest.DONE) {
            // in doughnut, success return with status 0
            const isSuccessInDoughnut = req.response && req.status === 0;
            if (req.status === 200 || isSuccessInDoughnut) {
              const bits = req.response;
              resolve(bits);
            } else {
              config.get(CONFIG.LOGGER).warn("load xap url fail", url, e);
              reject(new Error("load xap url fail " + url));
            }
          }
        });
        req.open("GET", url);
        req.responseType = "arraybuffer";
        req.send();
      }
    });
  },
  /**
   *
   * @param {String} url - could be base64, blob url, http, file etc
   * @returns {String} base64 encoded String
   */
  normalizeUrlToBase64(url) {
    return new Promise((res, rej) => {
      if (Util.isBase64Url(url)) {
        res(url);
      } else if (url.indexOf("blob:") === 0) {
        //TODO:
      } else {
        //http or file url
        const req = new XMLHttpRequest();
        req.addEventListener("readystatechange", (e) => {
          if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status === 200) {
              const bits = req.response;
              res(Util.arrayBufferToBase64(bits));
            } else {
              config.get(CONFIG.LOGGER).warn("load xap url fail", url, e);
              rej(new Error("load xap url fail " + url));
            }
          }
        });
        req.open("GET", url);
        req.responseType = "arraybuffer";
        req.send();
      }
    });
  },
};
export default cpUtil;
