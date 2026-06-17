const base64Reg = /data:image[\s\S]*;base64/;
export function isDef(v) {
  return v !== undefined && v !== null;
}
export function isUndef(v) {
  return v === undefined || v === null;
}
export function inArray(arr, v) {
  return arr.indexOf(v) !== -1;
}
export function flatten(arr) {
  return arr.reduce((a, b) => a.concat(b), []);
}
/**
 * @description 限制函数触发频率
 * @param fn 需要限制频率的函数
 * @param interval 每调用一次最小时间间隔，单位 ms
 * */
export function throttle(fn, interval) {
  const __self = fn; // 保存需要被延迟执行的函数引用
  let timer;
  let // 定时器
    firstTime = true; // 是否是第一次调用
  return function doThrottle(...args) {
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
      interval === undefined ? 500 : interval,
    );
  };
}
/**
 * @description 验证字符串是否为base64
 * */
export function isBase64Url(str) {
  return base64Reg.test(str);
}
/**
 * @description 用作过滤掉对绘图不必要的回调，当回调调用频率比fps要大时起作用，比如mousemove
 * @param frameRender 待降频的函数
 * @param eventHandler 可以用来停止冒泡
 * */
export function frameStabilize(frameRender, eventHandler) {
  let isRequested = false;
  return function doFrameStabilize(...args) {
    if (!isRequested) {
      isRequested = true;
      requestAnimationFrame(() => {
        frameRender.bind(this)(...args);
        isRequested = false;
      });
    }
    if (eventHandler && typeof eventHandler === "function") {
      eventHandler.bind(this)(...args);
    }
  };
}
export function removeItem(arr, item) {
  if (arr.length > 0) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}
export function isSame(o1, o2) {
  const keys = Object.keys(o1);
  const keys2 = Object.keys(o2);
  if (keys.length !== keys2.length) {
    return false;
  }
  return Object.keys(o1).every((key) => {
    const v1 = o1[key];
    const v2 = o2[key];
    if (typeof v1 === "number" && typeof v2 === "number") {
      const limit = 0.0001;
      return Math.abs(v1 - v2) <= limit;
    } else {
      return v1 === v2;
    }
  });
}
export function wrapReadOnly(view, fileds) {
  fileds.forEach((filed) => {
    const oldFn = view.prototype[filed];
    if (typeof oldFn !== "function") {
      return;
    }
    view.prototype[filed] = function (...args) {
      if (this.getContext().isReadOnly()) {
        return;
      }
      oldFn.apply(this, args);
    };
  });
}
