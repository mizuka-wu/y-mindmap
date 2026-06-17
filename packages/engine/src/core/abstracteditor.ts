import { ACTION_STATUS, EVENTS } from '../common/constants/index';
import type { BaseModel } from '../models/base';
import type { Config } from '../common/config';

import backbone from 'backbone';

/**
 * Abstract Editor, parent class of WorkbookEditor and SheetEditor
 * An Editor may contains several Editors
 * @class
 * @extends Backbone.View
 */
export class AbstractEditor<T extends BaseModel = BaseModel> extends backbone.View<T> {
  _parent: AbstractEditor;
  _config: Config;
  static __super__: AbstractEditor;
  /**
   *
   * @param {any} opt
   */
  initialize(args: any) {
    this._parent = args.parent as AbstractEditor;
    this._config = this.model.getConfig();
  }
  /**
   * listen gesture event on view of certian type
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGesture(eventName: string, viewType: string, callback: (e: HammerInput) => void) {
    throw new Error('must be overrided');
  }
  /**
   * stop listening gesture event
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  offGesture(eventName: string, viewType: string, callback: (e: HammerInput) => void) {
    throw new Error('must be overrided');
  }
  /**
   * listen jquery event on view of certain type
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {JQuery.Event} callback.args[0]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onEvent(eventName: string, viewType: string, callback: (e: JQuery.Event) => void) {
    throw new Error('must be overrided');
  }
  /**
   * stop listening JQuery event
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {JQuery.Event} callback.args[0]
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  offEvent(eventName: string, viewType: string, callback: (e: JQuery.Event) => void) {
    throw new Error('must be overrided');
  }
  /**
   * execute action by action name and arguments
   * @abstract
   * @param {string} actionName - value of constant.ACTION_NAME
   * @param {...*} args - arguments to execute action
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execAction(actionName: string, ...args: any[]) {
    throw new Error('must implement execAction function in AbstractEditor');
  }
  /**
   * query status of action
   * @abstract
   * @param {string} actionName - value of constant.ACTION_NAME
   * @param {...*} args - arguments to execute action
   * @returns {symbol} value of constant.ACTION_STATUS
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  queryActionStatus(actionName: string, ...args: any[]) {
    throw new Error('must implement queryActionStatus in AbstractEditor');
  }
  /**
   * indicate whether an action is isActionExecutable
   * @abstract
   * @param {string} actionName - vaule of constant.ACTION_NAME
   * @param {...*} args - arguments to execute action
   * @returns {boolean} true if the action is executable , false if not
   */
  isActionExecutable(actionName: string, ...args: any[]) {
    return (this.queryActionStatus(actionName, ...args) as any) === ACTION_STATUS.NORMAL;
  }
  /**
   * @returns {AbstractEditor[]}
   */
  getChildEditors() {
    throw new Error('must implement getChildrenEditor in AbstractEditor');
  }
  /**
   * override Backbone.View's remove function
   * @override
   */
  remove() {
    if (Array.isArray(this.getChildEditors())) {
      (this.getChildEditors() as any).forEach((item: AbstractEditor) => {
        item.remove();
      });
    }
    this.trigger(EVENTS.BEFORE_EDITOR_REMOVE, this);
    AbstractEditor.__super__.remove.bind(this)();
    this._remove();
    this.trigger(EVENTS.EDITOR_REMOVED, this);
    return this;
  }
  /**
   * get selections
   * @abstract
   * @returns {SVGComponentView[]} return selected views
   */
  getSelections() {
    throw new Error('must implement getSelections in AbstractEditor');
  }
  _remove() {}
  parent(editor?: AbstractEditor) {
    if (editor !== undefined) {
      this._parent = editor;
    } else {
      return this._parent;
    }
  }
  /**
   * config's setter and getter, like JQuery's `attr` method
   * @param args it can be [Object], [string], [key, value]
   */
  config(...args: any[]) {
    if (args.length === 1 && typeof args[0] === 'string') {
      const key = args[0];
      return this._config.get(key);
    } else {
      this._config.set(...args);
    }
  }
  /**
   * get inner view
   * @param {string} id
   * @returns {WorkbookComponentView}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getComponentViewById(id: string) {}
  /**
   * get current active UI status
   * @returns {String[]} - optional value see constant.UI_STATUS
   */
  getActiveUIStatus(): string[] {
    return [];
  }
  getZoomPencentage() {
    throw new Error('must implement it');
  }
  /**
   * get translate and scale
   * @returns {x: Number, y: Number, scaleX: Number, scaleY: Number}
   */
  getTransform() {
    throw new Error('must implement it');
  }
}

export default AbstractEditor;
