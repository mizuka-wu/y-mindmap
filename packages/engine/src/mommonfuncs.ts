import styleManager from './utils/business/stylemanager/index';

import * as lib from './lib/index';

import { BROWSER_TYPE } from './common/constants/index';

import jquery from 'jquery';

import underscore from 'underscore';

import * as utils from './utils/index'; // @ts-nocheck

const uuidMap: Record<string, string> = {};
let isMobile: boolean = undefined;
let browserType: string = undefined;
let isPassiveSupport: boolean = undefined;
/**
 * @deprecated DO NOT use this module any more! Use separate utility functions and classes in `js/common/utils/` or `js/utils/`.
 */
const mommonFuncs = {
  /**
   * @deprecated
   */
  BREAK: '1',
  SKIP: '2',
  hexColorReg: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  get browserType() {
    if (browserType !== undefined) {
      return browserType;
    } else {
      return (browserType = __());
    }
    function __() {
      const userAgent = navigator.userAgent;
      if ((userAgent.indexOf('Opera') || userAgent.indexOf('OPR')) !== -1) {
        return BROWSER_TYPE.OPERA;
      } else if (userAgent.indexOf('Edge') !== -1) {
        return BROWSER_TYPE.EDGE;
      } else if (userAgent.indexOf('Firefox') !== -1) {
        return BROWSER_TYPE.FIREFOX;
      } else if (userAgent.indexOf('Chrome') !== -1) {
        return BROWSER_TYPE.CHROME;
      } else if (userAgent.indexOf('Safari') !== -1) {
        return BROWSER_TYPE.SAFARI;
      } else if (userAgent.indexOf('MSIE') !== -1 || !!(document as any).documentMode === true) {
        //IF IE > 10
        return BROWSER_TYPE.IE;
      } else {
        return BROWSER_TYPE.UNKNOWN;
      }
    }
  },
  get isMac() {
    return navigator.userAgent.includes('Mac');
  },
  isIE() {
    return this.browserType === BROWSER_TYPE.IE;
  },
  isEdge() {
    return this.browserType === BROWSER_TYPE.EDGE;
  },
  isSafari() {
    return this.browserType === BROWSER_TYPE.SAFARI;
  },
  isWebKit() {
    const ua = navigator.userAgent;
    return ua.includes('WebKit') && !ua.includes('Edge');
  },
  //@see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
  get isPassiveSupport() {
    //init
    if (isPassiveSupport === undefined) {
      isPassiveSupport = false;
      try {
        const options = Object.defineProperty({}, 'passive', {
          get: function () {
            isPassiveSupport = true;
          },
        });
        window.addEventListener('test', null, options);
      } catch {
        // Ignore errors when testing browser compatibility.
      }
    }
    return isPassiveSupport;
  },
  imgToBase64String(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);
    document.body.appendChild(canvas);
    return canvas.toDataURL();
  },
  generateRect(
    bounds: { x: any; y: any; width: any; height: any },
    innerBorderWidth: number,
    radius?: number,
    padding?: number
  ) {
    if (typeof radius !== 'number') {
      radius = utils.layoutConstant.TOPIC_SELECTBOX_RADIUS;
    }
    if (typeof padding !== 'number') {
      padding = utils.layoutConstant.TOPIC_SELECTBOX_PADDING;
    }
    const halfInnerBorderWidth = innerBorderWidth / 2;
    const x = bounds.x;
    const y = bounds.y;
    const width = bounds.width;
    const height = bounds.height;
    // pX refers the point of the rect's corner.
    // A----B
    // |    |
    // D----C
    const pA = {
      x: x - halfInnerBorderWidth - padding,
      y: y - halfInnerBorderWidth - padding,
    };
    const pB = {
      x: x + width + halfInnerBorderWidth + padding,
      y: pA.y,
    };
    const pC = {
      x: pB.x,
      y: y + height + halfInnerBorderWidth + padding,
    };
    const pD = {
      x: pA.x,
      y: pC.y,
    };
    const d = `M ${pA.x + radius} ${pA.y}L ${pB.x - radius} ${pB.y}Q ${pB.x} ${
      pB.y
    }  ${pB.x} ${pB.y + radius}L ${pC.x} ${pC.y - radius}Q ${pC.x} ${pC.y}  ${
      pC.x - radius
    } ${pC.y}L ${pD.x + radius} ${pD.y}Q ${pD.x} ${pD.y}  ${pD.x} ${
      pD.y - radius
    }L ${pA.x} ${pA.y + radius}Q ${pA.x} ${pA.y}  ${pA.x + radius} ${pA.y}`;
    return d;
  },
  /**
   * @deprecated Please use `UUID()` in `js/common/base.ts`.
   */
  UUID: function (jsonUUID?: string | number, jsonToXMind?: any) {
    if (jsonUUID && uuidMap[jsonUUID]) {
      return uuidMap[jsonUUID];
    }
    const toReplacedString = jsonToXMind ? 'xxxyxxxxxxxyxxxxxxxxxyxxxx' : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    const newUUID = toReplacedString.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 3) | 8;
      return v.toString(16);
    });
    if (jsonUUID) {
      return (uuidMap[jsonUUID] = newUUID);
    } else {
      return newUUID;
    }
  },
  getHexColor: function (rgbString: any) {
    let rgb = rgbString;
    if (/^rgb/.test(rgb)) {
      rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      rgb = '#' + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }
    return rgb;
  },
  /**
   * hex转十进制rgb数组
   * @param hexStr
   * @returns {Array}
   */
  hexToRgb: function (hexStr: string) {
    let rgb: any[] = [];
    hexStr = hexStr.replace(' ', '');
    if (/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexStr)) {
      hexStr = hexStr.slice(1, hexStr.length);
      if (hexStr.length === 3) {
        rgb = hexStr.split('');
        rgb = rgb.map((item: any) => {
          return parseInt(item + item, 16);
        });
      } else {
        rgb = hexStr.split('');
        rgb = ['', '', ''].map((item, index) => {
          return parseInt(rgb[index * 2] + rgb[index * 2 + 1], 16);
        });
      }
    } else {
      throw new Error('wrong hex color format! check the argument');
    }
    return rgb;
  },
  hexToHsb: function (hexStr: any) {
    const rgb: [number, number, number] = mommonFuncs.hexToRgb(hexStr) as [number, number, number];
    return mommonFuncs.rgbToHsb(...rgb);
  },
  hsbToHex: function (H: number, S: number, B: number) {
    const rgb = mommonFuncs.hsbToRbg(H, S, B);
    function hex(x: number) {
      return ('0' + x.toString(16)).slice(-2);
    }
    return '#' + hex(rgb.R) + hex(rgb.G) + hex(rgb.B);
  },
  hsbToRbg: function (H: number, S: number, B: number) {
    const rgb = {
      R: 0,
      G: 0,
      B: 0,
    };
    H = H >= 360 ? 0 : H;
    if (S === 0) {
      rgb.R = B * 255;
      rgb.G = B * 255;
      rgb.B = B * 255;
    } else {
      const i = Math.floor(H / 60) % 6;
      const f = H / 60 - i;
      const p = B * (1 - S);
      const q = B * (1 - S * f);
      const t = B * (1 - S * (1 - f));
      switch (i) {
        case 0:
          rgb.R = B;
          rgb.G = t;
          rgb.B = p;
          break;
        case 1:
          rgb.R = q;
          rgb.G = B;
          rgb.B = p;
          break;
        case 2:
          rgb.R = p;
          rgb.G = B;
          rgb.B = t;
          break;
        case 3:
          rgb.R = p;
          rgb.G = q;
          rgb.B = B;
          break;
        case 4:
          rgb.R = t;
          rgb.G = p;
          rgb.B = B;
          break;
        case 5:
          rgb.R = B;
          rgb.G = p;
          rgb.B = q;
          break;
      }
      rgb.R = rgb.R * 255;
      rgb.G = rgb.G * 255;
      rgb.B = rgb.B * 255;
    }
    return rgb;
  },
  /**
   * @param R decimal
   * @param G
   * @param B
   * @returns {*[]} [h(0~360),s(0~1),b(0~1)]
   */
  rgbToHsb: function (R: number, G: number, B: number) {
    const var_Min = Math.min(Math.min(R, G), B);
    const var_Max = Math.max(Math.max(R, G), B);
    const hsb = {
      H: 0,
      S: 0,
      B: 0,
    };
    if (var_Min === var_Max) {
      hsb.H = 0;
    } else if (var_Max === R && G >= B) {
      hsb.H = ((G - B) / (var_Max - var_Min)) * 60;
    } else if (var_Max === R && G < B) {
      hsb.H = ((G - B) / (var_Max - var_Min)) * 60 + 360;
    } else if (var_Max === G) {
      hsb.H = ((B - R) / (var_Max - var_Min)) * 60 + 120;
    } else if (var_Max === B) {
      hsb.H = ((R - G) / (var_Max - var_Min)) * 60 + 240;
    }
    if (var_Max === 0) {
      hsb.S = 0;
    } else {
      hsb.S = 1 - var_Min / var_Max;
    }
    const var_R = R / 255;
    const var_G = G / 255;
    const var_B = B / 255;
    hsb.B = Math.max(Math.max(var_R, var_G), var_B);
    hsb.H = hsb.H >= 360 ? 0 : hsb.H;
    return hsb;
  },
  getWindowSize: function () {
    let winWidth;
    let winHeight;
    // 获取窗口宽度
    if (window.innerWidth) {
      winWidth = window.innerWidth;
    } else if (document.body && document.body.clientWidth) {
      winWidth = document.body.clientWidth;
    }
    // 获取窗口高度
    if (window.innerHeight) {
      winHeight = window.innerHeight;
    } else if (document.body && document.body.clientHeight) {
      winHeight = document.body.clientHeight;
    }
    // 通过深入 Document 内部对 body 进行检测，获取窗口大小
    if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) {
      winHeight = document.documentElement.clientHeight;
      winWidth = document.documentElement.clientWidth;
    }
    return {
      winWidth: winWidth,
      winHeight: winHeight,
    };
  },
  setAsyncExcute: function (
    view: { timer: Record<number | string, NodeJS.Timer> },
    timerName: string | number,
    callback: () => void
  ) {
    const timer = view.timer || {};
    if (timer[timerName]) {
      clearTimeout(timer[timerName]);
    }
    timer[timerName] = setTimeout(callback, 0);
    view.timer = timer;
  },
  /**
   * @deprecated 使用utils/baseutil.throttle
   * */
  throttle: function (fn: any, interval: number) {
    const __self = fn; // 保存需要被延迟执行的函数引用
    let timer: NodeJS.Timeout;
    let // 定时器
      firstTime = true; // 是否是第一次调用
    return function doThrottle() {
      // eslint-disable-next-line prefer-rest-params
      const args = arguments;

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const __me = this;
      if (firstTime) {
        // 如果是第一次调用,不需延迟执行
        __self.apply(__me, args);
        return (firstTime = false);
      }
      if (timer) {
        // 如果定时器还在,说明前一次延迟执行还没有完成
        return false;
      }
      timer = setTimeout(
        () => {
          clearTimeout(timer);
          timer = null;
          __self.apply(__me, args);
        },
        interval === undefined ? 500 : interval
      );
    };
  },
  showBounds: function (
    branch: {
      boundsLine: lib.SVG.Rect;
      svg: { put: (arg0: lib.SVG.Rect) => void };
    },
    bounds: string
  ) {
    const rect = new lib.SVG.Rect();
    rect.attr(bounds);
    rect.attr({
      'stroke-width': 1,
      stroke: 'blue',
      fill: 'grey',
      opacity: 0.2,
    });
    rect.style('pointer-events', 'none');
    if (branch.boundsLine) {
      branch.boundsLine.remove();
    }
    branch.svg.put(rect);
    branch.boundsLine = rect;
    //setTimeout(function(){
    //  rect.remove();
    //  branch.boundsLine = undefined;
    //},60000);
  },
  cookieUtil: {
    getItem: function (sKey: string | number | boolean) {
      if (!sKey) {
        return null;
      }
      return (
        decodeURIComponent(
          document.cookie.replace(
            new RegExp(
              '(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'
            ),
            '$1'
          )
        ) || null
      );
    },
    setItem: function (
      sKey: string | number | boolean,
      sValue: string | number | boolean,
      vEnd: string | number | Date,
      sPath: string,
      sDomain: string,
      bSecure: any
    ) {
      if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey as string)) {
        return false;
      }
      let sExpires = '';
      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + vEnd;
            break;
          case String:
            sExpires = '; expires=' + vEnd;
            break;
          case Date:
            sExpires = '; expires=' + (vEnd as Date).toUTCString();
            break;
        }
      }
      document.cookie =
        encodeURIComponent(sKey) +
        '=' +
        encodeURIComponent(sValue) +
        sExpires +
        (sDomain ? '; domain=' + sDomain : '') +
        (sPath ? '; path=' + sPath : '') +
        (bSecure ? '; secure' : '');
      return true;
    },
    removeItem: function (sKey: string | number | boolean, sPath: string, sDomain?: string) {
      if (!mommonFuncs.cookieUtil.hasItem(sKey)) {
        return false;
      }
      document.cookie =
        encodeURIComponent(sKey) +
        '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
        (sDomain ? '; domain=' + sDomain : '') +
        (sPath ? '; path=' + sPath : '');
      return true;
    },
    clear: function () {
      mommonFuncs.cookieUtil.keys().forEach(item => {
        mommonFuncs.cookieUtil.removeItem(item, '/');
      });
    },
    hasItem: function (sKey: string | number | boolean) {
      if (!sKey) {
        return false;
      }
      return new RegExp('(?:^|;\\s*)' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=').test(
        document.cookie
      );
    },
    keys: function () {
      const aKeys = document.cookie
        // eslint-disable-next-line no-useless-backreference
        .replace(/((?:^|\s*;)[^=]+)(?=;|$)|^\s*|\s*(?:=[^;]*)?(?:\1|$)/g, '')
        .split(/\s*(?:=[^;]*)?;\s*/);
      for (let nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }
      return aKeys;
    },
  },
  get isMobile() {
    if (isMobile !== undefined) {
      return isMobile;
    } else {
      return (isMobile = __());
    }
    function __() {
      const userAgent = navigator.userAgent.toLowerCase();
      let isIOS;
      if ((window as any).device && (window as any).device.systemName && (window as any).device.systemName === 'iOS') {
        isIOS = true;
      }
      return (
        userAgent.includes('ipad') ||
        userAgent.includes('android') ||
        userAgent.includes('mobile') ||
        userAgent.includes('phone') ||
        isIOS
      );
    }
  },
  /**
   * @return {boolean}
   * @public
   * */
  get isTouchAble() {
    // 检测最大支持的触摸点
    return navigator.maxTouchPoints > 0;
  },
  urlNormalize: function (url: string) {
    let path;
    let protocol;
    const doubleSlash = url.indexOf('//') === 0;
    if (url.indexOf('://') !== -1) {
      const arr = url.split('://');
      protocol = arr[0];
      arr.shift();
      path = arr.join('://');
    } else {
      path = url;
    }
    path = mommonFuncs.pathNormalize(path);
    if (protocol) {
      return protocol + '://' + path;
    } else if (doubleSlash) {
      return '/' + path;
    } else {
      return path;
    }
  },
  pathNormalize: function (path: string) {
    const isAbsolute = path.charAt(0) === '/';
    const trailingSlash = path && path[path.length - 1] === '/';
    path = normalizeArray(path.split('/'), !isAbsolute).join('/');
    if (!path && !isAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }
    return (isAbsolute ? '/' : '') + path;
    function normalizeArray(parts: string | any[], allowAboveRoot: boolean) {
      const res = [];
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        // ignore empty parts
        if (!p || p === '.') {
          continue;
        }
        if (p === '..') {
          if (res.length && res[res.length - 1] !== '..') {
            res.pop();
          } else if (allowAboveRoot) {
            res.push('..');
          }
        } else {
          res.push(p);
        }
      }
      return res;
    }
  },
  getXapResourceHash: function (resourceStr: string) {
    if (mommonFuncs.isXapResource(resourceStr)) {
      return resourceStr.match(new RegExp('xap:resources/(\\S*)\\.*\\S*$'))[1];
    } else {
      return resourceStr;
    }
  },
  isXapResource: function (resourceStr: string | string[]) {
    if (typeof resourceStr !== 'string') {
      return false;
    }
    return resourceStr.indexOf('xap:resources/') === 0;
  },
  /**
   * 用作过滤掉对绘图不必要的回调，当回调调用频率比fps要大时起作用，比如mousemove
   * 警告：stablized函数off事件回调后，忍然可能会在下一帧执行
   * @param frameRender 待降频的函数
   * @param eventHandler 可以用来停止冒泡
   * @returns {Function}
   * @deprecated 使用baseUtil.frameStabilize
   */
  frameStabilize: function (
    frameRender: { apply: (arg0: any, arg1: any) => void },
    eventHandler?: { apply: (arg0: any, arg1: any) => void }
  ) {
    let isRequested = false;
    return function doFrameStabilize() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      const args = Array.prototype.slice.apply(arguments); // eslint-disable-line prefer-rest-params
      if (!isRequested) {
        isRequested = true;
        requestAnimationFrame(() => {
          frameRender.apply(self, args);
          isRequested = false;
        });
      }
      if (eventHandler && typeof eventHandler === 'function') {
        eventHandler.apply(self, args);
      }
    };
  },
  putElementSuitable: function (
    $div: {
      width: () => any;
      height: () => any;
      css: (arg0: { 'max-height': string; 'overflow-y': string; left: any; top: any }) => void;
    },
    position: { x: number; y: any },
    targetHeight = 0
  ) {
    const divWidth = $div.width();
    const divHeight = $div.height();
    const windowSize = mommonFuncs.getWindowSize();
    const windowWidth =
      windowSize.winWidth - (jquery('#right_side_bar')[0].style.display !== 'none' ? jquery('#right-bar').width() : 0);
    const windowHeight = windowSize.winHeight;
    const maxUp = jquery('#top-bar').height ? jquery('#top-bar').height() : 0;
    let left = position.x;
    let top = position.y;
    let maxHeight = 'none';
    let overflowY = 'hidden';
    /* 对y方向进行变换坐标. */
    if (position.y + divHeight > windowHeight) {
      top -= divHeight + targetHeight * 3;
      if (top < maxUp) {
        top += divHeight - 100;
        maxHeight = '100px';
        overflowY = 'scroll';
      }
    } else {
      maxHeight = 'none';
      overflowY = 'hidden';
    }
    /* 对x方向进行变换坐标.*/
    if (position.x + divWidth > windowWidth) {
      left -= position.x + divWidth - windowWidth;
    } else if (position.x < 0) {
      left += -position.x;
    }
    $div.css({
      'max-height': maxHeight,
      'overflow-y': overflowY,
      left: left,
      top: top,
    });
  },
  /**
   * branch的后序遍历,回调中返回true会立刻返回
   * TODO 用非递归版本改写，可以减少调用栈的开销
   * @param branch
   * @param type
   * @param callback
   * @deprecated
   */
  postorderIterate: function (
    branch: { getChildrenBranchesByType: (arg0: any) => any },
    type: any,
    callback: (arg0: any) => any
  ) {
    const children = branch.getChildrenBranchesByType(type);
    if (
      children.some((item: any) => {
        return mommonFuncs.postorderIterate(item, type, callback) === mommonFuncs.BREAK;
      })
    ) {
      return mommonFuncs.BREAK;
    }
    return callback(branch);
  },
  /**
   * branch的先序遍历,回调中返回true会立刻返回
   * TODO 用非递归版本改写，可以减少调用栈的开销
   * @param branch
   * @param type array of [Seawind.TOPIC_ATTACHED ...etc]
   * @param callback
   */
  preorderIterate: function (
    branch: { getChildrenBranchesByType: (arg0: any) => any },
    type: any,
    callback: (arg0: any) => any
  ) {
    let result = callback(branch);
    if (result === mommonFuncs.BREAK || result === mommonFuncs.SKIP) {
      return result;
    }
    const children = branch.getChildrenBranchesByType(type);
    for (let i = 0; i < children.length; i++) {
      result = mommonFuncs.preorderIterate(children[i], type, callback);
      if (result === mommonFuncs.BREAK) {
        return result;
      }
    }
  },
  getType: function (selection: { type: string }) {
    if (selection.type === 'branch') {
      return styleManager.getClassName(selection);
    } else {
      return selection.type;
    }
  },
  /**
   * 更新JSON对象里的ID值，以免和原始model冲突
   * 有一个难点是要保证summaries和summary topic的ID要更新且保持一致
   * @param {Object}data 待递归替换ID的JSON对象
   * @param {function} idGenerator
   */
  replaceId(
    data: any,
    idGenerator: {
      (jsonUUID?: any): any;
      (jsonUUID?: any): any;
      (): any;
      (): any;
      (): any;
      (): any;
    }
  ) {
    const result: Record<string, string> = {
      //key : old id
      //value : new id
    };
    const summaryTopicIdMap: Record<string, string> = {
      //key : old summary topic id
      //value : new id
    };
    const path = ['root']; //save the path of recursion
    _replaceId(data);
    return result;
    function _replaceId(data: underscore.Dictionary<any> & object) {
      const lastTowAttr = path[path.length - 2]; //标注了当前JSON节点的类型，为summary,detached,callout,summaries
      if (data.id) {
        if (lastTowAttr === 'summary') {
          //当前data对象是summary topic的JSON对象
          if (!summaryTopicIdMap[data.id]) {
            summaryTopicIdMap[data.id] = idGenerator();
          }
          result[data.id] = summaryTopicIdMap[data.id];
          data.id = summaryTopicIdMap[data.id];
        } else if (lastTowAttr === 'summaries') {
          //当前data 对象是summaries 的JSON对象（summary model 的JSON对象）
          result[data.id] = idGenerator();
          data.id = result[data.id];
          if (!summaryTopicIdMap[data.topicId]) {
            summaryTopicIdMap[data.topicId] = idGenerator();
          }
          result[data.topicId] = summaryTopicIdMap[data.topicId];
          data.topicId = summaryTopicIdMap[data.topicId];
        } else {
          result[data.id] = idGenerator();
          data.id = result[data.id];
        }
      }
      for (const attr in data) {
        if (underscore.isObject(data[attr])) {
          path.push(attr);
          _replaceId(data[attr]);
          path.pop();
        }
      }
    }
  },
  /**
   * 包装类方法，当当前sheet为readonly时，不进行任何操作。
   * @param {SVGComponentView} view
   * @param {string[]} fileds
   */
  wrapReadOnly(view: { prototype: { [x: string]: (...args: any[]) => void } }, fileds: any[]) {
    fileds.forEach((filed: string | number) => {
      const oldFn = view.prototype[filed];
      if (typeof oldFn !== 'function') {
        return;
      }
      view.prototype[filed] = function (...args: any) {
        if (this.getContext().isReadOnly()) {
          return;
        }
        oldFn.apply(this, args);
      };
    });
  },
  /**
   * 功能键判断，在mac上是Command键，在windows上是ctrl键。 （用于多选等情况下）
   * @param {MouseEvent} mouseEvent
   */
  isFunctionEnabled(mouseEvent: Partial<{ metaKey: boolean; ctrlKey: boolean }>) {
    if (this.isMac) {
      return mouseEvent.metaKey;
    } else {
      return mouseEvent.ctrlKey;
    }
  },
  /**
   * 查找一组branches的共同parent，找不到的话返回null。
   * 返回parent，以及parent直属下级branches
   * @param {BranchView[]} branches
   * @return {Object} {parent: BranchView, subBranches: BranchView[]}
   */
  findCommonParent(branches: { length: any; sort: (arg0: (a: any, b: any) => boolean) => any }) {
    if (!branches || !branches.length) {
      return null;
    }
    const sortedBranch = branches.sort(
      (a: { getLayer: () => number }, b: { getLayer: () => number }) => a.getLayer() > b.getLayer()
    );
    const topTier = sortedBranch[0].getLayer();
    let lastTopTier = 0;
    sortedBranch.some((branch: { getLayer: () => any }, ind: number) => {
      if (branch.getLayer() !== topTier) {
        return true;
      }
      lastTopTier = ind;
    });
    const topTiers = sortedBranch.slice(0, lastTopTier + 1);
    const topTiersPath = topTiers.map((branch: { getBranchPath: () => any }) => branch.getBranchPath());
    const tailBranches = sortedBranch.slice(lastTopTier + 1);
    const tailBranchesPath = tailBranches.map((branch: { getBranchPath: () => any }) => branch.getBranchPath());
    //Every tail branch should be attach to a top tier branch. otherwise processiong end.
    if (
      !tailBranchesPath.every((tPath: string | any[]) => {
        return topTiersPath.some((path: any) => tPath.indexOf(path) === 0);
      })
    ) {
      return null;
    }
    //then check the top tiers, they should have the same parent. Otherwise, processing end.
    const theParent = topTiers[0].parent();
    if (!topTiers.every((branch: { parent: () => any }) => branch.parent() === theParent)) {
      return null;
    }
    if (theParent.type !== 'branch') {
      return null;
    } //seems root branch has been passed in.
    return {
      parent: theParent,
      subBranches: topTiers,
    };
  },
  setAnimation(opts: { start: any; end: any; duration: any; during: any; after: any }) {
    const { start, end, duration, during, after } = opts;
    const startTime = Date.now();
    const easeInQuad = (t: number) => t * t;
    const getNum = (progress: number) => {
      // the range of factor is (0, 1)
      const factor = easeInQuad(progress / duration);
      return start + (end - start) * factor;
    };
    let clearFlag = false;
    const step = () => {
      if (clearFlag) {
        return;
      } else {
        const timestamp = Date.now();
        const progress = timestamp - startTime;
        during(getNum(progress));
        if (progress < duration) {
          requestAnimationFrame(step);
        } else {
          during(end); // trigger the last step
          if (after) {
            after();
          }
        }
      }
    };
    requestAnimationFrame(step);
    return function clearAnimation() {
      clearFlag = true;
    };
  },
};
function hex(x: string) {
  return ('0' + parseInt(x).toString(16)).slice(-2);
}

export default mommonFuncs;
