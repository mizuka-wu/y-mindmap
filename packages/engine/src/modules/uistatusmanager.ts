import { EVENTS, MODULE_NAME, VIEW_TYPE } from '../common/constants/index';
import type { BranchView, SheetEditor } from '../type.d';

export enum Mutations {
  selectionChange = 'selectionChange',
  semaphoreChange = 'semaphoreChange',
}

export type IStatus = {
  selections: {
    id: string;
    type: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE];
  }[];
  semaphores: string[];
  sync: boolean;
};
export type IPayload = Partial<{
  content: any;
  forceFlush: boolean;
}>;

export class UiStatusManager {
  _context: SheetEditor;
  _status: IStatus;
  _notifying: boolean;
  static _mutations: typeof Mutations;
  static identifier: string;
  constructor(context: SheetEditor) {
    this._context = context;
    this._status = {
      selections: [],
      semaphores: [],
      sync: false,
    };
    this._notifying = false;
  }
  commit(mutation: Mutations, payload?: IPayload) {
    const method = UiStatusManager._mutations[mutation];
    if (typeof Reflect.get(this, method) !== 'function') {
      return;
    }
    const callback = Reflect.get(this, method) as (status: IStatus, content?: string) => void;
    callback(this._status, payload && payload.content);
    this._notify(payload && payload.forceFlush);
  }
  getStatus(): IStatus {
    return JSON.parse(JSON.stringify(this._status));
  }
  _notify(forceFlush?: boolean) {
    if (forceFlush) {
      const status = Object.assign(Object.assign({}, this.getStatus()), {
        sync: true,
      });
      return this._context.trigger(EVENTS.SE_UI_STATUS_CHANGED, status);
    }
    if (!this._notifying) {
      this._notifying = true;
      Promise.resolve().then(() => {
        this._context.trigger(EVENTS.SE_UI_STATUS_CHANGED, this.getStatus());
        this._notifying = false;
      });
    }
  }
  _selectionChange(status: IStatus, selections: BranchView[]) {
    status.selections = selections.map(sel => {
      return {
        id: sel.model ? sel.model.id : null,
        type: sel.type,
      };
    });
  }
  _semaphoreChange(status: IStatus, semaphores: Record<string, number>) {
    status.semaphores = Object.keys(semaphores).filter(key => semaphores[key] > 0);
  }
}
UiStatusManager.identifier = MODULE_NAME.UI_STATUS;
UiStatusManager._mutations = Mutations;

export default UiStatusManager;
