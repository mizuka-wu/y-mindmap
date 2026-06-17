import { COMPONENT_TYPE } from '../common/constants/index';
import BaseModel, { ObjectHash } from './base';
import type { Config } from '../common/config';
import type { UndoManager } from '../common/undo';
import type { SheetModel, WorkbookModel } from '../type.d';

export type { ObjectHash } from './base';

/**
 * @fileOverview the backbone model of BaseComponent
 * */
/**
 * @description model基础组件，提供一些基本功能
 * @constructor
 * */
export class BaseComponent<T extends ObjectHash> extends BaseModel<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _parent: any | null;
  private _ownerWorkbook: WorkbookModel | null | undefined;
  private _ownerSheet: SheetModel | null | undefined;
  /**
   * @description 组件类型
   * @type {string}
   * @public
   * */
  get componentType(): string {
    return COMPONENT_TYPE.BASE_COMPONENT;
  }
  /**
   * @param {Object} [attr] model的属性
   * @param {Object} [options] 初始化的选项
   * @param {SheetModel} options.sheet 该组件所依附的sheet的model
   * @private
   * */
  constructor(attr: T, options?: { sheet?: SheetModel }) {
    super(attr, options);
    this._parent = null;
    // set ownerSheet before run initialize
    if (options && options.sheet) {
      this.ownerSheet(options.sheet);
    }
  }
  ownerWorkbook(workbook?: WorkbookModel) {
    if (workbook) {
      this._ownerWorkbook = workbook;
    }
    return this._ownerWorkbook;
  }
  ownerSheet(sheet?: SheetModel) {
    if (!sheet) {
      return this._ownerSheet;
    }
    this._ownerSheet = sheet;
    return this._ownerSheet;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parent<K = any>(parentModel?: K | null): K | null {
    let _a;
    let _b;
    if (parentModel !== undefined) {
      this.trigger('beforeParentChange');
      if (parentModel === null) {
        if ((_a = this.ownerSheet()) === null || _a === undefined) {
          // do nothing
        } else {
          _a.unregisterComponent(this.getId() as string);
        }
      } else if ((_b = this.ownerSheet()) === null || _b === undefined) {
        // do nothing
      } else {
        _b.registerComponent(this);
      }
      this._parent = parentModel;
      this.trigger('afterParentChange');
    }
    return this._parent as K;
  }
  /**
   * @description 获取undo manager
   * @return {Undo}
   * @public
   * */
  getUndo(): UndoManager | undefined {
    let _a: SheetModel | null | undefined;
    if ((_a = this.ownerSheet()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getUndo();
    }
  }
  getConfig(): Config | undefined {
    let _a: SheetModel | null | undefined;
    if ((_a = this.ownerSheet()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getConfig();
    }
  }
  /**
   * @description 是否有祖先元素
   * */
  hasAncestor(): boolean {
    const parent = this.parent();
    if (parent) {
      return parent.hasAncestor();
    }
    return false;
  }
  getId() {
    return this.get('id');
  }
}

export default BaseComponent;
