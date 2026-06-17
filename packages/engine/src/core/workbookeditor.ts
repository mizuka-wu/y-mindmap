import { ACTION_NAMES, ACTION_STATUS, EVENTS, CONFIG, MODULE_NAME } from '../common/constants/index';
import AbstractEditor from './abstracteditor';
import SheetEditor from './sheeteditor';
import underscore from 'underscore';
import { initWorkbookActions } from '../actions/workbook/index';

import type { Action, MiniMap, WorkbookModel } from '../type.d';

const unProxyEvents = [EVENTS.BEFORE_EDITOR_REMOVE, EVENTS.EDITOR_REMOVED, EVENTS.AFTER_MODIFY_STATUS_CHANGE];
const invertedEvents = underscore.invert(EVENTS);

/**
 * WorkbookEditor work as sheetEditors proxy
 * @class
 * @extends AbstractEditor
 * @param {Object} args - argument of constructor must input
 * @param {HTMLElement} args.el - a DOM the WorkbookEditor will work in
 * @param {WorkbookModel} args.model - an instance of Workbook Model
 * @example let we = new WorkbookEditor({el: el, model: workbookModel);
 */
export class WorkbookEditor extends AbstractEditor<WorkbookModel> {
  scrollContainer: HTMLElement | undefined;
  currentSheetId: string | -1;
  SheetEditorConstructor: typeof SheetEditor = SheetEditor;
  _initViewerStatus: {
    lastSheetIndex?: number;
    geometryStatus?: unknown;
  };
  sheetEditors: Record<string, SheetEditor>;
  _gestureArgs: any[];
  _eventArgs: any[];
  _actions: Record<string, Action>;
  miniMapManager: MiniMapManager;
  eventManager: any;
  initialize({ scrollContainer, initViewerStatus }: { scrollContainer?: HTMLElement; initViewerStatus?: {} }) {
    super.initialize.bind(this)({
      scrollContainer,
    });
    this.scrollContainer = scrollContainer;
    this.currentSheetId = -1;
    this._initViewerStatus = initViewerStatus || {};
    /**
     * @public
     * */
    this.sheetEditors = {};
    this._gestureArgs = []; //cache onGesture's arguments, array of arguemnts
    this._eventArgs = []; //chage onEvent's arguments, array of arguments
    this._actions = initWorkbookActions(this);
    /** @public */
    this.miniMapManager = new MiniMapManager(this);
    this.initListeners();
  }
  /** @private */
  initListeners() {
    this.listenTo(this.model, EVENTS.BEFORE_REMOVE_SHEET_MODEL, this.removeSheet);
    this.listenTo(this.model, 'all', (...args: [string, ...any]) => {
      const eventName = args[0];
      if (eventName in invertedEvents) {
        this.trigger(...args);
      }
    });
    this.listenTo(
      this.model,
      EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE,
      underscore.debounce(() => {
        this.trigger(EVENTS.AFTER_MODIFY_STATUS_CHANGE);
      }, 0)
    );
    this.listenTo(this.model, EVENTS.AFTER_ADD_EXISTING_SHEET, sheetData => {
      // switch to sheet based on `lastSheetIndex`
      // `switchTo` method must be sheet data added
      // `lastSheetIndex` defaults to 0 if unset
      const sheetIndex = this.findSheetIndex(sheetData.id);
      const lastSheetIndex = this._initViewerStatus.lastSheetIndex || 0;
      if (sheetIndex === lastSheetIndex) {
        this.switchTo(lastSheetIndex);
      }
    });
  }
  /**
   * @description check if this workbook is modified
   * @public
   * */
  isWorkBookModified() {
    // just check current sheet editor is enough
    // coz every sheet editor use the same undo manager with workbook editor
    return this.getCurrentSheetEditor().isSheetModified();
  }
  /**
   * @description update modify status base index
   * @public
   * */
  updateBaseUndoIndex() {
    this.getCurrentSheetEditor().updateBaseUndoIndex();
  }
  _remove() {
    this.sheetEditors = {};
  }
  /**
   * listen gesture event on view of certian type
   * @example we.onGesture("tap", "branch", ()=>{we.config(CONFIG.LOGGER).info("on Tap")});
   * @override
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  onGesture(eventName, viewType, callback) {
    this._gestureArgs.push({
      eventName,
      viewType,
      callback,
    });
    const sheetEditor = this.getCurrentSheetEditor();
    sheetEditor.onGesture(eventName, viewType, callback);
  }
  /**
   * stop listening gesture event
   * @override
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  offGesture(eventName, viewType, callback) {
    const sheetEditor = this.getCurrentSheetEditor();
    const compareFn = compareFnCreator(eventName, viewType, callback);
    //_gestureArgs is array of arguments (array of array)
    this._gestureArgs = this._gestureArgs.filter(args => {
      if (compareFn && compareFn(args)) {
        sheetEditor.offGesture(args.eventName, args.viewType, args.callback);
        return false;
      }
      return true;
    });
  }
  /**
   * listen jquery event on view of certain type
   * @override
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {jQuery.Event} callback.args[0]
   */
  onEvent(eventName, viewType, callback) {
    this._eventArgs.push({
      eventName,
      viewType,
      callback,
    });
    const sheetEditor = this.getCurrentSheetEditor();
    sheetEditor.onEvent(eventName, viewType, callback);
  }
  /**
   * stop listening JQuery event
   * @override
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {jQuery.Event} callback.args[0]
   */
  offEvent(eventName, viewType, callback) {
    const sheetEditor = this.getCurrentSheetEditor();
    const compareFn = compareFnCreator(eventName, viewType, callback);
    //_gestureArgs is array of arguments (array of array)
    this._eventArgs = this._eventArgs.filter(args => {
      if (compareFn && compareFn(args)) {
        sheetEditor.offEvent(args.eventName, args.viewType, args.callback);
        return false;
      }
      return true;
    });
  }
  /**
   * remove a sheetEditor by sheetId, and show a nearest index sheetEditor automaticaly
   * this function may be called when run `workbookModel.removeSheet()`
   * @param {string} sheetId
   */
  removeSheet(sheetId: string) {
    const sheetEditor = this.sheetEditors[sheetId];
    if (!sheetEditor) {
      return;
    }
    sheetEditor.remove();
    this.stopListening(sheetEditor);
    delete this.sheetEditors[sheetId];
    let nearestDistance = Number.MAX_VALUE;
    let nearestIndex = -1;
    const sheetIndex = this.findSheetIndex(sheetId);
    this.model.sheets.forEach((item, index) => {
      if (index === sheetIndex) {
        return;
      }
      const distance = Math.abs(index - sheetIndex);
      if (distance < nearestDistance || (distance === nearestDistance && index > sheetIndex)) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    this.switchTo(nearestIndex);
  }
  switchTo(index: number) {
    let isInit = false;
    if (!this.model.sheets[index]) {
      this.config(CONFIG.LOGGER).warn('try to switch to an inexistent sheet');
      // defaults to index 0 if index of sheet lost
      index = 0;
      // still not found with index 0
      if (!this.model.sheets[index]) {
        return;
      }
    }
    const sheetId = this.model.findSheetId(index);
    if (this.currentSheetId === sheetId) {
      return;
    }
    const lastSheetIndex = this.findSheetIndex(this.currentSheetId);
    this.trigger(EVENTS.BEFORE_SWITCH_SHEET, index);
    const preSheetEditor = this.getCurrentSheetEditor();
    if (preSheetEditor) {
      stopListeningSheetEditor.call(this, preSheetEditor);
    }
    const { sheetEditors } = this;
    let sheetEditor = sheetEditors[sheetId];
    if (!sheetEditor) {
      this.trigger(EVENTS.BEFORE_CREATE_SHEET_EDITOR);
      sheetEditor = this.initSheetEditor(index) as SheetEditor;
      this.trigger(EVENTS.SHEET_EDITOR_CREATED, sheetEditor);
      isInit = true;
    }
    listenSheetEditor.call(this, sheetEditor);
    underscore.each(sheetEditors, item => {
      if (item === sheetEditor) {
        this.showSheetEditor(item, isInit);
      } else {
        this.hideSheetEditor(item);
      }
    });
    this.currentSheetId = sheetId;
    this.trigger(EVENTS.SHEET_SWITCHED);
    /**
     * @link https://gitlab.xmind.cn/xmind/snowbrush/issues/341
     * @desc only if undo manager has pre action group, switchTo would be append to undo stack
     * */
    if (lastSheetIndex !== -1 && this.model.getUndo().getLastGroup()) {
      this.model.getUndo().append({
        undo: () => this.switchTo(lastSheetIndex),
        redo: () => this.switchTo(index),
      });
    }
  }
  /**
   * force initialize a SheetEditor
   * @param {number} index - index in workbook-json's sheets
   */
  initSheetEditor(index: number) {
    if (!this.model.sheets[index]) {
      this.config(CONFIG.LOGGER).warn('try to initialize an inexistent sheet');
      return;
    }
    const sheetId = this.model.findSheetId(index);
    if (!this.sheetEditors[sheetId]) {
      const sheetEl = document.createElement('div');
      sheetEl.classList.add('workbook-item');
      sheetEl.style.width = '100%';
      sheetEl.style.height = '100%';
      sheetEl.style.position = 'absolute';
      this.$el.append(sheetEl);
      const sheetEditor = new this.SheetEditorConstructor({
        el: sheetEl,
        model: this.model.sheets[index],
        scrollContainer: this.scrollContainer,
        parent: this,
        eventManager: this.eventManager,
        initSheetGeometryStatus:
          this._initViewerStatus.geometryStatus && this._initViewerStatus.geometryStatus[sheetId],
      });
      this.sheetEditors[sheetId] = sheetEditor;
      sheetEditor._config.parent(this._config);
      sheetEditor.initInnerView();
      this.hideSheetEditor(sheetEditor); //hide SheetEditor by default;
      return sheetEditor;
    }
  }
  /**
   * initialize all SheetEditors whose model is ready
   */
  initAllSheetEditor() {
    this.model.sheets.forEach((item, index) => {
      this.initSheetEditor(index);
    });
  }
  hideSheetEditor(sheetEditor: SheetEditor) {
    // sheetEditor.el.style.visibility = 'hidden';
    sheetEditor.el.style.display = 'none';
  }
  // todo 这个是干嘛用的
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSheetEditor(sheetEditor: SheetEditor, isInit?: boolean) {
    // sheetEditor.el.style.visibility = 'visible';
    sheetEditor.el.style.display = 'block';
    // !isInit && sheetEditor.getSVGView().getCanvasControl().resetScrollContainerArea()
  }
  /**
   * find sheet index in workbook by sheet ID
   * @param sheetId ID of sheet
   */
  findSheetIndex(sheetId: string) {
    return this.model.findSheetIndex(sheetId);
  }
  /**
   *
   */
  getCurrentSheetEditor() {
    return this.sheetEditors[this.currentSheetId];
  }
  /**
   * @param {string} id - id of sheet
   */
  getSheetEditorById(id: string) {
    return this.sheetEditors[id];
  }
  execAction(actionName, args) {
    const curSheetEditor = this.getCurrentSheetEditor();
    let action = curSheetEditor && curSheetEditor.findOwnAction(actionName);
    if (!action) {
      action = this.findOwnAction(actionName);
    }
    if (action && action.queryStatus(args) === ACTION_STATUS.NORMAL) {
      return action.execute(args);
    }
  }
  /**
   * @returns {typeof ACTION_STATUS.NORMAL|typeof ACTION_STATUS.DISABLE}
   * @public
   */
  queryActionStatus(
    actionName: (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES],
    args: unknown
  ): typeof ACTION_STATUS.NORMAL | typeof ACTION_STATUS.DISABLE {
    const curSheetEditor = this.getCurrentSheetEditor();
    let action = curSheetEditor && curSheetEditor.findOwnAction(actionName);
    if (!action) {
      action = this.findOwnAction(actionName);
    }
    if (action) {
      return action.queryStatus(args);
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  findOwnAction(actionName: (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES]) {
    return this._actions[actionName];
  }
  /**
   * get child editors
   * @returns {SheetEditor[]}
   */
  getChildEditors() {
    const result: SheetEditor[] = [];
    (this.model.get('sheets') || []).forEach(item => {
      const sheetEditor = this.sheetEditors[item.id];
      if (sheetEditor) {
        result.push(sheetEditor);
      }
    });
    return result;
  }
  /**
   * override AbstractEditor, return current SheetEditor's selections
   * @override
   * @returns {WorkbookComponentView[]} return selected views
   */
  getSelections() {
    let _a;
    return ((_a = this.getCurrentSheetEditor()) === null || _a === undefined ? undefined : _a.getSelections()) ?? [];
  }
  /**
   * get inner view, CAN NOT auto switch to uninitialized sheetEditor
   * @param {string} id
   * @returns {WorkbookComponentView}
   */
  getComponentViewById(id: string) {
    let view;
    underscore.values(this.sheetEditors).some(sheetEditor => {
      return (view = sheetEditor.getComponentViewById(id));
    });
    return view;
  }
  /**
   * get current active UI status
   * @returns {String[]} - optional value see constant.UI_STATUS
   */
  getActiveUIStatus() {
    let _a;
    return (
      ((_a = this.getCurrentSheetEditor()) === null || _a === undefined ? undefined : _a.getActiveUIStatus()) ?? []
    );
  }
  getZoomPencentage() {
    let _a;
    return (
      ((_a = this.getCurrentSheetEditor()) === null || _a === undefined ? undefined : _a.getZoomPencentage()) ?? 100
    );
  }
  /**
   * get translate and scale
   * @returns {x: Number, y: Number, scaleX: Number, scaleY: Number}
   */
  getTransform() {
    const currentSheetEditor = this.getCurrentSheetEditor();
    if (!currentSheetEditor)
      return {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
      };
    return currentSheetEditor.getTransform();
  }
  getViewerStatus() {
    const geometryStatus = {};
    for (const sheetEditorId in this.sheetEditors) {
      const sheetEditor = this.getSheetEditorById(sheetEditorId);
      geometryStatus[sheetEditorId] = sheetEditor.getSheetGeometryStatus();
    }
    return {
      geometryStatus,
      lastSheetIndex: this.findSheetIndex(this.currentSheetId),
    };
  }
}
function compareFnCreator(eventName, viewType, callback) {
  if (!viewType) {
    return args => eventName === args.eventName;
  } else if (!callback) {
    return args => eventName === args.eventName && viewType === args.viewType;
  } else if (eventName && viewType && callback) {
    return args => eventName === args.eventName && viewType === args.viewType && callback === args.callback;
  }
}
function listenSheetEditor(this: WorkbookEditor, sheetEditor: SheetEditor) {
  this.listenTo(
    sheetEditor,
    'all',
    (...args: ['beforeEditorRemove' | 'editorRemoved' | 'afterModifyStatusChange', ...unknown[]]) => {
      const eventName = args[0];
      if (unProxyEvents.indexOf(eventName) === -1) {
        this.trigger(...args);
      }
    }
  );
  this._gestureArgs.forEach(args => {
    sheetEditor.onGesture(args.eventName, args.viewType, args.callback);
  });
  this._eventArgs.forEach(args => {
    sheetEditor.onEvent(args.eventName, args.viewType, args.callback);
  });
}
function stopListeningSheetEditor(this: WorkbookEditor, sheetEditor: SheetEditor) {
  this.stopListening(sheetEditor);
  this._gestureArgs.forEach(args => {
    sheetEditor.offGesture(args.eventName, args.viewType, args.callback);
  });
  this._eventArgs.forEach(args => {
    sheetEditor.offEvent(args.eventName, args.viewType, args.callback);
  });
}
class MiniMapManager {
  _workbookEditor: WorkbookEditor;
  _show: boolean;
  constructor(workbookEditor: WorkbookEditor) {
    /**
     * @type {WorkbookEditor}
     * @private
     * */
    this._workbookEditor = workbookEditor;
    /** @private */
    this._show = false;
    this._initEventListener();
  }
  /**
   * @private
   * */
  _initEventListener() {
    this._workbookEditor.on(EVENTS.SHEET_SWITCHED, () => {
      this.setMiniMapDisplay(this._show);
    });
  }
  /**
   * @return {Array.<SheetEditor>}
   * @private
   * */
  _getSheetEditorList() {
    return Object.keys(this._workbookEditor.sheetEditors).map(id => this._workbookEditor.sheetEditors[id]);
  }
  /**
   * @param {boolean} show
   * @public
   * */
  setMiniMapDisplay(show: boolean) {
    this._getSheetEditorList().forEach(sheetEditor => {
      sheetEditor.execAction(ACTION_NAMES.SET_MINI_MAP_DISPLAY, {
        show: false,
        prue: true,
      });
    });
    if (show) {
      const currentSheetEditor = this._workbookEditor.getCurrentSheetEditor();
      /** @type {MiniMapManageProcess} */
      const currentMiniMapModule = currentSheetEditor.getModule<MiniMap>(MODULE_NAME.MINI_MAP);
      if (currentMiniMapModule) {
        currentMiniMapModule.setMiniMapDisplay(currentSheetEditor, true);
      }
      if (currentMiniMapModule) {
        currentMiniMapModule.resetMiniMapUse();
      }
    }
    this._show = show;
  }
}

export default WorkbookEditor;
