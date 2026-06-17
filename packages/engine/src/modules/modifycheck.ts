import { EVENTS, MODULE_NAME } from "../common/constants/index";

import underscore from "underscore"; // @flow
/**
 * @fileOverview sheet or workbook modify check
 * */
export class ModifyCheck {
  _baseIndex: number;
  _baseGroup: any;
  _undo: any;
  _context: any;
  static identifier: string;
  constructor(context /*SheetEditor*/) {
    this._baseIndex = -1;
    this._baseGroup = undefined;
    this._undo = null;
    this._context = context;
    this._undo = context.model.getUndo();
  }
  /**
   * @description 当前内容与基础内容比对，检测是否已经被修改
   * @public
   * */
  checkIsModified() {
    return (
      this._undo.getIndex() !== this._baseIndex ||
      !underscore.isEqual(this._undo.getLastGroup(), this._baseGroup)
    );
  }
  /**
   * @description 更新基础对比内容
   * @public
   * */
  updateBaseIndex() {
    this._baseIndex = this._undo.getIndex();
    this._baseGroup = this._undo.getLastGroup();
  }
  // 把编辑状态设置为"已编辑"
  simulateModify() {
    this._baseIndex = this._baseIndex === -1 ? -2 : -1;
    this._context.trigger(EVENTS.AFTER_MODIFY_STATUS_CHANGE);
  }
}
ModifyCheck.identifier = MODULE_NAME.MODIFY_CHECK;

export default ModifyCheck;
