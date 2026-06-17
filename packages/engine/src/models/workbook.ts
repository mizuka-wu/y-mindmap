import { COMPONENT_TYPE, EVENTS, CONFIG, PLATFORMS, MODULE_NAME } from '../common/constants/index';

import { Config } from '../common/config';

import { UndoManager } from '../common/undo';

import BaseModel from './base';

import SheetModel from './sheet';

import { getInjectModule } from '../utils/index';

import type { SheetData } from './sheet';
import type { ThemeData } from '../type.d';

interface SheetResponse {
  id: string;
  title: string;
}

export type WorkbookData = {
  title?: string;
  sheetOrder: string[];
  sheets: SheetResponse[];
};

/**
 * Model of workbook data, data format see [workbook demo](https://bitbucket.org/xmindltd/snowbrush-js/src/36d08b0829fe58b6b24078a41e11b48277e9eed3/test/exampledata/workbook?at=kernel&fileviewer=file-view-default)
 * Workbook Format:{
 *   id: String,
 *   title: String,
 *   sheets: [{
 *     id: String,
 *     title: String,
 *   }],
 *   sheetOrder: [String...]
 * }
 * sheetOrder's length may is different with sheets'length
 * @class
 * @extends Backbone.Model
 */
export class WorkbookModel extends BaseModel<WorkbookData> {
  sheets: SheetModel[];
  _config: Config;
  _undoManager: UndoManager;
  get componentType() {
    return COMPONENT_TYPE.WORKBOOK;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: any, options: any) {
    super(attrs, options);
    this.sheets = [];
    this._config = new Config();
    this._undoManager = new UndoManager();
    this._undoManager.setStackLimitedLength(Infinity);
    this._undoManager.on(EVENTS.UNDO_STATE_CHANGE, (event: { canUndo: boolean; canRedo: boolean }) =>
      this.trigger(EVENTS.UNDO_STATE_CHANGE, event)
    );
    this._repairData();
  }
  _repairData() {
    let sheetOrder: string[] = this.get('sheetOrder') || [];
    const sheets: SheetResponse[] = this.get('sheets') || [];
    //sheetOrder has and sheets has not
    sheetOrder = sheetOrder.filter(sheetId => sheets.findIndex(item => item.id === sheetId) !== -1);
    //sheets has and sheetOrder has not
    sheets.forEach(sheetItem => {
      if (sheetOrder.findIndex(sheetId => sheetId === sheetItem.id) === -1) {
        sheetOrder.push(sheetItem.id);
      }
    });
    //make sheets' order always follow sheetOrder
    const newSheets: SheetResponse[] = [];
    sheetOrder.forEach(sheetId => {
      newSheets.push(sheets.find(item => item.id === sheetId) as SheetResponse);
    });
    this.set('sheetOrder', sheetOrder);
    this.set('sheets', newSheets);
  }
  /**
   * mount a sheet existed in workbook or create metadata and insert it
   * @param {string} id - id of sheet
   * @param {Object} sheetData - sheet json data
   * @param {Object} [options] - write to sheet meta data
   * @param {string} [options.title] - sheet title
   * @param {string} [options.at] - sheet index at sheets of workbook
   * @returns {SheetModel}
   */
  addSheet(id: string, sheetData: SheetData, options: Partial<{ title: string; at: number }> = {}) {
    let _a;
    let _b;
    let _c;
    const sheetIndex = this.findSheetIndex(id);
    if (this.sheets[sheetIndex]) {
      if ((_a = this.getConfig()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.get(CONFIG.LOGGER).info(sheetIndex, id);
      }
      if ((_b = this.getConfig()) === null || _b === undefined) {
        // do nothing
      } else {
        _b.get(CONFIG.LOGGER).warn('try to add to existing sheet');
      }
    }
    const shouldUseDividedUndo =
      ((_c = this.getConfig()) === null || _c === undefined ? undefined : _c.get(CONFIG.PLATFORM)) ===
      PLATFORMS.DOUGHNUT;
    const sheetModel = new SheetModel(sheetData, {
      undo: shouldUseDividedUndo ? null : this._undoManager,
    });
    if (sheetIndex === -1) {
      // insert an new Sheet
      this._addNewSheet({
        sheetModel: sheetModel,
        id: id,
        title: isNull(options.title) ? this.getNextSheetTitle() : options.title,
        at: isNull(options.at) ? (this.get('sheets') as SheetResponse[]).length : options.at,
      });
    } else {
      this._listenSheetModel(sheetModel);
      this.sheets[sheetIndex] = sheetModel;
      this.trigger(EVENTS.AFTER_ADD_EXISTING_SHEET, sheetData);
    }
    return sheetModel;
  }
  /**
   *
   * @param {Object} info
   * @param {SheetModel} info.sheetModel
   * @param {Number} info.at - sheet index
   * @param {String} info.id - sheetId
   * @param {title} info.title - sheet title
   */
  _addNewSheet(info: { sheetModel: SheetModel; at: number; id: string; title: string }) {
    let _a;
    const { sheetModel, at, id, title } = info;
    const sheetData = sheetModel && sheetModel.toJSON();
    this._listenSheetModel(sheetModel);
    this.trigger(EVENTS.BEFORE_ADD_NEW_SHEET, sheetData, info);
    this.sheets.splice(at, 0, sheetModel);
    (this.get('sheets') as SheetResponse[]).splice(at, 0, {
      id,
      title,
    });
    (this.get('sheetOrder') || []).splice(at, 0, id);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => this.removeSheet(info.id),
          redo: () => this._addNewSheet(info),
        },
        'addSheet'
      );
    }
    this.trigger(EVENTS.AFTER_ADD_NEW_SHEET, sheetData, info);
    this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
  }
  _listenSheetModel(sheet: SheetModel) {
    if (!sheet) {
      return;
    }
    this.listenTo(sheet, EVENTS.AFTER_SHEET_CONTENT_CHANGE, () => {
      this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
    });
  }
  getNextSheetTitle() {
    return 'Sheet ' + ((this.get('sheets') as SheetResponse[]).length + 1);
  }
  /**
   * @description 删除sheet
   * @param {string} sheetId
   * */
  removeSheet(sheetId: string) {
    let _a;
    const sheetIndex = this.findSheetIndex(sheetId);
    const indexInSheets = (this.get('sheets') as SheetResponse[]).findIndex(item => item.id === sheetId);
    const sheet = (this.get('sheets') as SheetResponse[])[indexInSheets];
    if (!sheet) {
      return;
    }
    this.trigger(EVENTS.BEFORE_REMOVE_SHEET_MODEL, sheetId);
    const metaData = (this.get('sheets') as SheetResponse[]).splice(indexInSheets, 1)[0];
    (this.get('sheetOrder') || []).splice(sheetIndex, 1);
    const sheetModel = this.sheets[sheetIndex];
    this.sheets.splice(sheetIndex, 1);
    if (sheetModel) {
      sheetModel.parent(null);
      this.stopListening(sheetModel);
    }
    this.trigger(EVENTS.AFTER_REMOVE_SHEET_MODEL, sheetId);
    const options = Object.assign(
      {
        sheetModel: sheetModel,
        at: sheetIndex,
      },
      metaData
    );
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => this._addNewSheet(options),
          redo: () => this.removeSheet(sheetId),
        },
        'removeSheet'
      );
    }
    this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
    return this;
  }
  updateSheetOrderToBefore(fromSheetId: string, toBeforeSheetId: string) {
    this._updateSheetOrder(fromSheetId, toBeforeSheetId, true);
  }
  updateSheetOrderToAfter(fromSheetId: string, toAfterSheetId: string) {
    this._updateSheetOrder(fromSheetId, toAfterSheetId, false);
  }
  _updateSheetOrder(fromSheetId: string, targetSheetId: string, isBefore: boolean) {
    let _a;
    const sheetOrder = this.get('sheetOrder') as (string | number)[];
    const sheetOrderCopy = sheetOrder.slice();
    const sheetsCopy = this.sheets.slice();
    const sheetMetasCopy = (this.get('sheets') as SheetResponse[]).slice();
    const fromIndex = sheetOrder.indexOf(fromSheetId);
    if (fromIndex === -1 || sheetOrder.indexOf(targetSheetId) === -1) {
      throw new Error('sheetId is not found');
    }
    sheetOrder.splice(fromIndex, 1);
    const targetSheetIndex = sheetOrder.indexOf(targetSheetId);
    sheetOrder.splice(targetSheetIndex + (isBefore ? 0 : 1), 0, fromSheetId);
    const popSheetModel = this.sheets.splice(fromIndex, 1)[0];
    if (popSheetModel) {
      this.sheets.splice(targetSheetIndex + (isBefore ? 0 : 1), 0, popSheetModel); //this.sheets' order always follow sheetOrder
    } else {
      this.sheets.splice(targetSheetIndex + (isBefore ? 0 : 1), 0);
    }
    (this.get('sheets') as SheetResponse[]).splice(
      targetSheetIndex + (isBefore ? 0 : 1),
      0,
      (this.get('sheets') as SheetResponse[]).splice(fromIndex, 1)[0]
    );
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            copyArrTo(sheetsCopy, this.sheets);
            copyArrTo(sheetOrderCopy, this.get('sheetOrder') || []);
            copyArrTo(sheetMetasCopy, this.get('sheets') || []);
            this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
            this.trigger(EVENTS.AFTER_SHEET_ORDER_CHANGE);
          },
          redo: () => this._updateSheetOrder(fromSheetId, targetSheetId, isBefore),
        },
        'reorderSheet'
      );
    }
    this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
    this.trigger(EVENTS.AFTER_SHEET_ORDER_CHANGE);
  }
  /**
   * @description 修改sheet的title，不需要再到sheet model里面继续修改title，以workbook里面的数据为准
   * @param {string} sheetId
   * @param {string} newTitle
   * @public
   * */
  changeSheetTitle(sheetId: string, newTitle: string) {
    let _a;
    const targetSheetData = (this.get('sheets') as SheetResponse[]).find(item => item.id === sheetId);
    if (!targetSheetData) {
      return;
    }
    const oldTitle = targetSheetData.title;
    if (oldTitle === newTitle) {
      return;
    }
    targetSheetData.title = newTitle;
    this.trigger(EVENTS.AFTER_SHEET_TITLE_CHANGE, sheetId, newTitle);
    this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeSheetTitle(sheetId, oldTitle);
          },
          redo: () => {
            this.changeSheetTitle(sheetId, newTitle);
          },
        },
        'changeSheetTitle'
      );
    }
  }
  /**
   * @description 好像没什么卵用？
   * @private
   * */
  changeTitle(newTitle: string) {
    let _a;
    // will trigger "change:title" event by backbone automatically
    const oldTitle = this.get('title');
    if (oldTitle === newTitle) {
      return;
    }
    this.set('title', newTitle);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do noting
    } else {
      _a.add(
        {
          undo: () => this.changeTitle(oldTitle || ''),
          redo: () => this.changeTitle(newTitle),
        },
        'changeWorkbookTitle'
      );
    }
    this.trigger(EVENTS.AFTER_WORKBOOK_TITLE_CHANGE);
    this.trigger(EVENTS.AFTER_WORKBOOK_CONTENT_CHANGE);
  }
  /**
   * @param {Number} value - index of sheet
   * @return {SheetModel}
   */
  getSheetByIndex(value: number) {
    return this.sheets[value];
  }
  /**
   * @param {String} sheetId
   * @return {Number} index of sheet
   */
  findSheetIndex(sheetId: string) {
    return (this.get('sheetOrder') as string[]).findIndex(item => {
      return item === sheetId;
    });
  }
  /**
   * @param {Number} - sheet index
   * @param {String}
   */
  findSheetId(index: number) {
    return (this.get('sheetOrder') as string[])[index];
  }
  /**
   * @return {Undo}
   * @public
   * */
  getUndo() {
    return this._undoManager;
  }
  getConfig() {
    return this._config;
  }

  addCustomSkeletonThemes(themes: ThemeData[]) {
    return getInjectModule(MODULE_NAME.SNOWBALL).addCustomSkeletonThemes(themes);
  }

  addCustomColorThemes(themes: ThemeData[]) {
    return getInjectModule(MODULE_NAME.SNOWBALL).addCustomColorThemes(themes);
  }
}
function isNull(val: unknown) {
  return val === undefined || val === null;
}
function copyArrTo(fromArr: unknown[], toArr: unknown[]) {
  if (fromArr.length !== toArr.length) {
    throw new Error("Arrays' length is not equal");
  }
  fromArr.forEach((item, index) => {
    toArr[index] = item;
  });
}
export default WorkbookModel;
