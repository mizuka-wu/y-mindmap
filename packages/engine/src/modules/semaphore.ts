import underscroe from 'underscore';
import { CONFIG, UI_STATUS, EVENTS, MODULE_NAME } from '../common/constants/index';
import config from '../common/config';

import { UiStatusManager } from './uistatusmanager';
import type { SheetEditor } from '../type.d';

/**
 * @fileOverview 信号量维护系统
 * */
export class Semphore {
  _semaphoreMap: Record<(typeof UI_STATUS)[keyof typeof UI_STATUS], number>;
  _context: SheetEditor;
  static identifier: string;
  constructor(context: SheetEditor) {
    /**
     * @description 信号量状态map
     * @private
     * */
    this._semaphoreMap = {} as Record<(typeof UI_STATUS)[keyof typeof UI_STATUS], number>;
    this._context = context;
    Object.keys(UI_STATUS).forEach(item => {
      const key = UI_STATUS[item as keyof typeof UI_STATUS];
      this._semaphoreMap[key] = 0;
    });
  }
  /**
   * @param {string} uiStatus
   * @public
   * */
  increase(uiStatus: (typeof UI_STATUS)[keyof typeof UI_STATUS], { forceFlush }: { forceFlush?: boolean } = {}) {
    if (!uiStatus) {
      config.get(CONFIG.LOGGER).error('需要传入uiStatus参数！');
    }
    const count = this._semaphoreMap[uiStatus];
    this._semaphoreMap[uiStatus] = count + 1;
    if (count === 0) {
      this._context.trigger(EVENTS.AFTER_UI_STATUS_ACTIVATE, uiStatus);
      const payload = {
        content: JSON.parse(JSON.stringify(this._semaphoreMap)),
        forceFlush,
      };
      this._context
        .getModule<UiStatusManager>(MODULE_NAME.UI_STATUS)
        .commit(UiStatusManager._mutations.semaphoreChange, payload);
    }
  }
  /**
   * @param {string} uiStatus
   * @public
   * */
  decrease(uiStatus: (typeof UI_STATUS)[keyof typeof UI_STATUS], { forceFlush }: { forceFlush?: boolean } = {}) {
    if (!uiStatus) {
      config.get(CONFIG.LOGGER).error('需要传入uiStatus参数！');
    }
    const count = this._semaphoreMap[uiStatus];
    this._semaphoreMap[uiStatus] = count - 1;
    // 若decrease后刚好降至0
    if (count - 1 === 0) {
      this._context.trigger(EVENTS.AFTER_UI_STATUS_DEACTIVATE, uiStatus);
      const payload = {
        content: JSON.parse(JSON.stringify(this._semaphoreMap)),
        forceFlush,
      };
      this._context
        .getModule<UiStatusManager>(MODULE_NAME.UI_STATUS)
        .commit(UiStatusManager._mutations.semaphoreChange, payload);
    }
    // 若小于0呢？这里先选择依然让其过关，但值最小只能是0
    if (count - 1 < 0) {
      this._semaphoreMap[uiStatus] = 0;
    }
  }
  /**
   * @description 获取当前正处于激活状态的uiStatus列表
   * @return {Array.<string>}
   * @public
   * */
  getActiveUIStatus() {
    return Object.keys(this._semaphoreMap).filter(
      (item: (typeof UI_STATUS)[keyof typeof UI_STATUS]) => this._semaphoreMap[item] !== 0
    );
  }
  /**
   * @log
   */
  _log_semaphore() {
    return JSON.stringify(this._semaphoreMap);
  }
  /**
   * @param {string} uiStatus
   * @return {boolean}
   * @public
   * */
  isStatusActive(uiStatus: (typeof UI_STATUS)[keyof typeof UI_STATUS]) {
    return this._semaphoreMap[uiStatus] > 0;
  }
  /**
   * Once status of application is not in indicated status arrary, call the callback function
   * @param {String[]} appStatusArr Array of UI_STATUS's values
   * @param {Function} fn callback
   * @public
   */
  onceNotInStatus(appStatusArr: (typeof UI_STATUS)[keyof typeof UI_STATUS][], fn: () => void) {
    if (appStatusArr.length === 0 || appStatusArr.every(item => this._semaphoreMap[item] === 0)) {
      fn();
      return;
    }
    // const callback = (nowArr, beforeArr) => {
    const callback = () => {
      if (underscroe.intersection(appStatusArr, this.getActiveUIStatus()).length === 0) {
        fn();
        this._context.off(EVENTS.AFTER_UI_STATUS_DEACTIVATE, callback);
      }
    };
    this._context.on(EVENTS.AFTER_UI_STATUS_DEACTIVATE, callback);
  }
}
Semphore.identifier = MODULE_NAME.SEMAPHORE;

export default Semphore;
