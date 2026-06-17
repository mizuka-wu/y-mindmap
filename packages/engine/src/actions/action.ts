import { ACTION_STATUS, CONFIG, EVENTS, MODULE_NAME } from '../common/constants/index';
import BranchView from '../view/branchview';
import type { WorkbookEditor, SheetEditor } from '../type.d';

export type IExecuteParams = {
  prue?: boolean;
  skipPostaction?: boolean;
  [key: string]: unknown;
};
export class Action<Context = SheetEditor | WorkbookEditor> {
  actionName: string;
  _context: Context;
  _auto_action_status: symbol;
  _preaction?: Action;
  _postaction?: any;

  constructor(context: Context) {
    this.actionName = 'Action';
    this._context = context;
    this._auto_action_status = ACTION_STATUS.DISABLE;
    if (this._context.config(CONFIG.AUTO_ACTION_STATUS)) {
      this._context.on(EVENTS.SE_UI_STATUS_CHANGED, () => {
        this._auto_action_status = this.queryStatus();
      });
    }
  }
  /**
   * @argument args.prue: invoke `syncExecute` method
   */
  execute(args: IExecuteParams = {}): void | boolean | symbol | Promise<boolean | void | symbol> {
    args.prue = args.prue === undefined ? false : args.prue;
    if (args.prue) {
      return this.syncExecute(args);
    } else {
      return this.asyncExecute(args);
    }
  }
  async asyncExecute(args: IExecuteParams = {}) {
    let actionResult = (await this._preaction) && this._preaction.execute(args);
    if (actionResult === ACTION_STATUS.ABORTED) {
      return ACTION_STATUS.ABORTED;
    }
    actionResult = this.doExecute(args);
    if (!args.skipPostaction && actionResult !== ACTION_STATUS.ABORTED) {
      actionResult = (await this._postaction) && this._postaction.execute(args);
    }
    return actionResult;
  }
  syncExecute(args = {}) {
    return this.doExecute(args);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  doExecute(args?: any): symbol | void | boolean {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  queryStatus(args?: any) {
    return ACTION_STATUS.NORMAL;
  }
  autoStatus() {
    return this._auto_action_status;
  }
  injectPreaction(preaction: Action) {
    this._preaction = preaction;
  }
  getFilterBranchViewList(targets: BranchView[]) {
    if (!targets || targets.length < 1) {
      targets = (this._context as SheetEditor).getModule(MODULE_NAME.SELECTION).getSelections();
    }
    return (
      (targets === null || targets === undefined ? undefined : targets.filter(view => view instanceof BranchView)) ?? []
    );
  }
}

export default Action;
