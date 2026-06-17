import * as constants from "../common/constants/index";
// @flow
let _browserType;
let _isMobile;
let _passiveSupported;
function browserType() {
  if (_browserType !== undefined) {
    return _browserType;
  }
  const userAgent = navigator.userAgent;
  if ((userAgent.indexOf("Opera") || userAgent.indexOf("OPR")) !== -1) {
    _browserType = constants.BROWSER_TYPE.OPERA;
  } else if (userAgent.indexOf("Edge") !== -1) {
    _browserType = constants.BROWSER_TYPE.EDGE;
  } else if (userAgent.indexOf("Firefox") !== -1) {
    _browserType = constants.BROWSER_TYPE.FIREFOX;
  } else if (userAgent.indexOf("Chrome") !== -1) {
    _browserType = constants.BROWSER_TYPE.CHROME;
  } else if (userAgent.indexOf("Safari") !== -1) {
    _browserType = constants.BROWSER_TYPE.SAFARI;
  } else if (
    userAgent.indexOf("MSIE") !== -1 ||
    !!(document as any).documentMode === true
  ) {
    //IF IE > 10
    _browserType = constants.BROWSER_TYPE.IE;
  } else {
    _browserType = constants.BROWSER_TYPE.UNKNOWN;
  }
  return _browserType;
}
export function browserIsMac() {
  return navigator.userAgent.includes("Mac");
}
function browserIsInWin() {
  return navigator.platform === "Win32";
}
export function browserIsIE() {
  return browserType() === constants.BROWSER_TYPE.IE;
}
export function browserIsEdge() {
  return browserType() === constants.BROWSER_TYPE.EDGE;
}
export function browserIsSafari() {
  return browserType() === constants.BROWSER_TYPE.SAFARI;
}
function browserIsFireFox() {
  return browserType() === constants.BROWSER_TYPE.FIREFOX;
}
export function browserIsWebKit() {
  const ua = navigator.userAgent;
  return ua.includes("WebKit") && !ua.includes("Edge");
}
export function browserIsMobile() {
  if (_isMobile !== undefined) {
    return _isMobile;
  }
  const userAgent = navigator.userAgent.toLowerCase();
  _isMobile =
    userAgent.includes("ipad") ||
    userAgent.includes("android") ||
    userAgent.includes("mobile") ||
    userAgent.includes("phone");
  return _isMobile;
}
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 */
export function browserPassiveSupported() {
  //init
  if (_passiveSupported === undefined) {
    _passiveSupported = false;
    try {
      const options = Object.defineProperty({}, "passive", {
        get: function () {
          _passiveSupported = true;
        },
      });
      const testFn = () => null;
      window.addEventListener("contextmenu", testFn, options);
      window.removeEventListener("contextmenu", testFn);
    } catch {
      // Ignore errors when testing browser compatibility.
    }
  }
  return _passiveSupported;
}
export function isToScaleByWheelEvent(e) {
  return (
    (e.ctrlKey && !browserIsMac()) ||
    ((e.ctrlKey || e.metaKey) && browserIsMac())
  );
}
export function isRedundantEvent(e) {
  // 当mouse事件是由touch事件触发的时候，将会阻止事件监听器的运行
  // 同样，由mouse触发的hammer也不予运行
  return isMouseEventFiredByTouch(e) || isHammerEventFiredByMouse(e);
}
/**
 * @description 判断某个事件是不是鼠标事件
 * @param {jQuery.Event | Hammer.Event} e
 * @return {boolean}
 * */
export function isMouseEvent(e) {
  return e.type.includes("mouse") || e.type === "dblclick";
}
/**
 * @description 判断某个鼠标事件是否是由touch触发的
 * @param {jQuery.Event | Hammer.Event} e
 * @return {boolean}
 * */
export const isMouseEventFiredByTouch = (e) => {
  if (!isMouseEvent(e)) {
    return false;
  }
  /** @type {Event} */
  const nativeEvent = e.originalEvent || e.srcEvent || e;
  // 手指触发的dblclick，没有sourceCapabilities属性
  if (e.type === "dblclick" && !nativeEvent.sourceCapabilities) {
    // 但在mac上的safari浏览器中，鼠标触发的也没有sourceCapabilities属性, same as edge
    const isSafariInMac = browserIsMac() && browserIsSafari();
    const isEdgeInWin = browserIsInWin() && browserIsEdge();
    return !isSafariInMac && !isEdgeInWin && !browserIsFireFox();
  }
  if (
    nativeEvent.sourceCapabilities &&
    nativeEvent.sourceCapabilities.firesTouchEvents
  ) {
    return true;
  }
  return false;
};
/**
 * @description 判断某个事件是不是hammer事件
 * @param {jQuery.Event | Hammer.Event} e
 * */
export function isHammerEvent(e) {
  const hammerEventsList = [
    "tap",
    "doubletap",
    "pinch",
    "pan",
    "press",
    "pressup",
  ];
  return hammerEventsList.includes(e.type) && !!e.srcEvent;
}
/**
 * @description 判断某个hammer事件是否是由Mouse触发的
 * @param {jQuery.Event | Hammer.Event} e
 * @return {boolean}
 * */
export function isHammerEventFiredByMouse(e) {
  if (!isHammerEvent(e)) {
    return false;
  }
  // 直接检查pointerType，由手指触发的话，pointerType为touch
  if (e.pointerType === "mouse") {
    return true;
  }
  return false;
}
export const isSupportPointerEvent = () => "PointerEvent" in window;
