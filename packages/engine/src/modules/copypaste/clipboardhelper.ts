import * as path_browserify from "path-browserify";
import { indexDbAccesser } from "./indexdbaccesser";

import { CONFIG, VIEW_TYPE } from "../../common/constants/index";

import config from "../../common/config";

import Util from "../../util";
import { cpUtil } from "./cputil";

export class ClipboardHelper {
  context: any;
  dataTransfer: any;
  constructor(context) {
    this.context = context;
    this.dataTransfer = null;
  }
  /**
   * return XAP_GENERATOR which return Promise
   * @returns {Promise}
   * @memberof ClipboardHelper
   */
  _xapGen(...args) {
    const generator = this.context.config(CONFIG.XAP_GENERATOR);
    if (!generator) {
      return Promise.reject("xap generator unfound");
    } else {
      return generator(...args);
    }
  }
  _xapLoader(...args) {
    return this.context.config(CONFIG.XAP_LOADER)(...args);
  }
  /**
   * @returns {Promise} promise resolve array of image xap url
   * @memberof ClipboardHelper
   */
  async readImageArr() {
    const result = await this.context.config(CONFIG.CLIPBOARD_READER)(
      "image/*",
    );
    if (result) {
      const promiseArr = [
        this._xapGen({
          // type: "x-data",
          // data: {
          //   ext: result.type,// for ext
          //   encode: result.encode,
          //   content: result.content
          // },
          extType: result.type,
          data: result.content,
        }),
      ];
      if (promiseArr.length) {
        return Promise.all(promiseArr);
      } else {
        return Promise.reject("image unfound in clipboard");
      }
    } else if (
      this.dataTransfer &&
      this.dataTransfer.files[0] &&
      this.dataTransfer.files[0].type.indexOf("image") !== -1
    ) {
      const promiseArr: any = Array.from(this.dataTransfer.files).reduce(
        (arr: any[], item: any) => {
          if (item.type.indexOf("image") !== -1) {
            // @ts-ignore @todo why there is path attribute in File type data?
            const filePath = item.path;
            const extname = path_browserify.extname(filePath);
            const ext = extname.startsWith(".") ? extname.substr(1) : extname;
            arr.push(
              this._xapGen({
                // type: "file",
                // data: {
                //   ext: ext,
                //   encode: 'utf8',
                //   content: item.path
                // }
                extType: ext,
                data: filePath,
              }),
            );
          }
          return arr;
        },
        [],
      );
      if (promiseArr.length) {
        return Promise.all(promiseArr);
      } else {
        return Promise.reject("image unfound in clipboard");
      }
    }
  }
  async readMathJaxObjectList() {
    return this.readObj().then((data: any) => {
      if (data["text/x-type"] === VIEW_TYPE.MATH_JAX) {
        return Promise.resolve(data);
      } else {
        return Promise.reject();
      }
    });
  }
  /**
   * promise return object which was wrote in sharedData
   * will rewrite xap hash in data!!!
   * @returns {Promise}
   * @memberof ClipboardHelper
   */
  readObj() {
    // return new Promise((resolve, reject) => {
    return Promise.all([
      this.readPlainText(),
      indexDbAccesser.read("text/plain"),
    ])
      .then((textArr: string[]) => {
        //当剪贴板和sharedData中的纯文本内容相同时，认为现在在读取sharedData中的对象数据
        if (textArr.some((text) => text === undefined || text === null)) {
          return Promise.reject("text is undefined");
        }
        if (
          textArr[0].replace(/\n|\r|\r\n/g, "") ===
          textArr[1].replace(/\n|\r|\r\n/g, "")
        ) {
          return (indexDbAccesser as any).read();
        } else {
          return Promise.reject("plain text not match");
        }
      })
      .then((data) =>
        Promise.all(
          Object.keys(data.xapInfoMap).map((xapHash) => {
            return this._xapGen({
              // type: "x-data",
              // data: {
              //   ext: xapHash.match(/\.(.+)$/)[1],
              //   encode: "ArrayBuffer",
              //   content: data.xapInfoMap[xapHash]
              // }
              extType: (xapHash.match(/\.(.+)$/) as any)[1],
              data: data.xapInfoMap[xapHash],
            }).then((newHash) => {
              data.xapInfoMap[xapHash] = newHash;
            });
          }),
        ).then(() => data),
      )
      .then((data) => {
        data["text/x-array-json"] = data["text/x-array-json"].map((item) => {
          item.xapPaths.forEach((path) => {
            if (path[0] === "/") {
              //TODO: replace usermarker
              return;
            }
            Util.replaceValueInObject(
              item.data,
              path,
              (oldXap) => data.xapInfoMap[oldXap],
            );
          });
          return item.data;
        });
        return data;
      });
  }
  /**
   * promise return plain text
   * @returns {Promise}
   * @memberof ClipboardHelper
   */
  async readPlainText() {
    const plainStr = await this.context.config(CONFIG.CLIPBOARD_READER)(
      "text/plain",
    );
    if (plainStr === null || plainStr === undefined) {
      if (this.dataTransfer) {
        return this.dataTransfer.getData("text/plain");
      } else {
        return indexDbAccesser.read("text/plain");
      }
    } else {
      return plainStr;
    }
  }
  async readHTML() {
    let htmlString = await this.context.config(CONFIG.CLIPBOARD_READER)(
      "text/html",
    );
    if (!htmlString) {
      if (this.dataTransfer) {
        htmlString = this.dataTransfer.getData("text/html");
      } else {
        htmlString = indexDbAccesser.read("text/html");
      }
    }
    return htmlString;
  }
  /**
   *
   * @param {Object} data - data to write to clipboard
   * @returns {Promise}
   * @memberof ClipboardHelper
   */
  write(data) {
    if (!data) {
      config.get(CONFIG.LOGGER).error("something wrong!");
      return;
    }
    const clipboardWriter = this.context.config(CONFIG.CLIPBOARD_WRITER);
    if (clipboardWriter) {
      clipboardWriter(data);
    } else if (this.dataTransfer) {
      this.dataTransfer.setData("text/plain", data["text/plain"]);
    } else {
      this.context.callService("copyToClipboard", data["text/plain"]);
    }
    //load xap resource
    const xapInfoMap = {};
    const dataArr = data["text/x-array-json"].map((data) => {
      return {
        data,
        xapPaths: [],
      };
    });
    dataArr.forEach((item) => {
      const xapInfoArr = Util.getXapInData(
        item.data,
        this.context.model.get("legend"),
      );
      xapInfoArr.forEach((xapInfo) => {
        item.xapPaths.push(xapInfo.path);
        xapInfoMap[xapInfo.content] = true;
      });
    });
    data["text/x-array-json"] = dataArr;
    return Promise.all(
      Object.keys(xapInfoMap).map((xap) =>
        this._xapLoader(xap)
          .then((url) => cpUtil.loadUrlAsBuffer(url))
          .then((buffer) => (xapInfoMap[xap] = buffer)),
      ),
    ).then(() => {
      //save xap buffer data into sharedData
      data.xapInfoMap = xapInfoMap;
      indexDbAccesser.write(data);
    });
  }
  reset() {
    this.dataTransfer = null;
    //sharedDataAccesser.clear();
    //clear clipboard
  }
  setDataTransfer(df) {
    this.dataTransfer = df;
  }
}

export default ClipboardHelper;
