/* eslint-disable @typescript-eslint/no-unused-vars */
import process from 'process';

import jquery from 'jquery';
import underscore from 'underscore';

import hammer from 'hammerjs';

import * as utils from '../utils/index';
import domUiEventHandlers from '../uieventhandlers/dom/index';
import * as uieventUtils from './utils';
import { VIEW_TYPE, PLATFORMS } from '../common/constants/index';

const pointerEventNameList = ['pointerdown'];
const pointerEventFallBackMap = {
  pointerover: {
    mouse: 'mouseover',
  },
  pointerenter: {
    mouse: 'mouseenter',
  },
  pointerleave: {
    mouse: 'mouseleave',
  },
  pointerdown: {
    mouse: 'mousedown',
    touch: 'tap',
  },
  pointermove: {
    mouse: 'mousemove',
    touch: 'touchmove',
  },
  pointerup: {
    mouse: 'mouseup',
    touch: 'touchend',
  },
} as const;
const generatePointerEventHandlerWrapper = (pointerType: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (callback: Function) => (e: Event) => {
    Reflect.set(e, 'pointerType', pointerType);
    callback(e);
  };
};

type ISelectors = (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE];

// const delegateEventSplitter = /^(\S+)\s*(.*)$/
// const VIEW_REGEXP = /^[^\[\.\#]/   // not begin with [ . #
// Abstract class
class EventEntity {
  on(eventName: string, handler: (e: Event) => void) {}
  off(eventName: string, handler: (e: Event) => void) {}
  // empty arr means entity can handle all  defautl events
  getEventList(): string[] {
    return [];
  }
}
class JQueryEntity extends EventEntity {
  entity: JQuery<HTMLElement>;
  constructor(el: HTMLElement) {
    super();
    this.entity = jquery(el);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventName: string, handler: (e: any) => void) {
    this.entity.on(eventName, handler);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(eventName: string, handler: (e: any) => void) {
    this.entity.off(eventName, handler);
  }
}
class HammerEntity extends EventEntity {
  list: string[];
  entity: HammerManager;
  constructor(el: HTMLElement) {
    super();
    this.list = ['tap', 'doubletap', 'pan', 'press', 'pressup', 'pinch', 'pinchstart', 'pinchmove', 'pinchend'];
    this.entity = new hammer.Manager(el, {
      touchAction: 'manipulation',
    });
    const Tap = new hammer.Tap({
      taps: 1,
    });
    const DoubleTap = new hammer.Tap({
      event: 'doubletap',
      taps: 2,
      interval: 500,
      posThreshold: 20,
    });
    const Pinch = new hammer.Pinch();
    const Pan = new hammer.Pan({
      pointers: 0,
    });
    const Press = new hammer.Press();
    DoubleTap.recognizeWith([Tap]);
    Pinch.recognizeWith([Pan]);
    this.entity.add(Pan);
    this.entity.add(Pinch);
    this.entity.add(DoubleTap);
    this.entity.add(Tap);
    this.entity.add(Press);
  }
  on(eventName: string, handler: (e: Event) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.entity.on(eventName, handler as unknown as any);
  }
  off(eventName: string, handler: (e: Event) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.entity.off(eventName, handler as unknown as any);
  }
  getEventList() {
    return this.list;
  }
}
class PointerEventEntity extends JQueryEntity {
  getEventList() {
    return pointerEventNameList as unknown as string[];
  }
}
class Events {
  dataMap: Record<string, Record<ISelectors, ((e: Event) => void)[]>>;
  constructor() {
    this.dataMap = {};
  }
  on(eventName: string, selector: ISelectors, handler) {
    const v = this.dataMap;
    v[eventName] = v[eventName] || {};
    v[eventName][selector] = v[eventName][selector] || [];
    // may use unshift to change the order of handlers
    v[eventName][selector].push(handler);
  }
  off(eventName, selector, handler) {
    const v = this.dataMap;
    if (Object(utils.isUndef)(selector)) {
      v[eventName] = {};
    } else {
      const s = v[eventName];
      if (Object(utils.isUndef)(handler)) {
        s[selector] = [];
      } else {
        Object(utils.removeItem)(s[selector], handler);
      }
      // delete extra key for easy testing of this.hasHandlers(e)
      if (s[selector].length === 0) {
        delete s[selector];
      }
    }
  }
  _getHandlers(eventName, selectors) {
    const selectorMap = this.dataMap[eventName];
    const handlers = selectors.map(s => selectorMap[s] || []);
    return Object(utils.flatten)(handlers);
  }
  // context for call, may remove in future
  dispatch(e, selectors, context) {
    const eventName = e.type;
    const handlers = this._getHandlers(eventName, selectors);
    handlers.some(handler => {
      const result = handler.call(context, e);
      if (result === false) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (e.isPropagationImmediateStoped()) {
        e.stopPropagation();
        return true;
      }
    });
    return e.isPropagationStopped();
  }
  // check is there any handlers on eventName
  hasHandlers(eventName) {
    const selectorMap = this.dataMap[eventName];
    return Object(utils.isDef)(selectorMap) && Object.keys(selectorMap).length !== 0;
  }
}
export class UiEventsManager {
  eventMap: Record<string, EventEntity>;
  entityMap: Record<string, EventEntity>;
  _defaultEntity: EventEntity | null = null;
  events: Events;
  el: HTMLElement;
  platform: string | undefined = undefined;
  constructor({ el, platform }: { el: HTMLElement; platform?: string }) {
    // 正在绑定(value === entity) 或者 需要绑定(value === undefined) 的事件
    this.eventMap = {}; // key: eventName, value: entity
    // 可以绑定的事件
    this.entityMap = {}; // key: eventName, value: entity
    this._defaultEntity = null;
    // this.events = new Events(this);
    this.events = new Events();
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.dispatch = this.dispatch.bind(this);
    this.el = el;
    this.platform = platform;
    this._addDefaultEntities();
    this._initUIEvents();
  }
  _addDefaultEntities() {
    const hammerEntity = new HammerEntity(this.el);
    const jQueryEntity = new JQueryEntity(this.el);
    this.addEntity(hammerEntity);
    this.addEntity(jQueryEntity);
    this.addEntity(new PointerEventEntity(this.el));
  }
  _initUIEvents() {
    domUiEventHandlers.forEach(handler => {
      uieventUtils.registerEvents(this, handler.events, handler.viewType, handler.eventHandlers);
    });
  }
  // replace eventMap[eventName] with newEntity
  _updateEventMap(eventName: string, newEntity: EventEntity) {
    const oldEntity = this.eventMap[eventName];
    if (this.events.hasHandlers(eventName)) {
      if (oldEntity === newEntity) {
        return;
      }
      // replace entity
      this.eventMap[eventName] = newEntity;
      if (Object(utils.isDef)(oldEntity)) {
        oldEntity.off(eventName, this.dispatch);
      }
      if (Object(utils.isDef)(newEntity)) {
        // 先调用 off 避免重复绑定事件，
        // 也许可以去掉，因为已经有 oldEntity === newEntity 的判断了
        newEntity.off(eventName, this.dispatch);
        newEntity.on(eventName, this.dispatch);
      }
    } else {
      // off eventName from eventMap
      if (Object(utils.isDef)(oldEntity)) {
        oldEntity.off(eventName, this.dispatch);
      }
      delete this.eventMap[eventName];
    }
  }
  addEntity(entity: EventEntity) {
    const eventList = entity.getEventList();
    // empty eventList means entity can handle all  defautl events
    if (eventList.length === 0) {
      // 注册 entity
      const oldEntity = this._defaultEntity;
      this._defaultEntity = entity;
      const filterFn = k => this.eventMap[k] === oldEntity;
      const events = Object.keys(this.eventMap).filter(filterFn);
      events.forEach(eventName => this._updateEventMap(eventName, entity));
    } else {
      eventList.forEach(eventName => {
        // 注册 entity
        this.entityMap[eventName] = entity;
        this._updateEventMap(eventName, entity);
      });
    }
  }
  // 获取合适的 entity 用于绑定事件
  _getEntity(eventName: string) {
    if (Object(utils.isDef)(this.entityMap[eventName])) {
      return this.entityMap[eventName];
    } else {
      return this._defaultEntity;
    }
  }
  _updateEvent(eventName: string) {
    const entity = this._getEntity(eventName);
    this._updateEventMap(eventName, entity);
  }
  _handlePointerEventFallBack(eventName, selector, handler, onOrOff) {
    const mouseEventName = pointerEventFallBackMap[eventName].mouse;
    const touchEventName = pointerEventFallBackMap[eventName].touch;
    const methodName = onOrOff ? 'on' : 'off';
    this.events[methodName](mouseEventName, selector, generatePointerEventHandlerWrapper('mouse')(handler));
    this._updateEvent(mouseEventName);
    if (touchEventName) {
      this.events[methodName](touchEventName, selector, generatePointerEventHandlerWrapper('touch')(handler));
      this._updateEvent(touchEventName);
    }
  }
  on(eventName: string, selector: ISelectors, handler) {
    if (pointerEventNameList.includes(eventName) && !Object(utils.isSupportPointerEvent)()) {
      this._handlePointerEventFallBack(eventName, selector, handler, true);
    } else {
      this.events.on(eventName, selector, handler);
      this._updateEvent(eventName);
    }
    return () => this.off(eventName, selector, handler);
  }
  off(eventName, selector, handler) {
    if (pointerEventNameList.includes(eventName) && !Object(utils.isSupportPointerEvent)()) {
      this._handlePointerEventFallBack(eventName, selector, handler, false);
    } else {
      this.events.off(eventName, selector, handler);
      this._updateEvent(eventName);
    }
  }
  doRedundantPreventDefault(e, view) {
    const redundantPreventDefaultMap = {
      [VIEW_TYPE.BRANCH]: ['mousedown'],
      [VIEW_TYPE.TOPIC]: ['mousedown'],
      [VIEW_TYPE.BOUNDARY]: ['mousedown'],
      [VIEW_TYPE.RELATIONSHIP]: ['mousedown'],
      [VIEW_TYPE.SVG]: ['mousedown'],
    };
    if (redundantPreventDefaultMap[view.type] && redundantPreventDefaultMap[view.type].includes(e.type)) {
      e.preventDefault();
    }
  }
  _shouldPreventDefault(e) {
    if (this.platform === PLATFORMS.BROWNIE) {
      // 由于无法通过 userAgent 正确辨别该平台, 故在此提前进行判断
      return false;
    } else {
      return Object(utils.isRedundantEvent)(e);
    }
  }
  dispatch(e) {
    const rootElem = e.currentTarget;
    let curElem = getEventTarget(e, rootElem);
    const isViewDOM = elem =>
      Object(utils.isDef)(elem.sbView) && (!elem.sbView.figure || !elem.sbView.figure.isDisposed());
    while (curElem && curElem !== rootElem) {
      if (!isViewDOM(curElem)) {
        curElem = curElem.parentNode;
      } else if (this._shouldPreventDefault(e)) {
        return this.doRedundantPreventDefault(e, curElem.sbView);
      } else {
        const view = curElem.sbView;
        const selectors = view.getTypeList();
        // change attributes of e for dispatching handlers
        e.currentTarget = curElem;
        e.sbView = view;
        if (process.env.SELECT_BOX === 'skip') {
          if (!curElem.getAttribute('data-immunity')) {
            curElem = view.getNextEventTarget(curElem);
            continue;
          }
        }
        const isPropagationStopped = this.events.dispatch(SBEventCreator(e), selectors, view);
        if (isPropagationStopped) {
          break;
        }
        // view can change the nextElem by overwrite *getNextEventTarget*
        // e.g., CellView
        curElem = view.getNextEventTarget(curElem);
      }
    }
  }
} // =============== helpers ===============
// for multi touch
const getEventTarget = (e, root) => {
  const getPath = (el, root) => {
    const path: any[] = [];
    while (el && el !== root) {
      path.unshift(el);
      el = el.parentNode;
    }
    if (el) {
      path.unshift(el);
    }
    return path;
  };
  const transMatrix = paths => {
    const minLength = paths
      .map(path => {
        return path.length;
      })
      .reduce((a, b) => {
        return Math.min(a, b);
      }, Infinity);
    const result: any[] = [];
    for (let i = 0; i < minLength; i++) {
      result[i] = [];
      for (let j = 0; j < paths.length; j++) {
        result[i][j] = paths[j][i];
      }
    }
    return result;
  };
  const getLCA = paths => {
    let result = null;
    const matrix = transMatrix(paths);
    for (let i = 0; i < matrix.length; i++) {
      const curEl = matrix[i][0];
      const isSame = matrix[i].every(el => {
        return el === curEl;
      });
      if (isSame) {
        result = curEl;
      } else {
        return result;
      }
    }
    return result;
  };
  if (!e.pointers || e.pointers.length <= 1) {
    return e.target;
  }
  const paths = e.pointers.map(pointer => {
    return getPath(pointer.target, root);
  });
  return getLCA(paths);
};
// =============== function about event obj ===============
const eventPrototype = {
  isPropagationStopped() {
    return false;
  },
  isDefaultPrevented() {
    return false;
  },
  isPropagationImmediateStoped() {
    return false;
  },
  stopPropagation() {
    this.isPropagationStopped = () => {
      return true;
    };
    // const e = this.srcEvent || this.originalEvent
    //e && e.stopPropagation()
  },
  preventDefault() {
    this.isDefaultPrevented = () => {
      return true;
    };
    const e = this.srcEvent || this.originalEvent;
    if (e) {
      e.preventDefault();
    }
  },
  stopImmediatePropagation() {
    this.isPropagationImmediateStoped = () => {
      return true;
    };
  },
};
/**
 * @param {JQuery.Event|Hammer.Event} event
 * Ray: can not use Object.assigin in JQuery.Event
 */
const SBEventCreator = event => underscore.extend({}, event, eventPrototype);

export default UiEventsManager;
