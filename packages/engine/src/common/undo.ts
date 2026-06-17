import { EVENTS } from './constants/index';
import BaseEvent from './utils/base-event';
const EXECUTOR_RESULT_NEXT = 'next';
const EXECUTOR_RESULT_BREAK = 'break';
const DEFAULT_LIMITED_LENGTH = 20;
const DEFAULT_GROUP_NAME = '__default__';
const DEFAULT_EXECUTOR = (operateType, tasks) => {
  const length = tasks.length;
  if (operateType === 'undo') {
    for (let i = length - 1; i >= 0; i--) {
      const task = tasks[i];
      task.undo();
    }
  } else if (operateType === 'redo') {
    for (let i = 0; i < length; i++) {
      const task = tasks[i];
      task.redo();
    }
  }
  return EXECUTOR_RESULT_BREAK;
};
class Group {
  _identifier: any;
  _executor: any;
  _tasks: any[];
  constructor(identifier, executor) {
    this._identifier = identifier;
    this._executor = executor ?? DEFAULT_EXECUTOR;
    this._tasks = [];
  }
  getName() {
    return this._identifier;
  }
  push(task) {
    this._tasks.push(task);
  }
  pop() {
    this._tasks.pop();
  }
  getTasks() {
    return [...this._tasks];
  }
  execute(operateType) {
    let executorResult = EXECUTOR_RESULT_BREAK;
    const executor = this._executor ? this._executor : DEFAULT_EXECUTOR;
    const newTasks = Array.from(this._tasks);
    const result = executor(operateType, newTasks);
    if (!result) {
      executorResult = EXECUTOR_RESULT_NEXT;
    }
    return executorResult;
  }
}
export class UndoManager extends BaseEvent {
  static a: any;
  NEW_GROUP_STAND_BY_EVENT: string;
  GROUP_RESTORE_EVENT: string;
  _undoStack: any[];
  _redoStack: any[];
  _standbyGroup: any;
  _limitedLength: number;
  _canRecord: boolean;
  _blocking: boolean;
  _allInOne: boolean;
  _nameToTagGroup: Map<any, any>;
  // trigger
  constructor() {
    super();
    this.NEW_GROUP_STAND_BY_EVENT = 'newGroupStandByEvent';
    this.GROUP_RESTORE_EVENT = 'groupRestoreEvent';
    this._undoStack = [];
    this._redoStack = [];
    this._standbyGroup = null;
    this._limitedLength = DEFAULT_LIMITED_LENGTH;
    this._canRecord = true;
    this._blocking = false;
    this._allInOne = false;
    this._nameToTagGroup = new Map();
  }
  setRecordState(canRecord) {
    this._canRecord = canRecord;
  }
  keepAllInOne(allInOne) {
    if (this._allInOne !== allInOne) {
      this._allInOne = allInOne;
      if (!allInOne) {
        this._resetStandbyGroup();
        this.trigger(this.NEW_GROUP_STAND_BY_EVENT, this._standbyGroup);
      }
    }
  }
  setStackLimitedLength(length: number) {
    this._limitedLength = length;
    const undoStackLength = this._undoStack.length;
    const redoStackLength = this._redoStack.length;
    if (this._limitedLength < undoStackLength) {
      this._undoStack.slice(undoStackLength - this._limitedLength, undoStackLength);
    } else if (this._limitedLength < undoStackLength + redoStackLength) {
      this._redoStack.slice(
        redoStackLength + undoStackLength - this._limitedLength,
        this._limitedLength - undoStackLength
      );
    }
  }
  add(task, type?) {
    this.push(task, type);
  }
  push(task, type) {
    if (!this._canRecord) {
      return;
    }
    if (this._blocking) {
      return;
    }
    task.type = type;
    if (!this._standbyGroup) {
      this._standbyGroup = this._autoStandbyGroup();
    }
    this._standbyGroup.push(task);
    this.trigger(this.NEW_GROUP_STAND_BY_EVENT, this._standbyGroup);
    this._triggerUndoStateChange();
  }
  pop() {
    const group = this._changeUndoStack();
    this._redoStack.length = 0;
    if (group) {
      this._nameToTagGroup.delete(group.getName());
    }
    this._resetStandbyGroup();
    return group;
  }
  /**
   * Append to last group which is not tag group
   * @param {*} task
   * @param {*} type
   */
  append(task, type?: string) {
    if (!this._canRecord) {
      return;
    }
    if (this._blocking) {
      return;
    }
    task.type = type;
    let lastGroup = this.getLastGroup();
    if (!lastGroup || this.isTagGroup(lastGroup)) {
      lastGroup = this._genNewGroup(DEFAULT_GROUP_NAME);
    }
    lastGroup.push(task);
  }
  getLastGroup() {
    return this._undoStack[this._undoStack.length - 1];
  }
  getAllGroups() {
    return Array.from(new Set([...this._undoStack, ...this._redoStack]));
  }
  isTagGroup(group) {
    return this._nameToTagGroup.has(group.getName());
  }
  popTag(tagName) {
    this._resetStandbyGroup();
    const group = this._nameToTagGroup.get(tagName);
    const indexForUndo = group ? this._undoStack.indexOf(group) : -1;
    if (indexForUndo > -1) {
      this._undoStack.splice(indexForUndo, 1);
    }
    const indexForRedo = group ? this._redoStack.indexOf(group) : -1;
    if (indexForRedo > -1) {
      this._redoStack.splice(indexForRedo, 1);
    }
    this._nameToTagGroup.delete(tagName);
    return group;
  }
  undo() {
    this._blocking = true;
    this.trigger(this.GROUP_RESTORE_EVENT, this.getLastGroup(), true);
    this._resetStandbyGroup();
    const currentGroup = this._changeUndoStack();
    if (currentGroup) {
      this._redoStack.push(currentGroup);
      const result = currentGroup.execute('undo');
      if (result === EXECUTOR_RESULT_NEXT) {
        this.undo();
      }
    }
    this._blocking = false;
  }
  redo() {
    this._blocking = true;
    this.trigger(this.GROUP_RESTORE_EVENT, this._redoStack[this._redoStack.length - 1], false);
    this._resetStandbyGroup();
    const currentGroup = this._redoStack.pop();
    if (currentGroup) {
      this._changeUndoStack(currentGroup);
      const result = currentGroup.execute('redo');
      if (result === EXECUTOR_RESULT_NEXT) {
        this.redo();
      }
    }
    this._blocking = false;
  }
  isExecuting() {
    return this._blocking === true;
  }
  canUndo() {
    return this._undoStack.length > 0;
  }
  canRedo() {
    return this._redoStack.length > 0;
  }
  clearUndo() {
    this._undoStack.length = 0;
  }
  clearRedo() {
    this._redoStack.length = 0;
  }
  getIndex() {
    return this._undoStack.length - 1;
  }
  _genNewGroup(name, executor?) {
    const newGroup = new Group(name, executor);
    this._changeUndoStack(newGroup);
    this._redoStack.length = 0;
    if (this._undoStack.length + this._redoStack.length > this._limitedLength) {
      this._undoStack = this._undoStack.slice(1, this._limitedLength);
    }
    return newGroup;
  }
  _autoStandbyGroup() {
    clearTimeout(this.TIMEOUT_ID);
    this.TIMEOUT_ID = setTimeout(() => {
      if (this._allInOne) {
        return;
      }
      this._resetStandbyGroup();
    }, 0);
    return this._genNewGroup(DEFAULT_GROUP_NAME);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  TIMEOUT_ID: any = () => (TIMEOUT_ID: any) => {
    throw new Error('Method not implemented.');
  };
  // @todo unused?
  pushTag(tagName, executor) {
    if (!this._canRecord) {
      return;
    }
    if (this._blocking) {
      return;
    }
    if (this._nameToTagGroup.has(tagName)) {
      return;
    }
    this._resetStandbyGroup();
    const newGroup = this._genNewGroup(tagName, executor);
    this._nameToTagGroup.set(tagName, newGroup);
  }
  _resetStandbyGroup() {
    this._standbyGroup = null;
  }
  _changeUndoStack(task?) {
    if (task) {
      this._undoStack.push(task);
    }
    const result = task ?? this._undoStack.pop();
    this._triggerUndoStateChange();
    return result;
  }
  _triggerUndoStateChange() {
    Promise.resolve().then(() => {
      this.trigger(EVENTS.UNDO_STATE_CHANGE, {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
    });
  }
}
/* harmony default export */
export default UndoManager;
